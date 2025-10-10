"use client";

import { useState, useEffect, useMemo, useRef, useCallback, type MouseEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import type { WordData } from "@/types/word";

interface FlashCardProps {
  word: WordData;
  onNext: () => void;
}

export default function FlashCard({ word, onNext }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<string[]>([]);

  const minSwipeDistance = 50;

  const handleTap = () => {
    if (isAnimating) return;
    if (!isFlipped) {
      setIsFlipped(true);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || isAnimating) return;

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
    if (!touchStart || !touchEnd || !isFlipped || isAnimating) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (!isHorizontalSwipe && distanceY > minSwipeDistance) {
      advanceToNext();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const advanceToNext = () => {
    if (!isFlipped || isAnimating) return;
    setIsAnimating(true);
    setSwipeDirection("up");
    setTimeout(() => {
      setIsFlipped(false);
      setTouchStart(null);
      setTouchEnd(null);
      onNext();
      setSwipeDirection(null);
      setIsAnimating(false);
    }, 220);
  };

  const resetCard = () => {
    setIsFlipped(false);
    setSwipeDirection(null);
    setTouchStart(null);
    setTouchEnd(null);
    setIsAnimating(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isAnimating) return;
    if (!isFlipped && (event.key === " " || event.key === "Enter")) {
      event.preventDefault();
      setIsFlipped(true);
      return;
    }

    if (isFlipped && (event.key === "ArrowUp" || event.key === "PageUp")) {
      event.preventDefault();
      advanceToNext();
    }
  };

  const displayText = word.word;
  const characterParts = useMemo(() => Array.from(displayText), [displayText]);
  const pinyinParts = useMemo(
    () => word.pinyin.split(/\s+/).filter(Boolean),
    [word.pinyin]
  );
  const canAlignCharacters =
    characterParts.length > 0 &&
    characterParts.length === pinyinParts.length &&
    characterParts.length <= 8;
  const exampleText = word.example;
  const exampleCharacters = useMemo(() => Array.from(exampleText), [exampleText]);
  const examplePinyinParts = useMemo(
    () => word.example_pinyin.split(/\s+/).filter(Boolean),
    [word.example_pinyin]
  );
  const canAlignExample =
    exampleCharacters.length > 0 &&
    exampleCharacters.length === examplePinyinParts.length &&
    exampleCharacters.length <= 30;

  const stopTts = useCallback(() => {
    audioQueueRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsPlayingTts(false);
  }, []);

  const getTtsUrl = (text: string) =>
    `https://dict.youdao.com/dictvoice?type=2&audio=${encodeURIComponent(text)}`;

  const playNextAudio = useCallback(() => {
    const nextUrl = audioQueueRef.current.shift();
    if (!nextUrl) {
      stopTts();
      return;
    }

    const audio = new Audio(nextUrl);
    audioRef.current = audio;

    const handleFinished = () => {
      audio.removeEventListener("ended", handleFinished);
      audio.removeEventListener("error", handleFinished);
      playNextAudio();
    };

    audio.addEventListener("ended", handleFinished);
    audio.addEventListener("error", handleFinished);

    audio.play().catch(() => {
      handleFinished();
    });
  }, [stopTts]);

  const playPronunciation = (event?: MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    event?.preventDefault();

    if (isPlayingTts) {
      stopTts();
      return;
    }

    const queue: string[] = [];
    const trimmedWord = word.word.trim();
    if (trimmedWord) queue.push(getTtsUrl(trimmedWord));
    const trimmedExample = word.example.trim();
    if (trimmedExample) queue.push(getTtsUrl(trimmedExample));

    if (queue.length === 0) return;

    audioQueueRef.current = queue;
    setIsPlayingTts(true);
    playNextAudio();
  };

  useEffect(() => {
    resetCard();
    stopTts();
  }, [word, stopTts]);

  useEffect(() => () => stopTts(), [stopTts]);

  return (
    <div className="relative w-full flex flex-col items-center px-4">
      <div
        className="relative w-full max-w-md focus:outline-none"
        role="button"
        aria-label="플래시카드"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div
          className={`
            relative cursor-pointer select-none
            transition-all duration-300
            ${swipeDirection === "up" ? "-translate-y-full opacity-0" : ""}
            ${swipeDirection === "right" ? "translate-x-full opacity-0" : ""}
            ${swipeDirection === "left" ? "-translate-x-full opacity-0" : ""}
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
            <Card className="h-[480px] flex items-center justify-center [backface-visibility:hidden] p-8">
              <div className="text-center">
                <h1 className={`font-bold text-gray-900 mb-8 ${
                  displayText.length > 4 ? "text-5xl" :
                  displayText.length > 3 ? "text-6xl" :
                  displayText.length > 2 ? "text-7xl" : "text-8xl"
                }`}>{displayText}</h1>
                <p className="text-base text-gray-500">탭해서 뒤집고 위로 스와이프하세요</p>
              </div>
            </Card>

            {/* Back side - 가독성 중심 */}
            <Card className="absolute inset-0 h-[480px] [backface-visibility:hidden] [transform:rotateY(180deg)] p-6">
              <div className="h-full flex flex-col gap-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    {canAlignCharacters ? (
                      <div className="flex justify-center flex-wrap gap-4">
                        {characterParts.map((char, index) => (
                          <div
                            key={`${char}-${index}`}
                            className="flex flex-col items-center gap-1"
                          >
                            <span className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight">
                              {char}
                            </span>
                            <span className="text-base sm:text-lg text-blue-600 font-semibold">
                              {pinyinParts[index]}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight">
                          {displayText}
                        </h1>
                        <p className="text-3xl sm:text-4xl text-blue-600 font-semibold">
                          {word.pinyin}
                        </p>
                      </div>
                    )}
                    <p className="text-xl text-gray-700 text-center font-medium">
                      {word.meaning_ko}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`text-gray-500 hover:text-gray-900 ${isPlayingTts ? "animate-pulse" : ""}`}
                      onClick={playPronunciation}
                      aria-label="발음 듣기"
                    >
                      <Volume2 className="h-6 w-6" />
                    </Button>
                    <span className="text-sm text-gray-500">
                      {isPlayingTts ? "재생 중..." : "발음 듣기"}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="rounded-2xl bg-gray-100/90 p-5 space-y-4">
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                        예문
                      </h3>
                      {canAlignExample ? (
                        <div className="flex flex-wrap gap-3">
                          {exampleCharacters.map((char, index) => (
                            <div
                              key={`${char}-${index}`}
                              className="flex flex-col items-center gap-1"
                            >
                              <span className="text-xl sm:text-2xl font-semibold text-gray-900">
                                {char}
                              </span>
                              <span className="text-sm sm:text-base text-blue-600">
                                {examplePinyinParts[index]}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <p className="text-xl sm:text-2xl leading-relaxed text-gray-900 whitespace-pre-wrap">
                            {word.example}
                          </p>
                          <p className="text-lg sm:text-xl leading-relaxed text-blue-700 whitespace-pre-wrap">
                            {word.example_pinyin}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="h-px bg-gray-300/70" />
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                        해석
                      </h3>
                      <p className="text-lg sm:text-xl leading-relaxed text-gray-800 whitespace-pre-wrap">
                        {word.example_korean}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
