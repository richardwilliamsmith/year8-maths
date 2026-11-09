import {
  loadCurriculumManifest,
  loadAllGeneratedSections,
  loadWorksheetAnswerKeys,
} from "@/lib/curriculum";
import { TextbookViewer } from "@/components/TextbookViewer";

export default function HomePage() {
  const manifest = loadCurriculumManifest();
  const generatedSections = loadAllGeneratedSections();
  const worksheetAnswerKeys = loadWorksheetAnswerKeys();

  return (
    <TextbookViewer
      manifest={manifest}
      generatedSections={generatedSections}
      worksheetAnswerKeys={worksheetAnswerKeys}
    />
  );
}
