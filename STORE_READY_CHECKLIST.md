# Clicky Helper — Store-Ready Build Checklist

Goal: turn Clicky from a working personal tool into a normal-user-ready Windows app.

## Priority 0 — Do not break the working app
- [ ] Keep browser dev mode working (`npm run dev`)
- [ ] Keep Tauri build working (`npm run tauri:build`)
- [ ] Keep screenshot paste/load/remove working
- [ ] Keep command copy flow working

## Priority 1 — In-app setup/settings
Normal users should not edit `.env.local`.

- [ ] First-run setup screen when no key is configured
- [ ] Provider selector: Gemini, Groq, OpenAI/custom
- [ ] API key input stored locally
- [ ] Optional base URL/model overrides for advanced users
- [ ] Test connection button
- [ ] Clear errors for invalid/missing keys
- [ ] Settings panel accessible after setup
- [ ] Reset/clear saved settings button

## Priority 2 — First-run onboarding
- [ ] Explain what Clicky does in 15 seconds
- [ ] Say nothing auto-runs
- [ ] Warn screenshots may contain sensitive info
- [ ] Explain user brings their own AI key
- [ ] Continue button into setup

## Priority 3 — Trust/privacy page
- [ ] Add About/Privacy view
- [ ] Explain API keys are stored locally
- [ ] Explain screenshots/prompts go to chosen AI provider
- [ ] Explain commands are suggestions only
- [ ] Add version number

## Priority 4 — Packaging polish
- [ ] Real icon/logo pass
- [ ] App metadata polish
- [ ] Store screenshots
- [ ] Store description short + long
- [ ] Privacy policy URL/page

## Priority 5 — Microsoft Store path
- [ ] Microsoft developer account
- [ ] App name reservation
- [ ] MSIX/store packaging check
- [ ] Signing/cert requirements
- [ ] Submit beta/private listing first

## Not now
- Browser extension
- User accounts
- Cloud sync
- Telemetry
- Paid plans
