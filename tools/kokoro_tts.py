#!/usr/bin/env python3
import argparse
import os
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--text-file", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--voice", default=os.environ.get("PEGILAGI_TTS_VOICE", "af_heart"))
    parser.add_argument("--model", default=os.environ.get("KOKORO_MODEL", "assets/voices/kokoro-v1.0.onnx"))
    parser.add_argument("--voices", default=os.environ.get("KOKORO_VOICES", "assets/voices/voices-v1.0.bin"))
    parser.add_argument("--speed", type=float, default=float(os.environ.get("KOKORO_SPEED", "1.05")))
    args = parser.parse_args()

    from kokoro_onnx import Kokoro
    import numpy as np
    import soundfile as sf

    text = Path(args.text_file).read_text(encoding="utf-8")
    samples, sr = Kokoro(args.model, args.voices).create(text, voice=args.voice, speed=args.speed, lang="id")
    if sr != 22050:
      n = int(round(len(samples) * 22050 / sr))
      samples = np.interp(np.linspace(0, len(samples), n, endpoint=False), np.arange(len(samples)), samples).astype(np.float32)
      sr = 22050
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    sf.write(args.out, samples, sr, subtype="PCM_16")


if __name__ == "__main__":
    main()
