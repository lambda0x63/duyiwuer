import { getTextbookWords } from "@/lib/textbookData";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const words = await getTextbookWords();

  return <SettingsClient totalWords={words.length} />;
}
