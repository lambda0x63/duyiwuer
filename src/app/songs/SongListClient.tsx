"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SongSet } from "@/lib/songData";

interface SongListClientProps {
  songSets: SongSet[];
}

export default function SongListClient({ songSets }: SongListClientProps) {
  return (
    <motion.div
      className="min-h-screen flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.header
        className="flex items-center justify-between px-6 pt-6 pb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-xl font-semibold">노래 가사 학습</h1>
          <p className="text-sm text-gray-500 mt-1">
            좋아하는 노래 가사 속 단어로 학습해보세요.
          </p>
        </div>
        <div className="w-10" />
      </motion.header>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid gap-4 pb-2">
          {songSets.map((set) => (
            <motion.div
              key={set.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gray-900 text-white p-3">
                    <Music className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{set.title}</h2>
                    <p className="text-sm text-gray-500">{set.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>단어 {set.words.length}개</span>
                  <Button size="sm" asChild>
                    <Link href={`/songs/${encodeURIComponent(set.slug)}`}>
                      학습 시작
                    </Link>
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
