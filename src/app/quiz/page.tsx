import { getBasicWords, getTextbookWords } from "@/lib/basicData";
import QuizClient from "./QuizClient";

export default async function QuizPage() {
  const [basicWords, textbookWords] = await Promise.all([
    getBasicWords(),
    getTextbookWords(),
  ]);

  return <QuizClient basicWords={basicWords} textbookWords={textbookWords} />;
}
