# duyiwuer

## 시스템 개요

### 학습 메커니즘
**플래시카드 (Flashcards)**
- 탭(Tab) 카드 뒤집기 및 의미 확인
- 스와이프(Swipe) 다음 단어 진행
- **LocalStorage** 학습 상태 영구 보존 및 진도 추적

**필기 인식 (Writing)**
- **Canvas API** 기반 터치 궤적 추적
- `perfect-freehand` 라이브러리 활용 필압 시뮬레이션
- 획 순서 자유 및 리셋 기능 제공

### AI 튜터링
**DeepSeek v3.2-exp (OpenRouter)**
- 현재 학습 중인 단어의 컨텍스트(한자/병음/예문) 주입
- 초급자 눈높이에 맞춘 1-3문장 간결 설명
- 한국어 답변 강제 및 관련 없는 주제 차단

### 음성 합성 (TTS)
**Baidu Fanyi Proxy**
- Next.js API Route 기반 CORS 우회
- `Referer` 및 `User-Agent` 헤더 조작으로 Baidu TTS 엔드포인트 접근
- 중국어(zh) 표준 발음 스트리밍

## 데이터 구조

### 단어 모델 (Word Data)
- **JSON** 기반 정적 데이터 관리 (`public/data/*.json`)
- 한자(word) 병음(pinyin) 뜻(meaning) 예문(examples) 구조

### 상태 관리
- **seenCardIds** 학습 완료한 단어 ID 배열
- **shuffle** Fisher-Yates 알고리즘 기반 랜덤 학습

## 기술 스택 (Tech Stack)
- **Framework** Next.js 15 (App Router)
- **Language** TypeScript 5
- **Styling** Tailwind CSS v4
- **UI/Motion** Framer Motion / Radix UI
- **Canvas** perfect-freehand
- **AI/LLM** OpenRouter (DeepSeek)

## 환경설정 (Environment Setup)

```bash
npm install
npm run dev
```

```env
OPENROUTER_API_KEY="..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```