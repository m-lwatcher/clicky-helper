import { useEffect, useMemo, useRef, useState } from "react";
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

function App() {
  const [prompt, setPrompt] = useState(suggestions[0].prompt);
  const [response, setResponse] = useState("");
  const [command, setCommand] = useState(FALLBACK_COMMAND);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<"response" | "command" | null>(null);
  const [hasScreenshot, setHasScreenshot] = useState(false);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAsk = prompt.trim().length > 0;

  const screenshotLabel = useMemo(() => {
    if (hasScreenshot) return "Screenshot attached · just now";
    return "No screenshot attached yet";
  }, [hasScreenshot]);

  // ── Paste image anywhere in the app ──────────────────────────────────────
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imgItem = items.find((i) => i.type.startsWith("image/"));
      if (!imgItem) return;
      e.preventDefault();
      const file = imgItem.getAsFile();
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshotDataUrl(reader.result as string);
        setHasScreenshot(true);
      };
      reader.readAsDataURL(file);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleAsk = async () => {
    if (!canAsk) return;
    setIsLoading(true);
    setResponse("");
    setError("");
    try {
      const result = await askHelper({ prompt, screenshotDataUrl });
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

  // ── Screenshot capture (mock — wire to Tauri later) ───────────────────────
  const handleScreenshot = () => {
    setHasScreenshot(true);
    setScreenshotDataUrl(undefined);
  };

  // ── Remove screenshot ─────────────────────────────────────────────────────
  const handleRemove = () => {
    setHasScreenshot(false);
    setScreenshotDataUrl(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Load from disk ────────────────────────────────────────────────────────
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotDataUrl(reader.result as string);
      setHasScreenshot(true);
    };
    reader.readAsDataURL(file);
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
                <button
                  className="btn btn-secondary"
                  onClick={handleScreenshot}
                  title="Attach the current screen context"
                >
                  {hasScreenshot ? "✅ Replace screenshot" : "📸 Attach screenshot"}
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

                {/* Remove — only visible when screenshot attached */}
                {hasScreenshot && (
                  <button className="btn btn-ghost btn-sm remove-btn" onClick={handleRemove}>
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
                <div className="preview-window">
                  <div className="preview-toolbar">
                    <span /><span /><span />
                  </div>
                  <div className="preview-content">
                    {screenshotDataUrl ? (
                      <img src={screenshotDataUrl} alt="Screenshot" className="preview-thumbnail" />
                    ) : hasScreenshot ? (
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
                        <span>Capture, load from disk, or paste (Ctrl+V).</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="status-row">
                <span className={`status-dot ${hasScreenshot ? "active" : ""}`} />
                <span>{screenshotLabel}</span>
                {hasScreenshot && (
                  <button
                    className="btn btn-ghost btn-sm remove-btn"
                    onClick={handleRemove}
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
