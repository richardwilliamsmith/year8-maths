import {
  loadAllYearManifests,
  loadAllGeneratedSections,
  loadAllTierWorksheetAnswerKeys,
  loadVcaaStandardsRegistry,
} from "@/lib/curriculum";
import { TextbookViewer } from "@/components/TextbookViewer";

export default function HomePage() {
  const yearManifests = loadAllYearManifests();
  const generatedSections = loadAllGeneratedSections();
  const tieredAnswerKeys = loadAllTierWorksheetAnswerKeys();
  const vcaaStandards = loadVcaaStandardsRegistry();

  const isDevMode = process.env.NODE_ENV === "development";

  return (
    <TextbookViewer
      yearManifests={yearManifests}
      generatedSections={generatedSections}
      tieredAnswerKeys={tieredAnswerKeys}
      vcaaStandards={vcaaStandards}
      isDevMode={isDevMode}
    />
  );
}
