# Quirky Help — Store Screenshot Plan

Goal: capture screenshots that make the app understandable in 5 seconds.

## Capture rules
- Use PNG.
- Keep window size consistent.
- Use the installed app if possible, not the browser dev version.
- Hide personal info and real API keys.
- Use fake/sample errors where possible.
- Use dark theme as current default.
- Make each screenshot show one clear value.

## Screenshot 1 — Main value
**Title idea:** Explain Windows errors in plain English

Show:
- main Quirky Help window
- prompt filled with a realistic terminal/install error question
- screenshot attached or preview visible
- Ask helper button visible

Purpose:
Shows what the app does immediately.

## Screenshot 2 — Structured answer
**Title idea:** Get the next safe command

Show response cards:
- What happened
- Where to run this
- What it does
- Command
- Copy command button

Purpose:
Shows the Windows coaching format.

## Screenshot 3 — First-run setup
**Title idea:** Bring your own AI key

Show onboarding/setup:
- provider dropdown
- API key field obscured/empty
- test connection button
- privacy/trust cards

Purpose:
Shows setup is built into the app.

## Screenshot 4 — Settings and privacy
**Title idea:** Local settings, transparent privacy

Show:
- About/Privacy section
- Settings button or settings panel
- local storage/provider explanation

Purpose:
Builds trust for store users.

## Screenshot 5 — Screenshot workflow
**Title idea:** Paste or load screenshots

Show:
- screenshot preview panel
- Load image / Remove controls
- tips pills

Purpose:
Shows visual workflow.

## Optional Screenshot 6 — No auto-run trust
**Title idea:** Commands are suggestions only

Show:
- command card
- note: Commands are suggestions only. Review before running.

Purpose:
Reinforces safety.

## Suggested sample error text
Use a non-sensitive sample like:

```text
npm ERR! code EACCES
npm ERR! syscall mkdir
npm ERR! path C:\\Program Files\\nodejs\\node_modules
```

Or:

```text
error: port 5173 is already in use
```

Avoid showing:
- real API keys
- wallet keys
- tokens
- personal account pages
- private filesystem paths beyond generic examples
