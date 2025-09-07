"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ChevronUp, ChevronRight, ChevronDown } from "lucide-react";

interface WordData {
  id: number;
  char?: string;
  word?: string;
  pinyin: string;
  korean: string;
  type?: "recognize" | "write";
  level?: string;
  example?: string;
  example_pinyin?: string;
  example_korean?: string;
  frequency?: number;
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

  const displayText = word.char || word.word || "";
  const hasExample = word.example && word.example_pinyin && word.example_korean;

  useEffect(() => {
    resetCard();
  }, [word]);

  return (
    <div className="relative w-full h-full flex items-center justify-center px-4">
      <div 
        className={`
          relative w-full h-[400px] cursor-pointer select-none
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
            relative w-full h-full transition-transform duration-500
            [transform-style:preserve-3d]
            ${isFlipped ? "[transform:rotateY(180deg)]" : ""}
          `}
        >
          {/* Front side */}
          <Card className="absolute w-full h-full flex items-center justify-center [backface-visibility:hidden]">
            <div className="text-center p-6">
              <h1 className={`leading-none font-bold mb-4 ${
                displayText.length > 1 ? "text-[80px]" : "text-[120px]"
              }`}>{displayText}</h1>
              {word.type === "write" && (
                <div className="inline-flex items-center gap-1 text-sm text-orange-600 mb-4">
                  <span>✍️</span>
                  쓰기
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-8">탭하여 뒤집기</p>
            </div>
          </Card>
          
          {/* Back side */}
          <Card className="absolute w-full h-full bg-muted/30 [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-y-auto">
            <div className="h-full flex flex-col justify-center p-6">
              <div className="text-center mb-6">
                <h1 className={`leading-none font-bold mb-4 ${
                  displayText.length > 1 ? "text-[60px]" : "text-[80px]"
                }`}>{displayText}</h1>
                <p className="text-3xl mb-2 text-blue-600">{word.pinyin}</p>
                <p className="text-2xl text-muted-foreground">{word.korean}</p>
              </div>
              
              {hasExample && (
                <div className="border-t pt-4">
                  <div className="text-sm text-slate-500 mb-3 text-center font-medium">
                    • 예문 •
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-lg font-medium">{word.example}</p>
                    <p className="text-sm text-blue-600">{word.example_pinyin}</p>
                    <p className="text-sm text-muted-foreground">{word.example_korean}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {isFlipped && (
        <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-8 text-muted-foreground">
          <div className="flex flex-col items-center">
            <ChevronUp size={24} />
            <span className="text-xs">완벽</span>
          </div>
          <div className="flex flex-col items-center">
            <ChevronRight size={24} />
            <span className="text-xs">헷갈림</span>
          </div>
          <div className="flex flex-col items-center">
            <ChevronDown size={24} />
            <span className="text-xs">처음봄</span>
          </div>
        </div>
      )}
    </div>
  );
}