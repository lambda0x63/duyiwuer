import { getTextbookWords } from "@/lib/textbookData";
import { getSongSets } from "@/lib/songData";
import HomeClient from "./_components/HomeClient";

export default async function Home() {
  const [textbookWords, songSets] = await Promise.all([
    getTextbookWords(),
    getSongSets(),
  ]);

  return (
    <HomeClient
      totalWords={textbookWords.length}
      totalSongSets={songSets.length}
    />
  );
}
