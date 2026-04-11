// api.ts — real AI call via OpenAI-compatible endpoint
// Uses VITE_API_KEY + VITE_API_BASE_URL from .env.local

// Auto-detect provider from key prefix if no explicit base URL is set
function resolveBase(): string {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  const key = import.meta.env.VITE_API_KEY ?? "";
  if (key.startsWith("gsk_"))    return "https://api.groq.com/openai/v1";   // Groq
  if (key.startsWith("sk-ant-")) return "https://api.anthropic.com/v1";     // Anthropic
  return "https://api.openai.com/v1";                                        // OpenAI default
}

function resolveModel(): string {
  if (import.meta.env.VITE_MODEL) return import.meta.env.VITE_MODEL;
  const key = import.meta.env.VITE_API_KEY ?? "";
  if (key.startsWith("gsk_")) return "llama-3.3-70b-versatile"; // Groq free tier, fast
  return "gpt-4o-mini";
}

const BASE_URL = resolveBase();
const API_KEY  = import.meta.env.VITE_API_KEY ?? "";
const MODEL    = resolveModel();

export type AskOptions = {
  prompt: string;
  screenshotDataUrl?: string; // base64 data URL if screenshot attached
};

export async function askHelper({ prompt, screenshotDataUrl }: AskOptions): Promise<string> {
  if (!API_KEY) {
    throw new Error("No API key set. Add VITE_API_KEY to .env.local");
  }

  const userContent: unknown[] = screenshotDataUrl
    ? [
        { type: "text",      text: prompt },
        { type: "image_url", image_url: { url: screenshotDataUrl } },
      ]
    : [{ type: "text", text: prompt }];

  const body = {
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are Clicky Helper — a concise Windows desktop assistant. " +
          "You help the user understand what is on screen, suggest PowerShell / CMD commands, " +
          "explain errors, and guide setup steps. " +
          "Keep answers short and practical. " +
          "When suggesting a command, wrap it in a ```powershell block so it is easy to copy.",
      },
      { role: "user", content: userContent },
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

// Extract the first ```powershell / ```bash / ``` code block from the response
export function extractCommand(text: string): string {
  const match = text.match(/```(?:powershell|bash|cmd|sh)?\n([\s\S]*?)```/i);
  return match?.[1]?.trim() ?? "";
}
