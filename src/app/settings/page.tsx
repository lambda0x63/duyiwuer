import { getBasicWords, getTextbookWords } from "@/lib/basicData";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const [basicWords, textbookWords] = await Promise.all([
    getBasicWords(),
    getTextbookWords(),
  ]);

  return <SettingsClient totalWords={basicWords.length + textbookWords.length} />;
}
