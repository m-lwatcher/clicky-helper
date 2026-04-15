import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { askHelper, extractCommand, parseStructuredResponse, testConnection } from "./api";
import {
  clearSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  providerDefaults,
  saveSettings,
  type AppSettings,
  type Provider,
} from "./settings";

type Suggestion = {
  title: string;
  prompt: string;
};

const suggestions: Suggestion[] = [
  {
    title: "Explain this error",
    prompt: "Explain this Windows or terminal error in plain English, tell me what likely caused it, where I should run the fix, and give me the safest next step.",
  },
  {
    title: "What command next?",
    prompt: "Look at this screenshot and tell me the exact next PowerShell command I should run, where to run it, and what should happen after.",
  },
  {
    title: "Fix this install issue",
    prompt: "Help me fix this install/setup problem. Tell me where to run the command, what it does, the exact command, expected result, and what to do if it fails.",
  },
  {
    title: "Summarize in plain English",
    prompt: "Summarize what this screen is telling me in plain English and tell me what matters most.",
  },
  {
    title: "Write a PowerShell command",
    prompt: "Write a safe PowerShell command for what I need, explain what it does, where to run it, and what result I should expect.",
  },
  {
    title: "Draft a reply",
    prompt: "Draft a short, friendly reply telling someone I reproduced the issue and I am collecting logs now.",
  },
];

const commandTips = [
  "Tip: attach a screenshot for much better answers.",
  "PowerShell commands are copied only — nothing auto-runs.",
  "If a command needs Admin, Quirky Help should say so in 'Where to run this'.",
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [draftSettings, setDraftSettings] = useState<AppSettings>(() => loadSettings());
  const [testStatus, setTestStatus] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAsk = prompt.trim().length > 0;
  const needsSetup = !settings.hasCompletedOnboarding || !settings.apiKey;

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

  const updateProvider = (provider: Provider) => {
    const defaults = providerDefaults(provider);
    setDraftSettings((prev) => ({
      ...prev,
      provider,
      model: prev.model || defaults.model,
      baseUrl: provider === "custom" ? prev.baseUrl : defaults.baseUrl,
    }));
  };

  const saveDraftSettings = () => {
    const next = { ...draftSettings, hasCompletedOnboarding: true };
    saveSettings(next);
    setSettings(next);
    setDraftSettings(next);
    setSettingsOpen(false);
    setTestStatus("Settings saved locally.");
  };

  const resetSavedSettings = () => {
    clearSettings();
    setSettings(DEFAULT_SETTINGS);
    setDraftSettings(DEFAULT_SETTINGS);
    setSettingsOpen(true);
    setTestStatus("Saved settings cleared.");
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus("");
    try {
      const result = await testConnection(draftSettings);
      if (/connection ok/i.test(result)) {
        setTestStatus("✅ Connection works.");
      } else {
        setTestStatus(`⚠️ Connected, but got: ${result}`);
      }
    } catch (err) {
      setTestStatus(`❌ ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleAsk = async () => {
    if (!canAsk || needsSetup) return;
    setIsLoading(true);
    setResponse("");
    setError("");
    try {
      const result = await askHelper({ prompt, screenshotDataUrl, settings });
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

  if (needsSetup) {
    return (
      <div className="shell">
        <div className="app">
          <section className="card section-block onboarding-card">
            <p className="eyebrow">Welcome</p>
            <h1>🖱️ Quirky Help</h1>
            <p className="subtitle">
              Quirky Help explains screenshots, terminal errors, and Windows commands in plain English.
              It does not auto-run anything.
            </p>

            <div className="onboarding-list">
              <div className="mini-card">
                <span className="mini-label">What it does</span>
                <p className="summary-text">Turns messy setup problems into clearer next steps and copyable commands.</p>
              </div>
              <div className="mini-card">
                <span className="mini-label">Privacy</span>
                <p className="summary-text">Your screenshots and prompts go only to the AI provider you choose.</p>
              </div>
              <div className="mini-card">
                <span className="mini-label">Trust</span>
                <p className="summary-text">Commands are suggestions only. Review before running.</p>
              </div>
            </div>

            <div className="settings-grid">
              <label>
                <span className="mini-label">Provider</span>
                <select
                  value={draftSettings.provider}
                  onChange={(e) => updateProvider(e.target.value as Provider)}
                  className="settings-input"
                >
                  <option value="gemini">Gemini</option>
                  <option value="groq">Groq</option>
                  <option value="openai">OpenAI</option>
                  <option value="custom">Custom OpenAI-compatible</option>
                </select>
              </label>

              <label>
                <span className="mini-label">API key</span>
                <input
                  className="settings-input"
                  type="password"
                  placeholder="Paste your API key"
                  value={draftSettings.apiKey}
                  onChange={(e) => setDraftSettings((prev) => ({ ...prev, apiKey: e.target.value }))}
                />
              </label>

              <label>
                <span className="mini-label">Model</span>
                <input
                  className="settings-input"
                  type="text"
                  placeholder="Optional model override"
                  value={draftSettings.model}
                  onChange={(e) => setDraftSettings((prev) => ({ ...prev, model: e.target.value }))}
                />
              </label>

              <label>
                <span className="mini-label">Base URL</span>
                <input
                  className="settings-input"
                  type="text"
                  placeholder="Optional base URL"
                  value={draftSettings.baseUrl}
                  onChange={(e) => setDraftSettings((prev) => ({ ...prev, baseUrl: e.target.value }))}
                />
              </label>
            </div>

            <div className="action-row">
              <button className="btn btn-secondary" onClick={handleTestConnection} disabled={isTesting || !draftSettings.apiKey}>
                {isTesting ? "Testing..." : "Test connection"}
              </button>
              <button className="btn btn-primary" onClick={saveDraftSettings} disabled={!draftSettings.apiKey}>
                Save and continue
              </button>
            </div>

            {testStatus && <p className="meta">{testStatus}</p>}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="app">
        <header className="hero card">
          <div>
            <p className="eyebrow">Windows desktop helper</p>
            <h1>🖱️ Quirky Help</h1>
            <p className="subtitle">
              A small polished launcher for screenshot-assisted questions,
              commands, and quick troubleshooting.
            </p>
          </div>
          <div className="hero-actions">
            <div className="hero-badge">{settings.provider.toUpperCase()} configured</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setAboutOpen((v) => !v)}>
              {aboutOpen ? "Close about" : "About"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSettingsOpen((v) => !v)}>
              {settingsOpen ? "Close settings" : "Settings"}
            </button>
          </div>
        </header>

        {aboutOpen && (
          <section className="card section-block">
            <div className="section-heading">
              <div>
                <p className="label">About</p>
                <h2>Trust, privacy, and version</h2>
              </div>
              <span className="meta">Quirky Help v0.2.0</span>
            </div>

            <div className="two-col-grid">
              <div className="mini-card">
                <span className="mini-label">What Quirky Help sends</span>
                <p className="summary-text">
                  Quirky Help sends your prompts and screenshots only to the AI provider you choose in Settings.
                </p>
              </div>

              <div className="mini-card">
                <span className="mini-label">What Quirky Help stores</span>
                <p className="summary-text">
                  Your provider choice, API key, model, and base URL are stored locally on this device so the app can reopen ready to use.
                </p>
              </div>

              <div className="mini-card">
                <span className="mini-label">Safety</span>
                <p className="summary-text">
                  Quirky Help never auto-runs commands. It explains, suggests, and lets you copy commands manually.
                </p>
              </div>

              <div className="mini-card">
                <span className="mini-label">Sensitive screenshots</span>
                <p className="summary-text">
                  Treat screenshots like you would any file sent to an AI provider. Avoid sharing secrets, account numbers, or private tokens unless you mean to.
                </p>
              </div>
            </div>
          </section>
        )}

        {settingsOpen && (
          <section className="card section-block">
            <div className="section-heading">
              <div>
                <p className="label">Settings</p>
                <h2>Provider and privacy</h2>
              </div>
              <span className="meta">Stored locally on this device</span>
            </div>

            <div className="settings-grid">
              <label>
                <span className="mini-label">Provider</span>
                <select
                  value={draftSettings.provider}
                  onChange={(e) => updateProvider(e.target.value as Provider)}
                  className="settings-input"
                >
                  <option value="gemini">Gemini</option>
                  <option value="groq">Groq</option>
                  <option value="openai">OpenAI</option>
                  <option value="custom">Custom OpenAI-compatible</option>
                </select>
              </label>

              <label>
                <span className="mini-label">API key</span>
                <input
                  className="settings-input"
                  type="password"
                  value={draftSettings.apiKey}
                  onChange={(e) => setDraftSettings((prev) => ({ ...prev, apiKey: e.target.value }))}
                />
              </label>

              <label>
                <span className="mini-label">Model</span>
                <input
                  className="settings-input"
                  type="text"
                  value={draftSettings.model}
                  onChange={(e) => setDraftSettings((prev) => ({ ...prev, model: e.target.value }))}
                />
              </label>

              <label>
                <span className="mini-label">Base URL</span>
                <input
                  className="settings-input"
                  type="text"
                  value={draftSettings.baseUrl}
                  onChange={(e) => setDraftSettings((prev) => ({ ...prev, baseUrl: e.target.value }))}
                />
              </label>
            </div>

            <div className="mini-card">
              <span className="mini-label">Privacy</span>
              <p className="summary-text">
                Screenshots and prompts are sent only to the provider you configure. Quirky Help does not auto-run commands.
              </p>
            </div>

            <div className="action-row">
              <button className="btn btn-secondary" onClick={handleTestConnection} disabled={isTesting || !draftSettings.apiKey}>
                {isTesting ? "Testing..." : "Test connection"}
              </button>
              <button className="btn btn-secondary" onClick={resetSavedSettings}>
                Reset settings
              </button>
              <button className="btn btn-primary" onClick={saveDraftSettings} disabled={!draftSettings.apiKey}>
                Save settings
              </button>
            </div>

            {testStatus && <p className="meta">{testStatus}</p>}
          </section>
        )}

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
                <button className="btn btn-secondary" onClick={handleScreenshot} title="Attach the current screen context">
                  {hasScreenshot ? "✅ Replace screenshot" : "📸 Attach screenshot"}
                </button>

                <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} title="Load image from disk">
                  📂 Load image
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFilePick} />

                {hasScreenshot && (
                  <button className="btn btn-ghost btn-sm remove-btn" onClick={handleRemove}>
                    ✕ Remove
                  </button>
                )}

                <button className="btn btn-primary" onClick={handleAsk} disabled={isLoading || !canAsk}>
                  {isLoading ? "⏳ Thinking..." : "✨ Ask helper"}
                </button>
              </div>

              <div className="screenshot-status-row">
                <span className="meta">{screenshotLabel}</span>
                {showPasteHint && <span className="paste-hint">✅ Image pasted</span>}
              </div>

              <div className="tips-list">
                {commandTips.map((tip) => (
                  <span key={tip} className="tip-pill">{tip}</span>
                ))}
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
                <button className="btn btn-ghost btn-sm" onClick={() => handleCopy(response, "response")} disabled={!response}>
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
                    <span>Check your provider settings or network connection.</span>
                  </div>
                ) : response ? (
                  <div className="structured-response">
                    <div className="mini-card">
                      <div className="mini-card-head">
                        <span className="mini-label">What happened</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleCopy(parsed?.summary || "", "summary")} disabled={!parsed?.summary}>
                          {copied === "summary" ? "✅ Copied" : "📋 Copy summary"}
                        </button>
                      </div>
                      <p className="summary-text">{parsed?.summary || response}</p>
                    </div>

                    {(parsed?.where || parsed?.whatItDoes) && (
                      <div className="two-col-grid">
                        {parsed?.where && (
                          <div className="mini-card">
                            <div className="mini-card-head">
                              <span className="mini-label">Where to run this</span>
                            </div>
                            <p className="summary-text">{parsed.where}</p>
                          </div>
                        )}

                        {parsed?.whatItDoes && (
                          <div className="mini-card">
                            <div className="mini-card-head">
                              <span className="mini-label">What it does</span>
                            </div>
                            <p className="summary-text">{parsed.whatItDoes}</p>
                          </div>
                        )}
                      </div>
                    )}

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
                        <button className="btn btn-primary btn-sm" onClick={() => handleCopy(activeCommand, "command")} disabled={!activeCommand}>
                          {copied === "command" ? "✅ Copied" : "📋 Copy command"}
                        </button>
                      </div>
                      {activeCommand ? (
                        <>
                          <pre className="command-block">{activeCommand}</pre>
                          <p className="command-note">Commands are suggestions only. Review before running.</p>
                        </>
                      ) : (
                        <p className="meta">No command extracted from this reply.</p>
                      )}
                    </div>

                    {(parsed?.expected || parsed?.ifFails) && (
                      <div className="two-col-grid">
                        {parsed?.expected && (
                          <div className="mini-card">
                            <div className="mini-card-head">
                              <span className="mini-label">Expected result</span>
                            </div>
                            <p className="summary-text">{parsed.expected}</p>
                          </div>
                        )}

                        {parsed?.ifFails && (
                          <div className="mini-card">
                            <div className="mini-card-head">
                              <span className="mini-label">If it fails</span>
                            </div>
                            <p className="summary-text">{parsed.ifFails}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <details className="raw-details">
                      <summary>Show full reply</summary>
                      <pre className="response-text">{response}</pre>
                    </details>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No response yet.</p>
                    <span>Ask a question or attach a screenshot to get started.</span>
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
