import {
  loadCurriculumManifest,
  loadAllGeneratedSections,
} from "@/lib/curriculum";
import { TextbookViewer } from "@/components/TextbookViewer";

export default function HomePage() {
  const manifest = loadCurriculumManifest();
  const generatedSections = loadAllGeneratedSections();

  return (
    <TextbookViewer
      manifest={manifest}
      generatedSections={generatedSections}
    />
  );
}
