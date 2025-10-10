"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Volume2, PenTool } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WordData } from "@/types/word";

type QuizMode = "pinyin" | "production";

type QuizQuestion = {
  mode: QuizMode;
  word: WordData;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
};

type QuizSession = {
  questions: QuizQuestion[];
  currentIndex: number;
  score: number;
  answers: { question: QuizQuestion; userAnswer: string; isCorrect: boolean }[];
};

interface QuizClientProps {
  words: WordData[];
}

export default function QuizClient({ words }: QuizClientProps) {
  const router = useRouter();
  const [quizMode, setQuizMode] = useState<QuizMode | null>(null);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [userInput, setUserInput] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);

  const quizModes = [
    {
      id: "pinyin" as QuizMode,
      name: "병음 쓰기",
      description: "한자를 보고 병음(숫자 성조) 입력하기",
      icon: Volume2,
      color: "bg-green-500",
    },
    {
      id: "production" as QuizMode,
      name: "한자 쓰기",
      description: "한국어를 보고 중국어로 변환",
      icon: PenTool,
      color: "bg-orange-500",
    },
  ];

  const shuffleWords = (count: number) => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  };

  const generateQuestions = async (mode: QuizMode, count = 10) => {
    const questions: QuizQuestion[] = [];
    const selectedWords = shuffleWords(count);

    for (const word of selectedWords) {
      if (mode === "pinyin") {
        const pinyinWithNumbers = convertToNumberTones(word.pinyin);
        questions.push({
          mode,
          word,
          question: word.word,
          correctAnswer: pinyinWithNumbers,
          explanation: `${word.pinyin} (${word.meaning_ko})\n예문: ${word.example}`,
        });
      } else {
        questions.push({
          mode,
          word,
          question: word.meaning_ko,
          correctAnswer: word.word,
          explanation: `${word.word} (${word.pinyin})\n예문: ${word.example}`,
        });
      }
    }

    return questions;
  };

  const convertToNumberTones = (pinyin: string) => {
    const toneMap: Record<string, string> = {
      "ā": "a1",
      "á": "a2",
      "ǎ": "a3",
      "à": "a4",
      "ē": "e1",
      "é": "e2",
      "ě": "e3",
      "è": "e4",
      "ī": "i1",
      "í": "i2",
      "ǐ": "i3",
      "ì": "i4",
      "ō": "o1",
      "ó": "o2",
      "ǒ": "o3",
      "ò": "o4",
      "ū": "u1",
      "ú": "u2",
      "ǔ": "u3",
      "ù": "u4",
      "ǖ": "ü1",
      "ǘ": "ü2",
      "ǚ": "ü3",
      "ǜ": "ü4",
      "ń": "n2",
      "ň": "n3",
      "ǹ": "n4",
      "ḿ": "m2",
      "m̌": "m3",
      "m̀": "m4",
    };

    let result = pinyin.toLowerCase();

    Object.entries(toneMap).forEach(([toned, numbered]) => {
      result = result.replace(new RegExp(toned, "g"), numbered);
    });

    return result.replace(/ü/g, "v");
  };

  const startQuiz = async (mode: QuizMode) => {
    setLoading(true);
    setQuizMode(mode);

    try {
      const questions = await generateQuestions(mode);
      setSession({
        questions,
        currentIndex: 0,
        score: 0,
        answers: [],
      });
    } catch (error) {
      console.error("Failed to generate questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer?: string) => {
    if (!session || showResult) return;

    const currentQuestion = session.questions[session.currentIndex];
    let userAnswer = answer || selectedAnswer || userInput.trim();

    if (currentQuestion.mode === "pinyin") {
      userAnswer = userAnswer.toLowerCase().replace(/\s+/g, " ").trim();
      const normalizedCorrect = currentQuestion.correctAnswer
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
      const isCorrect =
        userAnswer === normalizedCorrect ||
        userAnswer === normalizedCorrect.replace(/v/g, "ü");

      updateSession(userAnswer, isCorrect);
      return;
    }

    const isCorrect = userAnswer === currentQuestion.correctAnswer;
    updateSession(userAnswer, isCorrect);
  };

  const updateSession = (userAnswer: string, isCorrect: boolean) => {
    if (!session) return;

    const currentQuestion = session.questions[session.currentIndex];

    const newAnswers = [
      ...session.answers,
      { question: currentQuestion, userAnswer, isCorrect },
    ];

    setSession({
      ...session,
      score: session.score + (isCorrect ? 1 : 0),
      answers: newAnswers,
    });

    setShowResult(true);
  };

  const goToNextQuestion = () => {
    if (!session) return;

    if (session.currentIndex < session.questions.length - 1) {
      setSession({
        ...session,
        currentIndex: session.currentIndex + 1,
      });
      setSelectedAnswer("");
      setUserInput("");
      setShowResult(false);
    } else {
      setQuizMode(null);
    }
  };

  const restartQuiz = () => {
    setSession(null);
    setQuizMode(null);
    setSelectedAnswer("");
    setUserInput("");
    setShowResult(false);
  };

  const currentQuestion = session?.questions[session.currentIndex];

  return (
    <motion.div
      className="min-h-screen flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <header className="flex items-center justify-between p-6 pb-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-xl font-semibold">랜덤 퀴즈</h1>
          <p className="text-sm text-gray-500 mt-1">
            교과서 단어로 병음/한자 쓰기 퀴즈를 풀어보세요.
          </p>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-6 pb-8">
        {!quizMode && (
          <motion.div
            className="grid gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {quizModes.map((mode) => (
              <Card key={mode.id} className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`rounded-full ${mode.color} text-white p-3`}>
                    <mode.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{mode.name}</h2>
                    <p className="text-sm text-gray-500">{mode.description}</p>
                  </div>
                </div>
                <Button
                  onClick={() => startQuiz(mode.id)}
                  disabled={loading || words.length === 0}
                  className="w-full"
                >
                  {loading ? "문제 생성 중..." : "시작하기"}
                </Button>
              </Card>
            ))}
          </motion.div>
        )}

        {quizMode && session && currentQuestion && (
          <motion.div
            className="space-y-6"
            key={`${session.currentIndex}-${quizMode}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 space-y-6">
              <div className="flex justify-between text-sm text-gray-500">
                <span>
                  문제 {session.currentIndex + 1} / {session.questions.length}
                </span>
                <span>점수 {session.score}</span>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-center">
                  {currentQuestion.question}
                </h2>

                {quizMode === "pinyin" ? (
                  <div className="space-y-3">
                    <label className="text-sm text-gray-600" htmlFor="pinyin-input">
                      숫자 성조 포함 입력 (예: ni3 hao3)
                    </label>
                    <input
                      id="pinyin-input"
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                      placeholder="정답을 입력하세요"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="text-sm text-gray-600" htmlFor="hanzi-input">
                      정답 한자를 정확히 입력하세요
                    </label>
                    <input
                      id="hanzi-input"
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                      placeholder="정답을 입력하세요"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => handleAnswer()} disabled={showResult}>
                  제출하기
                </Button>
                <Button variant="outline" className="flex-1" onClick={restartQuiz}>
                  모드 선택으로
                </Button>
              </div>

              {showResult && (
                <div
                  className={`rounded-lg p-4 text-sm ${
                    session.answers[session.answers.length - 1]?.isCorrect
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <p className="font-semibold">
                    {session.answers[session.answers.length - 1]?.isCorrect
                      ? "정답입니다!"
                      : "틀렸어요"}
                  </p>
                  <p className="mt-2 whitespace-pre-line">정답: {currentQuestion.correctAnswer}</p>
                  {currentQuestion.explanation && (
                    <p className="mt-2 whitespace-pre-line text-gray-600">
                      {currentQuestion.explanation}
                    </p>
                  )}
                  <Button
                    className="mt-4"
                    variant="secondary"
                    onClick={goToNextQuestion}
                  >
                    다음 문제
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {quizMode && session && !currentQuestion && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 space-y-4 text-center">
              <h2 className="text-2xl font-bold">퀴즈 완료!</h2>
              <p className="text-gray-600">
                총 {session.questions.length}문제 중 {session.score}문제를 맞췄어요.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => startQuiz(quizMode!)}>다시 풀기</Button>
                <Button variant="outline" onClick={restartQuiz}>
                  모드 선택으로
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </main>
    </motion.div>
  );
}

