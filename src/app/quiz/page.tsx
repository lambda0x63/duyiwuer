"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Volume2, PenTool } from "lucide-react";
import { motion } from "framer-motion";
import wordsData from "@/../../public/data/1.json";

// Types
interface WordData {
  word: string;
  meaning_ko: string;
  pinyin: string;
  example: string;
  example_pinyin: string;
  example_korean: string;
}

// Quiz Types
type QuizMode = "pinyin" | "production";

interface QuizQuestion {
  mode: QuizMode;
  word: WordData;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

interface QuizSession {
  questions: QuizQuestion[];
  currentIndex: number;
  score: number;
  answers: { question: QuizQuestion; userAnswer: string; isCorrect: boolean }[];
}

export default function QuizPage() {
  const router = useRouter();
  const [quizMode, setQuizMode] = useState<QuizMode | null>(null);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [userInput, setUserInput] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);

  // Quiz Mode Descriptions
  const quizModes = [
    {
      id: "pinyin" as QuizMode,
      name: "병음 쓰기",
      description: "한자를 보고 병음(숫자 성조) 입력하기",
      icon: Volume2,
      color: "bg-green-500"
    },
    {
      id: "production" as QuizMode,
      name: "한자 쓰기",
      description: "한국어를 보고 중국어로 변환",
      icon: PenTool,
      color: "bg-orange-500"
    }
  ];

  // Generate questions based on mode
  const generateQuestions = async (mode: QuizMode, count: number = 10) => {
    const questions: QuizQuestion[] = [];
    const shuffled = [...wordsData].sort(() => Math.random() - 0.5).slice(0, count) as WordData[];

    for (const word of shuffled) {
      let question: QuizQuestion;

      switch (mode) {
        case "pinyin":
          // 한자 → 병음 (직접 입력 - 숫자 성조)
          // 정답을 숫자 성조 형식으로 변환
          const pinyinWithNumbers = convertToNumberTones(word.pinyin);
          question = {
            mode,
            word,
            question: word.word,
            correctAnswer: pinyinWithNumbers,
            explanation: `${word.pinyin} (${word.meaning_ko})\n예문: ${word.example}`
          };
          break;

        case "production":
          // 한국어 → 중국어 (입력 방식, options 없음)
          question = {
            mode,
            word,
            question: word.meaning_ko,
            correctAnswer: word.word,
            explanation: `${word.word} (${word.pinyin})\n예문: ${word.example}`
          };
          break;
      }

      questions.push(question);
    }

    return questions;
  };

  // Convert pinyin with tone marks to number notation
  const convertToNumberTones = (pinyin: string) => {
    // 성조 기호를 숫자로 매핑
    const toneMap: { [key: string]: string } = {
      'ā': 'a1', 'á': 'a2', 'ǎ': 'a3', 'à': 'a4',
      'ē': 'e1', 'é': 'e2', 'ě': 'e3', 'è': 'e4',
      'ī': 'i1', 'í': 'i2', 'ǐ': 'i3', 'ì': 'i4',
      'ō': 'o1', 'ó': 'o2', 'ǒ': 'o3', 'ò': 'o4',
      'ū': 'u1', 'ú': 'u2', 'ǔ': 'u3', 'ù': 'u4',
      'ǖ': 'ü1', 'ǘ': 'ü2', 'ǚ': 'ü3', 'ǜ': 'ü4',
      'ń': 'n2', 'ň': 'n3', 'ǹ': 'n4',
      'ḿ': 'm2', 'm̌': 'm3', 'm̀': 'm4'
    };

    let result = pinyin.toLowerCase();

    // 모든 성조 기호를 숫자로 변환
    Object.entries(toneMap).forEach(([toned, numbered]) => {
      result = result.replace(new RegExp(toned, 'g'), numbered);
    });

    // ü를 v로 변환 (일반적인 입력 방식)
    result = result.replace(/ü/g, 'v');

    return result;
  };


  // Start quiz session
  const startQuiz = async (mode: QuizMode) => {
    setLoading(true);
    setQuizMode(mode);

    try {
      const questions = await generateQuestions(mode);
      setSession({
        questions,
        currentIndex: 0,
        score: 0,
        answers: []
      });
    } catch (error) {
      console.error("Failed to generate questions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle answer
  const handleAnswer = (answer?: string) => {
    if (!session || showResult) return;

    const currentQuestion = session.questions[session.currentIndex];
    let userAnswer = answer || selectedAnswer || userInput.trim();

    // 병음 모드에서는 대소문자 구분 없이, 공백 정규화
    if (currentQuestion.mode === "pinyin") {
      userAnswer = userAnswer.toLowerCase().replace(/\s+/g, ' ').trim();
      // v를 ü로 처리 (둘 다 허용)
      const normalizedCorrect = currentQuestion.correctAnswer.toLowerCase().replace(/\s+/g, ' ').trim();
      const isCorrect = userAnswer === normalizedCorrect ||
                       userAnswer === normalizedCorrect.replace(/v/g, 'ü');

      // Update session with normalized answer
      const newAnswers = [
        ...session.answers,
        { question: currentQuestion, userAnswer: userAnswer, isCorrect }
      ];

      setSession({
        ...session,
        score: session.score + (isCorrect ? 1 : 0),
        answers: newAnswers
      });

      setShowResult(true);
      return;
    }

    const isCorrect = userAnswer === currentQuestion.correctAnswer;

    // Update session
    const newAnswers = [
      ...session.answers,
      { question: currentQuestion, userAnswer: userAnswer, isCorrect }
    ];

    setSession({
      ...session,
      score: session.score + (isCorrect ? 1 : 0),
      answers: newAnswers
    });

    setShowResult(true);
  };

  // Next question
  const nextQuestion = () => {
    if (!session) return;

    if (session.currentIndex < session.questions.length - 1) {
      setSession({
        ...session,
        currentIndex: session.currentIndex + 1
      });
      setSelectedAnswer("");
      setUserInput("");
      setShowResult(false);
    } else {
      // Quiz completed
      // Show results screen
    }
  };

  // Mode selection screen
  if (!quizMode) {
    return (
      <motion.div
        className="min-h-screen flex flex-col p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <header className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">퀴즈 모드 선택</h1>
        </header>

        <div className="flex-1 max-w-2xl mx-auto w-full">
          <div className="grid gap-4">
            {quizModes.map((mode, index) => (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => startQuiz(mode.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg text-white ${mode.color}`}>
                      <mode.icon size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{mode.name}</h3>
                      <p className="text-sm text-gray-600">{mode.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">문제를 준비하는 중...</p>
        </div>
      </div>
    );
  }

  // Quiz completed screen
  if (session && session.currentIndex >= session.questions.length - 1 && showResult) {
    const percentage = Math.round((session.score / session.questions.length) * 100);

    return (
      <motion.div
        className="min-h-screen flex flex-col p-4 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-full max-w-md mx-auto py-8">
          <Card className="w-full p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">퀴즈 완료!</h2>

            <div className="mb-6">
              <div className="text-5xl font-bold mb-2">{percentage}%</div>
              <p className="text-gray-600">
                {session.questions.length}문제 중 {session.score}개 정답
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {session.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`flex justify-between p-2 rounded ${
                    answer.isCorrect ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <span className="text-sm">문제 {index + 1}</span>
                  <span>{answer.isCorrect ? "✅" : "❌"}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => startQuiz(quizMode)}
                className="w-full"
              >
                다시 도전
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setQuizMode(null);
                  setSession(null);
                }}
                className="w-full"
              >
                다른 모드 선택
              </Button>
            </div>
          </Card>
        </div>
      </motion.div>
    );
  }

  // Quiz screen
  if (!session) return null;

  const currentQuestion = session.questions[session.currentIndex];
  const progress = ((session.currentIndex + 1) / session.questions.length) * 100;

  return (
    <motion.div
      className="min-h-screen flex flex-col p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <header className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setQuizMode(null);
              setSession(null);
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium">
            {session.currentIndex + 1} / {session.questions.length}
          </span>
          <div className="w-10" />
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-black h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <div className="mb-8">
            <div className="text-sm text-gray-500 mb-2">
              {quizModes.find(m => m.id === quizMode)?.name}
            </div>
            <h2 className={`text-center font-bold ${
              currentQuestion.mode === "pinyin" ? "text-5xl" : "text-2xl"
            }`}>
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options for multiple choice */}
          {currentQuestion.options && (
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  variant={showResult ? "outline" : selectedAnswer === option ? "default" : "outline"}
                  className={`w-full justify-start text-left ${
                    showResult && option === currentQuestion.correctAnswer
                      ? "bg-green-100 border-green-500 text-green-700 hover:bg-green-100"
                      : showResult && option === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer
                      ? "bg-red-100 border-red-500 text-red-700 hover:bg-red-100"
                      : ""
                  }`}
                  onClick={() => {
                    if (!showResult) {
                      setSelectedAnswer(option);
                      handleAnswer(option);
                    }
                  }}
                  disabled={showResult}
                >
                  {option}
                </Button>
              ))}
            </div>
          )}

          {/* Input field for production and pinyin modes */}
          {(currentQuestion.mode === "production" ||
            currentQuestion.mode === "pinyin") && !showResult && (
            <div className="space-y-3 mb-6">
              <input
                type="text"
                className="w-full p-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={
                  currentQuestion.mode === "production" ? "중국어로 입력하세요" :
                  "병음을 숫자 성조로 입력 (예: ni3 hao3)"
                }
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && userInput.trim()) {
                    handleAnswer();
                  }
                }}
                autoFocus
              />
              <Button
                onClick={() => handleAnswer()}
                disabled={!userInput.trim()}
                className="w-full"
              >
                제출
              </Button>
            </div>
          )}

          {/* Result */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* 정답 여부 표시 */}
              <div className={`p-4 rounded-lg ${
                (selectedAnswer === currentQuestion.correctAnswer || userInput.trim() === currentQuestion.correctAnswer)
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}>
                {(selectedAnswer === currentQuestion.correctAnswer || userInput.trim() === currentQuestion.correctAnswer) ? (
                  <div className="text-green-700">
                    <div className="font-bold text-lg mb-1">🎉 정답!</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-red-700 font-bold">❌ 틀렸습니다</div>
                    {currentQuestion.mode === "production" && (
                      <>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-600">내 답안:</div>
                          <div className="text-lg font-medium text-red-600">
                            {userInput.trim() || "(입력 없음)"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-600">정답:</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {currentQuestion.correctAnswer}
                          </div>
                        </div>
                      </>
                    )}
                    {currentQuestion.mode === "pinyin" && (
                      <>
                        <div className="text-sm text-gray-600">
                          내 답안: <span className="text-red-600 font-medium">{userInput.trim() || "(입력 없음)"}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          정답: <span className="text-gray-900 font-bold text-base">{currentQuestion.correctAnswer}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 설명 섹션 - 더 자세하게 */}
              {currentQuestion.explanation && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="space-y-2">
                    {currentQuestion.mode === "production" && (
                      <>
                        <div className="text-lg font-bold text-gray-900">
                          {currentQuestion.word.word}
                        </div>
                        <div className="text-base text-blue-600">
                          {currentQuestion.word.pinyin}
                        </div>
                        <div className="text-sm text-gray-600 pt-2 border-t">
                          예문: {currentQuestion.word.example}
                        </div>
                      </>
                    )}
                    {currentQuestion.mode === "pinyin" && (
                      <>
                        <div className="text-sm text-gray-700">
                          {currentQuestion.explanation}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={nextQuestion}
                className="w-full"
              >
                {session.currentIndex < session.questions.length - 1
                  ? "다음 문제"
                  : "결과 보기"}
              </Button>
            </motion.div>
          )}

        </Card>
      </div>
    </motion.div>
  );
}
