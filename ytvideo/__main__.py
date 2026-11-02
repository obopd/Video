"""CLI: python -m ytvideo SCRIPT.yaml [--preview] [-o OUT.mp4] [--voice ENGINE]"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

from .build import Builder


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="ytvideo", description="Render a YAML script into a YouTube video.")
    ap.add_argument("script", type=Path, help="path to the video script (.yaml)")
    ap.add_argument("-o", "--output", type=Path, help="output .mp4 (default: from script or output/<name>.mp4)")
    ap.add_argument("--preview", action="store_true", help="fast half-resolution render for checking")
    ap.add_argument("--voice", choices=["auto", "edge", "espeak", "none"], help="override the TTS engine")
    args = ap.parse_args(argv)

    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            print(f"error: {tool} not found. Install FFmpeg: https://ffmpeg.org/download.html", file=sys.stderr)
            return 1
    try:
        Builder(args.script, args.output, args.preview, args.voice).run()
    except (ValueError, KeyError, FileNotFoundError, RuntimeError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
