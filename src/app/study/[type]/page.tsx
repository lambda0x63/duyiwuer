import StudySession from "@/components/StudySession";
import { getBasicWords, getTextbookWords } from "@/lib/basicData";

type Props = {
  params: Promise<{ type: "basic" | "textbook" }>;
};

const titles = {
  basic: "기본 단어",
  textbook: "교과서 단어",
};

export default async function StudyPage(props: Props) {
  const params = await props.params;
  const type = params.type;

  const wordsData = type === "basic" ? await getBasicWords() : await getTextbookWords();
  const title = titles[type as keyof typeof titles];

  return (
    <StudySession
      words={wordsData}
      title={`중국어 ${title}`}
      backLabel="홈으로"
    />
  );
}
