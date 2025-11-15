"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import FlashCard from "@/components/FlashCard";
import { Button } from "@/components/ui/button";
import type { WordData } from "@/types/word";

interface StudySessionProps {
  words: WordData[];
  backPath?: string;
  title?: string;
  backLabel?: string;
}

const ensureIds = (words: WordData[]): WordData[] =>
  words.map((word, index) =>
    typeof word.id === "number" ? word : { ...word, id: index + 1 }
  );

const shuffleWords = (words: WordData[]) => {
  const copied = [...words];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
};

export default function StudySession({
  words,
  backPath = "/",
  title,
  backLabel = "돌아가기",
}: StudySessionProps) {
  const router = useRouter();
  const wordsWithIds = useMemo(() => ensureIds(words), [words]);
  const [shuffledWords, setShuffledWords] = useState<WordData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    if (wordsWithIds.length > 0) {
      const initial = shuffleWords(wordsWithIds);
      setShuffledWords(initial);
      setCurrentIndex(0);
      setSessionComplete(false);
    }
  }, [wordsWithIds]);

  const handleNext = () => {
    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionComplete(true);
    }
  };

  const restartSession = () => {
    const reshuffled = shuffleWords(wordsWithIds);
    setShuffledWords(reshuffled);
    setCurrentIndex(0);
    setSessionComplete(false);
  };

  if (shuffledWords.length === 0) {
    return (
      <motion.div
        className="h-screen flex items-center justify-center p-4 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <motion.h2
            className="text-2xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            단어를 불러오는 중...
          </motion.h2>
        </div>
      </motion.div>
    );
  }

  if (sessionComplete) {
    return (
      <motion.div
        className="h-screen flex items-center justify-center p-4 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="text-center space-y-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h2 className="text-2xl font-bold">전부 훑어봤어요!</h2>
          <p className="text-gray-600">다시 섞어서 새로운 순서로 학습해보세요.</p>
          <div className="space-y-2">
            <Button onClick={restartSession} className="w-full">
              다시 섞기
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(backPath)}
              className="w-full"
            >
              {backLabel}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="h-screen flex flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.header
        className="px-3 py-2 border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Button variant="ghost" size="sm" onClick={() => router.push(backPath)} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="bg-black h-1.5 rounded-full transition-all"
              style={{
                width: `${((currentIndex + 1) / shuffledWords.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
            {currentIndex + 1}/{shuffledWords.length}
          </span>
        </div>
        {title && (
          <div className="text-center">
            <h1 className="text-xs font-semibold text-gray-700">{title}</h1>
          </div>
        )}
      </motion.header>

      <main className="flex-1 flex flex-col items-center px-4 pt-4 overflow-hidden">
        <FlashCard word={shuffledWords[currentIndex]} onNext={handleNext} />
      </main>
    </motion.div>
  );
}
