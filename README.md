# 🖱️ Clicky Helper

A lightweight Windows desktop AI assistant built with **Tauri 2 + React + TypeScript**.
Inspired by Clicky — a small always-on-top overlay that lets you ask questions, grab screenshots, and copy commands without leaving your workflow.

---

## Project Structure

```
windows-clicky-helper/
├── src/                    # React + TypeScript frontend
│   ├── App.tsx             # Main UI (prompt, screenshot, ask, response, copy)
│   ├── App.css             # Dark-theme UI styles
│   ├── main.tsx            # React entry point
│   └── index.css           # Global reset
├── src-tauri/              # Rust / Tauri backend
│   ├── src/
│   │   ├── lib.rs          # Tauri commands: ask_ai, capture_screenshot
│   │   └── main.rs         # Entry point (sets windows_subsystem)
│   ├── tauri.conf.json     # App config (window size, title, bundle)
│   ├── Cargo.toml          # Rust dependencies
│   └── build.rs            # Tauri build script
├── vite.config.ts          # Vite config tuned for Tauri
├── package.json            # Node scripts incl. tauri:dev / tauri:build
└── README.md               # ← you are here
```

---

## UI Features (implemented)

| Element | Status |
|---|---|
| Title / header | ✅ "🖱️ Clicky Helper" gradient |
| Textarea prompt | ✅ Multi-line, Ctrl+Enter shortcut |
| Screenshot button | ⚠️ Placeholder (see wiring below) |
| Ask button | ✅ Calls `ask_ai` (placeholder impl) |
| Response panel | ✅ Shown after Ask |
| Copy command button | ✅ Copies response to clipboard |

---

## Setup & Development

### Prerequisites

**On Windows (target machine):**

```powershell
# 1. Install Rust
winget install Rustlang.Rustup
rustup default stable
rustup target add x86_64-pc-windows-msvc

# 2. Install Node 18+
winget install OpenJS.NodeJS

# 3. Install Visual Studio Build Tools (required for MSVC)
winget install Microsoft.VisualStudio.2022.BuildTools
# In the VS installer, select: "Desktop development with C++"

# 4. Install WebView2 (usually pre-installed on Win10 21H2+ / Win11)
# If missing: https://developer.microsoft.com/microsoft-edge/webview2/
```

**On Linux/macOS (cross-compile or local dev):**

```bash
# WebKit2GTK (Linux)
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

# macOS
xcode-select --install
```

### Install & Run

```bash
# Install JS deps
npm install

# Dev mode (hot-reload)
npm run tauri:dev

# Production build (outputs .exe / .msi on Windows)
npm run tauri:build
```

---

## Wiring Up Real Functionality

### 1. AI / LLM Integration

In `src-tauri/src/lib.rs`, replace `ask_ai`:

```rust
// Example: call local Ollama
#[tauri::command]
pub async fn ask_ai(prompt: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let res = client
        .post("http://localhost:11434/api/generate")
        .json(&serde_json::json!({ "model": "llama3", "prompt": prompt, "stream": false }))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let body: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(body["response"].as_str().unwrap_or("").to_string())
}
```

Add `reqwest` to `Cargo.toml`:
```toml
reqwest = { version = "0.12", features = ["json"] }
tokio = { version = "1", features = ["full"] }
```

### 2. Screenshot

Install the Tauri screenshot plugin:

```bash
cargo add tauri-plugin-screenshot
```

Or use an OS-level call via `tauri-plugin-shell`:

```rust
#[tauri::command]
pub async fn capture_screenshot(app: tauri::AppHandle) -> Result<String, String> {
    tauri_plugin_shell::ShellExt::shell(&app)
        .command("powershell")
        .args(["-c", "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen"])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok("screenshot.png".into())
}
```

### 3. Always-on-top / Overlay Mode

In `tauri.conf.json` windows array:

```json
{
  "alwaysOnTop": true,
  "decorations": false,
  "transparent": true,
  "shadow": true
}
```

### 4. Global Hotkey to Show/Hide

Add `tauri-plugin-global-shortcut` to `Cargo.toml` and register a shortcut (e.g. `Alt+Space`).

---

## Blockers on This Linux Build Host

- **No WebView2**: The app targets Windows. Cross-compilation from Linux to Windows requires `x86_64-pc-windows-msvc` toolchain + `xwin` linker setup, OR use a Windows machine / GitHub Actions CI.
- **Icons**: `src-tauri/icons/` is empty. Generate icons with `npm run tauri icon <source.png>` once the CLI is fully set up.

## Quick Cross-Compile Path (Linux → Windows)

```bash
# Install cross-compilation target
rustup target add x86_64-pc-windows-msvc

# Install xwin for MSVC headers
cargo install xwin
xwin --accept-license splat --output ~/.xwin

# Build
CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_LINKER=lld-link \
  XWIN_ARCH=x86_64 \
  npm run tauri:build -- --target x86_64-pc-windows-msvc
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Shell | Tauri 2 (Rust) |
| UI | React 19 + TypeScript |
| Bundler | Vite 8 |
| Styling | Plain CSS (dark theme, no deps) |
| AI (placeholder) | Tauri `invoke()` → Rust command |
