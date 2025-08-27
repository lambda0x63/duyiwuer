"use client";

import { useState, useEffect } from "react";
import FlashCard from "@/components/FlashCard";
import { Button } from "@/components/ui/button";
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
  difficulty: number;
}

const wordsData = wordsDataRaw as WordData[];

export default function StudyPage() {
  const [currentWords, setCurrentWords] = useState<WordData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studyRecords, setStudyRecords] = useState<Record<number, StudyRecord>>({});
  const [sessionComplete, setSessionComplete] = useState(false);
  const [stats, setStats] = useState({ perfect: 0, hard: 0, again: 0 });

  useEffect(() => {
    const saved = localStorage.getItem("studyRecords");
    if (saved) {
      setStudyRecords(JSON.parse(saved));
    }
    loadTodayWords();
  }, []);

  const loadTodayWords = () => {
    const saved = localStorage.getItem("studyRecords");
    const records: Record<number, StudyRecord> = saved ? JSON.parse(saved) : {};
    
    const now = new Date();
    const wordsToReview = wordsData.filter((word) => {
      const record = records[word.id];
      if (!record) return true;
      return new Date(record.nextReview) <= now;
    });

    const sessionWords = wordsToReview.slice(0, 15);
    
    if (sessionWords.length === 0) {
      const unstudied = wordsData.filter(word => !records[word.id]);
      setCurrentWords(unstudied.slice(0, 15));
    } else {
      setCurrentWords(sessionWords);
    }
    
    setCurrentIndex(0);
    setSessionComplete(false);
    setStats({ perfect: 0, hard: 0, again: 0 });
  };

  const handleSwipe = (difficulty: "perfect" | "hard" | "again") => {
    const word = currentWords[currentIndex];
    const now = new Date();
    const nextReview = new Date();

    switch (difficulty) {
      case "perfect":
        nextReview.setDate(nextReview.getDate() + 7);
        setStats(prev => ({ ...prev, perfect: prev.perfect + 1 }));
        break;
      case "hard":
        nextReview.setDate(nextReview.getDate() + 1);
        setStats(prev => ({ ...prev, hard: prev.hard + 1 }));
        break;
      case "again":
        nextReview.setHours(nextReview.getHours() + 1);
        setStats(prev => ({ ...prev, again: prev.again + 1 }));
        break;
    }

    const newRecord: StudyRecord = {
      wordId: word.id,
      lastStudied: now.toISOString(),
      nextReview: nextReview.toISOString(),
      difficulty: difficulty === "perfect" ? 1 : difficulty === "hard" ? 0.5 : 0,
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
          <Button onClick={loadTodayWords} size="lg">
            다시 학습하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {currentIndex + 1} / {currentWords.length}
          </span>
          <span className="text-sm text-gray-600">
            레벨: {currentWords[currentIndex].level}
          </span>
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