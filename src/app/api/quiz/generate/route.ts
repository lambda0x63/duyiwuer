import { NextRequest, NextResponse } from "next/server";
import type { WordData } from "@/types/word";

interface AIGeneratedQuestion {
  question: string;
  correctAnswer: string;
  options?: string[];
  explanation: string;
}

export async function POST(req: NextRequest) {
  try {
    const { words, count = 5 } = await req.json();

    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: "유효한 단어 배열이 필요합니다" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API 키가 설정되지 않았습니다" },
        { status: 500 }
      );
    }

    // 무작위로 n개의 단어 선택
    const selectedWords = words
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(count, words.length));

    // 선택된 단어들을 포맷팅
    const wordsList = selectedWords
      .map((w: WordData) => `- ${w.word} (${w.pinyin}): ${w.meaning}`)
      .join("\n");

    const prompt = `다음 중국어 단어들을 이용해서 초등학생 수준의 응용 문제를 ${count}개 만들어주세요.

단어들:
${wordsList}

요구사항:
1. 각 문제는 해당 단어의 올바른 사용을 테스트해야 합니다
2. 초등학생이 이해할 수 있는 수준의 일상 상황을 포함합니다
3. 문제와 정답을 포함합니다
4. 정답 설명을 포함합니다

다음과 같은 JSON 형식으로 응답해주세요 (다른 텍스트는 없이 JSON만):
[
  {
    "word": "단어",
    "question": "문제 내용",
    "correctAnswer": "정답",
    "explanation": "정답 설명",
    "options": ["옵션1", "옵션2", "옵션3", "정답"]
  }
]`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Chinese Learning App",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-v3.2-exp",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter API Error:", error);
      return NextResponse.json(
        { error: "AI 문제 생성에 실패했습니다" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || "[]";

    // JSON 추출 (마크다운 코드 블록 처리)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // JSON 배열이 직접 포함되어 있는 경우
      const arrayMatch = responseText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonStr = arrayMatch[0];
      }
    }

    const questions = JSON.parse(jsonStr) as AIGeneratedQuestion[];

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Quiz Generate API Error:", error);
    return NextResponse.json(
      { error: "요청 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
