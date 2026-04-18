# Quirky Help — Windows Build Smoke Test

Run this before Microsoft Store submission.

## Test environment
Use Katie's Windows machine where the app already worked:

```powershell
cd C:\Users\mlein\clicky-helper
```

Use Developer PowerShell for VS 2022 if Tauri/linker complains.

## Pre-build checks
- [ ] Repo opens without missing files
- [ ] `npm install` already done or succeeds
- [ ] No real API keys are committed
- [ ] App name shows as Quirky Help
- [ ] Icon appears in build output / installer metadata

## Browser/dev smoke test
```powershell
npm run dev
```

Check:
- [ ] app loads
- [ ] onboarding appears if settings are cleared
- [ ] provider setup screen works
- [ ] settings panel opens
- [ ] API key field masks input
- [ ] test connection button gives clear success/failure
- [ ] screenshot load/paste/remove works
- [ ] response cards render correctly
- [ ] command copy button works
- [ ] About/Privacy page opens

## Desktop build
```powershell
npm run tauri:build
```

Check:
- [ ] build completes
- [ ] installer/package is produced
- [ ] no stale Clicky Helper product-facing name appears in installer UI
- [ ] Quirky Help title appears in app window
- [ ] icon appears in taskbar/start menu if installed

## Installed app smoke test
After installing the built app:

- [ ] app launches from Start menu
- [ ] first-run onboarding works
- [ ] provider setup saves locally
- [ ] app restarts and remembers settings
- [ ] screenshot workflow works
- [ ] text-only prompt works
- [ ] copied command is correct
- [ ] no command auto-runs
- [ ] privacy/trust screen is accessible
- [ ] reset/clear settings works

## Store submission readiness
- [ ] screenshots match current UI
- [ ] privacy policy URL is public
- [ ] support email is set to `support_quirkyhelp@proton.me`
- [ ] Microsoft Store listing copy matches `MICROSOFT_STORE_FINAL_COPY.md`
- [ ] submit private/beta first

## Known safe technical compromises
- Internal repo/path may still say `clicky-helper`; product-facing UI says Quirky Help.
- Tauri identifier currently remains `com.clickyhelper.desktop` to avoid risky churn before first submission.
