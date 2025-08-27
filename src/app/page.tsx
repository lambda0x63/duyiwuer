"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [sessionSize, setSessionSize] = useState<string>("5");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const savedSize = localStorage.getItem("sessionSize");
    if (savedSize) {
      setSessionSize(savedSize);
    }
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
        completionRate: Math.round((totalStudied / 279) * 100), // 중복 제거 후 총 279자 (199 인식 + 80 쓰기)
      });
    }
  }, []);

  const handleSessionSizeChange = (value: string) => {
    setSessionSize(value);
    localStorage.setItem("sessionSize", value);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center mb-8 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl font-bold mb-2">独一无二</h1>
          <p className="text-gray-600">1학년 1학기</p>
        </div>

        {showSettings && (
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  학습 세션 크기
                </label>
                <Select value={sessionSize} onValueChange={handleSessionSizeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3개씩</SelectItem>
                    <SelectItem value="5">5개씩</SelectItem>
                    <SelectItem value="10">10개씩</SelectItem>
                    <SelectItem value="15">15개씩</SelectItem>
                    <SelectItem value="20">20개씩</SelectItem>
                    <SelectItem value="30">30개씩</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">识字表 (인식)</span>
              <span className="text-sm font-semibold">199자</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">写字表 (쓰기)</span>
              <span className="text-sm font-semibold">80자</span>
            </div>
            <div className="border-t pt-3 mt-3 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">학습한 한자</span>
                <span className="font-semibold">{studyStats.totalStudied} / 279</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">복습 대기</span>
                <span className="font-semibold text-orange-500">{studyStats.dueForReview}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">진도율</span>
                <span className="font-semibold">{studyStats.completionRate}%</span>
              </div>
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
        </div>
      </div>
    </div>
  );
}