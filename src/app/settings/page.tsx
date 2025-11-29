import { getAllWords } from "@/lib/basicData";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const allWords = await getAllWords();

  return <SettingsClient totalWords={allWords.length} />;
}
