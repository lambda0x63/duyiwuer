"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { motion } from "framer-motion";

interface StudyRecord {
  wordId: number;
  lastStudied: string;
  nextReview: string;
  difficulty: number;
}

// Grade metadata
const gradeInfo: Record<string, {name: string, total: number}> = {
  "grade1-1": { name: "1학년 1학기", total: 279 },
  "grade1-2": { name: "1학년 2학기", total: 0 },
  "grade2-1": { name: "2학년 1학기", total: 0 },
  "grade2-2": { name: "2학년 2학기", total: 0 },
};

export default function Home() {
  const router = useRouter();
  const [studyStats, setStudyStats] = useState({
    totalStudied: 0,
    dueForReview: 0,
    completionRate: 0,
  });
  const [selectedGrade, setSelectedGrade] = useState("grade1-1");

  useEffect(() => {
    const savedGrade = localStorage.getItem("selectedGrade") || "grade1-1";
    setSelectedGrade(savedGrade);
    
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
        completionRate: Math.round((totalStudied / (gradeInfo[savedGrade]?.total || 279)) * 100),
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
            {selectedGrade === "grade1-1" && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">识字表 (인식)</span>
                  <span className="text-sm font-semibold">199자</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">写字表 (쓰기)</span>
                  <span className="text-sm font-semibold">80자</span>
                </div>
              </>
            )}
            <div className="border-t pt-3 mt-3 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">학습한 한자</span>
                <span className="font-semibold">{studyStats.totalStudied} / {gradeInfo[selectedGrade]?.total || 279}</span>
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
        </motion.div>
      </div>
    </motion.div>
  );
}