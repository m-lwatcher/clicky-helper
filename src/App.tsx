import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { askHelper, extractCommand } from "./api";

type Suggestion = {
  title: string;
  prompt: string;
};

const suggestions: Suggestion[] = [
  {
    title: "Explain an error",
    prompt:
      "I clicked a button in my Windows app and now it says 'Access is denied'. Explain likely causes and what to try next.",
  },
  {
    title: "Write a PowerShell command",
    prompt:
      "Write a PowerShell command to list large files in my Downloads folder and explain what it does.",
  },
  {
    title: "Summarize what's on screen",
    prompt:
      "Based on the screenshot, summarize what this app is asking me to do and suggest the safest next step.",
  },
  {
    title: "Draft a reply",
    prompt:
      "Draft a short, friendly reply telling my coworker I reproduced the issue and I'm collecting logs now.",
  },
];

const FALLBACK_COMMAND =
  "Get-ChildItem $env:USERPROFILE\\Downloads -File | Sort-Object Length -Descending | Select-Object -First 10 Name,@{N='SizeMB';E={[math]::Round($_.Length/1MB,2)}}";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function App() {
  const [prompt, setPrompt] = useState(suggestions[0].prompt);
  const [response, setResponse] = useState("");
  const [command, setCommand] = useState(FALLBACK_COMMAND);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<"response" | "command" | null>(null);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | undefined>(undefined);
  const [screenshotLabel, setScreenshotLabel] = useState("No screenshot attached yet");
  const [pasteHint, setPasteHint] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasScreenshot = !!screenshotDataUrl;
  const canAsk = prompt.trim().length > 0;

  // ── Attach helpers ───────────────────────────────────────────────────────
  const attachImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const dataUrl = await readFileAsDataUrl(file);
    setScreenshotDataUrl(dataUrl);
    setScreenshotLabel(`${file.name || "image"} · ${(file.size / 1024).toFixed(0)} KB`);
  }, []);

  const clearScreenshot = useCallback(() => {
    setScreenshotDataUrl(undefined);
    setScreenshotLabel("No screenshot attached yet");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // ── Mock capture (Tauri hook point) ─────────────────────────────────────
  const handleScreenshotCapture = () => {
    // TODO: wire to Tauri invoke('capture_screenshot') and call attachImage()
    // For now just show a placeholder to indicate the slot is ready
    setScreenshotDataUrl("placeholder");
    setScreenshotLabel("Screenshot captured · just now");
  };

  // ── Paste anywhere in the app ────────────────────────────────────────────
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imgItem = items.find((i) => i.type.startsWith("image/"));
      if (!imgItem) return;
      e.preventDefault();
      const file = imgItem.getAsFile();
      if (file) {
        await attachImage(file);
        setPasteHint(true);
        setTimeout(() => setPasteHint(false), 2000);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [attachImage]);

  // ── File picker ──────────────────────────────────────────────────────────
  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await attachImage(file);
  };

  // ── Ask ──────────────────────────────────────────────────────────────────
  const handleAsk = async () => {
    if (!canAsk) return;
    setIsLoading(true);
    setResponse("");
    setError("");
    try {
      const imageUrl = screenshotDataUrl === "placeholder" ? undefined : screenshotDataUrl;
      const result = await askHelper({ prompt, screenshotDataUrl: imageUrl });
      setResponse(result);
      const cmd = extractCommand(result);
      if (cmd) setCommand(cmd);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (value: string, type: "response" | "command") => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="shell">
      <div className="app">
        <header className="hero card">
          <div>
            <p className="eyebrow">Windows desktop helper</p>
            <h1>🖱️ Clicky Helper</h1>
            <p className="subtitle">
              A small polished launcher for screenshot-assisted questions,
              commands, and quick troubleshooting.
            </p>
          </div>
          <div className="hero-badge">Desktop build ready · Tauri + React</div>
        </header>

        <main className="layout">
          <section className="main-column">
            <section className="card section-block">
              <div className="section-heading">
                <div>
                  <p className="label">Ask</p>
                  <h2>Describe what you need</h2>
                </div>
                <span className="meta">Ctrl/Cmd + Enter to send</span>
              </div>

              <textarea
                id="prompt-input"
                className="prompt-textarea"
                placeholder="Describe the issue, paste an error, or ask for a command..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={7}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAsk();
                }}
              />

              <div className="action-row">
                {/* Screenshot capture button */}
                <button
                  className="btn btn-secondary"
                  onClick={handleScreenshotCapture}
                  title="Capture current screen"
                >
                  📸 {hasScreenshot ? "Replace screenshot" : "Capture screen"}
                </button>

                {/* Load from disk */}
                <button
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  title="Load image from disk"
                >
                  📂 Load image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFilePick}
                />

                {/* Remove screenshot — only shown when one is attached */}
                {hasScreenshot && (
                  <button
                    className="btn btn-ghost btn-sm remove-btn"
                    onClick={clearScreenshot}
                    title="Remove attached screenshot"
                  >
                    ✕ Remove
                  </button>
                )}

                <button
                  className="btn btn-primary"
                  onClick={handleAsk}
                  disabled={isLoading || !canAsk}
                >
                  {isLoading ? "⏳ Thinking..." : "✨ Ask helper"}
                </button>
              </div>

              {pasteHint && (
                <div className="paste-hint">✅ Image pasted and attached!</div>
              )}
            </section>

            <section className="card section-block">
              <div className="section-heading">
                <div>
                  <p className="label">Response</p>
                  <h2>Assistant output</h2>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleCopy(response, "response")}
                  disabled={!response}
                >
                  {copied === "response" ? "✅ Copied" : "📋 Copy reply"}
                </button>
              </div>

              <div className="response-panel">
                {isLoading ? (
                  <div className="loading-indicator">
                    <span className="spinner" />
                    <div>
                      <strong>Thinking through the request...</strong>
                      <p>Generating a simple answer and suggested command.</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="error-state">
                    <p>⚠️ {error}</p>
                    <span>Check your .env.local API key or network connection.</span>
                  </div>
                ) : response ? (
                  <pre className="response-text">{response}</pre>
                ) : (
                  <div className="empty-state">
                    <p>No response yet.</p>
                    <span>Set VITE_API_KEY in .env.local, then ask a question.</span>
                  </div>
                )}
              </div>
            </section>
          </section>

          <aside className="side-column">
            <section className="card section-block">
              <div className="section-heading compact">
                <div>
                  <p className="label">Screenshot preview</p>
                  <h2>Context panel</h2>
                </div>
              </div>

              <div className={`preview-frame ${hasScreenshot ? "is-filled" : ""}`}>
                {/* Show real image thumbnail if we have one */}
                {screenshotDataUrl && screenshotDataUrl !== "placeholder" ? (
                  <img
                    src={screenshotDataUrl}
                    alt="Attached screenshot"
                    className="preview-thumbnail"
                  />
                ) : (
                  <div className="preview-window">
                    <div className="preview-toolbar">
                      <span /><span /><span />
                    </div>
                    <div className="preview-content">
                      {hasScreenshot ? (
                        <>
                          <div className="preview-line wide" />
                          <div className="preview-line" />
                          <div className="preview-card-grid">
                            <div className="preview-mini-card accent" />
                            <div className="preview-mini-card" />
                            <div className="preview-mini-card" />
                          </div>
                          <div className="preview-chart" />
                        </>
                      ) : (
                        <div className="preview-placeholder">
                          <span className="preview-icon">🖼️</span>
                          <p>Screenshot preview</p>
                          <span>Capture, load from disk, or paste (Ctrl+V) an image.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="status-row">
                <span className={`status-dot ${hasScreenshot ? "active" : ""}`} />
                <span>{screenshotLabel}</span>
                {hasScreenshot && (
                  <button
                    className="btn btn-ghost btn-xs remove-btn"
                    onClick={clearScreenshot}
                    style={{ marginLeft: "auto" }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </section>

            <section className="card section-block">
              <div className="section-heading compact">
                <div>
                  <p className="label">Suggested command</p>
                  <h2>Copy and run manually</h2>
                </div>
              </div>

              <div className="command-box">
                <code>{command}</code>
              </div>
              <button
                className="btn btn-secondary full-width"
                onClick={() => handleCopy(command, "command")}
              >
                {copied === "command" ? "✅ Command copied" : "📋 Copy command"}
              </button>
            </section>

            <section className="card section-block">
              <div className="section-heading compact">
                <div>
                  <p className="label">Prompts</p>
                  <h2>Try one of these</h2>
                </div>
              </div>

              <div className="suggestion-list">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.title}
                    className="suggestion-btn"
                    onClick={() => setPrompt(suggestion.prompt)}
                  >
                    <strong>{suggestion.title}</strong>
                    <span>{suggestion.prompt}</span>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}

export default App;
