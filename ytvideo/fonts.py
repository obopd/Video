"""Locate usable TrueType/OpenType fonts on Linux, macOS and Windows."""

from __future__ import annotations

import os
from functools import lru_cache

from PIL import ImageFont

_BOLD = [
    "/usr/share/fonts/opentype/inter/Inter-Bold.otf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/segoeuib.ttf",
]
_REGULAR = [
    "/usr/share/fonts/opentype/inter/Inter-Regular.otf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
]


def _first_existing(paths: list[str]) -> str | None:
    for p in paths:
        if p and os.path.isfile(p):
            return p
    return None


@lru_cache(maxsize=None)
def font_path(bold: bool, override: str | None = None) -> str | None:
    if override and os.path.isfile(override):
        return override
    return _first_existing(_BOLD if bold else _REGULAR) or _first_existing(_BOLD + _REGULAR)


@lru_cache(maxsize=256)
def load(size: int, bold: bool = False, override: str | None = None) -> ImageFont.FreeTypeFont:
    path = font_path(bold, override)
    if path:
        return ImageFont.truetype(path, size)
    return ImageFont.load_default(size)  # Pillow >= 10.1
