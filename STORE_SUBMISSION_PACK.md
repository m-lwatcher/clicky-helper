# Quirky Help — Store Submission Pack

This file is the boring, practical checklist for getting Quirky Help into the Microsoft Store without re-thinking everything every time.

## App identity
- **Store name:** Quirky Help
- **Desktop product name:** Quirky Help
- **Current version:** 0.2.0
- **Category:** Productivity
- **Current Tauri productName:** Quirky Help
- **Current window title:** Quirky Help
- **Current Tauri identifier:** `com.clickyhelper.desktop`
  - Keep for now to avoid risky churn before first submission.

## Positioning
- **Short description:** A Windows troubleshooting helper that explains screenshots, terminal errors, and setup commands in plain English.
- **One-line pitch:** Get clearer explanations and safer next steps for Windows errors, setup issues, and command-line problems.
- **Core promise:** Quirky Help helps people understand what happened, where to run a fix, what a command does, and what to try next.
- **Safety promise:** Quirky Help does not auto-run commands or make system changes.
- **Privacy promise:** API keys/settings are stored locally; prompts and screenshots go only to the AI provider the user chooses.

## Current store assets status
### Ready now
- [x] App name consistent in the product UI
- [x] Onboarding/setup exists
- [x] Trust/privacy screen exists
- [x] Listing draft exists
- [x] Privacy policy draft exists
- [x] Screenshot plan exists
- [x] Screenshot selection exists
- [x] Tauri packaging config exists

### Still needed before serious submission
- [ ] Final icon/logo pass suitable for store tile sizes
- [ ] Final support/contact destination
- [ ] Public privacy policy URL
- [ ] Microsoft Store partner account work
- [ ] Name reservation confirmation
- [ ] Final screenshot export/crop verification
- [ ] Final package build to test-install on Windows

## Screenshot set to use
Use the already-selected screenshot set from `STORE_SCREENSHOT_SELECTION.md`:
1. Hero / main app
2. Onboarding / setup
3. Provider dropdown / supported models
4. Problem-solving response
5. Trust / privacy / version

## Listing copy source of truth
Use `STORE_LISTING_DRAFT.md` as the working source for:
- short description
- long description
- key features
- keywords
- trust/privacy copy

## Privacy policy source of truth
Use `PRIVACY_POLICY_DRAFT.md` as the base text.
Before submission, publish it to a stable public URL and replace any placeholders.

## Packaging notes
- Windows repo folder still lives at `clicky-helper` / `windows-clicky-helper`
- Product-facing name is **Quirky Help**
- Keep identifier/package churn low until after first store acceptance
- Test with the installed desktop build, not only browser dev mode

## Recommended next boring tasks
1. Create a cleaner app icon set for the store
2. Pick support/contact destination
3. Publish privacy policy somewhere stable
4. Verify screenshots at store-required sizes
5. Build final Windows package and smoke-test install/update flow
6. Submit as beta/private listing first
