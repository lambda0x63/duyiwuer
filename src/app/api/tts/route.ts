import { NextRequest } from "next/server";

const BAIDU_TTS_ENDPOINT = "https://fanyi.baidu.com/gettts";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");

  if (!text || !text.trim()) {
    return new Response("Missing text", { status: 400 });
  }

  const targetUrl = new URL(BAIDU_TTS_ENDPOINT);
  targetUrl.searchParams.set("lan", "zh");
  targetUrl.searchParams.set("text", text);
  targetUrl.searchParams.set("spd", "5");
  targetUrl.searchParams.set("source", "web");

  const upstreamResponse = await fetch(targetUrl.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Referer: "https://fanyi.baidu.com/",
    },
    cache: "no-store",
  });

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return new Response("Unable to generate speech", { status: upstreamResponse.status });
  }

  const headers = new Headers();
  headers.set("Content-Type", upstreamResponse.headers.get("content-type") ?? "audio/mpeg");
  headers.set("Cache-Control", "no-store");
  headers.set("Access-Control-Allow-Origin", "*");

  return new Response(upstreamResponse.body, {
    status: 200,
    headers,
  });
}
