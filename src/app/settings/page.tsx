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


export default function Settings() {
  const router = useRouter();
  const [sessionSize, setSessionSize] = useState<string>("5");

  useEffect(() => {
    const savedSize = localStorage.getItem("sessionSize");
    if (savedSize) {
      setSessionSize(savedSize);
    }
  }, []);

  const handleSessionSizeChange = (value: string) => {
    setSessionSize(value);
    localStorage.setItem("sessionSize", value);
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
                  한 세션에 학습할 단어 개수를 설정합니다.
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
              <p className="text-xs text-gray-500">独一无二 v2.0</p>
              <p className="text-xs text-gray-500">중국어 기초 학습</p>
              <p className="text-xs text-gray-500">총 150개 단어 수록</p>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}