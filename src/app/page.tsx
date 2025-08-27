"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface StudyRecord {
  wordId: number;
  lastStudied: string;
  nextReview: string;
  difficulty: number;
}

export default function Home() {
  const router = useRouter();
  const [studyStats, setStudyStats] = useState({
    totalStudied: 0,
    dueForReview: 0,
    completionRate: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem("studyRecords");
    if (saved) {
      const records: Record<number, StudyRecord> = JSON.parse(saved);
      const now = new Date();
      
      const totalStudied = Object.keys(records).length;
      const dueForReview = Object.values(records).filter(
        record => new Date(record.nextReview) <= now
      ).length;
      
      setStudyStats({
        totalStudied,
        dueForReview,
        completionRate: Math.round((totalStudied / 300) * 100),
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">읽어2</h1>
          <p className="text-gray-600">HSK 1급 한자 학습</p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">학습한 단어</span>
              <span className="font-semibold">{studyStats.totalStudied} / 300</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">복습 대기</span>
              <span className="font-semibold text-orange-500">{studyStats.dueForReview}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">완성도</span>
              <span className="font-semibold">{studyStats.completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-black h-2 rounded-full transition-all"
                style={{ width: `${studyStats.completionRate}%` }}
              />
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <Button 
            onClick={() => router.push("/study")} 
            size="lg" 
            className="w-full"
          >
            학습 시작하기
          </Button>
          
          <Card className="p-4 text-center text-sm text-gray-500">
            <p>앞으로 추가될 예정:</p>
            <p className="mt-1">HSK 2급, 3급 단어</p>
          </Card>
        </div>
      </div>
    </div>
  );
}