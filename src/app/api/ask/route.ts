import { NextRequest, NextResponse } from "next/server";
import type { WordData } from "@/types/word";

export async function POST(req: NextRequest) {
  try {
    const { word, userQuestion, systemPrompt } = await req.json();

    if (!word || !userQuestion) {
      return NextResponse.json(
        { error: "word와 userQuestion은 필수입니다" },
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

    // 기본 시스템 프롬프트
    const defaultSystemPrompt = `당신은 중국어 학습을 돕는 친절한 선생님입니다. 초등학생 수준으로 이해하기 쉽게 답변해주세요.

현재 학습 중인 단어:
- 한자: ${word.word}
- 병음: ${word.pinyin}
- 의미: ${word.meaning}
- 예문: ${word.examples?.join(", ") || "없음"}

사용자의 질문에 이 단어와 관련해서 친절하게 답변해주세요.`;

    const messages = [
      {
        role: "user" as const,
        content: userQuestion,
      },
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Chinese Learning App",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        messages: messages,
        system: systemPrompt || defaultSystemPrompt,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter API Error:", error);
      return NextResponse.json(
        { error: "AI 응답 생성에 실패했습니다" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content || "응답을 생성할 수 없습니다";

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Ask API Error:", error);
    return NextResponse.json(
      { error: "요청 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
