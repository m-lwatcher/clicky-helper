export type Provider = "gemini" | "groq" | "openai" | "custom";

export type AppSettings = {
  hasCompletedOnboarding: boolean;
  provider: Provider;
  apiKey: string;
  model: string;
  baseUrl: string;
};

const SETTINGS_KEY = "clicky-helper-settings-v1";

export const DEFAULT_SETTINGS: AppSettings = {
  hasCompletedOnboarding: false,
  provider: "gemini",
  apiKey: "",
  model: "gemini-3-flash-preview",
  baseUrl: "",
};

export function loadSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function clearSettings(): void {
  window.localStorage.removeItem(SETTINGS_KEY);
}

export function providerDefaults(provider: Provider): Pick<AppSettings, "model" | "baseUrl"> {
  if (provider === "gemini") return { model: "gemini-3-flash-preview", baseUrl: "" };
  if (provider === "groq") return { model: "llama-3.3-70b-versatile", baseUrl: "https://api.groq.com/openai/v1" };
  if (provider === "openai") return { model: "gpt-4o-mini", baseUrl: "https://api.openai.com/v1" };
  return { model: "", baseUrl: "" };
}
