# Quirky Help — GitHub Release Checklist

Use this when publishing the first public downloadable build from GitHub Releases.

## Release target
- **Version:** 0.2.0
- **Release title:** Quirky Help v0.2.0
- **Repo:** https://github.com/m-lwatcher/clicky-helper

## Before creating the release
- [ ] Final Windows desktop build succeeded
- [ ] Installed desktop app passed smoke test
- [ ] Product-facing name shows as Quirky Help
- [ ] Screenshot workflow works
- [ ] Command copy flow works
- [ ] Support contact is set to `support_quirkyhelp@proton.me`
- [ ] Privacy policy URL is available or clearly marked pending

## Find build artifacts
Look under:

```text
src-tauri/target/release/bundle/
```

Likely useful upload candidates:
- `.msi` installer
- installer `.exe` if present
- optional zip bundle if generated

## What to upload
Minimum:
- [ ] primary Windows installer

Nice to have:
- [ ] zip fallback build if available

## Release body
Use `RELEASE_TEMPLATE.md` as the base.

## Suggested release notes for v0.2.0
Quirky Help v0.2.0 is the first polished Windows desktop build prepared for broader testing.

Highlights:
- screenshot-aware troubleshooting help
- structured Windows command guidance
- local provider setup for Gemini, Groq, OpenAI, and compatible providers
- built-in privacy and safety explanations
- no auto-run commands

This release is intended for early distribution and real-world testing.

## After publishing
- [ ] verify the release page loads correctly
- [ ] verify the uploaded installer downloads correctly
- [ ] verify README download section points people to Releases
- [ ] optionally pin the release in repo discussions/notes
