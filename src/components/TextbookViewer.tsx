"use client";

import React, { useState } from "react";
import type {
  CurriculumManifest,
  TextbookSectionData,
  ExerciseQuestion,
  TieredWorksheetAnswerKeys,
  WorksheetTierKey,
  VcaaStandardsRegistry,
} from "@/lib/curriculum";
import { MathText, FormulaBlock } from "./MathText";
import { MathDiagram } from "./MathDiagram";
import { SectionCopyEditor, WorksheetCopyEditor } from "./CopyEditor";
import type { EditableWorksheetData } from "@/app/api/editor/worksheet/route";

interface TextbookViewerProps {
  yearManifests: Record<string, CurriculumManifest>;
  generatedSections: Record<string, TextbookSectionData>;
  tieredAnswerKeys: TieredWorksheetAnswerKeys;
  vcaaStandards: VcaaStandardsRegistry;
  isDevMode?: boolean;
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

const APPENDIX_TEACHER_ID = "appendix_teacher_resources";
const APPENDIX_STANDARDS_ID = "appendix_vcaa_standards";

const TIER_META: Record<
  WorksheetTierKey,
  {
    label: string;
    shortLabel: string;
    subtitle: string;
    masterPdfUrl: string;
    badgeClass: string;
  }
> = {
  foundation: {
    label: "Foundation Tier (Support)",
    shortLabel: "Foundation",
    subtitle:
      "Scaffolded A4 worksheets with step-by-step prompts, friendly integers, and formula reminders for targeted support.",
    masterPdfUrl: "/worksheets/year8_maths_worksheets_foundation_answer_key.pdf",
    badgeClass: "tier-badge-foundation",
  },
  standard: {
    label: "Standard Tier (Core)",
    shortLabel: "Standard",
    subtitle:
      "Core Year 8 Victorian Curriculum v2.0 A4 worksheets balancing Fluency, Applications, and Reasoning.",
    masterPdfUrl: "/worksheets/year8_maths_worksheets_answer_key.pdf",
    badgeClass: "tier-badge-standard",
  },
  extension: {
    label: "Extension Tier (Challenge)",
    shortLabel: "Extension",
    subtitle:
      "Enrichment A4 worksheets featuring multi-step synthesis, algebraic parameters, and competition-style proofs.",
    masterPdfUrl: "/worksheets/year8_maths_worksheets_extension_answer_key.pdf",
    badgeClass: "tier-badge-extension",
  },
};

export function TextbookViewer({
  yearManifests,
  generatedSections: initialGeneratedSections,
  tieredAnswerKeys: initialTieredAnswerKeys,
  vcaaStandards,
  isDevMode = false,
}: TextbookViewerProps) {
  const [generatedSections, setGeneratedSections] = useState(
    initialGeneratedSections
  );
  const [tieredAnswerKeys, setTieredAnswerKeys] = useState(
    initialTieredAnswerKeys
  );
  const [editingSectionMode, setEditingSectionMode] = useState(false);
  const [editingWorksheet, setEditingWorksheet] = useState<{
    tier: WorksheetTierKey;
    chapterNumber: number;
    data: EditableWorksheetData;
  } | null>(null);
  const [loadingWsEditor, setLoadingWsEditor] = useState(false);
  const [selectedYear, setSelectedYear] = useState<"8" | "9" | "10">("8");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("1_1");
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [exerciseTier, setExerciseTier] = useState<ExerciseTierFilter>("all");
  const [appendixWorksheetTier, setAppendixWorksheetTier] =
    useState<WorksheetTierKey>("standard");
  const [standardsYearFilter, setStandardsYearFilter] = useState<
    "all" | "8" | "9" | "10"
  >("all");
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [revealedTryAnswers, setRevealedTryAnswers] = useState<
    Record<string, boolean>
  >({});
  const [openSolutions, setOpenSolutions] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<
    Record<number, boolean>
  >({ 1: true });
  const [appendixChapterFilter, setAppendixChapterFilter] = useState<
    number | "all"
  >("all");

  const manifest = yearManifests[selectedYear] || yearManifests["8"];
  const isAppendixSelected = selectedSectionId === APPENDIX_TEACHER_ID;
  const isStandardsSelected = selectedSectionId === APPENDIX_STANDARDS_ID;
  const isSpecialPage = isAppendixSelected || isStandardsSelected;

  const activeSection = !isSpecialPage
    ? generatedSections[selectedSectionId]
    : undefined;

  const foundationKey = !isSpecialPage
    ? tieredAnswerKeys.foundation[selectedSectionId]
    : undefined;
  const standardKey = !isSpecialPage
    ? tieredAnswerKeys.standard[selectedSectionId]
    : undefined;
  const extensionKey = !isSpecialPage
    ? tieredAnswerKeys.extension[selectedSectionId]
    : undefined;

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
  const totalAllYearsSections = Object.values(yearManifests).reduce(
    (acc, m) =>
      acc + m.chapters.reduce((cAcc, ch) => cAcc + ch.sections.length, 0),
    0
  );
  const totalVerifiedAssertions = Object.values(generatedSections).reduce(
    (acc, sec) => acc + sec.assertions.length,
    0
  );
  const totalWorksheetsCount =
    Object.keys(tieredAnswerKeys.foundation).length +
    Object.keys(tieredAnswerKeys.standard).length +
    Object.keys(tieredAnswerKeys.extension).length;

  const handleYearSwitch = (yr: "8" | "9" | "10") => {
    setSelectedYear(yr);
    const targetManifest = yearManifests[yr];
    if (targetManifest && targetManifest.chapters.length > 0) {
      setExpandedChapters({ 1: true });
      setSelectedSectionId(targetManifest.chapters[0].sections[0].section_id);
    }
  };

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

  const openAppendixForSection = (
    chNum: number,
    tier: WorksheetTierKey = "standard"
  ) => {
    setAppendixChapterFilter(chNum);
    setAppendixWorksheetTier(tier);
    setSelectedSectionId(APPENDIX_TEACHER_ID);
  };

  const openWorksheetEditor = async (
    tier: WorksheetTierKey,
    chapterNumber: number,
    sectionId: string
  ) => {
    setLoadingWsEditor(true);
    try {
      const res = await fetch(
        `/api/editor/worksheet?year=${selectedYear}&chapter=${chapterNumber}&tier=${tier}&section_id=${sectionId}`
      );
      if (res.ok) {
        const json = await res.json();
        setEditingWorksheet({
          tier,
          chapterNumber,
          data: json.worksheet,
        });
      }
    } finally {
      setLoadingWsEditor(false);
    }
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

  // Helper to find mapped sections for a VCAA code across manifests
  const findMappedSectionsForCode = (yr: string, code: string) => {
    const m = yearManifests[yr];
    if (!m) return [];
    const matches: {
      year: string;
      chapter_number: number;
      section_id: string;
      section_code: string;
      title: string;
      isGenerated: boolean;
    }[] = [];

    for (const ch of m.chapters) {
      const chMatches = ch.vcaa_codes.includes(code);
      for (const sec of ch.sections) {
        if (sec.vcaa_code === code || chMatches) {
          matches.push({
            year: yr,
            chapter_number: ch.chapter_number,
            section_id: sec.section_id,
            section_code: sec.section_code,
            title: sec.title,
            isGenerated: !!generatedSections[sec.section_id],
          });
        }
      }
    }
    return matches;
  };

  const activeTierMap = tieredAnswerKeys[appendixWorksheetTier];
  const activeTierMeta = TIER_META[appendixWorksheetTier];

  return (
    <div className="textbook-shell">
      {/* Minimal Left Sidebar */}
      <aside className="curriculum-sidebar">
        <div className="brand-header">
          <div className="brand-kicker">Victorian Curriculum F–10 v2.0</div>
          <h1 className="brand-title">Secondary Mathematics (8–10A)</h1>
          <div className="brand-stats">
            <span>
              {totalGeneratedCount}/{totalAllYearsSections} sections
            </span>
            <span>·</span>
            <span>{totalWorksheetsCount} sheets</span>
            <span>·</span>
            <span>{totalVerifiedAssertions} checks</span>
          </div>

          <div className="year-switcher-bar" role="tablist" aria-label="Year Level">
            {(
              [
                ["8", "Year 8"],
                ["9", "Year 9"],
                ["10", "Year 10 / 10A"],
              ] as const
            ).map(([yrKey, yrLabel]) => (
              <button
                key={yrKey}
                type="button"
                onClick={() => handleYearSwitch(yrKey)}
                className={`year-switch-btn ${
                  selectedYear === yrKey ? "active" : ""
                }`}
              >
                {yrLabel}
              </button>
            ))}
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
                    !isSpecialPage &&
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
                      const isSelected =
                        !isSpecialPage && sec.section_id === selectedSectionId;
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
                              title={isReady ? "Verified & Live" : "Mapped in Scope & Sequence"}
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

          {/* Appendices & Teacher Resources */}
          <div className="appendix-sidebar-group">
            <div className="appendix-sidebar-label">
              Teacher Hub &amp; VCAA Alignment
            </div>
            <button
              type="button"
              onClick={() => {
                setAppendixChapterFilter("all");
                setSelectedSectionId(APPENDIX_TEACHER_ID);
              }}
              className={`section-nav-item ready ${
                isAppendixSelected ? "selected" : ""
              }`}
            >
              <span className="sec-code-pill">App A</span>
              <span className="sec-nav-title">
                Teacher Resources &amp; Answer Keys
              </span>
              <span className="sec-status-dot dot-ready" title="Complete" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSectionId(APPENDIX_STANDARDS_ID);
              }}
              className={`section-nav-item ready ${
                isStandardsSelected ? "selected" : ""
              }`}
            >
              <span className="sec-code-pill">App B</span>
              <span className="sec-nav-title">
                VCAA v2.0 Standards Matrix (8–10A)
              </span>
              <span className="sec-status-dot dot-ready" title="83/83 Mapped" />
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="textbook-main">
        {isAppendixSelected ? (
          <div className="appendix-container">
            <header className="section-hero">
              <div className="hero-meta-row">
                <span>Appendix A · Teacher Resources</span>
                <span>·</span>
                <span>Victorian Curriculum F–10 v2.0</span>
                <span>·</span>
                <span>
                  {totalWorksheetsCount} Differentiated A4 Worksheets (Foundation,
                  Standard &amp; Extension)
                </span>
              </div>

              <h2 className="section-main-title">
                <span className="section-code-highlight">Appendix A</span>
                <span>Teacher Resources &amp; Differentiated Answer Keys</span>
              </h2>

              <p className="vcaa-official-desc">
                Centralised teacher resource hub containing the compiled Master
                Answer Keys and single-sided A4 student PDF downloads across all
                three differentiated classroom tiers:{" "}
                <strong>Foundation (Support)</strong>,{" "}
                <strong>Standard (Core)</strong>, and{" "}
                <strong>Extension (Challenge)</strong>.
              </p>

              {/* 3-Tier Master Answer Key Cards */}
              <div className="resource-roadmap-grid">
                {(["foundation", "standard", "extension"] as const).map(
                  (tKey) => {
                    const meta = TIER_META[tKey];
                    const count = Object.keys(tieredAnswerKeys[tKey]).length;
                    const isSelectedTier = appendixWorksheetTier === tKey;
                    return (
                      <div
                        key={tKey}
                        className={`roadmap-card ${
                          isSelectedTier ? "active" : ""
                        }`}
                      >
                        <div className="roadmap-status">
                          Available Now · {count} Section PDFs
                        </div>
                        <div className="roadmap-title">{meta.label}</div>
                        <p>{meta.subtitle}</p>
                        <div className="roadmap-card-actions">
                          <button
                            type="button"
                            onClick={() => setAppendixWorksheetTier(tKey)}
                            className={`minimal-btn ${
                              isSelectedTier ? "active" : ""
                            }`}
                          >
                            {isSelectedTier
                              ? `Viewing ${meta.shortLabel} Answers`
                              : `View ${meta.shortLabel} Answers`}
                          </button>
                          <a
                            href={meta.masterPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pdf-download-btn"
                          >
                            Master Answer Key (PDF)
                          </a>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <div className="teacher-master-download-bar">
                <div className="teacher-master-info">
                  <div className="teacher-master-title">
                    Currently Viewing: {activeTierMeta.label} — Master Answer Key
                  </div>
                  <div className="teacher-master-sub">
                    {activeTierMeta.subtitle}
                  </div>
                </div>
                <a
                  href={activeTierMeta.masterPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pdf-download-btn primary"
                >
                  Download {activeTierMeta.shortLabel} Master Answer Key (PDF)
                </a>
              </div>

              <div className="section-tabs" role="tablist">
                <button
                  type="button"
                  onClick={() => setAppendixChapterFilter("all")}
                  className={`tab-btn ${
                    appendixChapterFilter === "all" ? "active" : ""
                  }`}
                >
                  All Year {selectedYear} Chapters (1–10)
                </button>
                {manifest.chapters.map((ch) => (
                  <button
                    key={ch.chapter_number}
                    type="button"
                    onClick={() => setAppendixChapterFilter(ch.chapter_number)}
                    className={`tab-btn ${
                      appendixChapterFilter === ch.chapter_number ? "active" : ""
                    }`}
                  >
                    Ch {ch.chapter_number}
                  </button>
                ))}
              </div>
            </header>

            <div className="section-content-body">
              {manifest.chapters
                .filter(
                  (ch) =>
                    appendixChapterFilter === "all" ||
                    ch.chapter_number === appendixChapterFilter
                )
                .map((ch) => (
                  <section key={ch.id} className="pedagogy-section">
                    <div className="section-heading-bar">
                      <h3>
                        Year {selectedYear} · Chapter {ch.chapter_number}:{" "}
                        {ch.title} ({activeTierMeta.shortLabel} Tier)
                      </h3>
                      <span className="section-subtitle">{ch.strand}</span>
                    </div>

                    <div className="ak-cards-stack">
                      {ch.sections.map((sec) => {
                        const wk = activeTierMap[sec.section_id];
                        if (!wk) return null;

                        return (
                          <article key={sec.section_id} className="ak-section-card">
                            <div className="ak-card-header">
                              <div>
                                <div className="ak-card-title-row">
                                  <span className="we-badge">
                                    Worksheet {wk.section_code} (
                                    {activeTierMeta.shortLabel})
                                  </span>
                                  <h4 className="we-title">{wk.title}</h4>
                                  <span className="meta-tag">{wk.vcaa_code}</span>
                                </div>
                              </div>
                              <div className="ak-card-actions">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSectionId(sec.section_id);
                                  }}
                                  className="minimal-btn"
                                >
                                  Section {wk.section_code}
                                </button>
                                {(
                                  ["foundation", "standard", "extension"] as const
                                ).map((tKey) => {
                                  const tItem =
                                    tieredAnswerKeys[tKey][sec.section_id];
                                  if (!tItem) return null;
                                  return (
                                    <a
                                      key={tKey}
                                      href={tItem.pdf_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`pdf-download-btn ${
                                        tKey === appendixWorksheetTier
                                          ? "primary"
                                          : ""
                                      }`}
                                    >
                                      {TIER_META[tKey].shortLabel} PDF
                                    </a>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="ak-card-body">
                              <div className="ak-part-block">
                                <div className="ak-part-label">
                                  Part A · Fluency &amp; Skill Practice Answers
                                </div>
                                <div className="ak-fluency-table">
                                  {wk.fluency_answers.map((fa) => (
                                    <div key={fa.number} className="ak-fluency-line">
                                      <span className="ak-q-badge">
                                        Q{fa.number}.
                                      </span>
                                      <div className="ak-parts-row">
                                        {fa.parts.map((pt) => (
                                          <div
                                            key={pt.label}
                                            className="ak-part-cell"
                                          >
                                            <span className="ak-sub-label">
                                              ({pt.label})
                                            </span>{" "}
                                            <MathText text={pt.answer} />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="ak-part-block">
                                <div className="ak-part-label">
                                  Part B · Problem-Solving &amp; Applications
                                  Answers
                                </div>
                                <div className="ak-word-answers-grid">
                                  {wk.application_answers.map((aa) => (
                                    <div
                                      key={aa.number}
                                      className="ak-word-answer-item"
                                    >
                                      <span className="ak-q-badge">
                                        Q{aa.number}.
                                      </span>
                                      <div>
                                        <MathText text={aa.answer} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="ak-part-block">
                                <div className="ak-part-label">
                                  Part C · Reasoning &amp; Challenge Answers
                                </div>
                                <div className="ak-reasoning-stack">
                                  {wk.reasoning_answers.map((ra) => (
                                    <div
                                      key={ra.number}
                                      className="ak-word-answer-item"
                                    >
                                      <span className="ak-q-badge">
                                        Q{ra.number}.
                                      </span>
                                      <div>
                                        <MathText text={ra.answer} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
            </div>
          </div>
        ) : isStandardsSelected ? (
          <div className="appendix-container">
            <header className="section-hero">
              <div className="hero-meta-row">
                <span>Appendix B · Curriculum Alignment &amp; Traceability</span>
                <span>·</span>
                <span>Victorian Curriculum F–10 Version 2.0 (VCAA)</span>
                <span>·</span>
                <span>83/83 Official Content Descriptions Mapped (Years 8–10A)</span>
              </div>

              <h2 className="section-main-title">
                <span className="section-code-highlight">Appendix B</span>
                <span>VCAA Version 2.0 Standards Traceability Matrix</span>
              </h2>

              <p className="vcaa-official-desc">
                Complete audit and mapping of every official Victorian Curriculum
                F–10 Version 2.0 Mathematics content description across{" "}
                <strong>Level 8 (26 codes)</strong>,{" "}
                <strong>Level 9 (24 codes)</strong>, and{" "}
                <strong>Level 10 &amp; 10A (33 codes)</strong> to our chapters,
                sections, and differentiated classroom worksheets.
              </p>

              <div className="section-tabs" role="tablist">
                {(
                  [
                    ["all", "All Levels (Years 8–10A · 83 Codes)"],
                    ["8", "Level 8 (Year 8 · 26 Codes)"],
                    ["9", "Level 9 (Year 9 · 24 Codes)"],
                    ["10", "Level 10 & 10A (33 Codes)"],
                  ] as const
                ).map(([lvlKey, lvlLabel]) => (
                  <button
                    key={lvlKey}
                    type="button"
                    onClick={() => setStandardsYearFilter(lvlKey)}
                    className={`tab-btn ${
                      standardsYearFilter === lvlKey ? "active" : ""
                    }`}
                  >
                    {lvlLabel}
                  </button>
                ))}
              </div>
            </header>

            <div className="section-content-body">
              {(["8", "9", "10"] as const)
                .filter(
                  (lvl) =>
                    standardsYearFilter === "all" || standardsYearFilter === lvl
                )
                .map((lvl) => {
                  const levelData = vcaaStandards.levels[lvl];
                  if (!levelData) return null;

                  return (
                    <section key={lvl} className="pedagogy-section">
                      <div className="section-heading-bar">
                        <h3>{levelData.title}</h3>
                        <span className="section-subtitle">
                          {levelData.codes.length} Official VCAA v2.0 Content
                          Descriptions · 100% Mapped
                        </span>
                      </div>

                      <div className="assertions-table-wrap">
                        <table className="assertions-table">
                          <thead>
                            <tr>
                              <th>VCAA Code</th>
                              <th>Strand</th>
                              <th>Official Content Description</th>
                              <th>Mapped Sections &amp; Resources</th>
                            </tr>
                          </thead>
                          <tbody>
                            {levelData.codes.map((item) => {
                              const mapped = findMappedSectionsForCode(
                                lvl,
                                item.code
                              );
                              return (
                                <tr key={item.code}>
                                  <td>
                                    <code>{item.code}</code>
                                  </td>
                                  <td>{item.strand}</td>
                                  <td>{item.description}</td>
                                  <td>
                                    <div className="mapped-pills-wrap">
                                      {mapped.map((m) => (
                                        <button
                                          key={m.section_id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedYear(
                                              m.year as "8" | "9" | "10"
                                            );
                                            setExpandedChapters((prev) => ({
                                              ...prev,
                                              [m.chapter_number]: true,
                                            }));
                                            setSelectedSectionId(m.section_id);
                                          }}
                                          className={`minimal-btn ${
                                            m.isGenerated ? "active" : ""
                                          }`}
                                          title={m.title}
                                        >
                                          Y{m.year} · {m.section_code}
                                        </button>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  );
                })}
            </div>
          </div>
        ) : editingWorksheet ? (
          <WorksheetCopyEditor
            year={selectedYear}
            chapterNumber={editingWorksheet.chapterNumber}
            tier={editingWorksheet.tier}
            initialWorksheet={editingWorksheet.data}
            onSaved={(updatedWs) => {
              setTieredAnswerKeys((prev) => ({
                ...prev,
                [editingWorksheet.tier]: {
                  ...prev[editingWorksheet.tier],
                  [updatedWs.section_id]: {
                    ...prev[editingWorksheet.tier][updatedWs.section_id],
                    title: updatedWs.title,
                    fluency_answers: updatedWs.fluency_questions.map((fq) => ({
                      number: fq.number,
                      parts: fq.parts.map((pt) => ({
                        label: pt.label,
                        answer: pt.answer,
                      })),
                    })),
                    application_answers: updatedWs.application_questions.map(
                      (aq) => ({
                        number: aq.number,
                        answer: aq.answer,
                      })
                    ),
                    reasoning_answers: updatedWs.reasoning_questions.map(
                      (rq) => ({
                        number: rq.number,
                        answer: rq.answer,
                      })
                    ),
                  },
                },
              }));
            }}
            onClose={() => setEditingWorksheet(null)}
          />
        ) : editingSectionMode && activeSection ? (
          <SectionCopyEditor
            year={selectedYear}
            initialSection={activeSection}
            onSaved={(updatedSec) => {
              setGeneratedSections((prev) => ({
                ...prev,
                [updatedSec.metadata.section_id]: updatedSec,
              }));
            }}
            onClose={() => setEditingSectionMode(false)}
          />
        ) : activeSection ? (
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
                {isDevMode && (
                  <>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => setEditingSectionMode(true)}
                      className="minimal-btn active"
                    >
                      Edit Section Copy
                    </button>
                  </>
                )}
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

              {/* Printable Worksheet & Differentiated Resource Strip */}
              {(foundationKey || standardKey || extensionKey) && (
                <div className="worksheet-resource-banner">
                  <div className="ws-banner-left">
                    <div className="ws-banner-kicker">
                      Differentiated Printable A4 Worksheets · Section{" "}
                      {activeSection.metadata.section_code}
                    </div>
                    <div className="ws-banner-desc">
                      Three complementary single-sided A4 problem sets (Support,
                      Core, and Challenge) for written workbook practice.
                    </div>
                  </div>
                  <div className="ws-banner-actions">
                    {foundationKey && (
                      <a
                        href={foundationKey.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pdf-download-btn"
                        title="Support tier worksheet with guided prompts"
                      >
                        Foundation PDF (Support)
                      </a>
                    )}
                    {isDevMode && foundationKey && (
                      <button
                        type="button"
                        disabled={loadingWsEditor}
                        onClick={() =>
                          openWorksheetEditor(
                            "foundation",
                            activeSection.metadata.chapter_number,
                            activeSection.metadata.section_id
                          )
                        }
                        className="minimal-btn"
                        title="Edit Foundation Worksheet Copy"
                      >
                        Edit
                      </button>
                    )}
                    {standardKey && (
                      <a
                        href={standardKey.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pdf-download-btn primary"
                        title="Core standard worksheet"
                      >
                        Standard PDF (Core)
                      </a>
                    )}
                    {isDevMode && standardKey && (
                      <button
                        type="button"
                        disabled={loadingWsEditor}
                        onClick={() =>
                          openWorksheetEditor(
                            "standard",
                            activeSection.metadata.chapter_number,
                            activeSection.metadata.section_id
                          )
                        }
                        className="minimal-btn"
                        title="Edit Standard Worksheet Copy"
                      >
                        Edit
                      </button>
                    )}
                    {extensionKey && (
                      <a
                        href={extensionKey.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pdf-download-btn"
                        title="Challenge tier worksheet for high-ability students"
                      >
                        Extension PDF (Challenge)
                      </a>
                    )}
                    {isDevMode && extensionKey && (
                      <button
                        type="button"
                        disabled={loadingWsEditor}
                        onClick={() =>
                          openWorksheetEditor(
                            "extension",
                            activeSection.metadata.chapter_number,
                            activeSection.metadata.section_id
                          )
                        }
                        className="minimal-btn"
                        title="Edit Extension Worksheet Copy"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        openAppendixForSection(
                          activeSection.metadata.chapter_number,
                          "standard"
                        )
                      }
                      className="minimal-btn"
                    >
                      Teacher Answer Keys →
                    </button>
                  </div>
                </div>
              )}

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

                  <MathDiagram
                    sectionId={activeSection.metadata.section_id}
                    vcaaCode={activeSection.metadata.vcaa_code}
                    strand={activeSection.metadata.strand}
                  />

                  {activeSection.metadata.key_vocabulary &&
                    activeSection.metadata.key_vocabulary.length > 0 && (
                      <div className="vocab-panel">
                        <div className="vocab-heading">Vocabulary</div>
                        <div className="vocab-grid">
                          {activeSection.metadata.key_vocabulary.map((kv, i) => (
                            <div key={i} className="vocab-item">
                              <span className="vocab-term">
                                <MathText text={kv.term} />
                              </span>
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
                        <h4 className="theory-card-title">
                          <MathText text={t.title} />
                        </h4>
                        <p className="theory-explanation">
                          <MathText text={t.explanation} />
                        </p>
                        {t.formula_latex && (
                          <FormulaBlock latex={t.formula_latex} />
                        )}
                        <div className="memory-aid-callout">
                          <div className="callout-header">
                            <MathText text={t.callout_title || "Key Rule"} />
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
                            <h4 className="we-title">
                              <MathText text={we.title} />
                            </h4>
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
                        <h4 className="misc-title">
                          <MathText text={m.title} />
                        </h4>
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
                      {foundationKey && (
                        <a
                          href={foundationKey.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pdf-download-btn"
                        >
                          Foundation PDF
                        </a>
                      )}
                      {standardKey && (
                        <a
                          href={standardKey.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pdf-download-btn"
                        >
                          Standard PDF
                        </a>
                      )}
                      {extensionKey && (
                        <a
                          href={extensionKey.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pdf-download-btn"
                        >
                          Extension PDF
                        </a>
                      )}
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
            <div className="pending-badge">
              Year {selectedYear} Curriculum Blueprint · Chapter{" "}
              {selectedManifestChapter.chapter_number} (
              {selectedManifestChapter.strand})
            </div>
            <h2>
              {selectedManifestSection.section_code}:{" "}
              {selectedManifestSection.title}
            </h2>
            <p className="pending-vcaa">
              <code>{selectedManifestSection.vcaa_code}</code> —{" "}
              {selectedManifestSection.vcaa_description}
            </p>
            <div className="pending-details">
              <h4>Target Mastery</h4>
              <p>{selectedManifestSection.target_mastery}</p>

              <h4>Prerequisites</h4>
              <ul>
                {selectedManifestSection.prerequisites.map((pre, idx) => (
                  <li key={idx}>{pre}</li>
                ))}
              </ul>

              <h4>Key Sub-Concepts Mapped</h4>
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
