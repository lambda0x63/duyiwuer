import StudySession from "@/components/StudySession";
import { getTextbookWords } from "@/lib/textbookData";

export default async function StudyPage() {
  const wordsData = await getTextbookWords();

  return (
    <StudySession
      words={wordsData}
      title="중국어 기초 단어"
      backLabel="홈으로"
    />
  );
}
