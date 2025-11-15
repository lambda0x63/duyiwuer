"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HomeClientProps {
  totalWords: number;
}

export default function HomeClient({ totalWords }: HomeClientProps) {
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
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <Settings className="h-5 w-5" />
          </Link>
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
          className="space-y-3"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Button size="lg" className="w-full" asChild>
            <Link href="/study/basic">기본 단어 학습</Link>
          </Button>
          <Button size="lg" variant="secondary" className="w-full" asChild>
            <Link href="/study/textbook">교과서 단어 학습</Link>
          </Button>
          <Button size="lg" variant="outline" className="w-full" asChild>
            <Link href="/quiz">퀴즈 풀기</Link>
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            단어 {totalWords}개
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
