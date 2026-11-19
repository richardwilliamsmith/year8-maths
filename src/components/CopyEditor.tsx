"use client";

import React, { useState } from "react";
import type { TextbookSectionData, WorksheetTierKey } from "@/lib/curriculum";
import type { EditableWorksheetData } from "@/app/api/editor/worksheet/route";
import { MathText, FormulaBlock } from "./MathText";

interface LiveFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  multiline?: boolean;
  rows?: number;
  isFormula?: boolean;
}

function LiveMathField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  isFormula = false,
}: LiveFieldProps) {
  return (
    <div className="editor-field-row">
      <div className="editor-input-col">
        <label className="editor-label">{label}</label>
        {multiline ? (
          <textarea
            className="editor-textarea"
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            type="text"
            className="editor-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>
      <div className="editor-preview-col">
        <div className="editor-preview-label">Live KaTeX Preview</div>
        <div className="editor-preview-box">
          {value.trim() ? (
            isFormula ? (
              <FormulaBlock latex={value} />
            ) : (
              <MathText text={value} />
            )
          ) : (
            <span className="editor-empty-hint">(empty)</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface SectionEditorProps {
  year: string;
  initialSection: TextbookSectionData;
  onSaved: (updated: TextbookSectionData) => void;
  onClose: () => void;
}

export function SectionCopyEditor({
  year,
  initialSection,
  onSaved,
  onClose,
}: SectionEditorProps) {
  const [draft, setDraft] = useState<TextbookSectionData>(() =>
    JSON.parse(JSON.stringify(initialSection))
  );
  const [tab, setTab] = useState<
    "theory" | "examples" | "misconceptions" | "exercises" | "assertions"
  >("theory");
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/editor/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, section: draft }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatusMsg({
          ok: true,
          text: `Saved to ${data.savedPath} — ${data.verificationOutput}`,
        });
        onSaved(draft);
      } else {
        setStatusMsg({
          ok: false,
          text:
            data.verificationOutput ||
            data.error ||
            "Save succeeded but SymPy verification reported an issue.",
        });
        if (data.saved) {
          onSaved(draft);
        }
      }
    } catch (e: unknown) {
      setStatusMsg({
        ok: false,
        text: e instanceof Error ? e.message : "Network error saving section.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="editor-shell">
      <div className="editor-topbar">
        <div>
          <div className="editor-kicker">
            Local Copy Editor · Year {year} · Section{" "}
            {draft.metadata.section_code}
          </div>
          <h2 className="editor-title">{draft.metadata.title}</h2>
          <p className="editor-hint">
            Write normal prose and single-backslash LaTeX (e.g.{" "}
            <code>$\frac{"{1}"}{"{2}"}$</code> or <code>\$25</code>). JSON
            escaping is handled automatically when you save.
          </p>
        </div>
        <div className="editor-topbar-actions">
          <button
            type="button"
            onClick={onClose}
            className="minimal-btn"
            disabled={saving}
          >
            Back to Reader
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="pdf-download-btn primary"
            disabled={saving}
          >
            {saving ? "Saving & Verifying..." : "Save & Verify (SymPy)"}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`editor-status-banner ${
            statusMsg.ok ? "status-ok" : "status-err"
          }`}
        >
          <pre className="editor-status-pre">{statusMsg.text}</pre>
        </div>
      )}

      <div className="section-tabs editor-tabs">
        {(
          [
            ["theory", "Metadata & Theory"],
            ["examples", "Worked Examples"],
            ["misconceptions", "Misconceptions"],
            ["exercises", "Exercises"],
            ["assertions", "SymPy Assertions"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`tab-btn ${tab === k ? "active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="editor-body">
        {tab === "theory" && (
          <div className="editor-stack">
            <div className="editor-card">
              <h3 className="editor-card-heading">Section Metadata</h3>
              <LiveMathField
                label="Section Title"
                value={draft.metadata.title}
                onChange={(val) =>
                  setDraft((d) => ({
                    ...d,
                    metadata: { ...d.metadata, title: val },
                  }))
                }
              />
              <LiveMathField
                label="Target Mastery"
                value={draft.metadata.target_mastery}
                multiline
                rows={2}
                onChange={(val) =>
                  setDraft((d) => ({
                    ...d,
                    metadata: { ...d.metadata, target_mastery: val },
                  }))
                }
              />
            </div>

            {draft.theory.map((t, idx) => (
              <div key={t.id} className="editor-card">
                <h3 className="editor-card-heading">
                  Theory Block {idx + 1} ({t.id})
                </h3>
                <LiveMathField
                  label="Title"
                  value={t.title}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.theory];
                      next[idx] = { ...next[idx], title: val };
                      return { ...d, theory: next };
                    })
                  }
                />
                <LiveMathField
                  label="Explanation"
                  value={t.explanation}
                  multiline
                  rows={4}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.theory];
                      next[idx] = { ...next[idx], explanation: val };
                      return { ...d, theory: next };
                    })
                  }
                />
                <LiveMathField
                  label="Formula LaTeX (no outer $$)"
                  value={t.formula_latex || ""}
                  isFormula
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.theory];
                      next[idx] = { ...next[idx], formula_latex: val };
                      return { ...d, theory: next };
                    })
                  }
                />
                <LiveMathField
                  label="Callout Title"
                  value={t.callout_title || ""}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.theory];
                      next[idx] = { ...next[idx], callout_title: val };
                      return { ...d, theory: next };
                    })
                  }
                />
                <LiveMathField
                  label="Callout Rule"
                  value={t.callout_rule}
                  multiline
                  rows={2}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.theory];
                      next[idx] = { ...next[idx], callout_rule: val };
                      return { ...d, theory: next };
                    })
                  }
                />
              </div>
            ))}
          </div>
        )}

        {tab === "examples" && (
          <div className="editor-stack">
            {draft.worked_examples.map((we, idx) => (
              <div key={we.id} className="editor-card">
                <h3 className="editor-card-heading">
                  Worked Example {idx + 1} ({we.id})
                </h3>
                <LiveMathField
                  label="Title"
                  value={we.title}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.worked_examples];
                      next[idx] = { ...next[idx], title: val };
                      return { ...d, worked_examples: next };
                    })
                  }
                />
                <LiveMathField
                  label="Problem"
                  value={we.problem}
                  multiline
                  rows={3}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.worked_examples];
                      next[idx] = { ...next[idx], problem: val };
                      return { ...d, worked_examples: next };
                    })
                  }
                />
                {we.steps.map((st, sIdx) => (
                  <div key={st.step} className="editor-subcard">
                    <div className="editor-subcard-title">Step {st.step}</div>
                    <LiveMathField
                      label="Thinking"
                      value={st.thinking}
                      multiline
                      rows={2}
                      onChange={(val) =>
                        setDraft((d) => {
                          const next = [...d.worked_examples];
                          const steps = [...next[idx].steps];
                          steps[sIdx] = { ...steps[sIdx], thinking: val };
                          next[idx] = { ...next[idx], steps };
                          return { ...d, worked_examples: next };
                        })
                      }
                    />
                    <LiveMathField
                      label="Working"
                      value={st.working}
                      multiline
                      rows={2}
                      onChange={(val) =>
                        setDraft((d) => {
                          const next = [...d.worked_examples];
                          const steps = [...next[idx].steps];
                          steps[sIdx] = { ...steps[sIdx], working: val };
                          next[idx] = { ...next[idx], steps };
                          return { ...d, worked_examples: next };
                        })
                      }
                    />
                  </div>
                ))}
                <LiveMathField
                  label="Final Answer"
                  value={we.final_answer}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.worked_examples];
                      next[idx] = { ...next[idx], final_answer: val };
                      return { ...d, worked_examples: next };
                    })
                  }
                />
                <div className="editor-subcard">
                  <div className="editor-subcard-title">Now You Try</div>
                  <LiveMathField
                    label="Problem"
                    value={we.now_you_try.problem}
                    multiline
                    rows={2}
                    onChange={(val) =>
                      setDraft((d) => {
                        const next = [...d.worked_examples];
                        next[idx] = {
                          ...next[idx],
                          now_you_try: { ...next[idx].now_you_try, problem: val },
                        };
                        return { ...d, worked_examples: next };
                      })
                    }
                  />
                  <LiveMathField
                    label="Hint"
                    value={we.now_you_try.hint || ""}
                    onChange={(val) =>
                      setDraft((d) => {
                        const next = [...d.worked_examples];
                        next[idx] = {
                          ...next[idx],
                          now_you_try: { ...next[idx].now_you_try, hint: val },
                        };
                        return { ...d, worked_examples: next };
                      })
                    }
                  />
                  <LiveMathField
                    label="Working Summary"
                    value={we.now_you_try.working_summary}
                    multiline
                    rows={2}
                    onChange={(val) =>
                      setDraft((d) => {
                        const next = [...d.worked_examples];
                        next[idx] = {
                          ...next[idx],
                          now_you_try: {
                            ...next[idx].now_you_try,
                            working_summary: val,
                          },
                        };
                        return { ...d, worked_examples: next };
                      })
                    }
                  />
                  <LiveMathField
                    label="Answer"
                    value={we.now_you_try.answer}
                    onChange={(val) =>
                      setDraft((d) => {
                        const next = [...d.worked_examples];
                        next[idx] = {
                          ...next[idx],
                          now_you_try: { ...next[idx].now_you_try, answer: val },
                        };
                        return { ...d, worked_examples: next };
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "misconceptions" && (
          <div className="editor-stack">
            {draft.common_misconceptions.map((m, idx) => (
              <div key={m.id} className="editor-card">
                <h3 className="editor-card-heading">
                  Misconception {idx + 1} ({m.id})
                </h3>
                <LiveMathField
                  label="Title"
                  value={m.title}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.common_misconceptions];
                      next[idx] = { ...next[idx], title: val };
                      return { ...d, common_misconceptions: next };
                    })
                  }
                />
                <LiveMathField
                  label="The Misconception"
                  value={m.misconception}
                  multiline
                  rows={2}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.common_misconceptions];
                      next[idx] = { ...next[idx], misconception: val };
                      return { ...d, common_misconceptions: next };
                    })
                  }
                />
                <LiveMathField
                  label="The Correct Concept"
                  value={m.correct_concept}
                  multiline
                  rows={2}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.common_misconceptions];
                      next[idx] = { ...next[idx], correct_concept: val };
                      return { ...d, common_misconceptions: next };
                    })
                  }
                />
                <LiveMathField
                  label="Incorrect Working"
                  value={m.incorrect_working || ""}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.common_misconceptions];
                      next[idx] = { ...next[idx], incorrect_working: val };
                      return { ...d, common_misconceptions: next };
                    })
                  }
                />
                <LiveMathField
                  label="Correct Working"
                  value={m.correct_working || ""}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.common_misconceptions];
                      next[idx] = { ...next[idx], correct_working: val };
                      return { ...d, common_misconceptions: next };
                    })
                  }
                />
                <LiveMathField
                  label="Counter-Example"
                  value={m.counter_example}
                  multiline
                  rows={2}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.common_misconceptions];
                      next[idx] = { ...next[idx], counter_example: val };
                      return { ...d, common_misconceptions: next };
                    })
                  }
                />
              </div>
            ))}
          </div>
        )}

        {tab === "exercises" && (
          <div className="editor-stack">
            {(
              [
                ["fluency_and_understanding", "Fluency & Understanding"],
                ["problem_solving_and_modelling", "Problem-Solving & Modelling"],
                ["reasoning_and_communication", "Reasoning & Communication"],
              ] as const
            ).map(([tierKey, tierLabel]) => (
              <div key={tierKey} className="editor-card">
                <h3 className="editor-card-heading">{tierLabel}</h3>
                {draft.exercises[tierKey].map((q, qIdx) => (
                  <div key={q.id} className="editor-subcard">
                    <div className="editor-subcard-title">
                      {q.id} [{q.difficulty}]
                    </div>
                    <LiveMathField
                      label="Question"
                      value={q.question}
                      multiline
                      rows={3}
                      onChange={(val) =>
                        setDraft((d) => {
                          const list = [...d.exercises[tierKey]];
                          list[qIdx] = { ...list[qIdx], question: val };
                          return {
                            ...d,
                            exercises: { ...d.exercises, [tierKey]: list },
                          };
                        })
                      }
                    />
                    <LiveMathField
                      label="Step-by-Step Solution (1 step per line)"
                      value={q.step_by_step_solution.join("\n")}
                      multiline
                      rows={3}
                      onChange={(val) =>
                        setDraft((d) => {
                          const list = [...d.exercises[tierKey]];
                          list[qIdx] = {
                            ...list[qIdx],
                            step_by_step_solution: val
                              .split("\n")
                              .filter((s) => s.trim().length > 0),
                          };
                          return {
                            ...d,
                            exercises: { ...d.exercises, [tierKey]: list },
                          };
                        })
                      }
                    />
                    <LiveMathField
                      label="Final Answer"
                      value={q.final_answer}
                      onChange={(val) =>
                        setDraft((d) => {
                          const list = [...d.exercises[tierKey]];
                          list[qIdx] = { ...list[qIdx], final_answer: val };
                          return {
                            ...d,
                            exercises: { ...d.exercises, [tierKey]: list },
                          };
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {tab === "assertions" && (
          <div className="editor-stack">
            <div className="editor-card">
              <h3 className="editor-card-heading">
                SymPy Verification Assertions
              </h3>
              <p className="editor-hint">
                If you change numbers in worked examples or exercises, update the
                matching SymPy expression and expected value here so{" "}
                <code>verify_math.py</code> stays green.
              </p>
              {draft.assertions.map((a, idx) => (
                <div key={a.id} className="editor-assertion-row">
                  <code>{a.id}</code>
                  <input
                    type="text"
                    className="editor-input"
                    value={a.expression}
                    onChange={(e) =>
                      setDraft((d) => {
                        const next = [...d.assertions];
                        next[idx] = { ...next[idx], expression: e.target.value };
                        return { ...d, assertions: next };
                      })
                    }
                  />
                  <input
                    type="text"
                    className="editor-input"
                    value={
                      typeof a.expected === "string"
                        ? a.expected
                        : JSON.stringify(a.expected)
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      let parsed: number | string | boolean | (number | string)[] = raw;
                      try {
                        parsed = JSON.parse(raw);
                      } catch {
                        parsed = raw;
                      }
                      setDraft((d) => {
                        const next = [...d.assertions];
                        next[idx] = { ...next[idx], expected: parsed };
                        return { ...d, assertions: next };
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface WorksheetEditorProps {
  year: string;
  chapterNumber: number;
  tier: WorksheetTierKey;
  initialWorksheet: EditableWorksheetData;
  onSaved: (updated: EditableWorksheetData) => void;
  onClose: () => void;
}

export function WorksheetCopyEditor({
  year,
  chapterNumber,
  tier,
  initialWorksheet,
  onSaved,
  onClose,
}: WorksheetEditorProps) {
  const [draft, setDraft] = useState<EditableWorksheetData>(() =>
    JSON.parse(JSON.stringify(initialWorksheet))
  );
  const [rebuildPdf, setRebuildPdf] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/editor/worksheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          chapter: chapterNumber,
          tier,
          rebuildPdf,
          worksheet: draft,
        }),
      });
      const data = await res.json();
      const combined = [data.verificationOutput, data.pdfOutput]
        .filter(Boolean)
        .join("\n");
      if (res.ok && data.ok) {
        setStatusMsg({
          ok: true,
          text: `Saved to ${data.savedPath}\n${combined}`,
        });
        onSaved(draft);
      } else {
        setStatusMsg({
          ok: false,
          text: combined || data.error || "Verification error.",
        });
        if (data.saved) onSaved(draft);
      }
    } catch (e: unknown) {
      setStatusMsg({
        ok: false,
        text: e instanceof Error ? e.message : "Network error saving worksheet.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="editor-shell">
      <div className="editor-topbar">
        <div>
          <div className="editor-kicker">
            Worksheet Copy Editor · Year {year} · {draft.section_code} (
            {tier.toUpperCase()})
          </div>
          <h2 className="editor-title">{draft.title}</h2>
        </div>
        <div className="editor-topbar-actions">
          <label className="editor-checkbox-label">
            <input
              type="checkbox"
              checked={rebuildPdf}
              onChange={(e) => setRebuildPdf(e.target.checked)}
            />
            Rebuild A4 PDF on Save
          </label>
          <button
            type="button"
            onClick={onClose}
            className="minimal-btn"
            disabled={saving}
          >
            Back to Reader
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="pdf-download-btn primary"
            disabled={saving}
          >
            {saving ? "Saving & Rendering..." : "Save & Verify Worksheet"}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`editor-status-banner ${
            statusMsg.ok ? "status-ok" : "status-err"
          }`}
        >
          <pre className="editor-status-pre">{statusMsg.text}</pre>
        </div>
      )}

      <div className="editor-body">
        <div className="editor-stack">
          <div className="editor-card">
            <h3 className="editor-card-heading">Part A · Fluency Questions</h3>
            {draft.fluency_questions.map((fq, fIdx) => (
              <div key={fq.number} className="editor-subcard">
                <div className="editor-subcard-title">Q{fq.number}</div>
                <LiveMathField
                  label="Stem Prompt"
                  value={fq.prompt}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.fluency_questions];
                      next[fIdx] = { ...next[fIdx], prompt: val };
                      return { ...d, fluency_questions: next };
                    })
                  }
                />
                {fq.parts.map((pt, pIdx) => (
                  <div key={pt.label} className="editor-ws-part-pair">
                    <LiveMathField
                      label={`(${pt.label}) Question`}
                      value={pt.question}
                      onChange={(val) =>
                        setDraft((d) => {
                          const next = [...d.fluency_questions];
                          const parts = [...next[fIdx].parts];
                          parts[pIdx] = { ...parts[pIdx], question: val };
                          next[fIdx] = { ...next[fIdx], parts };
                          return { ...d, fluency_questions: next };
                        })
                      }
                    />
                    <LiveMathField
                      label={`(${pt.label}) Answer`}
                      value={pt.answer}
                      onChange={(val) =>
                        setDraft((d) => {
                          const next = [...d.fluency_questions];
                          const parts = [...next[fIdx].parts];
                          parts[pIdx] = { ...parts[pIdx], answer: val };
                          next[fIdx] = { ...next[fIdx], parts };
                          return { ...d, fluency_questions: next };
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="editor-card">
            <h3 className="editor-card-heading">
              Part B · Problem-Solving &amp; Applications
            </h3>
            {draft.application_questions.map((aq, idx) => (
              <div key={aq.number} className="editor-subcard">
                <div className="editor-subcard-title">Q{aq.number}</div>
                <LiveMathField
                  label="Question"
                  value={aq.question}
                  multiline
                  rows={2}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.application_questions];
                      next[idx] = { ...next[idx], question: val };
                      return { ...d, application_questions: next };
                    })
                  }
                />
                <LiveMathField
                  label="Answer"
                  value={aq.answer}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.application_questions];
                      next[idx] = { ...next[idx], answer: val };
                      return { ...d, application_questions: next };
                    })
                  }
                />
              </div>
            ))}
          </div>

          <div className="editor-card">
            <h3 className="editor-card-heading">
              Part C · Reasoning &amp; Challenge
            </h3>
            {draft.reasoning_questions.map((rq, idx) => (
              <div key={rq.number} className="editor-subcard">
                <div className="editor-subcard-title">Q{rq.number}</div>
                <LiveMathField
                  label="Question"
                  value={rq.question}
                  multiline
                  rows={2}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.reasoning_questions];
                      next[idx] = { ...next[idx], question: val };
                      return { ...d, reasoning_questions: next };
                    })
                  }
                />
                <LiveMathField
                  label="Answer"
                  value={rq.answer}
                  multiline
                  rows={2}
                  onChange={(val) =>
                    setDraft((d) => {
                      const next = [...d.reasoning_questions];
                      next[idx] = { ...next[idx], answer: val };
                      return { ...d, reasoning_questions: next };
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
