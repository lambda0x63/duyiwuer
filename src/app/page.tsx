"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { motion } from "framer-motion";
import wordsData from "@/../../public/data/1.json";

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
  const [totalWords, setTotalWords] = useState(0);

  useEffect(() => {
    // 동적으로 단어 개수 계산
    setTotalWords(wordsData.length);

    // 데이터 버전 체크 (새 단어 추가 감지)
    const currentDataHash = `v1_${wordsData.length}`; // 간단한 버전 관리
    const savedDataHash = localStorage.getItem("dataVersion");

    if (savedDataHash && savedDataHash !== currentDataHash) {
      // 새 단어가 추가됨
      const prevCount = parseInt(savedDataHash.split('_')[1]) || 0;
      const newCount = wordsData.length - prevCount;
      if (newCount > 0) {
        console.log(`🎉 ${newCount}개의 새로운 단어가 추가되었습니다!`);
      }
    }
    localStorage.setItem("dataVersion", currentDataHash);

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
        completionRate: Math.round((totalStudied / wordsData.length) * 100),
      });
    }
  }, []);

  return (
    <motion.div 
      className="min-h-screen flex flex-col items-center justify-center p-6 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="absolute top-6 right-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/settings")}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </motion.div>
      
      <div className="max-w-md w-full space-y-6">
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Image 
            src="/icon.png" 
            alt="独一无二" 
            width={200} 
            height={200} 
            className="mx-auto mb-6"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card className="p-6">
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">중국어 기초 단어</h2>
              <p className="text-sm text-gray-500 mt-1">중국어 기초 단어 학습</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">학습한 단어</span>
                <span className="font-semibold">{studyStats.totalStudied} / {totalWords}</span>
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
        </motion.div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Button
            onClick={() => router.push("/study")}
            size="lg"
            className="w-full"
          >
            학습 시작하기
          </Button>
          <Button
            onClick={() => router.push("/quiz")}
            size="lg"
            variant="outline"
            className="w-full"
          >
            퀴즈 풀기
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}