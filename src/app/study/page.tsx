"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import FlashCard from "@/components/FlashCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

// Grade data imports - will add more as they become available
import wordsData from "@/../../public/data/1.json";

interface WordData {
  id?: number;
  word: string;
  meaning_ko: string;
  pinyin: string;
  example: string;
  example_pinyin: string;
  example_korean: string;
}

interface StudyRecord {
  wordId: number;
  lastStudied: string;
  nextReview: string;
  difficulty: number;
  easiness: number;
  interval: number;
  repetitions: number;
}

// Add IDs to words data if not present
const wordsWithIds: WordData[] = wordsData.map((word, index) => ({
  ...word,
  id: index + 1
}));

// SM-2 Algorithm implementation
const calculateSM2 = (
  quality: number, // 0-5 (0=complete blackout, 3=correct with difficulty, 5=perfect)
  easiness: number,
  interval: number,
  repetitions: number
) => {
  let newEasiness = easiness;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easiness);
    }
    newRepetitions = repetitions + 1;
  } else {
    // Incorrect response
    newRepetitions = 0;
    newInterval = 1;
  }

  // Update easiness factor
  newEasiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEasiness < 1.3) newEasiness = 1.3;
  
  return {
    easiness: newEasiness,
    interval: newInterval,
    repetitions: newRepetitions
  };
};

export default function StudyPage() {
  const router = useRouter();
  const [currentWords, setCurrentWords] = useState<WordData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studyRecords, setStudyRecords] = useState<Record<number, StudyRecord>>({});
  const [sessionComplete, setSessionComplete] = useState(false);
  const [stats, setStats] = useState({ perfect: 0, confused: 0, new: 0 });
  const [sessionSize, setSessionSize] = useState(5);
  const [wordsData, setWordsData] = useState<WordData[]>([]);

  // Load settings and grade data
  useEffect(() => {
    const saved = localStorage.getItem("studyRecords");
    const savedSize = localStorage.getItem("sessionSize");

    setWordsData(wordsWithIds);

    if (saved) {
      setStudyRecords(JSON.parse(saved));
    }
    if (savedSize) {
      setSessionSize(parseInt(savedSize));
    }
  }, []);

  // Load today's words when data is ready
  useEffect(() => {
    if (wordsData.length > 0) {
      loadTodayWords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordsData, sessionSize]);

  const loadTodayWords = useCallback(() => {
    const saved = localStorage.getItem("studyRecords");
    const records: Record<number, StudyRecord> = saved ? JSON.parse(saved) : {};
    
    const now = new Date();
    
    // Get words that need review (sorted by urgency)
    const wordsToReview = wordsData
      .filter((word) => {
        const record = records[word.id!];
        if (!record) return false;
        return new Date(record.nextReview) <= now;
      })
      .sort((a, b) => {
        const aReview = new Date(records[a.id!].nextReview).getTime();
        const bReview = new Date(records[b.id!].nextReview).getTime();
        return aReview - bReview;
      });

    // Get new words (never studied)
    const newWords = wordsData.filter(word => !records[word.id!]);

    // Mix strategy: prioritize overdue reviews, then add new words
    let sessionWords: WordData[] = [];
    
    // Take up to 70% review words
    const maxReviewWords = Math.ceil(sessionSize * 0.7);
    const reviewWords = wordsToReview.slice(0, maxReviewWords);
    sessionWords = [...reviewWords];
    
    // Fill remaining slots with new words
    const remainingSlots = sessionSize - sessionWords.length;
    if (remainingSlots > 0 && newWords.length > 0) {
      sessionWords = [...sessionWords, ...newWords.slice(0, remainingSlots)];
    }
    
    // If still not enough words, add more reviews
    if (sessionWords.length < sessionSize) {
      const additionalReviews = wordsToReview.slice(
        maxReviewWords, 
        sessionSize - sessionWords.length + maxReviewWords
      );
      sessionWords = [...sessionWords, ...additionalReviews];
    }
    
    // Shuffle to mix reviews and new words
    sessionWords = sessionWords.sort(() => Math.random() - 0.5);
    
    setCurrentWords(sessionWords);
    setCurrentIndex(0);
    setSessionComplete(false);
    setStats({ perfect: 0, confused: 0, new: 0 });
  }, [wordsData, sessionSize]);

  const handleSwipe = (difficulty: "perfect" | "confused" | "new") => {
    const word = currentWords[currentIndex];
    const now = new Date();
    
    // Convert difficulty to SM-2 quality score
    let quality: number;
    switch (difficulty) {
      case "perfect":
        quality = 5;
        setStats(prev => ({ ...prev, perfect: prev.perfect + 1 }));
        break;
      case "confused":
        quality = 3;
        setStats(prev => ({ ...prev, confused: prev.confused + 1 }));
        break;
      case "new":
        quality = 0;
        setStats(prev => ({ ...prev, new: prev.new + 1 }));
        break;
    }

    // Get existing record or create new one
    const existingRecord = studyRecords[word.id!];
    const currentEasiness = existingRecord?.easiness || 2.5;
    const currentInterval = existingRecord?.interval || 0;
    const currentRepetitions = existingRecord?.repetitions || 0;

    // Calculate new SM-2 values
    const sm2Result = calculateSM2(quality, currentEasiness, currentInterval, currentRepetitions);
    
    // Calculate next review date
    const nextReview = new Date(now);
    if (quality === 0) {
      nextReview.setMinutes(nextReview.getMinutes() + 10);
    } else if (sm2Result.interval < 1) {
      nextReview.setHours(nextReview.getHours() + Math.max(1, sm2Result.interval * 24));
    } else {
      nextReview.setDate(nextReview.getDate() + sm2Result.interval);
    }

    const newRecord: StudyRecord = {
      wordId: word.id!,
      lastStudied: now.toISOString(),
      nextReview: nextReview.toISOString(),
      difficulty: quality,
      easiness: sm2Result.easiness,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions
    };

    const newRecords = { ...studyRecords, [word.id!]: newRecord };
    setStudyRecords(newRecords);
    localStorage.setItem("studyRecords", JSON.stringify(newRecords));

    if (currentIndex < currentWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSessionComplete(true);
    }
  };

  if (currentWords.length === 0) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center p-4"
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
        className="min-h-screen flex items-center justify-center p-4"
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
          <h2 className="text-2xl font-bold">학습 완료!</h2>
          <div className="space-y-2">
            <p>완벽: {stats.perfect}개</p>
            <p>헷갈림: {stats.confused}개</p>
            <p>처음봄: {stats.new}개</p>
          </div>
          <div className="space-y-2">
            <Button onClick={loadTodayWords} className="w-full">
              더 학습하기
            </Button>
            <Button variant="outline" onClick={() => router.push("/")} className="w-full">
              홈으로
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.header 
        className="p-4 border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm text-gray-600">
            {currentIndex + 1} / {currentWords.length}
          </span>
          <div className="w-10" />
        </div>
        <div className="mt-2 bg-gray-200 rounded-full h-2">
          <div
            className="bg-black h-2 rounded-full transition-all"
            style={{
              width: `${((currentIndex + 1) / currentWords.length) * 100}%`,
            }}
          />
        </div>
      </motion.header>

      <main className="flex-1 flex items-start justify-center pt-8">
        <FlashCard
          word={currentWords[currentIndex]}
          onSwipe={handleSwipe}
        />
      </main>
    </motion.div>
  );
}