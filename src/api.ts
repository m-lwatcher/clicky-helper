// api.ts — real AI call via in-app settings, with env fallback for development

import type { AppSettings } from "./settings";

function envApiKey(): string {
  return import.meta.env.VITE_API_KEY ?? "";
}

function envGeminiKey(): string {
  return import.meta.env.VITE_GEMINI_KEY ?? "";
}

function resolveBase(settings?: AppSettings): string {
  if (settings?.baseUrl) return settings.baseUrl;
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  const key = settings?.apiKey || envApiKey();
  if (settings?.provider === "groq" || key.startsWith("gsk_")) return "https://api.groq.com/openai/v1";
  if (settings?.provider === "openai" || key.startsWith("sk-")) return "https://api.openai.com/v1";
  return "https://api.openai.com/v1";
}

function resolveModel(settings?: AppSettings): string {
  if (settings?.model) return settings.model;
  if (import.meta.env.VITE_MODEL) return import.meta.env.VITE_MODEL;
  const key = settings?.apiKey || envApiKey();
  if (settings?.provider === "groq" || key.startsWith("gsk_")) return "llama-3.3-70b-versatile";
  if (settings?.provider === "gemini") return "gemini-3-flash-preview";
  return "gpt-4o-mini";
}

const SYSTEM_PROMPT = [
  "You are Quirky Help — a concise Windows desktop assistant.",
  "You help the user understand screenshots, explain terminal errors, suggest PowerShell or CMD commands, and guide setup steps.",
  "Be practical, calm, and direct.",
  "For Windows command/setup questions, format the answer in exactly these sections:",
  "What happened",
  "Where to run this",
  "What it does",
  "Do this next",
  "Command",
  "Expected result",
  "If it fails",
  "Keep each section short and useful.",
  "If you suggest a command, put exactly one best command in a ```powershell code block.",
  "Always say where the user should run the command: PowerShell, Developer PowerShell, CMD, project folder, or Admin terminal if needed.",
  "Do not repeat an old port-fix command unless the current screenshot or prompt clearly shows that exact issue.",
  "Prefer the safest next step over the fanciest one.",
].join(" ");

export type AskOptions = {
  prompt: string;
  screenshotDataUrl?: string;
  settings?: AppSettings;
};

export type StructuredResponse = {
  raw: string;
  summary: string;
  where: string;
  whatItDoes: string;
  steps: string[];
  command: string;
  expected: string;
  ifFails: string;
  isTerminalLike: boolean;
};

async function askGemini({ prompt, screenshotDataUrl, settings }: AskOptions): Promise<string> {
  const model = resolveModel(settings);
  const key = settings?.apiKey || envGeminiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const parts: unknown[] = [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }];

  if (screenshotDataUrl) {
    const [header, b64data] = screenshotDataUrl.split(",");
    const mimeType = header.replace("data:", "").replace(";base64", "");
    parts.push({ inlineData: { mimeType, data: b64data } });
  }

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 1000 },
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

async function askOpenAICompat({ prompt, screenshotDataUrl, settings }: AskOptions): Promise<string> {
  const userContent: unknown[] = screenshotDataUrl
    ? [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: screenshotDataUrl } },
      ]
    : [{ type: "text", text: prompt }];

  const apiKey = settings?.apiKey || envApiKey();
  const baseUrl = resolveBase(settings);
  const model = resolveModel(settings);
  const activeModel = screenshotDataUrl && (settings?.provider === "groq" || apiKey.startsWith("gsk_"))
    ? "llama-3.2-11b-vision-preview"
    : model;

  const body = {
    model: activeModel,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  };

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
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
  const settings = opts.settings;
  const key = settings?.apiKey || envApiKey() || envGeminiKey();
  if (!key) {
    throw new Error("No API key set. Open Settings and add a Gemini, Groq, OpenAI, or custom provider key.");
  }

  if (settings?.provider === "gemini" || (opts.screenshotDataUrl && envGeminiKey() && !settings?.apiKey)) {
    return askGemini(opts);
  }

  return askOpenAICompat(opts);
}

export async function testConnection(settings: AppSettings): Promise<string> {
  const reply = await askHelper({
    prompt: "Reply with exactly: connection ok",
    settings,
  });
  return reply;
}

export function extractCommand(text: string): string {
  const match = text.match(/```(?:powershell|bash|cmd|sh)?\n([\s\S]*?)```/i);
  return match?.[1]?.trim() ?? "";
}

function cleanLine(line: string): string {
  return line.replace(/^[-*•\d.)\s]+/, "").trim();
}

function extractSection(text: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\\s*:?\\s*([\\s\\S]*?)(?=\\n[A-Z][^\\n]{0,40}:?\\s*$|$)`, "im");
  const match = text.match(re);
  return match?.[1]?.trim() ?? "";
}

export function parseStructuredResponse(text: string): StructuredResponse {
  const command = extractCommand(text);
  const withoutCode = text.replace(/```[\s\S]*?```/g, "").trim();

  const summary = extractSection(withoutCode, "What happened") || withoutCode.split("\n\n")[0] || withoutCode;
  const where = extractSection(withoutCode, "Where to run this");
  const whatItDoes = extractSection(withoutCode, "What it does");
  const next = extractSection(withoutCode, "Do this next");
  const expected = extractSection(withoutCode, "Expected result");
  const ifFails = extractSection(withoutCode, "If it fails");
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

  const isTerminalLike = /(powershell|cmd|terminal|npm|node|install|path|permission|enoent|eperm|access denied|where to run this|expected result|if it fails)/i.test(text);

  return {
    raw: text,
    summary: summary.trim(),
    where: where.trim(),
    whatItDoes: whatItDoes.trim(),
    steps,
    command,
    expected: expected.trim(),
    ifFails: ifFails.trim(),
    isTerminalLike,
  };
}
