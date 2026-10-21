#!/usr/bin/env python3
"""Turn a voiceover into word timings: episodes/<ep>/words.json = [{"w": "word", "s": start, "e": end}, ...]

    python3 tools/transcribe.py episodes/<ep>/vo.mp3                 # writes episodes/<ep>/words.json
    python3 tools/transcribe.py vo.mp3 --out words.json --model small.en
    python3 tools/transcribe.py vo.mp3 --to 120                       # only the first 120 seconds

Needs: pip install faster-whisper (the model downloads once from Hugging Face).
Models: tiny.en (fastest), base.en (default, good for clean narration), small.en (more accurate).
"""
import argparse
import json
import os
import subprocess
import sys


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("--out")
    ap.add_argument("--model", default="base.en")
    ap.add_argument("--to", type=float, help="only transcribe up to this many seconds")
    a = ap.parse_args()

    from faster_whisper import WhisperModel

    # Decode with ffmpeg ourselves (16 kHz mono float), so no audio library versions matter.
    import numpy as np
    cmd = ["ffmpeg", "-v", "error", "-i", a.audio]
    if a.to:
        cmd += ["-t", str(a.to)]
    cmd += ["-f", "s16le", "-ac", "1", "-ar", "16000", "-"]
    pcm = subprocess.run(cmd, check=True, stdout=subprocess.PIPE).stdout
    src = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0

    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    segments, info = model.transcribe(src, word_timestamps=True, vad_filter=True, language="en")
    words = []
    for seg in segments:
        for w in seg.words:
            words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)})
        print(f"  {seg.end:7.1f}s  {seg.text.strip()[:80]}", file=sys.stderr)

    out = a.out or os.path.join(os.path.dirname(os.path.abspath(a.audio)), "words.json")
    with open(out, "w") as f:
        json.dump(words, f, indent=0)
    print(f"{out}: {len(words)} words, {words[-1]['e'] if words else 0:.1f}s")


if __name__ == "__main__":
    main()
