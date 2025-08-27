# 독일무이 (独一无二)

중국어 한자 학습 PWA (人教版 교재 기반)

## 개요

- 人教版 일년급상책 识字表(199자) 및 写字表(80자) 학습
- SM-2 알고리즘 기반 간격 반복 학습
- PWA 지원으로 오프라인 학습 가능
- 모바일 최적화 인터페이스

## 주요 기능

### 학습 시스템
- 플래시카드 방식 한자 학습
- 터치 제스처 지원 (상하좌우 스와이프)
- 난이도별 평가: 완벽 / 헷갈림 / 처음봄
- 자동 복습 스케줄링

### 데이터 관리
- 학년별 데이터 구조 (grade1-1.json 형식)
- 로컬 스토리지 기반 학습 기록 저장
- 학습 통계 추적 (진도율, 복습 대기 등)

## SM-2 알고리즘

### 핵심 변수
- **Quality (품질)**: 0-5 점수 (응답 정확도)
- **Easiness Factor (난이도 계수)**: 기본 2.5, 최소 1.3
- **Interval (간격)**: 다음 복습까지 일수
- **Repetitions (반복)**: 연속 정답 횟수

### 난이도별 Quality 값
- 완벽: 5
- 헷갈림: 3
- 처음봄: 0

### 복습 간격 계산
```
Quality >= 3인 경우:
  첫 번째 복습: 1일
  두 번째 복습: 6일
  세 번째 이후: 이전 간격 × 난이도 계수

Quality < 3인 경우:
  반복 횟수 초기화
  10분 후 즉시 복습
```

### 난이도 계수 조정
```
EF = EF + (0.1 - (5 - q) × (0.08 + (5 - q) × 0.02))
최소값: 1.3
```

## 학습 세션 구성

- 기본 세션 크기: 5개 (3/5/10/15/20/30 선택 가능)
- 복습 단어: 70% (복습 기한 지난 것 우선)
- 신규 단어: 30%
- 최종 순서: 무작위 배치

## 기술 스택

- Next.js 15.5.2
- TypeScript
- Tailwind CSS v4
- PWA (next-pwa)
- Framer Motion

## 데이터 구조

```json
{
  "id": 1,
  "char": "一",
  "pinyin": "yī",
  "korean": "하나",
  "type": "recognize",
  "level": "1-1"
}
```

## 파일 구조

```
/src/app
  /page.tsx - 메인 페이지
  /study/page.tsx - 학습 페이지
  /settings/page.tsx - 설정 페이지
/src/components
  /FlashCard.tsx - 플래시카드 컴포넌트
/public/data
  /grade1-1.json - 1학년 1학기 데이터
```

## 로컬 스토리지 구조

- `studyRecords`: 학습 기록 (wordId, lastStudied, nextReview, difficulty, easiness, interval, repetitions)
- `sessionSize`: 세션 크기 설정
- `selectedGrade`: 선택된 학년

## 설치 및 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
npm start
```