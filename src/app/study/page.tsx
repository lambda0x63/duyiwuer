import StudySession from "@/components/StudySession";
import { getAllWords } from "@/lib/basicData";

export default async function StudyPage() {
  const wordsData = await getAllWords();

  return (
    <StudySession
      words={wordsData}
      title="중국어 단어 학습"
      backLabel="홈으로"
    />
  );
}
