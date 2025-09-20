"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ChevronUp, ChevronRight, ChevronDown } from "lucide-react";

interface WordData {
  id?: number;
  word: string;
  meaning_ko: string;
  pinyin: string;
  example: string;
  example_pinyin: string;
  example_korean: string;
}

interface FlashCardProps {
  word: WordData;
  onSwipe: (difficulty: "perfect" | "confused" | "new") => void;
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
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const currentTouch = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };

    const distanceX = touchStart.x - currentTouch.x;
    const distanceY = touchStart.y - currentTouch.y;

    if (Math.abs(distanceX) > 10 || Math.abs(distanceY) > 10) {
      e.preventDefault();
    }

    setTouchEnd(currentTouch);
  };

  const onTouchEnd = () => {
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
              onSwipe("confused");
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
              onSwipe("new");
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

  const displayText = word.word;

  useEffect(() => {
    resetCard();
  }, [word]);

  return (
    <div className="relative w-full flex flex-col items-center px-4">
      <div className="relative w-full max-w-md">
        <div
          className={`
            relative cursor-pointer select-none
            transition-all duration-300
            ${swipeDirection === "up" ? "-translate-y-full opacity-0" : ""}
            ${swipeDirection === "right" ? "translate-x-full opacity-0" : ""}
            ${swipeDirection === "down" ? "translate-y-full opacity-0" : ""}
          `}
          style={{
            perspective: "1000px"
          }}
          onClick={handleTap}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className={`
              relative w-full transition-transform duration-500
              [transform-style:preserve-3d]
              ${isFlipped ? "[transform:rotateY(180deg)]" : ""}
            `}
          >
            {/* Front side - 심플하고 깔끔하게 */}
            <Card className="h-[450px] flex items-center justify-center [backface-visibility:hidden] p-8">
              <div className="text-center">
                <h1 className={`font-bold text-gray-900 mb-8 ${
                  displayText.length > 4 ? "text-5xl" :
                  displayText.length > 3 ? "text-6xl" :
                  displayText.length > 2 ? "text-7xl" : "text-8xl"
                }`}>{displayText}</h1>
                <p className="text-sm text-gray-400">탭하여 뒤집기</p>
              </div>
            </Card>

            {/* Back side - 가독성 중심 */}
            <Card className="absolute inset-0 h-[450px] [backface-visibility:hidden] [transform:rotateY(180deg)] p-6">
              <div className="h-full flex flex-col">
                {/* 단어 정보 섹션 */}
                <div className="text-center space-y-2 pb-4">
                  <h1 className={`font-bold text-gray-900 ${
                    displayText.length > 4 ? "text-3xl" :
                    displayText.length > 3 ? "text-4xl" :
                    displayText.length > 2 ? "text-4xl" : "text-5xl"
                  }`}>{displayText}</h1>
                  <p className="text-2xl text-blue-600">{word.pinyin}</p>
                  <p className="text-xl font-medium text-gray-700">{word.meaning_ko}</p>
                </div>

                {/* 예문 섹션 - 명확한 구분 */}
                <div className="flex-1 border-t-2 border-gray-100 pt-4">
                  <div className="bg-gray-50 rounded-lg p-4 h-full flex flex-col justify-center space-y-3">
                    {/* 중국어 예문 */}
                    <p className="text-lg font-medium text-gray-900 leading-relaxed">
                      {word.example}
                    </p>
                    {/* 병음 */}
                    <p className="text-base text-blue-600 leading-relaxed">
                      {word.example_pinyin}
                    </p>
                    {/* 한국어 번역 */}
                    <p className="text-base text-gray-600 leading-relaxed">
                      {word.example_korean}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* 스와이프 인디케이터 - 카드 아래 별도 영역 */}
      {isFlipped && (
        <div className="flex justify-center gap-10 text-gray-400 mt-12">
          <div className="flex flex-col items-center">
            <ChevronUp size={20} />
            <span className="text-xs mt-1">완벽</span>
          </div>
          <div className="flex flex-col items-center">
            <ChevronRight size={20} />
            <span className="text-xs mt-1">헷갈림</span>
          </div>
          <div className="flex flex-col items-center">
            <ChevronDown size={20} />
            <span className="text-xs mt-1">처음봄</span>
          </div>
        </div>
      )}
    </div>
  );
}