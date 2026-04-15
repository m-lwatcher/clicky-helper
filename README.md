# Clicky Helper

A polished Windows desktop AI helper built with **Tauri + React + TypeScript**.

It is designed for the exact kind of messy real-world setup work Katie keeps running into:
- terminal errors
- install problems
- screenshots that need explaining
- Windows commands that need plain-English context

## What it does

Clicky Helper lets you:
- paste or load a screenshot
- ask what went wrong
- get a safer next step
- copy a suggested command
- see **where to run it**, **what it does**, **what should happen**, and **what to do if it fails**

Nothing auto-runs.
It suggests and explains. You stay in control.

## Current status

Working now:
- polished React UI
- Tauri desktop wrapper
- screenshot paste / load / remove flow
- Gemini vision support for screenshots
- terminal-aware answer formatting
- Windows coaching format:
  - What happened
  - Where to run this
  - What it does
  - Do this next
  - Command
  - Expected result
  - If it fails
- copy buttons for summary / command / full reply

Still future ideas:
- real native screenshot capture
- always-on-top mini mode
- global hotkey
- richer Windows troubleshooting presets

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

## Clone and install

```powershell
git clone https://github.com/m-lwatcher/clicky-helper.git
cd clicky-helper
npm install --include=dev
```

## Environment setup

Copy the example env file:

```powershell
Copy-Item .env.example .env.local
```

Then edit `.env.local` and add your real key.

Recommended setup:
- `VITE_GEMINI_KEY` for screenshot understanding
- `VITE_API_KEY` optional for non-image text fallback or other providers

## Run the app in browser/dev mode

```powershell
npm run dev
```

Open:

```text
http://localhost:5173
```

## Run the Tauri desktop app

Use **Developer PowerShell for VS 2022** if regular PowerShell gives build/linker issues.

```powershell
npm run tauri:dev
```

## Build a Windows app

```powershell
npm run tauri:build
```

Tauri will output a Windows app bundle / installer under:

```text
src-tauri/target/release/bundle/
```

## Environment variables

Supported in `.env.local`:

```env
VITE_API_KEY=...
VITE_GEMINI_KEY=...
VITE_API_BASE_URL=...
VITE_MODEL=...
```

Auto-detection currently works like this:
- `gsk_...` → Groq
- `sk-...` → OpenAI
- `sk-ant-...` → Anthropic-compatible endpoint if manually used
- Gemini screenshots use `VITE_GEMINI_KEY`

## Windows gotchas

### If npm errors with EPERM or access denied
You are probably in the wrong folder.

Make sure you are in:

```powershell
cd C:\Users\mlein\clicky-helper
```

and **not** in something protected like Visual Studio build tools folders.

### If port 5173 is already in use
A previous dev server may still be running.
Close the old one before starting a new one.

### If Tauri fails to build
Use **Developer PowerShell for VS 2022** and make sure Visual Studio Build Tools has **Desktop development with C++** installed.

## Product stance

Clicky Helper is meant to feel like:
- less bot
- more practical teacher
- more Windows guide
- less command vomit

That’s the goal.
