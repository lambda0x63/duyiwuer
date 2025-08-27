"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const gradeOptions = [
  { value: "grade1-1", label: "1학년 1학기", available: true },
  { value: "grade1-2", label: "1학년 2학기", available: false },
  { value: "grade2-1", label: "2학년 1학기", available: false },
  { value: "grade2-2", label: "2학년 2학기", available: false },
];

export default function Settings() {
  const router = useRouter();
  const [sessionSize, setSessionSize] = useState<string>("5");
  const [selectedGrade, setSelectedGrade] = useState<string>("grade1-1");

  useEffect(() => {
    const savedSize = localStorage.getItem("sessionSize");
    const savedGrade = localStorage.getItem("selectedGrade");
    if (savedSize) {
      setSessionSize(savedSize);
    }
    if (savedGrade) {
      setSelectedGrade(savedGrade);
    }
  }, []);

  const handleSessionSizeChange = (value: string) => {
    setSessionSize(value);
    localStorage.setItem("sessionSize", value);
  };

  const handleGradeChange = (value: string) => {
    setSelectedGrade(value);
    localStorage.setItem("selectedGrade", value);
    // Reset study records when changing grade
    if (confirm("학년을 변경하면 현재 학습 기록이 초기화됩니다. 계속하시겠습니까?")) {
      localStorage.removeItem("studyRecords");
    }
  };

  const handleReset = () => {
    if (confirm("정말로 모든 학습 기록을 초기화하시겠습니까?")) {
      localStorage.removeItem("studyRecords");
      localStorage.removeItem("sessionSize");
      setSessionSize("5");
      alert("학습 기록이 초기화되었습니다.");
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-md w-full mx-auto space-y-6">
        <motion.div 
          className="flex items-center gap-3 mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">설정</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  학년 선택
                </label>
                <Select value={selectedGrade} onValueChange={handleGradeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map(option => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        disabled={!option.available}
                      >
                        {option.label} {!option.available && "(준비중)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-2">
                  학습할 교재를 선택합니다.
                </p>
              </div>

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
                    <SelectItem value="5">5개씩 (기본값)</SelectItem>
                    <SelectItem value="10">10개씩</SelectItem>
                    <SelectItem value="15">15개씩</SelectItem>
                    <SelectItem value="20">20개씩</SelectItem>
                    <SelectItem value="30">30개씩</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-2">
                  한 세션에 학습할 한자 개수를 설정합니다.
                </p>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-sm font-medium mb-3">데이터 관리</h2>
                <Button 
                  variant="destructive" 
                  onClick={handleReset}
                  className="w-full"
                >
                  학습 기록 초기화
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  모든 학습 진도와 복습 일정이 초기화됩니다.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Card className="p-6">
            <div className="space-y-2">
              <h2 className="text-sm font-medium">버전 정보</h2>
              <p className="text-xs text-gray-500">独一无二 v1.0</p>
              <p className="text-xs text-gray-500">人教版 언어 교재</p>
              <p className="text-xs text-gray-500">현재 선택: {gradeOptions.find(g => g.value === selectedGrade)?.label}</p>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}