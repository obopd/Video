#!/usr/bin/env python3
"""Route B (Kokoro) narrator auditions, per VOICE.md sections 2, 4 and 5.

Makes weighted blends of Kokoro's built-in voices, has each read the VOICE.md
test script, saves every blend as a fixed voice file (so the one Marvin picks
can be locked and reproduced exactly), and runs the automated checks:
  * accuracy  - Whisper transcript vs. script (word error rate)
  * pace      - words per minute
  * pitch     - median pitch and variation in semitones (monotone vs. sing-song)
  * glitches  - clipped samples, clicks

Usage (needs the Python 3.12 venv with kokoro, librosa, faster-whisper):
  python voice/audition.py OUT_DIR
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
import torch

SR = 24000
SPEED = 0.95  # VOICE.md tell #14: speed <= 1.0, calm first
TARGET_WPM = 155

TEST_SCRIPT = (
    "Okay, quick question. Why does ice float? Almost every other solid sinks in its own liquid. "
    "Water is the weird one. Here's the catch: when water freezes, its molecules lock into a pattern "
    "that takes up more space, not less. More space, same mass, lower density. And that tiny quirk is "
    "the reason lakes freeze from the top down, and why fish survive the winter. So, next time you drop "
    "ice in a drink, you're watching hydrogen bonding win an argument with gravity."
)

BLENDS = {  # name: {base voice: weight}
    "F1": {"af_heart": 0.6, "af_bella": 0.4},
    "F2": {"af_heart": 0.5, "af_nicole": 0.5},
    "F3": {"af_bella": 0.5, "af_nicole": 0.3, "af_heart": 0.2},
    "F4": {"af_heart": 0.75, "af_nicole": 0.25},
    "F5": {"af_bella": 0.6, "af_heart": 0.4},
    "M1": {"am_michael": 0.6, "am_fenrir": 0.4},
    "M2": {"am_michael": 0.5, "am_puck": 0.5},
    "M3": {"am_fenrir": 0.5, "am_puck": 0.3, "am_michael": 0.2},
    "M4": {"am_michael": 0.75, "am_puck": 0.25},
    "M5": {"am_puck": 0.6, "am_fenrir": 0.4},
}


def blend(pipe, weights):
    total = sum(weights.values())
    return sum(pipe.load_voice(v) * (w / total) for v, w in weights.items())


def words(text):
    return re.findall(r"[a-z']+", text.lower().replace("’", "'"))


def wer(ref, hyp):
    r, h = words(ref), words(hyp)
    d = np.zeros((len(r) + 1, len(h) + 1), int)
    d[:, 0] = range(len(r) + 1)
    d[0, :] = range(len(h) + 1)
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            d[i, j] = min(d[i - 1, j] + 1, d[i, j - 1] + 1, d[i - 1, j - 1] + (r[i - 1] != h[j - 1]))
    return d[-1, -1] / max(1, len(r))


def analyze(audio, transcript):
    import librosa
    f0, voiced, _ = librosa.pyin(audio, fmin=60, fmax=400, sr=SR, frame_length=1024)
    f0 = f0[voiced & ~np.isnan(f0)]
    semis = 12 * np.log2(f0 / np.median(f0))
    speech_sec = len(audio) / SR
    clipped = int(np.sum(np.abs(audio) >= 0.999))
    diff = np.abs(np.diff(audio))
    clicks = int(np.sum(diff > 0.5))
    return {
        "seconds": round(speech_sec, 2),
        "wpm": round(len(words(TEST_SCRIPT)) / speech_sec * 60, 1),
        "median_pitch_hz": round(float(np.median(f0)), 1),
        "pitch_spread_semitones": round(float(np.percentile(semis, 90) - np.percentile(semis, 10)), 2),
        "clipped_samples": clipped,
        "clicks": clicks,
        "wer": round(wer(TEST_SCRIPT, transcript), 3),
        "transcript": transcript,
    }


def main():
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "voice/auditions")
    (out / "blends").mkdir(parents=True, exist_ok=True)
    from kokoro import KPipeline
    from faster_whisper import WhisperModel

    pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
    stt = WhisperModel("base.en", device="cpu", compute_type="int8")
    report = {}
    for name, weights in BLENDS.items():
        voice = blend(pipe, weights)
        torch.save(voice, out / "blends" / f"{name}.pt")
        synth = lambda sp: np.concatenate([np.asarray(r.audio) for r in pipe(TEST_SCRIPT, voice=voice, speed=sp)]).astype(np.float32)
        # calibrate speed so the read lands near TARGET_WPM (VOICE.md section 1: 145-165 wpm)
        first = synth(SPEED)
        speed = round(float(np.clip(SPEED * TARGET_WPM / (len(words(TEST_SCRIPT)) / (len(first) / SR) * 60), 0.6, 1.0)), 3)
        audio = synth(speed)
        sf.write(out / f"{name}.wav", audio, SR)
        import librosa
        segs, _ = stt.transcribe(librosa.resample(audio, orig_sr=SR, target_sr=16000), language="en", beam_size=5)
        transcript = " ".join(s.text.strip() for s in segs)
        report[name] = {"blend": weights, "speed": speed, **analyze(audio, transcript)}
        r = report[name]
        print(f"{name}: speed {speed} {r['seconds']}s {r['wpm']}wpm pitch {r['median_pitch_hz']}Hz spread {r['pitch_spread_semitones']}st "
              f"WER {r['wer']} clip {r['clipped_samples']} clicks {r['clicks']}", flush=True)
    (out / "report.json").write_text(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
