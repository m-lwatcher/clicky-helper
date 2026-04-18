# Quirky Help — Icon Direction

## Goal
A store-safe icon that reads clearly at tiny Windows sizes and still feels like Quirky Help.

## Recommended concept
**Dark rounded square + electric blue terminal window + small cursor/spark.**

Why:
- terminal window = command/setup help
- cursor/spark = interactive AI helper
- dark/electric palette matches current UI
- avoids generic robot/AI face clichés

## Palette
- Background: `#0A0B0F`
- Panel: `#141820`
- Electric blue: `#00E0FF`
- Warm accent: `#FFB347`
- Soft white: `#F4F7FB`

## Icon checklist
- [ ] Looks clear at 32x32
- [ ] Works on dark and light Windows backgrounds
- [ ] Avoids text in the icon
- [ ] Avoids detailed mascot art
- [ ] Has enough padding for Store tile cropping
- [ ] Export sizes for Tauri:
  - `32x32.png`
  - `128x128.png`
  - `128x128@2x.png`
  - `icon.ico`
  - `icon.icns`

## First-pass generated icon
A simple first-pass icon has been generated into `src-tauri/icons/` so packaging has something cleaner than a placeholder. Treat it as good-enough-for-test, not final brand art.
