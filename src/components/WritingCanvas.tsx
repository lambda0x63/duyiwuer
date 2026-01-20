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
  const strokesRef = useRef<Array<Array<[number, number, number]>>>([]);
  const dprRef = useRef(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRep, setCurrentRep] = useState(1);

  // 현재 회차에 따른 투명도 계산
  const getOpacity = useCallback(() => {
    if (currentRep <= 2) return 0.4; // 1~2회: 40% (명확한 가이드)
    if (currentRep <= 4) return 0.15; // 3~4회: 15% (약한 가이드)
    return 0; // 5회: 0% (가이드 없음)
  }, [currentRep]);

  // 글자수에 따른 폰트 크기 계산 (쓰기 가이드용)
  const getFontSize = useCallback((charCount: number) => {
    if (charCount === 1) return 260;
    if (charCount === 2) return 170;
    if (charCount === 3) return 130;
    return 100; // 4글자 이상
  }, []);

  // 글자수에 따른 붓펜 두께 계산 (폰트 크기에 비례)
  const getBrushSize = useCallback((charCount: number) => {
    if (charCount === 1) return 13;   // 1글자: 기본 두께
    if (charCount === 2) return 9;    // 2글자: 약간 가늘게
    if (charCount === 3) return 7;    // 3글자: 더 가늘게
    return 5.5;                        // 4글자 이상: 가장 가늘게
  }, []);

  // 스트로크 포인트를 SVG 경로로 변환 (붓펜 서예 스타일)
  const pointsToPath = useCallback((points: Array<[number, number, number]>) => {
    const brushSize = getBrushSize(character.length);
    const taperSize = brushSize * 3; // 테이퍼는 붓 크기의 3배

    const stroke = getStroke(points, {
      size: brushSize,    // 글자수에 따른 동적 붓펜 두께
      thinning: 0.82,     // 강약 대비 (속도에 따른 필압 시뮬레이션)
      smoothing: 0.75,    // 부드럽고 유려한 곡선
      streamline: 0.65,   // 자연스러운 잉크 흐름
      easing: (t) => Math.sin((t * Math.PI) / 2),  // 부드러운 가속
      start: {
        taper: taperSize, // 획 시작 테이퍼 (붓 크기에 비례)
        cap: true
      },
      end: {
        taper: taperSize, // 획 끝 테이퍼 (붓 크기에 비례)
        cap: true
      },
      simulatePressure: true,  // 속도 기반 압력 시뮬레이션 (빠르게 = 얇게)
    });

    if (stroke.length === 0) return "";

    let path = `M ${stroke[0][0]} ${stroke[0][1]}`;
    for (let i = 1; i < stroke.length; i++) {
      path += ` L ${stroke[i][0]} ${stroke[i][1]}`;
    }
    return path;
  }, [character.length, getBrushSize]);

  const drawAnswerGuide = useCallback((ctx: CanvasRenderingContext2D, rect: DOMRect) => {
    const opacity = getOpacity();
    if (opacity === 0) return; // 5회차에는 아무것도 그리지 않음

    const fontSize = getFontSize(character.length);

    // FlashCard와 동일한 폰트 사용
    const fontFamily = getComputedStyle(document.documentElement)
      .getPropertyValue('--font-noto-serif-cjk-jp')
      .trim() || "'Noto Serif CJK JP', 'Noto Serif JP', serif";

    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = `rgba(200, 200, 200, ${opacity})`;
    ctx.fillText(character, rect.width / 2, rect.height / 2);
  }, [character, getOpacity, getFontSize]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();

    // 배경 흰색 (canvas 크기 기준으로)
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 정답 한자 가이드 그리기
    drawAnswerGuide(ctx, rect);

    // 이전 획들 다시 그리기
    strokesRef.current.forEach((stroke) => {
      const path = pointsToPath(stroke);
      if (path) {
        const svgPath = new Path2D(path);
        ctx.fillStyle = "#000000";
        ctx.fill(svgPath);
      }
    });
  }, [drawAnswerGuide, pointsToPath]);

  // 새로운 단어가 로드될 때 상태 초기화
  useEffect(() => {
    setCurrentRep(1);
    strokesRef.current = [];
    pointsRef.current = [];
  }, [character]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 크기 설정
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // 초기 드로잉
    redrawCanvas();
  }, [character, currentRep, redrawCanvas]);

  const clearCanvas = () => {
    strokesRef.current = [];
    pointsRef.current = [];
    redrawCanvas();
  };

  const handleNext = () => {
    if (currentRep < TOTAL_REPS) {
      setCurrentRep(currentRep + 1);
      clearCanvas();
    } else {
      // 5회 완료 - 다음 단어로 이동 (자동으로 학습 탭으로 돌아감)
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
      redrawCanvas();

      // 현재 획 표시
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const path = pointsToPath(pointsRef.current);
      if (path) {
        const svgPath = new Path2D(path);
        ctx.fillStyle = "#000000";
        ctx.fill(svgPath);
      }
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
      redrawCanvas();

      // 현재 획 표시
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const path = pointsToPath(pointsRef.current);
      if (path) {
        const svgPath = new Path2D(path);
        ctx.fillStyle = "#000000";
        ctx.fill(svgPath);
      }
    }
  };

  const handleEnd = () => {
    if (isDrawing && pointsRef.current.length > 0) {
      // 현재 획을 strokesRef에 저장
      strokesRef.current.push([...pointsRef.current]);
      pointsRef.current = [];
    }
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
