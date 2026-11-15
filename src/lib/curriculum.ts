import fs from "fs";
import path from "path";

export interface ManifestSectionSummary {
  section_id: string;
  section_code: string;
  title: string;
  vcaa_code: string;
  vcaa_description: string;
  target_mastery: string;
  prerequisites: string[];
  sub_concepts: string[];
}

export interface ManifestChapter {
  chapter_number: number;
  id: string;
  title: string;
  strand: string;
  vcaa_codes: string[];
  description: string;
  sections: ManifestSectionSummary[];
}

export interface CurriculumManifest {
  curriculum: string;
  year_level: number;
  title: string;
  version: string;
  locale: string;
  chapters: ManifestChapter[];
}

export interface VcaaStandardCode {
  code: string;
  strand: string;
  description: string;
}

export interface VcaaStandardsRegistry {
  curriculum: string;
  levels: Record<
    string,
    {
      title: string;
      codes: VcaaStandardCode[];
    }
  >;
}

export interface KeyVocabularyItem {
  term: string;
  definition: string;
}

export interface TheoryBlock {
  id: string;
  title: string;
  explanation: string;
  formula_latex?: string;
  callout_title?: string;
  callout_rule: string;
}

export interface WorkedExampleStep {
  step: number;
  thinking: string;
  working: string;
}

export interface NowYouTry {
  problem: string;
  hint?: string;
  answer: string;
  working_summary: string;
}

export interface WorkedExample {
  id: string;
  title: string;
  difficulty?: string;
  problem: string;
  steps: WorkedExampleStep[];
  final_answer: string;
  now_you_try: NowYouTry;
}

export interface CommonMisconception {
  id: string;
  title: string;
  misconception: string;
  correct_concept: string;
  incorrect_working?: string;
  correct_working?: string;
  counter_example: string;
}

export interface ExerciseQuestion {
  id: string;
  question: string;
  difficulty: "Easy" | "Medium" | "Challenging" | "Extension";
  context?: string;
  final_answer: string;
  step_by_step_solution: string[];
}

export interface MathAssertion {
  id: string;
  description?: string;
  expression: string;
  expected: number | string | boolean | (number | string)[];
}

export interface TextbookSectionData {
  metadata: {
    section_id: string;
    section_code: string;
    chapter_number: number;
    chapter_title: string;
    title: string;
    vcaa_code: string;
    vcaa_description: string;
    strand: string;
    target_mastery: string;
    prerequisites: string[];
    key_vocabulary?: KeyVocabularyItem[];
  };
  theory: TheoryBlock[];
  worked_examples: WorkedExample[];
  common_misconceptions: CommonMisconception[];
  exercises: {
    fluency_and_understanding: ExerciseQuestion[];
    problem_solving_and_modelling: ExerciseQuestion[];
    reasoning_and_communication: ExerciseQuestion[];
  };
  assertions: MathAssertion[];
}

export interface WorksheetPartAnswer {
  label: string;
  answer: string;
}

export interface WorksheetFluencyAnswer {
  number: number;
  parts: WorksheetPartAnswer[];
}

export interface WorksheetItemAnswer {
  number: number;
  answer: string;
}

export type WorksheetTierKey = "foundation" | "standard" | "extension";

export interface SectionWorksheetAnswerKey {
  section_id: string;
  section_code: string;
  chapter_number: number;
  chapter_title: string;
  title: string;
  vcaa_code: string;
  tier: string;
  tier_key: WorksheetTierKey;
  pdf_url: string;
  fluency_answers: WorksheetFluencyAnswer[];
  application_answers: WorksheetItemAnswer[];
  reasoning_answers: WorksheetItemAnswer[];
}

export type TieredWorksheetAnswerKeys = Record<
  WorksheetTierKey,
  Record<string, SectionWorksheetAnswerKey>
>;

export function loadCurriculumManifest(): CurriculumManifest {
  const manifestPath = path.join(process.cwd(), "curriculum_manifest_year8.json");
  const raw = fs.readFileSync(manifestPath, "utf-8");
  return JSON.parse(raw) as CurriculumManifest;
}

export function loadAllYearManifests(): Record<string, CurriculumManifest> {
  const y8 = loadCurriculumManifest();
  const y9Path = path.join(process.cwd(), "curriculum", "year9", "manifest.json");
  const y10Path = path.join(process.cwd(), "curriculum", "year10", "manifest.json");

  const manifests: Record<string, CurriculumManifest> = {
    "8": y8,
  };
  if (fs.existsSync(y9Path)) {
    manifests["9"] = JSON.parse(fs.readFileSync(y9Path, "utf-8")) as CurriculumManifest;
  }
  if (fs.existsSync(y10Path)) {
    manifests["10"] = JSON.parse(fs.readFileSync(y10Path, "utf-8")) as CurriculumManifest;
  }
  return manifests;
}

export function loadVcaaStandardsRegistry(): VcaaStandardsRegistry {
  const p = path.join(process.cwd(), "vcaa_v2_standards.json");
  return JSON.parse(fs.readFileSync(p, "utf-8")) as VcaaStandardsRegistry;
}

export function loadAllGeneratedSections(): Record<string, TextbookSectionData> {
  const manifests = loadAllYearManifests();
  const sections: Record<string, TextbookSectionData> = {};

  const yearOutputDirs: Record<string, string[]> = {
    "8": ["output"],
    "9": ["output", "year9"],
    "10": ["output", "year10"],
  };

  for (const [yr, manifest] of Object.entries(manifests)) {
    const baseParts = yearOutputDirs[yr] || ["output"];
    for (const chapter of manifest.chapters) {
      for (const sec of chapter.sections) {
        const filePath = path.join(
          process.cwd(),
          ...baseParts,
          `chapter_${chapter.chapter_number}`,
          `${sec.section_id}.json`
        );
        if (fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, "utf-8");
          sections[sec.section_id] = JSON.parse(raw) as TextbookSectionData;
        }
      }
    }
  }

  return sections;
}

function loadSingleTierKeys(
  tierKey: WorksheetTierKey,
  subDir: string,
  tierLabel: string
): Record<string, SectionWorksheetAnswerKey> {
  const keys: Record<string, SectionWorksheetAnswerKey> = {};
  const yearPrefixes = ["", "year9", "year10"];

  for (const yrPrefix of yearPrefixes) {
    for (let c = 1; c <= 10; c++) {
      const parts = [process.cwd(), "worksheets"];
      if (yrPrefix) parts.push(yrPrefix);
      if (subDir) parts.push(subDir);
      parts.push(`chapter_${c}.json`);
      const filePath = path.join(...parts);

      if (fs.existsSync(filePath)) {
        const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        for (const ws of raw.worksheets || []) {
          const pdfRel = `/worksheets/worksheet_${ws.section_id}_${tierKey}.pdf`;
          const htmlRel = `/worksheets/worksheet_${ws.section_id}_${tierKey}.html`;
          const pdfDisk = path.join(
            process.cwd(),
            "public",
            "worksheets",
            `worksheet_${ws.section_id}_${tierKey}.pdf`
          );

          keys[ws.section_id] = {
            section_id: ws.section_id,
            section_code: ws.section_code,
            chapter_number: raw.chapter_number,
            chapter_title: raw.chapter_title,
            title: ws.title,
            vcaa_code: ws.vcaa_code,
            tier: ws.tier || tierLabel,
            tier_key: tierKey,
            pdf_url: fs.existsSync(pdfDisk) ? pdfRel : htmlRel,
            fluency_answers: (ws.fluency_questions || []).map(
              (fq: { number: number; parts: { label: string; answer: string }[] }) => ({
                number: fq.number,
                parts: fq.parts.map((pt) => ({
                  label: pt.label,
                  answer: pt.answer,
                })),
              })
            ),
            application_answers: (ws.application_questions || []).map(
              (aq: { number: number; answer: string }) => ({
                number: aq.number,
                answer: aq.answer,
              })
            ),
            reasoning_answers: (ws.reasoning_questions || []).map(
              (rq: { number: number; answer: string }) => ({
                number: rq.number,
                answer: rq.answer,
              })
            ),
          };
        }
      }
    }
  }

  return keys;
}

export function loadAllTierWorksheetAnswerKeys(): TieredWorksheetAnswerKeys {
  return {
    foundation: loadSingleTierKeys("foundation", "foundation", "Foundation"),
    standard: loadSingleTierKeys("standard", "", "Standard"),
    extension: loadSingleTierKeys("extension", "extension", "Extension"),
  };
}
