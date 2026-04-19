# Quirky Help

**A Windows troubleshooting helper that explains screenshots, terminal errors, and setup commands in plain English.**

Quirky Help is a desktop app for people who get stuck in messy setup work: terminal errors, installer problems, confusing app screens, and commands that need context before you trust them.

It explains what happened, where to run the fix, what a command does, and what to try next.

Nothing auto-runs. You stay in control.

---

## Screenshots

### Main app view
![Quirky Help main app screenshot](./src/assets/hero.png)

_Current screenshot set is being cleaned up for releases. More onboarding, response, and privacy screenshots can be added here once exported into the repo._

---

## Download

The recommended distribution path is **GitHub Releases**.

Once releases are published, download the latest Windows installer from:

**https://github.com/m-lwatcher/clicky-helper/releases**

If there is no release yet, build from source using the instructions below.

---

## What it does

Quirky Help lets you:

- paste or load a screenshot
- ask what went wrong
- get a safer next step
- copy a suggested command
- see where to run it
- understand what it does before using it
- see the expected result
- get fallback steps if the command fails

It is designed for Windows troubleshooting, PowerShell/CMD errors, developer setup problems, and screenshots that need a plain-English explanation.

---

## Safety stance

Quirky Help does **not**:

- auto-run commands
- install software for you
- change system settings
- take control of your computer
- collect analytics or telemetry in this version

It explains and suggests. You decide what to copy or run.

---

## Privacy

Quirky Help is bring-your-own-key.

You choose an AI provider during setup. Provider settings are stored locally on your device. Prompts and screenshots are sent only to the AI provider you configure.

Screenshots may contain sensitive information. Review screenshots before sending them to your chosen provider.

Privacy policy source:

- `privacy-policy.html`

Public privacy URL will be added here once published.

---

## Supported providers

Quirky Help supports:

- Gemini
- Groq
- OpenAI
- custom OpenAI-compatible providers

You can update provider settings from inside the app.

---

## Current status

Working now:

- polished React UI
- Tauri desktop wrapper
- first-run onboarding/setup
- provider selector and local settings
- screenshot paste / load / remove flow
- screenshot-aware AI help
- Windows coaching format:
  - What happened
  - Where to run this
  - What it does
  - Do this next
  - Command
  - Expected result
  - If it fails
- copy buttons for summary / command / full reply
- About / Privacy page

Future ideas:

- native screenshot capture
- always-on-top mini mode
- global hotkey
- richer Windows troubleshooting presets

---

## Build from source

### Requirements on Windows

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

### Clone and install

```powershell
git clone https://github.com/m-lwatcher/clicky-helper.git
cd clicky-helper
npm install --include=dev
```

### Run in browser/dev mode

```powershell
npm run dev
```

Open:

```text
http://localhost:5173
```

### Run the Tauri desktop app

Use **Developer PowerShell for VS 2022** if regular PowerShell gives build/linker issues.

```powershell
npm run tauri:dev
```

### Build a Windows app

```powershell
npm run tauri:build
```

Tauri outputs the Windows app bundle / installer under:

```text
src-tauri/target/release/bundle/
```

---

## Windows gotchas

### If npm errors with EPERM or access denied
You are probably in the wrong folder.

Make sure you are in:

```powershell
cd C:\Users\mlein\clicky-helper
```

and not in something protected like Visual Studio build tools folders.

### If port 5173 is already in use
A previous dev server may still be running. Close the old one before starting a new one.

### If Tauri fails to build
Use **Developer PowerShell for VS 2022** and make sure Visual Studio Build Tools has **Desktop development with C++** installed.

---

## Support

For support, contact:

**support_quirkyhelp@proton.me**

Do not send API keys, private tokens, or sensitive screenshots in plain text unless you are comfortable sharing that information for troubleshooting.

---

## Product stance

Quirky Help should feel like:

- less bot
- more practical teacher
- more Windows guide
- less command vomit

That is the goal.
