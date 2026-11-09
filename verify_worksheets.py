#!/usr/bin/env python3
"""
SymPy & Schema verifier for Year 8 Mathematics Printable Worksheets.
Validates all 23 section worksheets and their SymPy mathematical assertions.
"""

import glob
import json
import os
import sys
import sympy as sp
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
)

TRANSFORMATIONS = standard_transformations + (implicit_multiplication_application,)

SYMPY_LOCALS = {
    "sqrt": sp.sqrt,
    "cbrt": lambda x: sp.real_root(x, 3),
    "pi": sp.pi,
    "Rational": sp.Rational,
    "Integer": sp.Integer,
    "Abs": sp.Abs,
    "gcd": sp.gcd,
    "ilcm": sp.ilcm,
    "igcd": sp.igcd,
    "factorint": sp.factorint,
    "simplify": sp.simplify,
    "expand": sp.expand,
    "factor": sp.factor,
    "Symbol": sp.Symbol,
    "x": sp.Symbol("x"),
    "y": sp.Symbol("y"),
    "z": sp.Symbol("z"),
    "a": sp.Symbol("a"),
    "b": sp.Symbol("b"),
    "c": sp.Symbol("c"),
    "m": sp.Symbol("m"),
    "n": sp.Symbol("n"),
    "p": sp.Symbol("p"),
    "q": sp.Symbol("q"),
    "r": sp.Symbol("r"),
    "t": sp.Symbol("t"),
    "k": sp.Symbol("k"),
}


def verify_assertion(a: dict) -> tuple[bool, str]:
    aid = a["id"]
    expr_str = a["expression"]
    expected = a["expected"]
    try:
        val = parse_expr(expr_str, local_dict=SYMPY_LOCALS, transformations=TRANSFORMATIONS)
        if isinstance(expected, bool):
            ok = bool(val) == expected
        elif isinstance(expected, (int, float)):
            exp_val = sp.Rational(str(expected))
            diff = sp.simplify(val - exp_val)
            ok = (diff == 0) or (abs(float(val) - float(expected)) < 1e-9)
        elif isinstance(expected, str):
            exp_val = parse_expr(expected, local_dict=SYMPY_LOCALS, transformations=TRANSFORMATIONS)
            ok = sp.simplify(val - exp_val) == 0
        else:
            ok = False
        if not ok:
            return False, f"[{aid}] FAIL: '{expr_str}' -> {val} != {expected}"
        return True, f"[{aid}] OK"
    except Exception as e:
        return False, f"[{aid}] ERROR parsing '{expr_str}': {e}"


def verify_worksheet_file(path: str) -> tuple[int, int, list[str]]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    worksheets = data["worksheets"]
    total_ws = 0
    total_assertions = 0
    errors = []

    for ws in worksheets:
        sec_id = ws["section_id"]
        total_ws += 1
        # Check fluency questions (4 questions, each with 4 parts a-d)
        if len(ws.get("fluency_questions", [])) != 4:
            errors.append(f"{sec_id}: Expected 4 fluency_questions")
        for fq in ws.get("fluency_questions", []):
            if len(fq.get("parts", [])) != 4:
                errors.append(f"{sec_id} {fq.get('number')}: Expected 4 parts (a-d)")
            for pt in fq.get("parts", []):
                if not pt.get("question") or not pt.get("answer"):
                    errors.append(f"{sec_id} Q{fq.get('number')}({pt.get('label')}): Missing question/answer")

        # Check application questions (4 questions Q5-Q8)
        if len(ws.get("application_questions", [])) != 4:
            errors.append(f"{sec_id}: Expected 4 application_questions")
        for aq in ws.get("application_questions", []):
            if not aq.get("question") or not aq.get("answer"):
                errors.append(f"{sec_id} Q{aq.get('number')}: Missing question/answer")

        # Check reasoning questions (2 questions Q9-Q10)
        if len(ws.get("reasoning_questions", [])) != 2:
            errors.append(f"{sec_id}: Expected 2 reasoning_questions")
        for rq in ws.get("reasoning_questions", []):
            if not rq.get("question") or not rq.get("answer"):
                errors.append(f"{sec_id} Q{rq.get('number')}: Missing question/answer")

        # Check assertions
        assertions = ws.get("assertions", [])
        if len(assertions) < 8:
            errors.append(f"{sec_id}: Expected at least 8 assertions, found {len(assertions)}")
        for a in assertions:
            total_assertions += 1
            ok, msg = verify_assertion(a)
            if not ok:
                errors.append(f"{sec_id}: {msg}")

    return total_ws, total_assertions, errors


def main():
    files = sorted(glob.glob("worksheets/chapter_*.json"))
    if not files:
        print("No worksheet files found in worksheets/chapter_*.json", file=sys.stderr)
        sys.exit(1)

    grand_ws = 0
    grand_assertions = 0
    all_errors = []
    for fpath in files:
        n_ws, n_as, errs = verify_worksheet_file(fpath)
        grand_ws += n_ws
        grand_assertions += n_as
        if errs:
            all_errors.extend(errs)
            print(f"FAILED: {fpath} ({len(errs)} errors)", file=sys.stderr)
            for e in errs:
                print(f"  - {e}", file=sys.stderr)
        else:
            print(f"VERIFIED OK: {fpath} | {n_ws} worksheets | {n_as}/{n_as} SymPy assertions passed")

    if all_errors:
        sys.exit(1)
    print(f"ALL WORKSHEETS VERIFIED: {grand_ws} worksheets, {grand_assertions}/{grand_assertions} SymPy assertions passed.")


if __name__ == "__main__":
    main()
