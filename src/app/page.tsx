import { getAllWords } from "@/lib/basicData";
import HomeClient from "./_components/HomeClient";

export default async function Home() {
  const allWords = await getAllWords();

  return (
    <HomeClient
      totalWords={allWords.length}
    />
  );
}
