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
