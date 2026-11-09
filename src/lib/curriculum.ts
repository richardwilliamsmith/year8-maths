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

export interface SectionWorksheetAnswerKey {
  section_id: string;
  section_code: string;
  chapter_number: number;
  chapter_title: string;
  title: string;
  vcaa_code: string;
  tier: string;
  pdf_url: string;
  fluency_answers: WorksheetFluencyAnswer[];
  application_answers: WorksheetItemAnswer[];
  reasoning_answers: WorksheetItemAnswer[];
}

export function loadCurriculumManifest(): CurriculumManifest {
  const manifestPath = path.join(process.cwd(), "curriculum_manifest_year8.json");
  const raw = fs.readFileSync(manifestPath, "utf-8");
  return JSON.parse(raw) as CurriculumManifest;
}

export function loadAllGeneratedSections(): Record<string, TextbookSectionData> {
  const manifest = loadCurriculumManifest();
  const sections: Record<string, TextbookSectionData> = {};

  for (const chapter of manifest.chapters) {
    for (const sec of chapter.sections) {
      const filePath = path.join(
        process.cwd(),
        "output",
        `chapter_${chapter.chapter_number}`,
        `${sec.section_id}.json`
      );
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        sections[sec.section_id] = JSON.parse(raw) as TextbookSectionData;
      }
    }
  }

  return sections;
}

export function loadWorksheetAnswerKeys(): Record<string, SectionWorksheetAnswerKey> {
  const keys: Record<string, SectionWorksheetAnswerKey> = {};

  for (let c = 1; c <= 10; c++) {
    const filePath = path.join(process.cwd(), "worksheets", `chapter_${c}.json`);
    if (fs.existsSync(filePath)) {
      const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      for (const ws of raw.worksheets || []) {
        keys[ws.section_id] = {
          section_id: ws.section_id,
          section_code: ws.section_code,
          chapter_number: raw.chapter_number,
          chapter_title: raw.chapter_title,
          title: ws.title,
          vcaa_code: ws.vcaa_code,
          tier: ws.tier || "Standard",
          pdf_url: `/worksheets/worksheet_${ws.section_id}_standard.pdf`,
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

  return keys;
}
