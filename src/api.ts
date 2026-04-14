// api.ts — real AI call via OpenAI-compatible endpoint + Gemini vision fallback
// Uses VITE_API_KEY + VITE_GEMINI_KEY + VITE_API_BASE_URL from .env.local

function resolveBase(): string {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  const key = import.meta.env.VITE_API_KEY ?? "";
  if (key.startsWith("gsk_"))    return "https://api.groq.com/openai/v1";
  if (key.startsWith("sk-ant-")) return "https://api.anthropic.com/v1";
  return "https://api.openai.com/v1";
}

function resolveModel(): string {
  if (import.meta.env.VITE_MODEL) return import.meta.env.VITE_MODEL;
  const key = import.meta.env.VITE_API_KEY ?? "";
  if (key.startsWith("gsk_")) return "llama-3.3-70b-versatile";
  return "gpt-4o-mini";
}

const BASE_URL   = resolveBase();
const API_KEY    = import.meta.env.VITE_API_KEY    ?? "";
const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY ?? "";
const MODEL      = resolveModel();

const SYSTEM_PROMPT =
  "You are Clicky Helper — a concise Windows desktop assistant. " +
  "You help the user understand what is on screen, suggest PowerShell / CMD commands, " +
  "explain errors, and guide setup steps. " +
  "Keep answers short and practical. " +
  "When suggesting a command, wrap it in a ```powershell block so it is easy to copy.";

export type AskOptions = {
  prompt: string;
  screenshotDataUrl?: string;
};

// ── Gemini vision path ────────────────────────────────────────────────────────
async function askGemini({ prompt, screenshotDataUrl }: AskOptions): Promise<string> {
  const model = "gemini-3-flash-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;

  // Build parts — text first, then optional image
  const parts: unknown[] = [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }];

  if (screenshotDataUrl) {
    // data URL format: "data:<mimeType>;base64,<data>"
    const [header, b64data] = screenshotDataUrl.split(",");
    const mimeType = header.replace("data:", "").replace(";base64", "");
    parts.push({ inlineData: { mimeType, data: b64data } });
  }

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
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

// ── OpenAI-compatible path ────────────────────────────────────────────────────
async function askOpenAICompat({ prompt, screenshotDataUrl }: AskOptions): Promise<string> {
  const userContent: unknown[] = screenshotDataUrl
    ? [
        { type: "text",      text: prompt },
        { type: "image_url", image_url: { url: screenshotDataUrl } },
      ]
    : [{ type: "text", text: prompt }];

  // Groq vision model when image attached
  const activeModel = screenshotDataUrl && API_KEY.startsWith("gsk_")
    ? "llama-3.2-11b-vision-preview"
    : MODEL;

  const body = {
    model: activeModel,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: userContent },
    ],
    temperature: 0.4,
    max_tokens: 800,
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

// ── Main entry point ──────────────────────────────────────────────────────────
// Route: image + Gemini key → Gemini; everything else → OpenAI-compat
export async function askHelper(opts: AskOptions): Promise<string> {
  if (!API_KEY && !GEMINI_KEY) {
    throw new Error("No API key set. Add VITE_API_KEY or VITE_GEMINI_KEY to .env.local");
  }

  if (opts.screenshotDataUrl && GEMINI_KEY) {
    return askGemini(opts);
  }

  return askOpenAICompat(opts);
}

// Extract the first ```powershell / ```bash / ``` code block from the response
export function extractCommand(text: string): string {
  const match = text.match(/```(?:powershell|bash|cmd|sh)?\n([\s\S]*?)```/i);
  return match?.[1]?.trim() ?? "";
}
