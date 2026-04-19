# Quirky Help — Release Publish Steps

Use this exact sequence to publish the first downloadable Windows release on GitHub.

## Goal
Publish **Quirky Help v0.2.0** as a GitHub Release with a working Windows installer.

## Step 1 — Build on Windows
Open the working Windows project folder:

```powershell
cd C:\Users\mlein\clicky-helper
```

Run the production desktop build:

```powershell
npm run tauri:build
```

If Tauri/linker complains, use **Developer PowerShell for VS 2022**.

## Step 2 — Find the installer
Check:

```powershell
dir src-tauri\target\release\bundle
dir src-tauri\target\release\bundle\msi
dir src-tauri\target\release\bundle\nsis
```

Use the main Windows installer artifact if present:
- `.msi` preferred
- installer `.exe` if that is the cleaner output

## Step 3 — Sanity check the artifact
Before publishing, confirm:
- [ ] installer launches
- [ ] installed app opens
- [ ] app name says **Quirky Help**
- [ ] icon is acceptable
- [ ] desktop version already passed smoke test

## Step 4 — Open GitHub Releases
Go to:

**https://github.com/m-lwatcher/clicky-helper/releases**

Click:
- **Draft a new release**

## Step 5 — Fill release details
Use:
- **Tag:** `v0.2.0`
- **Release title:** `Quirky Help v0.2.0`

For the release body, copy from:
- `RELEASE_NOTES_v0.2.0.md`

## Step 6 — Upload files
Upload:
- [ ] primary Windows installer
- [ ] optional zip fallback if available

## Step 7 — Publish
Click:
- **Publish release**

## Step 8 — Verify immediately
After publishing:
- [ ] release page loads correctly
- [ ] installer downloads correctly
- [ ] README Releases link works
- [ ] app can be installed from the downloaded artifact

## Step 9 — Optional follow-up
After release is live:
- add the public privacy policy URL once published
- update release notes if needed
- share the release link instead of raw repo links

## Final output
What you should end up with:
- one GitHub release
- one downloadable installer
- one stable public link you can send people
