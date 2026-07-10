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
npm run studio -- render-next
npm run studio -- safety
```

`generate` creates an approval-assisted batch. `schedule` creates the 30-day plan. `variants` reads analytics and makes new ideas from winners. `export-lifeos` writes backlog, approval queue, calendar, and recommendations.

## Media Rendering

`render-next` turns the next queued content item into a 9:16 MP4 using official assets from `https://pegilagi.com/`, reusable Pegi character art, ASS captions, and ffmpeg.

```powershell
npm run studio -- render-next
npm run studio -- render --id 2026-07-10-001-uangmu-ke-mana
```

TTS is pluggable:

- Default: silent review audio, useful when ffmpeg exists but Kokoro is not configured.
- `PEGILAGI_KOKORO=1`: calls `tools/kokoro_tts.py`, expecting `kokoro_onnx`, `soundfile`, model, and voices.
- `PEGILAGI_TTS_CMD`: shell command hook. It receives `PEGILAGI_TTS_TEXT`, `PEGILAGI_TTS_TEXT_FILE`, `PEGILAGI_TTS_OUT`, and `PEGILAGI_TTS_VOICE`.

Example for Stewie-style shared Kokoro:

```bash
PEGILAGI_KOKORO=1 \
PEGILAGI_PYTHON=~/miniforge3/bin/python \
KOKORO_MODEL=/path/to/kokoro.onnx \
KOKORO_VOICES=/path/to/voices.bin \
npm run studio -- render-next
```

## Oracle A1-Flex

This project is safe for the same Oracle box as `aiTrading`, `smartstudent`, `stewie`, and `lifeOS`: it has no runtime dependencies beyond Node and can run from cron. See [deploy/oracle-a1.md](deploy/oracle-a1.md).
