import { getBasicWords, getTextbookWords } from "@/lib/basicData";
import HomeClient from "./_components/HomeClient";

export default async function Home() {
  const [basicWords, textbookWords] = await Promise.all([
    getBasicWords(),
    getTextbookWords(),
  ]);

  return (
    <HomeClient
      totalWords={basicWords.length + textbookWords.length}
    />
  );
}
