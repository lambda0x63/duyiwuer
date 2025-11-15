import { NextRequest, NextResponse } from "next/server";

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
    const defaultSystemPrompt = `당신은 중국어 교육 전문가이자 친절한 튜터입니다. 반드시 다음 규칙을 따르세요:

**현재 학습 단어 (반드시 이 단어에 대해서만 답변)**:
- 한자: ${word.word}
- 병음: ${word.pinyin}
- 뜻: ${word.meaning}
- 예문들: ${word.examples?.map((e: string, i: number) => `${i + 1}. ${e}`).join(" / ") || "없음"}

**답변 규칙**:
1. 반드시 한국어로 답변하세요
2. 사용자의 질문은 "${word.word}(${word.pinyin})"라는 단어에 관한 질문입니다
3. 이 단어의 의미, 사용법, 어원, 발음, 예문 등에 대해 초등학생도 이해할 수 있게 친절하게 설명하세요
4. 답변은 간단하고 명확하게, 1-3개 문장으로 시작하세요
5. 필요하면 예문을 활용하세요

**중요**: 다른 단어나 주제는 언급하지 말고, 오직 "${word.word}"에 대해서만 답변하세요.`;

    const messages = [
      {
        role: "user" as const,
        content: `[학습 단어: ${word.word}(${word.pinyin}) - ${word.meaning}]\n\n질문: ${userQuestion}`,
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
        model: "deepseek/deepseek-v3.2-exp",
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
