"use client";

import { useState, useEffect, useMemo, useRef, useCallback, type MouseEvent } from "react";
import { Card } from "@/components/ui/card";
import { Volume2, MessageSquare, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [showAskModal, setShowAskModal] = useState(false);
  const [askQuestion, setAskQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
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

  const stopTts = useCallback(() => {
    audioQueueRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsPlayingTts(false);
  }, []);

  const getTtsUrl = (text: string) => `/api/tts?text=${encodeURIComponent(text)}`;

  const playNextAudio = useCallback(() => {
    const nextUrl = audioQueueRef.current.shift();
    if (!nextUrl) {
      stopTts();
      return;
    }

    const audio = new Audio(nextUrl);
    audio.crossOrigin = "anonymous";
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

    if (queue.length === 0) return;

    audioQueueRef.current = queue;
    setIsPlayingTts(true);
    playNextAudio();
  };

  const askAI = async () => {
    if (!askQuestion.trim()) return;

    setIsLoadingResponse(true);
    setAiResponse("");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word,
          userQuestion: askQuestion,
        }),
      });

      if (!response.ok) {
        throw new Error("AI 응답 생성 실패");
      }

      const data = await response.json();
      setAiResponse(data.answer);
    } catch (error) {
      console.error("Ask AI Error:", error);
      setAiResponse("죄송합니다. 현재 AI 기능을 사용할 수 없습니다. OpenRouter API 키를 확인해주세요.");
    } finally {
      setIsLoadingResponse(false);
    }
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
                      {word.meaning}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="rounded-2xl bg-gray-100/90 p-5 space-y-4">
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                        예문
                      </h3>
                      <div className="space-y-4">
                        {word.examples && word.examples.map((example, index) => (
                          <div key={index} className="space-y-2">
                            <p className="text-lg sm:text-xl leading-relaxed text-gray-900 whitespace-pre-wrap">
                              {example}
                            </p>
                            {index < word.examples.length - 1 && (
                              <div className="h-px bg-gray-300/70" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <div className="mt-5 mb-10 flex justify-center gap-4">
        <button
          type="button"
          className={`inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3 text-gray-700 shadow-md hover:text-gray-900 hover:border-gray-500 transition-all ${isPlayingTts ? "ring-2 ring-blue-400" : ""}`}
          onClick={playPronunciation}
          aria-label="발음 듣기"
        >
          <Volume2 className="h-6 w-6" />
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3 text-gray-700 shadow-md hover:text-gray-900 hover:border-gray-500 transition-all"
          onClick={() => setShowAskModal(true)}
          aria-label="질문하기"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      </div>

      {/* Bottom Sheet Ask Panel */}
      {showAskModal && (
        <>
          {/* Backdrop - invisible but clickable to dismiss */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowAskModal(false);
              setAskQuestion("");
              setAiResponse("");
            }}
          />

          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] animate-in slide-in-from-bottom-10 duration-500 ease-out">
            <div className="w-full rounded-t-3xl bg-white shadow-2xl">
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-12 rounded-full bg-gray-300" />
              </div>

              {/* Content */}
              <div className="overflow-y-auto px-6 pb-8 pt-4 max-h-[calc(85vh-60px)]">

                {/* Q&A Section */}
                {!aiResponse ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-3">
                        질문 입력하기
                      </label>
                      <textarea
                        autoFocus
                        value={askQuestion}
                        onChange={(e) => setAskQuestion(e.target.value)}
                        placeholder="예: 이 단어는 언제 사용해요?"
                        className="w-full rounded-xl border border-gray-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={askAI}
                      disabled={isLoadingResponse || !askQuestion.trim()}
                      className="w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base"
                    >
                      {isLoadingResponse ? (
                        <>
                          <Loader className="h-5 w-5 animate-spin mr-2" />
                          생성 중...
                        </>
                      ) : (
                        "질문하기"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI의 답변</p>
                      <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-5 border border-green-100">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
                          {aiResponse}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => {
                          setAiResponse("");
                          setAskQuestion("");
                        }}
                        variant="outline"
                        className="h-11 rounded-xl font-semibold border-gray-300"
                      >
                        다시 물어보기
                      </Button>
                      <Button
                        onClick={() => {
                          setShowAskModal(false);
                          setAskQuestion("");
                          setAiResponse("");
                        }}
                        className="h-11 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                      >
                        닫기
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
