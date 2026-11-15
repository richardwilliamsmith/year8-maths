import fs from "fs";
import path from "path";
import katex from "katex";

const ROOT = process.cwd();
const KATEX_CSS_PATH = path
  .join(ROOT, "node_modules", "katex", "dist", "katex.min.css")
  .replaceAll("\\", "/");

function renderMathText(str) {
  if (!str) return "";
  const ESCAPED_DOLLAR = "\u0000DOLLAR\u0000";
  const normalized = str.replace(/\\\$/g, ESCAPED_DOLLAR);
  const parts = normalized.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);
  return parts
    .map((part) => {
      if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
        const tex = part.slice(2, -2).replaceAll(ESCAPED_DOLLAR, "\\$").trim();
        try {
          return katex.renderToString(tex, {
            displayMode: true,
            throwOnError: false,
            strict: false,
          });
        } catch {
          return `<code>${tex}</code>`;
        }
      }
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        const tex = part.slice(1, -1).replaceAll(ESCAPED_DOLLAR, "\\$").trim();
        try {
          return katex.renderToString(tex, {
            displayMode: false,
            throwOnError: false,
            strict: false,
          });
        } catch {
          return `<code>${tex}</code>`;
        }
      }
      return part
        .replaceAll(ESCAPED_DOLLAR, "$")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    })
    .join("");
}

const TIER_CONFIG = {
  foundation: {
    key: "foundation",
    label: "Foundation",
    badge: "Foundation Worksheet · Support",
    footerLabel: "Foundation Printable Worksheet (Support Tier)",
    akTitle: "Foundation Worksheets Master Answer Key",
    akSubtitle:
      "Complete compiled answers for all Foundation (Support Tier) printable worksheets, SymPy verified.",
    partANote: "Follow the step-by-step prompts and show working in your workbook",
    partBNote: "Use the guided hints to write clear mathematical statements with units",
    partCNote: "Explain your thinking clearly using numbers, words, or a diagram",
    accentBg: "#eef5f0",
    accentBorder: "#1e5631",
  },
  standard: {
    key: "standard",
    label: "Standard",
    badge: "Standard Worksheet · Core",
    footerLabel: "Standard Printable Worksheet (Core Tier)",
    akTitle: "Standard Worksheets Master Answer Key",
    akSubtitle:
      "Complete compiled answers for all Standard (Core Tier) printable worksheets, SymPy verified.",
    partANote: "Show complete step-by-step working in your workbook",
    partBNote: "Write clear mathematical statements with units",
    partCNote: "Justify your conclusions using algebraic or geometric reasoning",
    accentBg: "#f3f2ee",
    accentBorder: "#111111",
  },
  extension: {
    key: "extension",
    label: "Extension",
    badge: "Extension Worksheet · Challenge",
    footerLabel: "Extension Printable Worksheet (Challenge Tier)",
    akTitle: "Extension Worksheets Master Answer Key",
    akSubtitle:
      "Complete compiled answers for all Extension (Challenge Tier) printable worksheets, SymPy verified.",
    partANote: "Show rigorous algebraic and numerical working for each part",
    partBNote: "Formulate equations and state exact or appropriately rounded answers",
    partCNote: "Provide formal mathematical proofs, generalisations, or justifications",
    accentBg: "#f0eef6",
    accentBorder: "#3b2366",
  },
};

function getYearLabel(sectionId) {
  if (sectionId.startsWith("9_")) return "Year 9 Mathematics";
  if (sectionId.startsWith("10_")) return "Year 10 & 10A Mathematics";
  return "Year 8 Mathematics";
}

function buildStudentWorksheetHtml(ch, ws, tierKey = "standard", forWeb = false) {
  const cfg = TIER_CONFIG[tierKey] || TIER_CONFIG.standard;
  const yearLabel = getYearLabel(ws.section_id);
  const cssHref = forWeb
    ? "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
    : `file:///${KATEX_CSS_PATH}`;

  const fluencyHtml = ws.fluency_questions
    .map((fq) => {
      const partsHtml = fq.parts
        .map(
          (pt) => `
          <div class="fluency-part">
            <span class="part-label">(${pt.label})</span>
            <span class="part-math">${renderMathText(pt.question)}</span>
          </div>`
        )
        .join("");

      return `
        <div class="q-block fluency-q">
          <div class="q-stem">
            <span class="q-num">Q${fq.number}.</span>
            <span class="q-prompt">${renderMathText(fq.prompt)}</span>
          </div>
          <div class="fluency-grid">
            ${partsHtml}
          </div>
        </div>`;
    })
    .join("");

  const appHtml = ws.application_questions
    .map(
      (aq) => `
      <div class="q-block word-q">
        <div class="q-num-col">Q${aq.number}.</div>
        <div class="q-text-col">${renderMathText(aq.question)}</div>
      </div>`
    )
    .join("");

  const reasoningHtml = ws.reasoning_questions
    .map(
      (rq) => `
      <div class="q-block word-q">
        <div class="q-num-col">Q${rq.number}.</div>
        <div class="q-text-col">${renderMathText(rq.question)}</div>
      </div>`
    )
    .join("");

  const webToolbar = forWeb
    ? `<div class="no-print-bar">
        <span><strong>${yearLabel} · Section ${ws.section_code}: ${ws.title}</strong> (${cfg.badge})</span>
        <button onclick="window.print()" class="print-btn">Print / Save as A4 PDF (Ctrl+P)</button>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8" />
  <title>Worksheet ${ws.section_code} (${cfg.label}) — ${ws.title}</title>
  <link rel="stylesheet" href="${cssHref}" />
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 13mm 10mm 13mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 184mm;
      height: 276mm;
      margin: 0 auto;
      font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #111111;
      background: #ffffff;
      font-size: 9.5pt;
      line-height: 1.38;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .no-print-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #141413;
      color: #ffffff;
      padding: 8px 14px;
      margin-bottom: 10px;
      border-radius: 4px;
      font-size: 12px;
    }
    .print-btn {
      background: #ffffff;
      color: #141413;
      border: none;
      padding: 5px 12px;
      border-radius: 3px;
      font-weight: 700;
      cursor: pointer;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
    }
    .page-frame {
      width: 100%;
      height: 275mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }
    .top-content {
      display: flex;
      flex-direction: column;
      gap: 2.5mm;
    }
    .ws-header {
      border-bottom: 1.5pt solid ${cfg.accentBorder};
      padding-bottom: 2mm;
    }
    .ws-meta-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.4pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #4b4b4b;
      margin-bottom: 1mm;
    }
    .ws-title-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 4mm;
    }
    .ws-main-title {
      font-size: 13.5pt;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: #111111;
    }
    .ws-code-pill {
      display: inline-block;
      background: ${cfg.accentBorder};
      color: #ffffff;
      font-size: 9.8pt;
      font-weight: 700;
      padding: 0.4mm 2.1mm;
      border-radius: 1mm;
      margin-right: 2mm;
      vertical-align: baseline;
    }
    .ws-tier-badge {
      font-size: 7.8pt;
      font-weight: 700;
      color: ${cfg.accentBorder};
      background: ${cfg.accentBg};
      border: 0.9pt solid ${cfg.accentBorder};
      padding: 0.4mm 2.2mm;
      border-radius: 0.8mm;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .student-info-row {
      display: grid;
      grid-template-columns: 1.8fr 1fr 1fr;
      gap: 4mm;
      margin-top: 2mm;
      padding-top: 1.6mm;
      border-top: 0.5pt solid #cccccc;
      font-size: 8.4pt;
      color: #333333;
    }
    .info-field {
      display: flex;
      align-items: baseline;
      gap: 1.5mm;
    }
    .info-line {
      flex: 1;
      border-bottom: 0.6pt solid #666666;
      height: 3.3mm;
    }
    .ws-section {
      display: flex;
      flex-direction: column;
      gap: 1.8mm;
    }
    .ws-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: ${cfg.accentBg};
      border-left: 2.5pt solid ${cfg.accentBorder};
      padding: 0.9mm 2.5mm;
      margin-top: 0.4mm;
    }
    .ws-section-title {
      font-size: 8.6pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #111111;
    }
    .ws-section-note {
      font-size: 7.4pt;
      color: #555555;
      font-style: italic;
    }
    .fluency-list {
      display: flex;
      flex-direction: column;
      gap: 2mm;
      padding: 0 1mm;
    }
    .fluency-q {
      border-bottom: 0.4pt dashed #dad8d0;
      padding-bottom: 1.8mm;
    }
    .fluency-q:last-child {
      border-bottom: none;
      padding-bottom: 0.4mm;
    }
    .q-stem {
      display: flex;
      gap: 1.8mm;
      margin-bottom: 1.2mm;
      font-weight: 600;
      font-size: 9.2pt;
    }
    .q-num {
      font-weight: 700;
      min-width: 6.5mm;
      color: #111111;
    }
    .fluency-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.3mm 2.8mm;
      padding-left: 6.5mm;
    }
    .fluency-part {
      display: flex;
      align-items: baseline;
      gap: 1.2mm;
      font-size: 9.1pt;
    }
    .part-label {
      font-weight: 600;
      color: #444444;
      font-size: 8.4pt;
    }
    .word-list {
      display: flex;
      flex-direction: column;
      gap: 2.1mm;
      padding: 0 1mm;
    }
    .word-q {
      display: grid;
      grid-template-columns: 7.5mm 1fr;
      align-items: baseline;
      padding-bottom: 1.8mm;
      border-bottom: 0.4pt dashed #dad8d0;
    }
    .word-q:last-child {
      border-bottom: none;
      padding-bottom: 0.4mm;
    }
    .q-num-col {
      font-weight: 700;
      font-size: 9.2pt;
      color: #111111;
    }
    .q-text-col {
      font-size: 9.2pt;
      text-align: justify;
    }
    .ws-footer {
      border-top: 0.8pt solid ${cfg.accentBorder};
      padding-top: 1.4mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.4pt;
      color: #555555;
    }
    .katex {
      font-size: 1.01em !important;
    }
  </style>
</head>
<body>
  ${webToolbar}
  <div class="page-frame">
    <div class="top-content">
      <header class="ws-header">
        <div class="ws-meta-bar">
          <span>${yearLabel} · Victorian Curriculum v2.0 (${ws.vcaa_code})</span>
          <span>Chapter ${ch.chapter_number}: ${ch.chapter_title}</span>
        </div>
        <div class="ws-title-row">
          <h1 class="ws-main-title">
            <span class="ws-code-pill">${ws.section_code}</span>${ws.title}
          </h1>
          <span class="ws-tier-badge">${cfg.badge}</span>
        </div>
        <div class="student-info-row">
          <div class="info-field"><span>Name:</span><span class="info-line"></span></div>
          <div class="info-field"><span>Class:</span><span class="info-line"></span></div>
          <div class="info-field"><span>Date:</span><span class="info-line"></span></div>
        </div>
      </header>

      <section class="ws-section">
        <div class="ws-section-header">
          <span class="ws-section-title">Part A · Fluency &amp; Skill Practice</span>
          <span class="ws-section-note">${cfg.partANote}</span>
        </div>
        <div class="fluency-list">
          ${fluencyHtml}
        </div>
      </section>

      <section class="ws-section">
        <div class="ws-section-header">
          <span class="ws-section-title">Part B · Problem-Solving &amp; Applications</span>
          <span class="ws-section-note">${cfg.partBNote}</span>
        </div>
        <div class="word-list">
          ${appHtml}
        </div>
      </section>

      <section class="ws-section">
        <div class="ws-section-header">
          <span class="ws-section-title">Part C · Reasoning &amp; Challenge</span>
          <span class="ws-section-note">${cfg.partCNote}</span>
        </div>
        <div class="word-list">
          ${reasoningHtml}
        </div>
      </section>
    </div>

    <footer class="ws-footer">
      <span>Open-Source ${yearLabel} · Victorian Curriculum F–10 v2.0</span>
      <span>Section ${ws.section_code} (${ws.vcaa_code}) · ${cfg.footerLabel}</span>
      <span>Page 1 of 1</span>
    </footer>
  </div>
</body>
</html>`;
}

function buildMasterAnswerKeyHtml(chaptersData, tierKey = "standard") {
  const cfg = TIER_CONFIG[tierKey] || TIER_CONFIG.standard;

  const sectionsHtml = chaptersData
    .map((ch) => {
      const wsBlocks = ch.worksheets
        .map((ws) => {
          const fluencyAns = ws.fluency_questions
            .map((fq) => {
              const pts = fq.parts
                .map(
                  (pt) =>
                    `<span class="ak-part"><strong>(${pt.label})</strong> ${renderMathText(
                      pt.answer
                    )}</span>`
                )
                .join("");
              return `<div class="ak-fluency-row"><span class="ak-qnum">Q${fq.number}.</span><div class="ak-parts-grid">${pts}</div></div>`;
            })
            .join("");

          const appAns = ws.application_questions
            .map(
              (aq) =>
                `<div class="ak-word-row"><span class="ak-qnum">Q${aq.number}.</span><span class="ak-ans">${renderMathText(
                  aq.answer
                )}</span></div>`
            )
            .join("");

          const reasAns = ws.reasoning_questions
            .map(
              (rq) =>
                `<div class="ak-word-row"><span class="ak-qnum">Q${rq.number}.</span><span class="ak-ans">${renderMathText(
                  rq.answer
                )}</span></div>`
            )
            .join("");

          return `
            <div class="ak-ws-card">
              <div class="ak-ws-header">
                <span class="ak-ws-title"><strong>${ws.section_code}</strong> · ${ws.title}</span>
                <span class="ak-ws-meta">${ws.vcaa_code} · ${cfg.label} Worksheet Answer Key</span>
              </div>
              <div class="ak-ws-body">
                <div class="ak-subhead">Part A · Fluency &amp; Skills</div>
                ${fluencyAns}
                <div class="ak-subhead">Part B · Problem-Solving &amp; Applications</div>
                <div class="ak-word-grid">${appAns}</div>
                <div class="ak-subhead">Part C · Reasoning &amp; Challenge</div>
                <div class="ak-word-stack">${reasAns}</div>
              </div>
            </div>`;
        })
        .join("");

      return `
        <section class="ak-chapter-block">
          <h2 class="ak-chapter-heading">Chapter ${ch.chapter_number}: ${ch.chapter_title} (${cfg.label} Tier)</h2>
          ${wsBlocks}
        </section>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8" />
  <title>Appendix A: Teacher Resources — ${cfg.label} Worksheets Answer Key</title>
  <link rel="stylesheet" href="file:///${KATEX_CSS_PATH}" />
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      color: #111111;
      background: #ffffff;
      font-size: 9pt;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .doc-header {
      border-bottom: 2pt solid ${cfg.accentBorder};
      padding-bottom: 3mm;
      margin-bottom: 4mm;
    }
    .doc-kicker {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #555555;
    }
    .doc-title {
      font-size: 16pt;
      font-weight: 700;
      margin: 1mm 0;
    }
    .doc-subtitle {
      font-size: 9pt;
      color: #444444;
    }
    .ak-chapter-block {
      margin-bottom: 5mm;
    }
    .ak-chapter-heading {
      font-size: 11.5pt;
      font-weight: 700;
      background: ${cfg.accentBorder};
      color: #ffffff;
      padding: 1.5mm 3mm;
      margin-bottom: 2.5mm;
      border-radius: 1mm;
    }
    .ak-ws-card {
      border: 0.7pt solid #cccccc;
      border-radius: 1.2mm;
      margin-bottom: 3.5mm;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .ak-ws-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: ${cfg.accentBg};
      padding: 1.5mm 3mm;
      border-bottom: 0.6pt solid #cccccc;
      font-size: 9.5pt;
    }
    .ak-ws-meta {
      font-size: 7.8pt;
      color: #555555;
      font-weight: 600;
    }
    .ak-ws-body {
      padding: 2mm 3mm;
      display: flex;
      flex-direction: column;
      gap: 1.4mm;
    }
    .ak-subhead {
      font-size: 7.6pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #555555;
      margin-top: 1mm;
      border-bottom: 0.4pt solid #e2e0d8;
      padding-bottom: 0.4mm;
    }
    .ak-fluency-row {
      display: grid;
      grid-template-columns: 7mm 1fr;
      align-items: baseline;
      font-size: 8.6pt;
    }
    .ak-qnum {
      font-weight: 700;
    }
    .ak-parts-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1mm 2.5mm;
    }
    .ak-word-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.2mm 4mm;
      font-size: 8.6pt;
    }
    .ak-word-stack {
      display: flex;
      flex-direction: column;
      gap: 1mm;
      font-size: 8.6pt;
    }
    .ak-word-row {
      display: grid;
      grid-template-columns: 7mm 1fr;
      align-items: baseline;
    }
  </style>
</head>
<body>
  <header class="doc-header">
    <div class="doc-kicker">Appendix A · Teacher Resources · Victorian Curriculum F–10 v2.0</div>
    <h1 class="doc-title">Secondary Mathematics — ${cfg.akTitle}</h1>
    <p class="doc-subtitle">${cfg.akSubtitle}</p>
  </header>
  ${sectionsHtml}
</body>
</html>`;
}

function loadTierChapters(yearPrefix, subDir) {
  const chaptersData = [];
  for (let c = 1; c <= 10; c++) {
    const parts = [ROOT, "worksheets"];
    if (yearPrefix) parts.push(yearPrefix);
    if (subDir) parts.push(subDir);
    parts.push(`chapter_${c}.json`);
    const p = path.join(...parts);
    if (fs.existsSync(p)) {
      chaptersData.push(JSON.parse(fs.readFileSync(p, "utf-8")));
    }
  }
  return chaptersData;
}

function main() {
  const outHtmlDir = path.join(ROOT, "worksheets", "build_html");
  const publicWsDir = path.join(ROOT, "public", "worksheets");
  fs.mkdirSync(outHtmlDir, { recursive: true });
  fs.mkdirSync(publicWsDir, { recursive: true });

  const yearPrefixes = ["", "year9", "year10"];
  let totalWorksheets = 0;

  for (const yrPrefix of yearPrefixes) {
    const tiersByChapter = {
      foundation: loadTierChapters(yrPrefix, "foundation"),
      standard: loadTierChapters(yrPrefix, ""),
      extension: loadTierChapters(yrPrefix, "extension"),
    };

    for (const [tierKey, chaptersData] of Object.entries(tiersByChapter)) {
      if (!chaptersData.length) continue;
      for (const ch of chaptersData) {
        for (const ws of ch.worksheets) {
          // 1. Local print-to-pdf HTML
          const htmlLocal = buildStudentWorksheetHtml(ch, ws, tierKey, false);
          fs.writeFileSync(
            path.join(outHtmlDir, `worksheet_${ws.section_id}_${tierKey}.html`),
            htmlLocal,
            "utf-8"
          );
          // 2. Web print-ready HTML in public/worksheets/
          const htmlWeb = buildStudentWorksheetHtml(ch, ws, tierKey, true);
          fs.writeFileSync(
            path.join(publicWsDir, `worksheet_${ws.section_id}_${tierKey}.html`),
            htmlWeb,
            "utf-8"
          );
          totalWorksheets++;
        }
      }
    }
  }

  console.log(
    `Generated ${totalWorksheets} student worksheet HTML files in both worksheets/build_html/ and public/worksheets/.`
  );
}

main();
