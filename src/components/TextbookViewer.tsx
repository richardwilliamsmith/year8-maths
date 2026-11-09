"use client";

import React, { useState } from "react";
import type {
  CurriculumManifest,
  TextbookSectionData,
  ExerciseQuestion,
} from "@/lib/curriculum";
import { MathText, FormulaBlock } from "./MathText";

interface TextbookViewerProps {
  manifest: CurriculumManifest;
  generatedSections: Record<string, TextbookSectionData>;
}

type ActiveTab =
  | "all"
  | "theory"
  | "examples"
  | "misconceptions"
  | "exercises"
  | "verification";

type ExerciseTierFilter =
  | "all"
  | "fluency_and_understanding"
  | "problem_solving_and_modelling"
  | "reasoning_and_communication";

export function TextbookViewer({
  manifest,
  generatedSections,
}: TextbookViewerProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>("1_1");
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [exerciseTier, setExerciseTier] = useState<ExerciseTierFilter>("all");
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [revealedTryAnswers, setRevealedTryAnswers] = useState<
    Record<string, boolean>
  >({});
  const [openSolutions, setOpenSolutions] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<
    Record<number, boolean>
  >({ 1: true });

  const activeSection = generatedSections[selectedSectionId];

  let selectedManifestChapter = manifest.chapters[0];
  let selectedManifestSection = manifest.chapters[0].sections[0];
  for (const ch of manifest.chapters) {
    for (const sec of ch.sections) {
      if (sec.section_id === selectedSectionId) {
        selectedManifestChapter = ch;
        selectedManifestSection = sec;
      }
    }
  }

  const totalGeneratedCount = Object.keys(generatedSections).length;
  const totalManifestSections = manifest.chapters.reduce(
    (acc, ch) => acc + ch.sections.length,
    0
  );
  const totalVerifiedAssertions = Object.values(generatedSections).reduce(
    (acc, sec) => acc + sec.assertions.length,
    0
  );

  const toggleChapter = (chNum: number) => {
    setExpandedChapters((prev) => ({ ...prev, [chNum]: !prev[chNum] }));
  };

  const toggleHint = (id: string) => {
    setRevealedHints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTryAnswer = (id: string) => {
    setRevealedTryAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSolution = (id: string) => {
    setOpenSolutions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderExerciseGroup = (
    title: string,
    subtitle: string,
    questions: ExerciseQuestion[]
  ) => (
    <div className="exercise-tier-block">
      <div className="exercise-tier-header">
        <div>
          <h4 className="tier-heading">{title}</h4>
          <p className="tier-subtitle">{subtitle}</p>
        </div>
        <span className="question-count">{questions.length} questions</span>
      </div>

      <div className="questions-grid">
        {questions.map((q) => {
          const isOpen = !!openSolutions[q.id];
          return (
            <div key={q.id} className="question-card">
              <div className="question-top-row">
                <div className="question-badges">
                  <span className="q-id-badge">{q.id.replaceAll("_", ".")}</span>
                  <span className="meta-tag">{q.difficulty}</span>
                  {q.context && <span className="meta-tag">{q.context}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => toggleSolution(q.id)}
                  className={`minimal-btn ${isOpen ? "active" : ""}`}
                >
                  {isOpen ? "Hide solution" : "Solution"}
                </button>
              </div>

              <div className="question-body">
                <MathText text={q.question} />
              </div>

              {isOpen && (
                <div className="solution-drawer">
                  <div className="solution-steps-title">Working</div>
                  <ol className="solution-steps-list">
                    {q.step_by_step_solution.map((stepLine, sIdx) => (
                      <li key={sIdx}>
                        <MathText text={stepLine} />
                      </li>
                    ))}
                  </ol>
                  <div className="solution-final-box">
                    <span className="solution-final-label">Answer:</span>{" "}
                    <MathText text={q.final_answer} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="textbook-shell">
      {/* Minimal Left Sidebar */}
      <aside className="curriculum-sidebar">
        <div className="brand-header">
          <div className="brand-kicker">Victorian Curriculum v2.0</div>
          <h1 className="brand-title">Year 8 Mathematics</h1>
          <div className="brand-stats">
            <span>
              {totalGeneratedCount} of {totalManifestSections} sections
            </span>
            <span>·</span>
            <span>{totalVerifiedAssertions} SymPy checks</span>
          </div>
        </div>

        <nav className="chapter-nav" aria-label="Textbook Chapters">
          {manifest.chapters.map((ch) => {
            const isExpanded = !!expandedChapters[ch.chapter_number];
            const generatedInChapter = ch.sections.filter(
              (s) => !!generatedSections[s.section_id]
            ).length;

            return (
              <div key={ch.id} className="chapter-group">
                <button
                  type="button"
                  className={`chapter-header-btn ${
                    selectedManifestChapter.chapter_number === ch.chapter_number
                      ? "current-chapter"
                      : ""
                  }`}
                  onClick={() => toggleChapter(ch.chapter_number)}
                >
                  <div className="chapter-header-top">
                    <span className="chapter-num">
                      Chapter {ch.chapter_number} · {ch.strand}
                    </span>
                    <span className="chapter-progress">
                      {generatedInChapter}/{ch.sections.length}
                    </span>
                  </div>
                  <div className="chapter-name">{ch.title}</div>
                </button>

                {isExpanded && (
                  <ul className="section-list">
                    {ch.sections.map((sec) => {
                      const isReady = !!generatedSections[sec.section_id];
                      const isSelected = sec.section_id === selectedSectionId;
                      return (
                        <li key={sec.section_id}>
                          <button
                            type="button"
                            onClick={() => setSelectedSectionId(sec.section_id)}
                            className={`section-nav-item ${
                              isSelected ? "selected" : ""
                            } ${isReady ? "ready" : "pending"}`}
                          >
                            <span className="sec-code-pill">
                              {sec.section_code}
                            </span>
                            <span className="sec-nav-title">{sec.title}</span>
                            <span
                              className={`sec-status-dot ${
                                isReady ? "dot-ready" : "dot-pending"
                              }`}
                              title={isReady ? "Verified" : "Planned"}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="textbook-main">
        {activeSection ? (
          <>
            <header className="section-hero">
              <div className="hero-meta-row">
                <span>
                  Chapter {activeSection.metadata.chapter_number} ·{" "}
                  {activeSection.metadata.chapter_title}
                </span>
                <span>·</span>
                <span>{activeSection.metadata.vcaa_code}</span>
                <span>·</span>
                <span>
                  {activeSection.assertions.length} assertions verified
                </span>
              </div>

              <h2 className="section-main-title">
                <span className="section-code-highlight">
                  {activeSection.metadata.section_code}
                </span>
                <span>{activeSection.metadata.title}</span>
              </h2>

              <p className="vcaa-official-desc">
                {activeSection.metadata.vcaa_description}
              </p>

              <div className="alignment-grid">
                <div className="alignment-card">
                  <div className="alignment-label">Target Mastery</div>
                  <p>
                    <MathText text={activeSection.metadata.target_mastery} />
                  </p>
                </div>
                <div className="alignment-card">
                  <div className="alignment-label">Prerequisites</div>
                  <ul className="prereq-list">
                    {activeSection.metadata.prerequisites.map((pre, i) => (
                      <li key={i}>
                        <MathText text={pre} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="section-tabs" role="tablist">
                {(
                  [
                    ["all", "All"],
                    ["theory", "Theory"],
                    ["examples", "Examples"],
                    ["misconceptions", "Misconceptions"],
                    ["exercises", "Exercises"],
                    ["verification", "Verification"],
                  ] as const
                ).map(([tabKey, tabLabel]) => (
                  <button
                    key={tabKey}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tabKey}
                    onClick={() => setActiveTab(tabKey)}
                    className={`tab-btn ${activeTab === tabKey ? "active" : ""}`}
                  >
                    {tabLabel}
                  </button>
                ))}
              </div>
            </header>

            <div className="section-content-body">
              {/* 1. Theory & Key Ideas */}
              {(activeTab === "all" || activeTab === "theory") && (
                <section className="pedagogy-section">
                  <div className="section-heading-bar">
                    <h3>Theory &amp; Key Ideas</h3>
                  </div>

                  {activeSection.metadata.key_vocabulary &&
                    activeSection.metadata.key_vocabulary.length > 0 && (
                      <div className="vocab-panel">
                        <div className="vocab-heading">Vocabulary</div>
                        <div className="vocab-grid">
                          {activeSection.metadata.key_vocabulary.map((kv, i) => (
                            <div key={i} className="vocab-item">
                              <span className="vocab-term">{kv.term}</span>
                              <span className="vocab-def">
                                <MathText text={kv.definition} />
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="theory-cards-stack">
                    {activeSection.theory.map((t, idx) => (
                      <article key={t.id} className="theory-card">
                        <div className="theory-card-index">0{idx + 1}</div>
                        <h4 className="theory-card-title">{t.title}</h4>
                        <p className="theory-explanation">
                          <MathText text={t.explanation} />
                        </p>
                        {t.formula_latex && (
                          <FormulaBlock latex={t.formula_latex} />
                        )}
                        <div className="memory-aid-callout">
                          <div className="callout-header">
                            {t.callout_title || "Key Rule"}
                          </div>
                          <div className="callout-body">
                            <MathText text={t.callout_rule} />
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* 2. Worked Examples */}
              {(activeTab === "all" || activeTab === "examples") && (
                <section className="pedagogy-section">
                  <div className="section-heading-bar">
                    <h3>Worked Examples</h3>
                  </div>

                  <div className="examples-stack">
                    {activeSection.worked_examples.map((we, idx) => {
                      const showHint = !!revealedHints[we.id];
                      const showTryAns = !!revealedTryAnswers[we.id];

                      return (
                        <article key={we.id} className="worked-example-card">
                          <div className="we-header">
                            <span className="we-badge">Example {idx + 1}</span>
                            <h4 className="we-title">{we.title}</h4>
                          </div>

                          <div className="we-problem-box">
                            <MathText text={we.problem} />
                          </div>

                          <div className="two-col-scaffold">
                            <div className="scaffold-head">
                              <div className="col-step">Step</div>
                              <div className="col-thinking">Thinking</div>
                              <div className="col-working">Working</div>
                            </div>
                            {we.steps.map((s) => (
                              <div key={s.step} className="scaffold-row">
                                <div className="col-step">{s.step}</div>
                                <div className="col-thinking">
                                  <MathText text={s.thinking} />
                                </div>
                                <div className="col-working">
                                  <MathText text={s.working} />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="we-final-answer">
                            <span className="we-answer-label">Answer:</span>{" "}
                            <MathText text={we.final_answer} />
                          </div>

                          <div className="now-you-try-box">
                            <div className="nyt-header">
                              <span className="nyt-label">Now You Try</span>
                              <div className="nyt-actions">
                                {we.now_you_try.hint && (
                                  <button
                                    type="button"
                                    onClick={() => toggleHint(we.id)}
                                    className="minimal-btn"
                                  >
                                    {showHint ? "Hide hint" : "Hint"}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => toggleTryAnswer(we.id)}
                                  className={`minimal-btn ${
                                    showTryAns ? "active" : ""
                                  }`}
                                >
                                  {showTryAns ? "Hide answer" : "Answer"}
                                </button>
                              </div>
                            </div>

                            <div className="nyt-problem">
                              <MathText text={we.now_you_try.problem} />
                            </div>

                            {showHint && we.now_you_try.hint && (
                              <div className="nyt-reveal">
                                <span className="reveal-label">Hint: </span>
                                <MathText text={we.now_you_try.hint} />
                              </div>
                            )}

                            {showTryAns && (
                              <div className="nyt-reveal">
                                <div>
                                  <span className="reveal-label">Working: </span>
                                  <MathText
                                    text={we.now_you_try.working_summary}
                                  />
                                </div>
                                <div className="nyt-final">
                                  <span className="reveal-label">Answer: </span>
                                  <MathText text={we.now_you_try.answer} />
                                </div>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 3. Common Misconceptions */}
              {(activeTab === "all" || activeTab === "misconceptions") && (
                <section className="pedagogy-section">
                  <div className="section-heading-bar">
                    <h3>Common Misconceptions</h3>
                  </div>

                  <div className="misconceptions-grid">
                    {activeSection.common_misconceptions.map((m) => (
                      <article key={m.id} className="misconception-card">
                        <h4 className="misc-title">{m.title}</h4>
                        <div className="misc-comparison">
                          <div className="misc-wrong-box">
                            <div className="misc-box-label">Misconception</div>
                            <p>
                              <MathText text={m.misconception} />
                            </p>
                            {m.incorrect_working && (
                              <div className="misc-working">
                                <MathText text={m.incorrect_working} />
                              </div>
                            )}
                          </div>

                          <div className="misc-right-box">
                            <div className="misc-box-label">
                              Correct Concept
                            </div>
                            <p>
                              <MathText text={m.correct_concept} />
                            </p>
                            {m.correct_working && (
                              <div className="misc-working">
                                <MathText text={m.correct_working} />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="misc-counter-example">
                          <span className="reveal-label">Counter-example: </span>
                          <MathText text={m.counter_example} />
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* 4. Exercises */}
              {(activeTab === "all" || activeTab === "exercises") && (
                <section className="pedagogy-section">
                  <div className="section-heading-bar">
                    <h3>Exercises</h3>
                    <div className="tier-filter-bar">
                      {(
                        [
                          ["all", "All"],
                          ["fluency_and_understanding", "Fluency"],
                          ["problem_solving_and_modelling", "Problem-Solving"],
                          ["reasoning_and_communication", "Reasoning"],
                        ] as const
                      ).map(([tKey, tLabel]) => (
                        <button
                          key={tKey}
                          type="button"
                          onClick={() => setExerciseTier(tKey)}
                          className={`minimal-btn ${
                            exerciseTier === tKey ? "active" : ""
                          }`}
                        >
                          {tLabel}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(exerciseTier === "all" ||
                    exerciseTier === "fluency_and_understanding") &&
                    renderExerciseGroup(
                      "Fluency & Understanding",
                      "Skill consolidation and graduated practice",
                      activeSection.exercises.fluency_and_understanding
                    )}

                  {(exerciseTier === "all" ||
                    exerciseTier === "problem_solving_and_modelling") &&
                    renderExerciseGroup(
                      "Problem-Solving & Modelling",
                      "Applied problems in Australian contexts",
                      activeSection.exercises.problem_solving_and_modelling
                    )}

                  {(exerciseTier === "all" ||
                    exerciseTier === "reasoning_and_communication") &&
                    renderExerciseGroup(
                      "Reasoning & Communication",
                      "Mathematical justification, proofs, and error analysis",
                      activeSection.exercises.reasoning_and_communication
                    )}
                </section>
              )}

              {/* 5. SymPy Assertions */}
              {(activeTab === "all" || activeTab === "verification") && (
                <section className="pedagogy-section">
                  <div className="section-heading-bar">
                    <h3>SymPy Verification Suite</h3>
                    <span className="section-subtitle">
                      <code>
                        output/chapter_{activeSection.metadata.chapter_number}/
                        {activeSection.metadata.section_id}.json
                      </code>
                    </span>
                  </div>

                  <div className="assertions-table-wrap">
                    <table className="assertions-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Description</th>
                          <th>Expression</th>
                          <th>Expected</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSection.assertions.map((a) => (
                          <tr key={a.id}>
                            <td>
                              <code>{a.id}</code>
                            </td>
                            <td>{a.description || "—"}</td>
                            <td>
                              <code>{a.expression}</code>
                            </td>
                            <td>
                              <code>{JSON.stringify(a.expected)}</code>
                            </td>
                            <td>
                              <span className="pass-badge">Verified</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          </>
        ) : (
          <div className="pending-section-card">
            <div className="pending-badge">Planned Section</div>
            <h2>
              {selectedManifestSection.section_code}{" "}
              {selectedManifestSection.title}
            </h2>
            <p className="pending-vcaa">
              <code>{selectedManifestSection.vcaa_code}</code> —{" "}
              {selectedManifestSection.vcaa_description}
            </p>
            <div className="pending-details">
              <h4>Target Mastery</h4>
              <p>{selectedManifestSection.target_mastery}</p>

              <h4>Sub-Concepts</h4>
              <ul>
                {selectedManifestSection.sub_concepts.map((sc, idx) => (
                  <li key={idx}>{sc}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
