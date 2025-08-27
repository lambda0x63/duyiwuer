"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FlashCard from "@/components/FlashCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Settings } from "lucide-react";
import wordsDataRaw from "@/../../public/data/grade1.json";

interface WordData {
  id: number;
  char: string;
  pinyin: string;
  korean: string;
  type: "recognize" | "write";
  level: string;
}

interface StudyRecord {
  wordId: number;
  lastStudied: string;
  nextReview: string;
  easiness: number; // SM-2 easiness factor (2.5 = default)
  interval: number; // days until next review
  repetitions: number; // successful repetition count
}

const wordsData = wordsDataRaw as WordData[];

// SM-2 Algorithm implementation
const calculateSM2 = (
  quality: number, // 0-5 rating (0=again, 3=hard, 5=perfect)
  easiness: number,
  interval: number,
  repetitions: number
) => {
  let newEasiness = easiness;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (quality < 3) {
    // Failed - reset
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Successful recall
    newEasiness = Math.max(1.3, easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEasiness);
    }
    
    newRepetitions = repetitions + 1;
  }

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
  const [stats, setStats] = useState({ perfect: 0, hard: 0, again: 0 });
  const [sessionSize, setSessionSize] = useState(5); // Default 5 cards
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("studyRecords");
    const savedSize = localStorage.getItem("sessionSize");
    
    if (saved) {
      setStudyRecords(JSON.parse(saved));
    }
    if (savedSize) {
      setSessionSize(parseInt(savedSize));
    }
    
    loadTodayWords();
  }, []);

  const loadTodayWords = () => {
    const saved = localStorage.getItem("studyRecords");
    const savedSize = localStorage.getItem("sessionSize");
    const records: Record<number, StudyRecord> = saved ? JSON.parse(saved) : {};
    const size = savedSize ? parseInt(savedSize) : sessionSize;
    
    const now = new Date();
    
    // Get words that need review (sorted by urgency)
    const wordsToReview = wordsData
      .filter((word) => {
        const record = records[word.id];
        if (!record) return false; // Only previously studied words
        return new Date(record.nextReview) <= now;
      })
      .sort((a, b) => {
        const aReview = new Date(records[a.id].nextReview).getTime();
        const bReview = new Date(records[b.id].nextReview).getTime();
        return aReview - bReview; // Most overdue first
      });

    // Get new words (never studied)
    const newWords = wordsData.filter(word => !records[word.id]);

    // Mix strategy: prioritize overdue reviews, then add new words
    let sessionWords: WordData[] = [];
    
    // Take up to 70% review words
    const maxReviewWords = Math.ceil(size * 0.7);
    const reviewWords = wordsToReview.slice(0, maxReviewWords);
    sessionWords = [...reviewWords];
    
    // Fill remaining slots with new words
    const remainingSlots = size - sessionWords.length;
    if (remainingSlots > 0 && newWords.length > 0) {
      sessionWords = [...sessionWords, ...newWords.slice(0, remainingSlots)];
    }
    
    // If still not enough words, add more reviews or new words
    if (sessionWords.length < size) {
      const additionalReviews = wordsToReview.slice(maxReviewWords, size - sessionWords.length + maxReviewWords);
      sessionWords = [...sessionWords, ...additionalReviews];
    }
    
    // Shuffle to mix reviews and new words
    sessionWords = sessionWords.sort(() => Math.random() - 0.5);
    
    setCurrentWords(sessionWords);
    setCurrentIndex(0);
    setSessionComplete(false);
    setStats({ perfect: 0, hard: 0, again: 0 });
  };

  const handleSwipe = (difficulty: "perfect" | "hard" | "again") => {
    const word = currentWords[currentIndex];
    const now = new Date();
    
    // Convert difficulty to SM-2 quality score
    let quality: number;
    switch (difficulty) {
      case "perfect":
        quality = 5;
        setStats(prev => ({ ...prev, perfect: prev.perfect + 1 }));
        break;
      case "hard":
        quality = 3;
        setStats(prev => ({ ...prev, hard: prev.hard + 1 }));
        break;
      case "again":
        quality = 0;
        setStats(prev => ({ ...prev, again: prev.again + 1 }));
        break;
    }

    // Get existing record or create new one
    const existingRecord = studyRecords[word.id];
    const currentEasiness = existingRecord?.easiness || 2.5;
    const currentInterval = existingRecord?.interval || 0;
    const currentRepetitions = existingRecord?.repetitions || 0;

    // Calculate new SM-2 values
    const sm2Result = calculateSM2(quality, currentEasiness, currentInterval, currentRepetitions);
    
    // Calculate next review date
    const nextReview = new Date(now);
    if (quality === 0) {
      // Again - review in 10 minutes
      nextReview.setMinutes(nextReview.getMinutes() + 10);
    } else if (sm2Result.interval < 1) {
      // Less than a day - review in hours
      nextReview.setHours(nextReview.getHours() + Math.max(1, sm2Result.interval * 24));
    } else {
      // Review in days
      nextReview.setDate(nextReview.getDate() + sm2Result.interval);
    }

    const newRecord: StudyRecord = {
      wordId: word.id,
      lastStudied: now.toISOString(),
      nextReview: nextReview.toISOString(),
      easiness: sm2Result.easiness,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions
    };

    const newRecords = {
      ...studyRecords,
      [word.id]: newRecord,
    };

    setStudyRecords(newRecords);
    localStorage.setItem("studyRecords", JSON.stringify(newRecords));

    if (currentIndex < currentWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSessionComplete(true);
    }
  };

  const handleSessionSizeChange = (newSize: number) => {
    setSessionSize(newSize);
    localStorage.setItem("sessionSize", newSize.toString());
    setShowSettings(false);
    loadTodayWords();
  };

  if (showSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-sm w-full">
          <h2 className="text-xl font-bold mb-4">학습 설정</h2>
          <p className="text-sm text-gray-600 mb-4">한 번에 학습할 단어 수</p>
          <div className="grid grid-cols-3 gap-2">
            {[3, 5, 10, 15, 20, 30].map(size => (
              <Button
                key={size}
                variant={sessionSize === size ? "default" : "outline"}
                onClick={() => handleSessionSizeChange(size)}
              >
                {size}개
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => setShowSettings(false)}
          >
            취소
          </Button>
        </Card>
      </div>
    );
  }

  if (currentWords.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">단어를 불러오는 중...</h2>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6">학습 완료!</h2>
          <div className="mb-6 space-y-2">
            <p className="text-lg">완벽: {stats.perfect}개</p>
            <p className="text-lg">애매: {stats.hard}개</p>
            <p className="text-lg">몰라: {stats.again}개</p>
          </div>
          <div className="space-y-2">
            <Button onClick={loadTodayWords} size="lg" className="w-full">
              다시 학습하기
            </Button>
            <Button onClick={() => router.push("/")} variant="outline" className="w-full">
              메인으로
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b">
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-2 bg-gray-200 rounded-full h-2">
          <div
            className="bg-black h-2 rounded-full transition-all"
            style={{
              width: `${((currentIndex + 1) / currentWords.length) * 100}%`,
            }}
          />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <FlashCard
          word={currentWords[currentIndex]}
          onSwipe={handleSwipe}
        />
      </main>
    </div>
  );
}