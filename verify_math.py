#!/usr/bin/env python3
"""
verify_math.py — SymPy & JSON Schema validator for Open-Source Year 8 Math Textbook (VCAA v2.0).

Usage:
    python verify_math.py output/chapter_1/1_1.json
    python verify_math.py --all
"""

import argparse
import json
import math
import pathlib
import sys
from typing import Any, Dict, List, Tuple

import jsonschema
import sympy as sp

SECTION_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": [
        "metadata",
        "theory",
        "worked_examples",
        "common_misconceptions",
        "exercises",
        "assertions",
    ],
    "properties": {
        "metadata": {
            "type": "object",
            "required": [
                "section_id",
                "section_code",
                "chapter_number",
                "chapter_title",
                "title",
                "vcaa_code",
                "vcaa_description",
                "strand",
                "target_mastery",
                "prerequisites",
            ],
            "properties": {
                "section_id": {"type": "string", "minLength": 2},
                "section_code": {"type": "string", "minLength": 2},
                "chapter_number": {"type": "integer", "minimum": 1, "maximum": 10},
                "chapter_title": {"type": "string", "minLength": 3},
                "title": {"type": "string", "minLength": 3},
                "vcaa_code": {"type": "string", "pattern": "^VC2M8[A-Z]+[0-9]+$"},
                "vcaa_description": {"type": "string", "minLength": 10},
                "strand": {"type": "string", "minLength": 3},
                "target_mastery": {"type": "string", "minLength": 10},
                "prerequisites": {
                    "type": "array",
                    "minItems": 1,
                    "items": {"type": "string", "minLength": 3},
                },
                "key_vocabulary": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["term", "definition"],
                        "properties": {
                            "term": {"type": "string"},
                            "definition": {"type": "string"},
                        },
                    },
                },
            },
        },
        "theory": {
            "type": "array",
            "minItems": 3,
            "maxItems": 6,
            "items": {
                "type": "object",
                "required": ["id", "title", "explanation", "callout_rule"],
                "properties": {
                    "id": {"type": "string"},
                    "title": {"type": "string"},
                    "explanation": {"type": "string", "minLength": 30},
                    "formula_latex": {"type": "string"},
                    "callout_title": {"type": "string"},
                    "callout_rule": {"type": "string", "minLength": 10},
                },
            },
        },
        "worked_examples": {
            "type": "array",
            "minItems": 3,
            "items": {
                "type": "object",
                "required": [
                    "id",
                    "title",
                    "problem",
                    "steps",
                    "final_answer",
                    "now_you_try",
                ],
                "properties": {
                    "id": {"type": "string"},
                    "title": {"type": "string"},
                    "difficulty": {"type": "string"},
                    "problem": {"type": "string"},
                    "steps": {
                        "type": "array",
                        "minItems": 2,
                        "items": {
                            "type": "object",
                            "required": ["step", "thinking", "working"],
                            "properties": {
                                "step": {"type": "integer"},
                                "thinking": {"type": "string", "minLength": 5},
                                "working": {"type": "string", "minLength": 2},
                            },
                        },
                    },
                    "final_answer": {"type": "string"},
                    "now_you_try": {
                        "type": "object",
                        "required": ["problem", "answer", "working_summary"],
                        "properties": {
                            "problem": {"type": "string"},
                            "hint": {"type": "string"},
                            "answer": {"type": "string"},
                            "working_summary": {"type": "string"},
                        },
                    },
                },
            },
        },
        "common_misconceptions": {
            "type": "array",
            "minItems": 2,
            "items": {
                "type": "object",
                "required": [
                    "id",
                    "title",
                    "misconception",
                    "correct_concept",
                    "counter_example",
                ],
                "properties": {
                    "id": {"type": "string"},
                    "title": {"type": "string"},
                    "misconception": {"type": "string"},
                    "correct_concept": {"type": "string"},
                    "incorrect_working": {"type": "string"},
                    "correct_working": {"type": "string"},
                    "counter_example": {"type": "string"},
                },
            },
        },
        "exercises": {
            "type": "object",
            "required": [
                "fluency_and_understanding",
                "problem_solving_and_modelling",
                "reasoning_and_communication",
            ],
            "properties": {
                "fluency_and_understanding": {
                    "$ref": "#/$defs/exercise_list",
                },
                "problem_solving_and_modelling": {
                    "$ref": "#/$defs/exercise_list",
                },
                "reasoning_and_communication": {
                    "$ref": "#/$defs/exercise_list",
                },
            },
        },
        "assertions": {
            "type": "array",
            "minItems": 10,
            "items": {
                "type": "object",
                "required": ["id", "expression", "expected"],
                "properties": {
                    "id": {"type": "string", "minLength": 1},
                    "description": {"type": "string"},
                    "expression": {"type": "string", "minLength": 1},
                    "expected": {
                        "oneOf": [
                            {"type": "number"},
                            {"type": "string"},
                            {"type": "boolean"},
                            {"type": "array"},
                        ]
                    },
                },
            },
        },
    },
    "$defs": {
        "exercise_list": {
            "type": "array",
            "minItems": 3,
            "items": {
                "type": "object",
                "required": [
                    "id",
                    "question",
                    "difficulty",
                    "final_answer",
                    "step_by_step_solution",
                ],
                "properties": {
                    "id": {"type": "string"},
                    "question": {"type": "string", "minLength": 5},
                    "difficulty": {
                        "type": "string",
                        "enum": ["Easy", "Medium", "Challenging", "Extension"],
                    },
                    "context": {"type": "string"},
                    "final_answer": {"type": "string", "minLength": 1},
                    "step_by_step_solution": {
                        "type": "array",
                        "minItems": 2,
                        "items": {"type": "string", "minLength": 2},
                    },
                },
            },
        }
    },
}


SYMPY_LOCALS = {
    "gcd": sp.gcd,
    "lcm": sp.lcm,
    "igcd": sp.igcd,
    "ilcm": sp.ilcm,
    "sqrt": sp.sqrt,
    "cbrt": lambda x: sp.real_root(x, 3),
    "real_root": sp.real_root,
    "Abs": sp.Abs,
    "abs": sp.Abs,
    "Rational": sp.Rational,
    "Integer": sp.Integer,
    "Float": sp.Float,
    "pi": sp.pi,
    "Eq": sp.Eq,
    "solve": sp.solve,
    "simplify": sp.simplify,
    "expand": sp.expand,
    "factor": sp.factor,
    "factorint": sp.factorint,
    "primefactors": sp.primefactors,
    "isprime": sp.isprime,
    "Mod": sp.Mod,
    "floor": sp.floor,
    "ceiling": sp.ceiling,
}


def evaluate_sympy_assertion(assertion: Dict[str, Any]) -> Tuple[bool, str]:
    """Evaluate a single assertion using SymPy."""
    aid = assertion.get("id", "<unnamed>")
    expr_str = str(assertion["expression"])
    expected_raw = assertion["expected"]

    try:
        expr_val = sp.sympify(expr_str, locals=SYMPY_LOCALS, evaluate=True)
    except Exception as exc:
        return False, f"[{aid}] Failed to parse expression '{expr_str}': {exc}"

    try:
        if isinstance(expected_raw, bool):
            actual_bool = bool(expr_val)
            if actual_bool == expected_raw:
                return True, f"[{aid}] PASS: {expr_str} == {expected_raw}"
            return (
                False,
                f"[{aid}] FAIL: {expr_str} evaluated to {actual_bool}, expected {expected_raw}",
            )

        if isinstance(expected_raw, list):
            expected_list = [
                sp.sympify(str(item), locals=SYMPY_LOCALS, evaluate=True)
                for item in expected_raw
            ]
            actual_list = list(expr_val) if hasattr(expr_val, "__iter__") else [expr_val]
            if len(actual_list) == len(expected_list) and all(
                sp.simplify(a - b) == 0 for a, b in zip(actual_list, expected_list)
            ):
                return True, f"[{aid}] PASS: {expr_str} == {expected_raw}"
            return (
                False,
                f"[{aid}] FAIL: {expr_str} evaluated to {actual_list}, expected {expected_list}",
            )

        expected_val = sp.sympify(str(expected_raw), locals=SYMPY_LOCALS, evaluate=True)

        if isinstance(expr_val, (bool, sp.logic.boolalg.BooleanAtom)):
            if bool(expr_val) == bool(expected_val):
                return True, f"[{aid}] PASS: {expr_str} == {expected_raw}"
            return (
                False,
                f"[{aid}] FAIL: {expr_str} -> {expr_val}, expected {expected_val}",
            )

        diff = sp.simplify(expr_val - expected_val)
        if diff == 0:
            return True, f"[{aid}] PASS: {expr_str} == {expected_val}"

        # Also check numeric closeness only if float expected
        if isinstance(expected_raw, float):
            if abs(float(expr_val) - expected_raw) < 1e-9:
                return True, f"[{aid}] PASS (float): {expr_str} ~= {expected_raw}"

        return (
            False,
            f"[{aid}] FAIL: '{expr_str}' evaluated to {expr_val} (expected {expected_val}, diff={diff})",
        )
    except Exception as exc:
        return (
            False,
            f"[{aid}] Error comparing '{expr_str}' with '{expected_raw}': {exc}",
        )


def render_section_markdown(data: Dict[str, Any]) -> str:
    """Render a validated section JSON dictionary into clean Markdown."""
    meta = data["metadata"]
    lines: List[str] = []
    lines.append(
        f"# {meta['section_code']}: {meta['title']} (Chapter {meta['chapter_number']} — {meta['chapter_title']})"
    )
    lines.append("")
    lines.append(f"**VCAA Version 2.0 Alignment**: `{meta['vcaa_code']}` ({meta['strand']})")
    lines.append(f"> {meta['vcaa_description']}")
    lines.append("")
    lines.append(f"**Target Mastery**: {meta['target_mastery']}")
    lines.append("")
    lines.append("**Prerequisite Skills**:")
    for prereq in meta.get("prerequisites", []):
        lines.append(f"- {prereq}")
    lines.append("")

    if meta.get("key_vocabulary"):
        lines.append("### Key Vocabulary")
        for kv in meta["key_vocabulary"]:
            lines.append(f"- **{kv['term']}**: {kv['definition']}")
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("## Theory & Key Ideas")
    lines.append("")
    for block in data["theory"]:
        lines.append(f"### {block['title']}")
        lines.append("")
        lines.append(block["explanation"])
        lines.append("")
        if block.get("formula_latex"):
            lines.append(f"$${block['formula_latex']}$$")
            lines.append("")
        callout_title = block.get("callout_title", "Key Rule & Memory Aid")
        lines.append(f"> **💡 {callout_title}**")
        lines.append(f"> {block['callout_rule']}")
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("## Worked Examples")
    lines.append("")
    for ex in data["worked_examples"]:
        lines.append(f"### {ex['id']}: {ex['title']}")
        lines.append("")
        lines.append(f"**Problem**: {ex['problem']}")
        lines.append("")
        lines.append("| Step | Thinking | Working |")
        lines.append("| :---: | :--- | :--- |")
        for step in ex["steps"]:
            thinking = step["thinking"].replace("|", "\\|")
            working = step["working"].replace("|", "\\|")
            lines.append(f"| {step['step']} | {thinking} | {working} |")
        lines.append("")
        lines.append(f"**Answer**: {ex['final_answer']}")
        lines.append("")
        nyt = ex["now_you_try"]
        lines.append("> **✏️ Now You Try**")
        lines.append(f"> **Problem**: {nyt['problem']}")
        if nyt.get("hint"):
            lines.append(f"> *Hint*: {nyt['hint']}")
        lines.append(f"> **Working**: {nyt['working_summary']}")
        lines.append(f"> **Answer**: {nyt['answer']}")
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("## ⚠️ Common Misconceptions Alert")
    lines.append("")
    for misc in data["common_misconceptions"]:
        lines.append(f"### {misc['title']}")
        lines.append(f"- **The Misconception**: {misc['misconception']}")
        lines.append(f"- **The Correct Concept**: {misc['correct_concept']}")
        if misc.get("incorrect_working"):
            lines.append(f"- **❌ Incorrect Working**: {misc['incorrect_working']}")
        if misc.get("correct_working"):
            lines.append(f"- **✅ Correct Working**: {misc['correct_working']}")
        lines.append(f"- **Counter-Example**: {misc['counter_example']}")
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("## Differentiated Exercise Bank")
    lines.append("")

    tiers = [
        ("Fluency & Understanding", "fluency_and_understanding"),
        ("Problem-Solving & Modelling", "problem_solving_and_modelling"),
        ("Reasoning & Communication", "reasoning_and_communication"),
    ]
    for tier_title, tier_key in tiers:
        lines.append(f"### {tier_title}")
        lines.append("")
        for q in data["exercises"][tier_key]:
            ctx = f" *({q['context']})*" if q.get("context") else ""
            lines.append(f"#### Question `{q['id']}` [{q['difficulty']}]{ctx}")
            lines.append(f"{q['question']}")
            lines.append("")
            lines.append("<details>")
            lines.append("<summary><strong>Full Step-by-Step Solution</strong></summary>")
            lines.append("")
            for idx, step_line in enumerate(q["step_by_step_solution"], start=1):
                lines.append(f"{idx}. {step_line}")
            lines.append("")
            lines.append(f"**Final Answer**: {q['final_answer']}")
            lines.append("</details>")
            lines.append("")

    return "\n".join(lines)


def verify_file(filepath: pathlib.Path, write_md: bool = True) -> bool:
    """Validate a section JSON file for schema compliance and SymPy math accuracy."""
    if not filepath.exists():
        print(f"ERROR: File not found: {filepath}", file=sys.stderr)
        return False

    try:
        raw_text = filepath.read_text(encoding="utf-8")
        data = json.loads(raw_text)
    except Exception as exc:
        print(f"ERROR: Invalid JSON in {filepath}: {exc}", file=sys.stderr)
        return False

    # 1. Validate JSON Schema
    try:
        jsonschema.validate(instance=data, schema=SECTION_SCHEMA)
    except jsonschema.ValidationError as exc:
        loc = " -> ".join(str(p) for p in exc.absolute_path) or "<root>"
        print(
            f"SCHEMA ERROR in {filepath} at [{loc}]: {exc.message}",
            file=sys.stderr,
        )
        return False

    # 2. Check duplicate assertion IDs
    assertions = data.get("assertions", [])
    seen_ids = set()
    for a in assertions:
        if a["id"] in seen_ids:
            print(
                f"ASSERTION ERROR in {filepath}: Duplicate assertion ID '{a['id']}'",
                file=sys.stderr,
            )
            return False
        seen_ids.add(a["id"])

    # 3. Verify all SymPy assertions
    passed = 0
    failed = 0
    for assertion in assertions:
        ok, msg = evaluate_sympy_assertion(assertion)
        if ok:
            passed += 1
        else:
            failed += 1
            print(f"MATH ASSERTION FAILURE in {filepath}: {msg}", file=sys.stderr)

    if failed > 0:
        print(
            f"FAILED: {filepath} ({passed} passed, {failed} failed)",
            file=sys.stderr,
        )
        return False

    # 4. Write companion Markdown file if requested
    if write_md:
        md_path = filepath.with_suffix(".md")
        md_content = render_section_markdown(data)
        md_path.write_text(md_content, encoding="utf-8")

    meta = data["metadata"]
    print(
        f"VERIFIED OK: {filepath} | Section {meta['section_code']} ({meta['vcaa_code']}) | "
        f"{len(data['worked_examples'])} worked examples | "
        f"{sum(len(v) for v in data['exercises'].values())} exercises | "
        f"{passed}/{len(assertions)} SymPy assertions passed"
    )
    return True


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate Year 8 Math Textbook section JSON against schema and SymPy assertions."
    )
    parser.add_argument(
        "files",
        nargs="*",
        help="Path(s) to section JSON file(s) to validate.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Validate all section JSON files in output/chapter_*/",
    )
    parser.add_argument(
        "--no-md",
        action="store_true",
        help="Do not automatically write companion .md files upon validation.",
    )
    args = parser.parse_args()

    targets: List[pathlib.Path] = []
    if args.all:
        targets = sorted(pathlib.Path("output").glob("chapter_*/*.json"))
        if not targets:
            print("No JSON files found under output/chapter_*/", file=sys.stderr)
            return 1
    elif args.files:
        targets = [pathlib.Path(f) for f in args.files]
    else:
        parser.print_help()
        return 1

    all_ok = True
    for target in targets:
        if not verify_file(target, write_md=not args.no_md):
            all_ok = False

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
