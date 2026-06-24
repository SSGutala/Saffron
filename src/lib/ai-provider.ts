import type { InspirationImage } from "@/types/lifecycle";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const GROQ_TEXT_MODEL = "llama-3.3-70b-versatile";
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export function hasAIKey(): boolean {
  return !!(
    process.env.GROQ_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY
  );
}

function buildUserContent(
  user: string,
  images?: InspirationImage[],
): string | unknown[] {
  if (!images?.length) return user;
  return [
    { type: "text", text: user },
    ...images.slice(0, 4).map((img) => ({
      type: "image_url",
      image_url: { url: img.dataUrl, detail: "low" },
    })),
  ];
}

async function callGroq(
  system: string,
  user: string,
  maxTokens: number,
  images?: InspirationImage[],
): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: images?.length ? GROQ_VISION_MODEL : GROQ_TEXT_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: buildUserContent(user, images) },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callOpenAI(
  system: string,
  user: string,
  maxTokens: number,
  images?: InspirationImage[],
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: images?.length ? "gpt-4o" : "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: buildUserContent(user, images) },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(
  system: string,
  user: string,
  maxTokens: number,
): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error: ${err}`);
  }

  const data = await res.json();
  const block = data.content?.find((b: { type: string }) => b.type === "text");
  return block?.text ?? "";
}

/** Groq first (default), then OpenAI, then Anthropic. */
export async function completeChat({
  system,
  user,
  maxTokens = 8000,
  images,
}: {
  system: string;
  user: string;
  maxTokens?: number;
  images?: InspirationImage[];
}): Promise<string> {
  if (process.env.GROQ_API_KEY) {
    return callGroq(system, user, maxTokens, images);
  }
  if (process.env.OPENAI_API_KEY) {
    return callOpenAI(system, user, maxTokens, images);
  }
  if (process.env.ANTHROPIC_API_KEY) {
    const userText = images?.length
      ? `${user}\n\n[${images.length} reference image(s) attached — apply their visual style where relevant.]`
      : user;
    return callAnthropic(system, userText, maxTokens);
  }
  throw new Error(
    "No AI API key configured. Set GROQ_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY.",
  );
}
