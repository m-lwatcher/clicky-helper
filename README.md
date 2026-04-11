# Clicky Helper

A polished Windows desktop AI helper built with **Tauri + React + TypeScript**.

It gives you a clean desktop window for:
- asking questions about errors or setup steps
- attaching screenshot context
- generating Windows-friendly command suggestions
- copying replies or commands without running anything automatically

## Current status

Working now:
- polished React UI
- Groq/OpenAI-compatible API wiring
- desktop wrapper via Tauri
- manual copy-command flow
- screenshot preview state in the UI

Still mock / next step:
- real native screenshot capture
- global hotkey / floating mini mode

## Requirements on Windows

Install these first:

```powershell
winget install Git.Git
winget install OpenJS.NodeJS.LTS
winget install Rustlang.Rustup
```

Then restart PowerShell and finish Rust setup:

```powershell
rustup default stable
```

If Tauri build tools are missing, install:

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
```

In the Visual Studio installer, enable **Desktop development with C++**.

## Run the desktop app

```powershell
git clone https://github.com/m-lwatcher/clicky-helper.git
cd clicky-helper
npm install --include=dev
```

Create `.env.local` in the project root:

```powershell
"VITE_API_KEY=your_key_here" | Out-File -Encoding utf8 .env.local
```

Recommended: use a Groq key (`gsk_...`) for fast, cheap testing.

Now launch the desktop app:

```powershell
npm run tauri:dev
```

## Build a Windows executable

```powershell
npm run tauri:build
```

Tauri will output a Windows app bundle / installer under `src-tauri/target/release/bundle/`.

## Environment variables

Supported in `.env.local`:

```env
VITE_API_KEY=...
VITE_API_BASE_URL=...
VITE_MODEL=...
```

Auto-detection currently works like this:
- `gsk_...` → Groq OpenAI-compatible endpoint
- `sk-...` → OpenAI
- `sk-ant-...` → Anthropic-compatible endpoint if configured

## Notes

- Nothing auto-runs on the machine.
- Commands are suggested and copied only.
- Screenshot capture should remain explicit user action only.
- If you just want the web version, `npm run dev` still works.
