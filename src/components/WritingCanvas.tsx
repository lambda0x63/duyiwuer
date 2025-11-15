"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { getStroke } from "perfect-freehand";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface WritingCanvasProps {
  character: string;
  onNext: () => void;
}

const TOTAL_REPS = 5; // 교육학적으로 최적의 반복 횟수

export default function WritingCanvas({ character, onNext }: WritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Array<[number, number, number]>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRep, setCurrentRep] = useState(1);

  // 현재 회차에 따른 투명도 계산
  const getOpacity = useCallback(() => {
    if (currentRep <= 2) return 0.4; // 1~2회: 40% (명확한 가이드)
    if (currentRep <= 4) return 0.15; // 3~4회: 15% (약한 가이드)
    return 0; // 5회: 0% (가이드 없음)
  }, [currentRep]);

  // 글자수에 따른 폰트 크기 계산
  const getFontSize = useCallback((charCount: number) => {
    if (charCount === 1) return 280;
    if (charCount === 2) return 200;
    if (charCount === 3) return 150;
    return 120; // 4글자 이상
  }, []);

  // 스트로크 포인트를 SVG 경로로 변환
  const pointsToPath = (points: Array<[number, number, number]>) => {
    const stroke = getStroke(points, {
      size: 8,
      thinning: 0.6,
      smoothing: 0.5,
      streamline: 0.5,
    });

    if (stroke.length === 0) return "";

    let path = `M ${stroke[0][0]} ${stroke[0][1]}`;
    for (let i = 1; i < stroke.length; i++) {
      path += ` L ${stroke[i][0]} ${stroke[i][1]}`;
    }
    return path;
  };

  const drawAnswerGuide = useCallback((ctx: CanvasRenderingContext2D, rect: DOMRect) => {
    const opacity = getOpacity();
    if (opacity === 0) return; // 5회차에는 아무것도 그리지 않음

    const fontSize = getFontSize(character.length);
    ctx.font = `bold ${fontSize}px 'Noto Serif CJK JP', serif, STHeiti, SimSun`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = `rgba(200, 200, 200, ${opacity})`;
    ctx.fillText(character, rect.width / 2, rect.height / 2);
  }, [character, getOpacity, getFontSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 크기 설정
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // 배경 흰색
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 정답 한자 가이드 그리기 (투명도는 회차에 따라 변함)
    drawAnswerGuide(ctx, rect);
  }, [character, currentRep, drawAnswerGuide]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 정답 한자 가이드 다시 그리기
    drawAnswerGuide(ctx, rect);
  };

  const handleNext = () => {
    if (currentRep < TOTAL_REPS) {
      setCurrentRep(currentRep + 1);
      clearCanvas();
    } else {
      // 5회 완료 후 다음 단어로 진행
      onNext();
    }
  };

  const getCanvasCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    const touchEvent = e as React.TouchEvent<HTMLCanvasElement>;
    if (touchEvent.touches) {
      if (touchEvent.touches.length === 0) return null;
      clientX = touchEvent.touches[0].clientX;
      clientY = touchEvent.touches[0].clientY;
    } else {
      const mouseEvent = e as React.MouseEvent<HTMLCanvasElement>;
      clientX = mouseEvent.clientX;
      clientY = mouseEvent.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const coords = getCanvasCoordinates(e);
    if (coords) {
      pointsRef.current = [[coords.x, coords.y, Date.now()]];
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const coords = getCanvasCoordinates(e);
    if (coords) {
      pointsRef.current.push([coords.x, coords.y, Date.now()]);

      const path = pointsToPath(pointsRef.current);
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Canvas 다시 그리기 (가이드 + 이전 선)
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, rect.width, rect.height);
      drawAnswerGuide(ctx, rect);

      // 새 선 그리기
      const svgPath = new Path2D(path);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke(svgPath);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCanvasCoordinates(e);
    if (coords) {
      pointsRef.current = [[coords.x, coords.y, Date.now()]];
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const coords = getCanvasCoordinates(e);
    if (coords) {
      pointsRef.current.push([coords.x, coords.y, Date.now()]);

      const path = pointsToPath(pointsRef.current);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, rect.width, rect.height);
      drawAnswerGuide(ctx, rect);

      const svgPath = new Path2D(path);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke(svgPath);
    }
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6">
      {/* Progress Indicator */}
      <div className="w-full space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700">쓰기 연습</span>
          <span className="text-sm font-semibold text-blue-600">{currentRep}/{TOTAL_REPS}회</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(currentRep / TOTAL_REPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Canvas */}
      <div className="w-full aspect-square rounded-3xl border-2 border-gray-300 overflow-hidden shadow-lg bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleEnd}
          onTouchCancel={handleEnd}
        />
      </div>

      {/* Learning Stage Info */}
      <div className="text-center text-xs text-gray-500">
        {currentRep <= 2 && "가이드를 보면서 따라 써보세요"}
        {currentRep > 2 && currentRep < 5 && "가이드가 희미해집니다. 자신감 있게 써보세요"}
        {currentRep === 5 && "이제 혼자 힘으로 써보세요!"}
      </div>

      {/* Controls */}
      <div className="flex gap-4 w-full">
        <Button
          onClick={clearCanvas}
          variant="outline"
          className="flex-1 h-12 rounded-xl border-gray-300 gap-2"
        >
          <RotateCcw className="h-5 w-5" />
          지우기
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1 h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold"
        >
          {currentRep < TOTAL_REPS ? "다음" : "완료"}
        </Button>
      </div>
    </div>
  );
}
