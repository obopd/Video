"""Render scene frames (PNG) with Pillow.

Every layout is expressed relative to the canvas size, so the same script
works for 16:9 landscape videos and 9:16 Shorts.
"""

from __future__ import annotations

from dataclasses import dataclass

from PIL import Image, ImageDraw, ImageFilter, ImageOps

from . import fonts


@dataclass
class Theme:
    background: str = "#0f172a"
    background2: str = "#1e293b"
    text: str = "#f8fafc"
    muted: str = "#94a3b8"
    accent: str = "#38bdf8"
    font_bold: str | None = None
    font_regular: str | None = None

    @classmethod
    def from_dict(cls, d: dict | None) -> "Theme":
        d = d or {}
        known = {k: v for k, v in d.items() if k in cls.__dataclass_fields__}
        return cls(**known)


def _rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def _gradient(w: int, h: int, top: str, bottom: str) -> Image.Image:
    a, b = _rgb(top), _rgb(bottom)
    col = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(h - 1, 1)
        col.putpixel((0, y), tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)))
    return col.resize((w, h))


def _wrap(draw: ImageDraw.ImageDraw, text: str, font, max_w: int) -> list[str]:
    lines: list[str] = []
    for para in str(text).split("\n"):
        words, line = para.split(), ""
        for word in words:
            trial = f"{line} {word}".strip()
            if draw.textlength(trial, font=font) <= max_w or not line:
                line = trial
            else:
                lines.append(line)
                line = word
        lines.append(line)
    return lines


def _fit(draw, text, max_w, max_h, start_size, bold, theme, min_size=24, spacing=1.2):
    """Largest font size (<= start_size) at which text fits the box."""
    size = start_size
    while True:
        font = fonts.load(size, bold, theme.font_bold if bold else theme.font_regular)
        lines = _wrap(draw, text, font, max_w)
        height = int(len(lines) * size * spacing)
        if height <= max_h or size <= min_size:
            return font, lines, height
        size = int(size * 0.92)


def _draw_lines(draw, lines, font, x, y, fill, align="center", width=0, spacing=1.2):
    size = font.size if hasattr(font, "size") else 20
    for line in lines:
        lw = draw.textlength(line, font=font)
        lx = x + (width - lw) / 2 if align == "center" else x
        draw.text((lx, y), line, font=font, fill=fill)
        y += int(size * spacing)
    return y


def _base(size, theme) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    w, h = size
    img = _gradient(w, h, theme.background, theme.background2)
    return img, ImageDraw.Draw(img)


def _accent_bar(draw, x, y, w, h, theme):
    draw.rounded_rectangle((x, y, x + w, y + h), radius=h // 2, fill=_rgb(theme.accent))


def _is_portrait(size) -> bool:
    return size[1] > size[0]


# --------------------------------------------------------------------------- layouts


def render_title(size, theme, title, subtitle=None) -> Image.Image:
    img, draw = _base(size, theme)
    w, h = size
    unit = min(w, h)
    margin = int(w * 0.1)
    box_w = w - 2 * margin
    font, lines, th = _fit(draw, title, box_w, int(h * 0.45), int(unit * 0.12), True, theme)
    sub_font = sub_lines = None
    sh = 0
    if subtitle:
        sub_font, sub_lines, sh = _fit(draw, subtitle, box_w, int(h * 0.2), int(unit * 0.045), False, theme)
    gap = int(unit * 0.05)
    total = th + (gap + sh if subtitle else 0)
    # in portrait, sit a little higher so burned-in captions don't collide
    y = int((h - total) * (0.4 if _is_portrait(size) else 0.5))
    y = _draw_lines(draw, lines, font, margin, y, theme.text, width=box_w)
    bar_w = int(unit * 0.12)
    _accent_bar(draw, (w - bar_w) // 2, y + gap // 3, bar_w, max(6, unit // 120), theme)
    if subtitle:
        _draw_lines(draw, sub_lines, sub_font, margin, y + gap, theme.muted, width=box_w)
    return img


def render_text(size, theme, text, heading=None) -> Image.Image:
    img, draw = _base(size, theme)
    w, h = size
    unit = min(w, h)
    margin = int(w * 0.1)
    box_w = w - 2 * margin
    y = int(h * 0.12)
    if heading:
        hf, hl, hh = _fit(draw, heading, box_w, int(h * 0.2), int(unit * 0.075), True, theme)
        y = _draw_lines(draw, hl, hf, margin, y, theme.accent, width=box_w)
        y += int(unit * 0.04)
    font, lines, th = _fit(draw, text, box_w, h - y - int(h * 0.15), int(unit * 0.065), False, theme)
    y = max(y, (h - th) // 2) if not heading else y + max(0, (h - y - int(h * 0.15) - th) // 2)
    _draw_lines(draw, lines, font, margin, y, theme.text, width=box_w)
    return img


def render_quote(size, theme, quote, author=None) -> Image.Image:
    img, draw = _base(size, theme)
    w, h = size
    unit = min(w, h)
    margin = int(w * 0.12)
    box_w = w - 2 * margin
    mark = fonts.load(int(unit * 0.25), True, theme.font_bold)
    font, lines, th = _fit(draw, quote, box_w, int(h * 0.5), int(unit * 0.07), True, theme)
    y = (h - th) // 2
    mw = draw.textlength("“", font=mark)
    draw.text(((w - mw) / 2, y - unit * 0.2), "“", font=mark, fill=_rgb(theme.accent))
    y = _draw_lines(draw, lines, font, margin, y, theme.text, width=box_w)
    if author:
        af = fonts.load(int(unit * 0.04), False, theme.font_regular)
        _draw_lines(draw, [f"— {author}"], af, margin, y + int(unit * 0.04), theme.muted, width=box_w)
    return img


def render_bullets(size, theme, heading, bullets, visible: int | None = None) -> Image.Image:
    """Bullet list; `visible` bullets are fully drawn, the rest are dimmed placeholders
    so the layout does not jump when bullets are revealed one at a time."""
    img, draw = _base(size, theme)
    w, h = size
    unit = min(w, h)
    margin = int(w * (0.08 if _is_portrait(size) else 0.1))
    box_w = w - 2 * margin
    y = int(h * 0.1)
    if heading:
        hf, hl, _ = _fit(draw, heading, box_w, int(h * 0.2), int(unit * 0.08), True, theme)
        y = _draw_lines(draw, hl, hf, margin, y, theme.text, align="left")
        _accent_bar(draw, margin, y + unit * 0.01, int(unit * 0.1), max(6, unit // 120), theme)
        y += int(unit * 0.06)

    avail = h - y - int(h * 0.08)
    size_px = int(unit * (0.07 if _is_portrait(size) else 0.055))
    dot_gap = int(unit * 0.06)
    while True:
        font = fonts.load(size_px, False, theme.font_regular)
        wrapped = [_wrap(draw, b, font, box_w - dot_gap) for b in bullets]
        need = sum(len(l) * size_px * 1.2 for l in wrapped) + (len(bullets) - 1) * size_px * 0.6
        if need <= avail or size_px <= 22:
            break
        size_px = int(size_px * 0.92)

    visible = len(bullets) if visible is None else visible
    accent, text = _rgb(theme.accent), _rgb(theme.text)
    hidden = tuple(int(c * 0.25 + b * 0.75) for c, b in zip(text, _rgb(theme.background2)))
    for i, lines in enumerate(wrapped):
        shown = i < visible
        r = size_px * 0.18
        cy = y + size_px * 0.62
        draw.ellipse((margin, cy - r, margin + 2 * r, cy + r), fill=accent if shown else hidden)
        y = _draw_lines(draw, lines, font, margin + dot_gap, y, text if shown else hidden, align="left")
        y += int(size_px * 0.6)
    return img


def render_image(size, theme, image_path, caption=None, fit="cover") -> Image.Image:
    """Full-bleed image (cover) or letterboxed on a blurred copy (contain)."""
    w, h = size
    src = ImageOps.exif_transpose(Image.open(image_path)).convert("RGB")
    if fit == "contain":
        bg = ImageOps.fit(src, size).filter(ImageFilter.GaussianBlur(min(w, h) // 25))
        bg = Image.blend(bg, Image.new("RGB", size, (0, 0, 0)), 0.45)
        fg = ImageOps.contain(src, (int(w * 0.92), int(h * 0.92)))
        bg.paste(fg, ((w - fg.width) // 2, (h - fg.height) // 2))
        img = bg
    else:
        img = ImageOps.fit(src, size)
    if caption:
        unit = min(w, h)
        draw = ImageDraw.Draw(img, "RGBA")
        margin = int(w * 0.06)
        font, lines, th = _fit(draw, caption, w - 4 * margin, int(h * 0.2), int(unit * 0.05), True, theme)
        pad = int(unit * 0.03)
        top = int(h * (0.12 if _is_portrait(size) else 0.08))
        widest = max(draw.textlength(l, font=font) for l in lines)
        x0 = (w - widest) / 2 - pad
        draw.rounded_rectangle(
            (x0, top - pad, x0 + widest + 2 * pad, top + th + pad * 0.6),
            radius=pad, fill=(*_rgb(theme.background), 200),
        )
        _draw_lines(draw, lines, font, 0, top, theme.text, width=w)
    return img


def render_thumbnail(size, theme, title, image_path=None, badge=None) -> Image.Image:
    """YouTube thumbnail: huge bold text with a dark outline, optional photo and badge."""
    w, h = size
    if image_path:
        img = ImageOps.fit(ImageOps.exif_transpose(Image.open(image_path)).convert("RGB"), size)
        shade = _gradient(w, h, "#000000", theme.background)
        img = Image.blend(img, shade, 0.45)
    else:
        img = _gradient(w, h, theme.background, theme.background2)
    draw = ImageDraw.Draw(img)
    margin = int(w * 0.06)
    font, lines, th = _fit(draw, title.upper(), w - 2 * margin, int(h * 0.7), int(h * 0.22), True, theme)
    y = (h - th) // 2
    stroke = max(4, font.size // 14)
    for i, line in enumerate(lines):
        color = theme.accent if i == len(lines) - 1 and len(lines) > 1 else theme.text
        draw.text((margin, y), line, font=font, fill=color, stroke_width=stroke, stroke_fill="#000000")
        y += int(font.size * 1.15)
    if badge:
        bf = fonts.load(int(h * 0.07), True, theme.font_bold)
        bw = draw.textlength(badge, font=bf)
        pad = int(h * 0.025)
        draw.rounded_rectangle((w - margin - bw - 2 * pad, margin * 0.6, w - margin, margin * 0.6 + bf.size + 2 * pad),
                               radius=pad, fill=_rgb(theme.accent))
        draw.text((w - margin - bw - pad, margin * 0.6 + pad * 0.7), badge, font=bf, fill=theme.background)
    return img
