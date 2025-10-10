import { getTextbookWords } from "@/lib/textbookData";
import QuizClient from "./QuizClient";

export default async function QuizPage() {
  const words = await getTextbookWords();

  return <QuizClient words={words} />;
}
