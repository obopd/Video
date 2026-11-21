#!/usr/bin/env python3
"""Round 2 Kokoro auditions: natural-speed voices, pace from pauses, studio chain.
Usage: python voice/audition2.py OUT_DIR"""
import json
import sys
from pathlib import Path

import numpy as np
import torch

sys.path.insert(0, str(Path(__file__).parent))
from audition import TEST_SCRIPT, analyze, blend, words  # noqa: E402
from narrate import SR, render_raw, studio_chain  # noqa: E402

# the key takeaway is read a little slower (VOICE.md section 1)
MARKED = TEST_SCRIPT.replace("More space, same mass, lower density.", "[slow] More space, same mass, lower density.")
TARGET_WPM = 155

BLENDS = {
    "F1": {"af_heart": 0.85, "af_bella": 0.15},
    "F2": {"af_heart": 0.65, "af_bella": 0.35},
    "F3": {"af_bella": 0.7, "af_heart": 0.3},
    "F4": {"af_heart": 0.7, "af_sarah": 0.3},
    "M1": {"am_michael": 0.55, "am_fenrir": 0.45},
    "M2": {"am_fenrir": 0.65, "am_michael": 0.35},
    "M3": {"am_michael": 0.65, "am_puck": 0.35},
    "M4": {"am_fenrir": 0.55, "am_puck": 0.45},
}


def main():
    out = Path(sys.argv[1])
    (out / "blends").mkdir(parents=True, exist_ok=True)
    from kokoro import KPipeline
    from faster_whisper import WhisperModel
    import librosa
    pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
    stt = WhisperModel("base.en", device="cpu", compute_type="int8")
    n_words = len(words(TEST_SCRIPT))
    report = {}
    for name, w in BLENDS.items():
        voice = blend(pipe, w)
        torch.save(voice, out / "blends" / f"{name}.pt")
        raw = render_raw(pipe, voice, MARKED, 1.0)
        # reach the target pace mostly through pauses; only nudge the voice speed, never drag it
        wpm_at_1 = n_words / (len(raw) / SR) * 60
        speed = round(float(np.clip(TARGET_WPM / wpm_at_1, 0.88, 1.08)), 3)
        raw = render_raw(pipe, voice, MARKED, speed)
        studio_chain(raw, out / f"{name}.wav")
        segs, _ = stt.transcribe(librosa.resample(raw, orig_sr=SR, target_sr=16000), language="en", beam_size=5)
        r = {"blend": w, "base_speed": speed, **analyze(raw, " ".join(s.text.strip() for s in segs))}
        report[name] = r
        print(f"{name}: speed {speed} {r['seconds']}s {r['wpm']}wpm pitch {r['median_pitch_hz']}Hz spread {r['pitch_spread_semitones']}st "
              f"WER {r['wer']} clicks {r['clicks']}", flush=True)
    (out / "report.json").write_text(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
