"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ChevronUp, ChevronRight, ChevronDown } from "lucide-react";

interface WordData {
  id: number;
  char: string;
  pinyin: string;
  korean: string;
  type: "recognize" | "write";
  level: string;
}

interface FlashCardProps {
  word: WordData;
  onSwipe: (difficulty: "perfect" | "hard" | "again") => void;
}

export default function FlashCard({ word, onSwipe }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);

  const minSwipeDistance = 50;

  const handleTap = () => {
    if (!isFlipped) {
      setIsFlipped(true);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isFlipped) {
      if (isHorizontalSwipe) {
        if (Math.abs(distanceX) > minSwipeDistance) {
          if (distanceX < 0) {
            setSwipeDirection("right");
            setTimeout(() => {
              onSwipe("hard");
              resetCard();
            }, 300);
          }
        }
      } else {
        if (Math.abs(distanceY) > minSwipeDistance) {
          if (distanceY > 0) {
            setSwipeDirection("up");
            setTimeout(() => {
              onSwipe("perfect");
              resetCard();
            }, 300);
          } else {
            setSwipeDirection("down");
            setTimeout(() => {
              onSwipe("again");
              resetCard();
            }, 300);
          }
        }
      }
    }
  };

  const resetCard = () => {
    setIsFlipped(false);
    setSwipeDirection(null);
    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    resetCard();
  }, [word]);

  return (
    <div className="relative w-full h-full flex items-center justify-center px-6">
      <div 
        className={`
          relative w-full h-[400px] cursor-pointer select-none
          transition-all duration-300
          ${swipeDirection === "up" ? "-translate-y-full opacity-0" : ""}
          ${swipeDirection === "right" ? "translate-x-full opacity-0" : ""}
          ${swipeDirection === "down" ? "translate-y-full opacity-0" : ""}
        `}
        style={{ 
          perspective: "1000px",
          touchAction: "none"
        }}
        onClick={handleTap}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={`
            relative w-full h-full transition-transform duration-500
            [transform-style:preserve-3d]
            ${isFlipped ? "[transform:rotateY(180deg)]" : ""}
          `}
        >
          {/* Front side */}
          <Card className="absolute w-full h-full flex items-center justify-center [backface-visibility:hidden]">
            <div className="text-center p-6">
              <h1 className="text-[120px] leading-none font-bold mb-4">{word.char}</h1>
              {word.type === "write" && (
                <p className="text-sm text-gray-500">쓰기</p>
              )}
              <p className="text-xs text-gray-300 mt-8">탭하여 뒤집기</p>
            </div>
          </Card>
          
          {/* Back side */}
          <Card className="absolute w-full h-full flex items-center justify-center bg-gray-50 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="text-center p-6">
              <h1 className="text-[80px] leading-none font-bold mb-6">{word.char}</h1>
              <p className="text-4xl mb-3">{word.pinyin}</p>
              <p className="text-3xl text-gray-600">{word.korean}</p>
            </div>
          </Card>
        </div>
      </div>

      {isFlipped && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8 text-gray-400">
        <div className="flex flex-col items-center">
          <ChevronUp size={24} />
          <span className="text-xs">완벽</span>
        </div>
        <div className="flex flex-col items-center">
          <ChevronRight size={24} />
          <span className="text-xs">애매</span>
        </div>
        <div className="flex flex-col items-center">
          <ChevronDown size={24} />
          <span className="text-xs">몰라</span>
        </div>
      </div>
      )}
    </div>
  );
}