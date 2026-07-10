# Pegilagi Studio

Automation pipeline for Pegilagi short-form marketing content.

Positioning: **hemat buat penumpang, utuh buat ojol**. The generator creates safe Indonesian scripts, subtitles, storyboard HTML, metadata, upload manifests, analytics placeholders, and lifeOS-ready exports.

## Quick Start

```powershell
npm run studio -- generate --count 10
npm run studio -- schedule --days 30 --per-day 3
npm test
```

Outputs are written to `out/`:

- `out/content/*.json` content metadata
- `out/scripts/*.txt` voiceover scripts
- `out/subtitles/*.srt` subtitles
- `out/storyboards/*.html` vertical storyboard previews
- `out/upload-manifest.json` channel upload queue
- `out/lifeos-export.json` future lifeOS panel input

## Commands

```powershell
npm run studio -- generate --count 10
npm run studio -- schedule --days 30 --per-day 3
npm run studio -- variants --top 5 --variants 10
npm run studio -- export-lifeos
npm run studio -- safety
```

`generate` creates an approval-assisted batch. `schedule` creates the 30-day plan. `variants` reads analytics and makes new ideas from winners. `export-lifeos` writes backlog, approval queue, calendar, and recommendations.

Real upload/render integrations should consume the generated metadata and replace `assets.status: "spec-only"` with actual media URLs.

## Oracle A1-Flex

This project is safe for the same Oracle box as `aiTrading`, `smartstudent`, `stewie`, and `lifeOS`: it has no runtime dependencies beyond Node and can run from cron. See [deploy/oracle-a1.md](deploy/oracle-a1.md).
