import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { askHelper, extractCommand, parseStructuredResponse } from "./api";

type Suggestion = {
  title: string;
  prompt: string;
};

const suggestions: Suggestion[] = [
  {
    title: "Explain this error",
    prompt: "Explain this Windows or terminal error in plain English, tell me what likely caused it, and give me the safest next step.",
  },
  {
    title: "What command next?",
    prompt: "Look at this screenshot and tell me the exact next PowerShell command I should run.",
  },
  {
    title: "Fix this install issue",
    prompt: "Help me fix this install/setup problem. Keep it practical and give me one best command to try next.",
  },
  {
    title: "Summarize in plain English",
    prompt: "Summarize what this screen is telling me in plain English and tell me what matters most.",
  },
  {
    title: "Write a PowerShell command",
    prompt: "Write a PowerShell command for what I need, explain what it does, and make sure it is safe to copy.",
  },
  {
    title: "Draft a reply",
    prompt: "Draft a short, friendly reply telling someone I reproduced the issue and I am collecting logs now.",
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
  const [copied, setCopied] = useState<"response" | "command" | "summary" | null>(null);
  const [hasScreenshot, setHasScreenshot] = useState(false);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | undefined>(undefined);
  const [showPasteHint, setShowPasteHint] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAsk = prompt.trim().length > 0;

  const screenshotLabel = useMemo(() => {
    if (hasScreenshot) return "Screenshot attached";
    return "No screenshot attached yet";
  }, [hasScreenshot]);

  const parsed = response ? parseStructuredResponse(response) : null;
  const activeCommand = parsed?.command || command;

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
        setShowPasteHint(true);
        window.setTimeout(() => setShowPasteHint(false), 1600);
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

  const handleScreenshot = () => {
    setHasScreenshot(true);
    setScreenshotDataUrl(undefined);
  };

  const handleRemove = () => {
    setHasScreenshot(false);
    setScreenshotDataUrl(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

  const handleCopy = async (value: string, type: "response" | "command" | "summary") => {
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

              <div className="suggestion-grid">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.title}
                    className="suggestion-chip"
                    onClick={() => setPrompt(suggestion.prompt)}
                  >
                    {suggestion.title}
                  </button>
                ))}
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

              <div className="screenshot-status-row">
                <span className="meta">{screenshotLabel}</span>
                {showPasteHint && <span className="paste-hint">✅ Image pasted</span>}
              </div>

              {screenshotDataUrl && (
                <div className="preview-wrap">
                  <img src={screenshotDataUrl} alt="Screenshot preview" className="preview-thumbnail" />
                </div>
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
                  <div className="structured-response">
                    <div className="mini-card">
                      <div className="mini-card-head">
                        <span className="mini-label">What happened</span>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleCopy(parsed?.summary || "", "summary")}
                          disabled={!parsed?.summary}
                        >
                          {copied === "summary" ? "✅ Copied" : "📋 Copy summary"}
                        </button>
                      </div>
                      <p className="summary-text">{parsed?.summary || response}</p>
                    </div>

                    {parsed?.steps && parsed.steps.length > 0 && (
                      <div className="mini-card">
                        <div className="mini-card-head">
                          <span className="mini-label">Do this next</span>
                        </div>
                        <ol className="steps-list">
                          {parsed.steps.map((step, index) => (
                            <li key={`${step}-${index}`}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    <div className="mini-card">
                      <div className="mini-card-head">
                        <span className="mini-label">Command</span>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleCopy(activeCommand, "command")}
                          disabled={!activeCommand}
                        >
                          {copied === "command" ? "✅ Copied" : "📋 Copy command"}
                        </button>
                      </div>
                      {activeCommand ? (
                        <pre className="command-block">{activeCommand}</pre>
                      ) : (
                        <p className="meta">No command extracted from this reply.</p>
                      )}
                    </div>

                    <details className="raw-details">
                      <summary>Show full reply</summary>
                      <pre className="response-text">{response}</pre>
                    </details>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No response yet.</p>
                    <span>Set VITE_API_KEY in .env.local, then ask a question.</span>
                  </div>
                )}
              </div>
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
