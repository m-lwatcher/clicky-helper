// api.ts — real AI call via OpenAI-compatible endpoint + Gemini vision fallback
// Uses VITE_API_KEY + VITE_GEMINI_KEY + VITE_API_BASE_URL from .env.local

function resolveBase(): string {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  const key = import.meta.env.VITE_API_KEY ?? "";
  if (key.startsWith("gsk_")) return "https://api.groq.com/openai/v1";
  if (key.startsWith("sk-ant-")) return "https://api.anthropic.com/v1";
  return "https://api.openai.com/v1";
}

function resolveModel(): string {
  if (import.meta.env.VITE_MODEL) return import.meta.env.VITE_MODEL;
  const key = import.meta.env.VITE_API_KEY ?? "";
  if (key.startsWith("gsk_")) return "llama-3.3-70b-versatile";
  return "gpt-4o-mini";
}

const BASE_URL = resolveBase();
const API_KEY = import.meta.env.VITE_API_KEY ?? "";
const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY ?? "";
const MODEL = resolveModel();

const SYSTEM_PROMPT = [
  "You are Clicky Helper — a concise Windows desktop assistant.",
  "You help the user understand screenshots, explain terminal errors, suggest PowerShell or CMD commands, and guide setup steps.",
  "Be practical, calm, and direct.",
  "When the prompt or screenshot looks terminal-related, format the answer in exactly these sections:",
  "What happened",
  "Why",
  "Do this next",
  "Command",
  "Keep each section short.",
  "If you suggest a command, put exactly one best command in a ```powershell code block.",
  "Prefer the safest next step over the fanciest one.",
].join(" ");

export type AskOptions = {
  prompt: string;
  screenshotDataUrl?: string;
};

export type StructuredResponse = {
  raw: string;
  summary: string;
  steps: string[];
  command: string;
  isTerminalLike: boolean;
};

async function askGemini({ prompt, screenshotDataUrl }: AskOptions): Promise<string> {
  const model = "gemini-3-flash-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;

  const parts: unknown[] = [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }];

  if (screenshotDataUrl) {
    const [header, b64data] = screenshotDataUrl.split(",");
    const mimeType = header.replace("data:", "").replace(";base64", "");
    parts.push({ inlineData: { mimeType, data: b64data } });
  }

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: { temperature: 0.35, maxOutputTokens: 900 },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "(no response)";
}

async function askOpenAICompat({ prompt, screenshotDataUrl }: AskOptions): Promise<string> {
  const userContent: unknown[] = screenshotDataUrl
    ? [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: screenshotDataUrl } },
      ]
    : [{ type: "text", text: prompt }];

  const activeModel = screenshotDataUrl && API_KEY.startsWith("gsk_")
    ? "llama-3.2-11b-vision-preview"
    : MODEL;

  const body = {
    model: activeModel,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.35,
    max_tokens: 900,
  };

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "(no response)";
}

export async function askHelper(opts: AskOptions): Promise<string> {
  if (!API_KEY && !GEMINI_KEY) {
    throw new Error("No API key set. Add VITE_API_KEY or VITE_GEMINI_KEY to .env.local");
  }

  if (opts.screenshotDataUrl && GEMINI_KEY) {
    return askGemini(opts);
  }

  return askOpenAICompat(opts);
}

export function extractCommand(text: string): string {
  const match = text.match(/```(?:powershell|bash|cmd|sh)?\n([\s\S]*?)```/i);
  return match?.[1]?.trim() ?? "";
}

function cleanLine(line: string): string {
  return line.replace(/^[-*•\d.\s]+/, "").trim();
}

function extractSection(text: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\s*:?\\s*([\\s\\S]*?)(?=\\n[A-Z][^\\n]{0,40}:?\\s*$|$)`, "im");
  const match = text.match(re);
  return match?.[1]?.trim() ?? "";
}

export function parseStructuredResponse(text: string): StructuredResponse {
  const command = extractCommand(text);
  const withoutCode = text.replace(/```[\s\S]*?```/g, "").trim();
  const summary = extractSection(withoutCode, "What happened") || withoutCode.split("\n\n")[0] || withoutCode;
  const next = extractSection(withoutCode, "Do this next");
  const why = extractSection(withoutCode, "Why");

  let steps = next
    .split("\n")
    .map(cleanLine)
    .filter(Boolean);

  if (steps.length === 0 && why) {
    steps = why
      .split("\n")
      .map(cleanLine)
      .filter(Boolean)
      .slice(0, 3);
  }

  const isTerminalLike = /(powershell|cmd|terminal|npm|node|install|path|permission|enoent|eperm|access denied|what happened|do this next)/i.test(text);

  return {
    raw: text,
    summary: summary.trim(),
    steps,
    command,
    isTerminalLike,
  };
}
