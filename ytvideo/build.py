"""Turn a YAML video script into a YouTube-ready MP4 (+ captions, thumbnail, description)."""

from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

import yaml

from . import slides, subtitles, tts

PRESETS = {
    "landscape": (1920, 1080),
    "1080p": (1920, 1080),
    "720p": (1280, 720),
    "4k": (3840, 2160),
    "shorts": (1080, 1920),
    "vertical": (1080, 1920),
}
LEAD_IN = 0.35   # silence before narration in each scene
TAIL = 0.65      # silence after narration
FADE = 0.3       # video fade in/out per scene
ANIMATION_DIR = Path(__file__).resolve().parent.parent / "animation"


def log(msg: str) -> None:
    print(f"[ytvideo] {msg}", flush=True)


def ffmpeg(*args: str, cwd: Path | None = None) -> None:
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args]
    res = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"ffmpeg failed:\n{' '.join(cmd)}\n{res.stderr}")


def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout
    return float(json.loads(out)["format"]["duration"])


def _ts(sec: float) -> str:
    sec = int(sec)
    h, rem = divmod(sec, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02}:{s:02}" if h else f"{m}:{s:02}"


@dataclass
class Scene:
    index: int
    spec: dict
    narration: str = ""
    audio: Path | None = None
    voice_seconds: float = 0.0
    seconds: float = 0.0
    frames: list[tuple[Path, float]] = field(default_factory=list)
    clip: Path | None = None
    start: float = 0.0
    words: list[dict] = field(default_factory=list)  # narration word timings, seconds from voice start
    animation: Path | None = None


class Builder:
    def __init__(self, script_path: Path, out: Path | None = None, preview: bool = False,
                 engine: str | None = None):
        self.script_path = script_path.resolve()
        self.root = self.script_path.parent
        self.cfg = yaml.safe_load(self.script_path.read_text(encoding="utf-8")) or {}
        if not self.cfg.get("scenes"):
            raise ValueError("script has no scenes")
        self.preview = preview

        res = self.cfg.get("resolution", "landscape")
        size = PRESETS[res.lower()] if isinstance(res, str) else tuple(res)
        if preview:  # quick low-res render for checking timing/layout
            size = (size[0] // 2 // 2 * 2, size[1] // 2 // 2 * 2)
        self.size: tuple[int, int] = size  # type: ignore[assignment]
        self.fps = int(self.cfg.get("fps", 30))
        self.theme = slides.Theme.from_dict(self.cfg.get("theme"))
        self.voice = self.cfg.get("voice", {}) or {}
        self.engine = tts.resolve_engine(engine or self.voice.get("engine", "auto"))

        stem = self.script_path.stem
        self.out = (out or self.root / self.cfg.get("output", f"output/{stem}.mp4")).resolve()
        if preview:
            self.out = self.out.with_name(self.out.stem + "-preview.mp4")
        self.work = self.out.parent / f".build-{self.out.stem}"
        self.work.mkdir(parents=True, exist_ok=True)

    def path(self, p: str) -> Path:
        q = Path(p).expanduser()
        return q if q.is_absolute() else (self.root / q)

    # ----------------------------------------------------------------------- steps

    def run(self) -> Path:
        log(f"script: {self.script_path.name} | {self.size[0]}x{self.size[1]} @ {self.fps}fps | voice: {self.engine}")
        scenes = [Scene(i, s or {}) for i, s in enumerate(self.cfg["scenes"])]
        t = 0.0
        for sc in scenes:
            self.prepare_audio(sc)
            sc.start = t
            self.render_frames(sc)
            t += sc.seconds
        self.render_animations([s for s in scenes if s.spec.get("type") == "animated"])
        for sc in scenes:
            self.render_clip(sc)
            log(f"scene {sc.index + 1}/{len(scenes)} [{sc.spec.get('type', 'text')}] {sc.seconds:.1f}s")
        self.assemble(scenes, t)
        self.write_extras(scenes, t)
        if not self.cfg.get("keep_build", False):
            shutil.rmtree(self.work, ignore_errors=True)
        log(f"done -> {self.out}")
        return self.out

    def prepare_audio(self, sc: Scene) -> None:
        spec = sc.spec
        sc.narration = " ".join(str(spec.get("narration", "")).split())
        if spec.get("audio"):  # user-recorded voiceover for this scene
            sc.audio = self.path(spec["audio"])
        elif sc.narration:
            key = hashlib.sha1(json.dumps([sc.narration, self.engine, self.voice], sort_keys=True).encode()).hexdigest()[:16]
            cache = self.out.parent / ".tts-cache"
            cache.mkdir(exist_ok=True)
            mp3 = cache / f"{key}.mp3"
            words_file = mp3.with_suffix(".words.json")
            if not mp3.exists() or mp3.stat().st_size == 0:
                try:
                    made, words = tts.synthesize(sc.narration, mp3, self.engine, self.voice)
                except Exception as e:  # network/voice errors from the TTS backend
                    mp3.unlink(missing_ok=True)
                    raise RuntimeError(f"scene {sc.index + 1}: voiceover failed ({self.engine}): {e}\n"
                                       "Check your internet connection, or render with --voice none") from e
                if made:
                    sc.audio = mp3
                    words_file.write_text(json.dumps(words))
            else:
                sc.audio = mp3
            if sc.audio and words_file.exists():
                sc.words = json.loads(words_file.read_text())
        if sc.audio:
            sc.voice_seconds = probe_duration(sc.audio)
        elif sc.narration:
            sc.voice_seconds = tts.estimate_seconds(sc.narration)
        if sc.narration and not sc.words:
            sc.words = tts.estimate_words(sc.narration, sc.voice_seconds)
        natural = LEAD_IN + sc.voice_seconds + TAIL if sc.voice_seconds else 0
        sc.seconds = max(float(spec.get("duration", 0) or 0), natural) or 4.0

    def render_frames(self, sc: Scene) -> None:
        s, size, theme = sc.spec, self.size, self.theme
        kind = s.get("type", "text")
        out = self.work / f"scene{sc.index:03}"
        if kind == "animated":
            return  # rendered by Remotion in render_animations()
        if kind == "title":
            imgs = [slides.render_title(size, theme, s.get("title", ""), s.get("subtitle"))]
        elif kind == "quote":
            imgs = [slides.render_quote(size, theme, s.get("quote", s.get("text", "")), s.get("author"))]
        elif kind == "image":
            imgs = [slides.render_image(size, theme, self.path(s["image"]), s.get("caption"), s.get("fit", "cover"))]
        elif kind == "bullets":
            bullets = [str(b) for b in s.get("bullets", [])]
            if s.get("reveal", True) and len(bullets) > 1:
                # reveal one bullet at a time, timed by how long each bullet's text is
                weights = [len(b) + 20 for b in bullets]
                body = sc.seconds - LEAD_IN
                durs = [LEAD_IN + body * weights[0] / sum(weights)] + [body * w / sum(weights) for w in weights[1:]]
                for i, d in enumerate(durs, 1):
                    p = Path(f"{out}_{i}.png")
                    slides.render_bullets(size, theme, s.get("heading"), bullets, visible=i).save(p)
                    sc.frames.append((p, d))
                return
            imgs = [slides.render_bullets(size, theme, s.get("heading"), bullets)]
        elif kind == "text":
            imgs = [slides.render_text(size, theme, s.get("text", ""), s.get("heading"))]
        else:
            raise ValueError(f"scene {sc.index + 1}: unknown type {kind!r} "
                             "(use title, text, bullets, image, quote or animated)")
        p = Path(f"{out}.png")
        imgs[0].save(p)
        sc.frames.append((p, sc.seconds))

    def render_animations(self, scenes: list[Scene]) -> None:
        """Render all `animated` scenes in one Remotion batch (bundling once is much faster)."""
        if not scenes:
            return
        anim_dir = Path(self.cfg.get("animation_dir", ANIMATION_DIR)).resolve()
        if not (anim_dir / "node_modules" / "remotion").is_dir():
            raise RuntimeError(f"animated scenes need the Remotion project installed: run `npm install` in {anim_dir}")
        # Cache rendered animations by (props + animation source code), so changing music,
        # text or one scene's narration doesn't re-render every animation.
        src_hash = hashlib.sha1()
        for f in sorted((anim_dir / "src").rglob("*")) + [anim_dir / "package-lock.json"]:
            if f.is_file():
                src_hash.update(f.relative_to(anim_dir).as_posix().encode() + f.read_bytes())
        cache = self.out.parent / ".anim-cache"
        cache.mkdir(exist_ok=True)
        jobs, cached = [], []
        for sc in scenes:
            if not sc.spec.get("component"):
                raise ValueError(f"scene {sc.index + 1}: animated scenes need a `component`")
            props = dict(sc.spec.get("props") or {})
            props.update(
                component=sc.spec["component"],
                durationInFrames=max(1, round(sc.seconds * self.fps)),
                fps=self.fps, width=self.size[0], height=self.size[1],
                # word times relative to the start of the scene (the voice starts after LEAD_IN)
                words=[{**w, "start": w["start"] + LEAD_IN, "end": w["end"] + LEAD_IN} for w in sc.words],
            )
            crf = 28 if self.preview else 16
            key = hashlib.sha1((src_hash.hexdigest() + json.dumps([props, crf], sort_keys=True)).encode()).hexdigest()[:20]
            sc.animation = cache / f"{key}.mp4"
            if sc.animation.exists() and sc.animation.stat().st_size > 0:
                cached.append(sc)
                continue
            tmp = cache / f"{key}.partial.mp4"
            jobs.append({"out": str(tmp), "final": str(sc.animation), "props": props, "crf": crf})
        if cached:
            log(f"reusing {len(cached)} cached animation(s)")
        if not jobs:
            return
        jobs_file = self.work / "animation-jobs.json"
        jobs_file.write_text(json.dumps(jobs))
        log(f"rendering {len(jobs)} animated scene(s) with Remotion...")
        res = subprocess.run(["node", str(anim_dir / "render.mjs"), str(jobs_file)], cwd=anim_dir)
        if res.returncode != 0:
            raise RuntimeError("Remotion render failed (see output above)")
        for job in jobs:  # only finished renders enter the cache
            Path(job["out"]).replace(job["final"])

    def render_clip(self, sc: Scene) -> None:
        w, h = self.size
        d = sc.seconds
        kind = sc.spec.get("type", "text")
        motion = sc.spec.get("motion", "zoom" if kind in ("image", "title") else "none")
        clip = self.work / f"scene{sc.index:03}.mp4"
        frames_n = max(1, round(d * self.fps))

        if sc.animation:
            vin = ["-i", str(sc.animation)]
            vf = f"fps={self.fps},scale={w}:{h},"
        elif len(sc.frames) == 1 and motion in ("zoom", "zoom-out", "pan"):
            # Ken Burns: upscale first so zoompan moves smoothly instead of in 1px steps
            rate = 0.08 / frames_n
            if motion == "zoom":
                z = f"1+{rate:.8f}*on"
            elif motion == "zoom-out":
                z = f"1.08-{rate:.8f}*on"
            else:
                z = "1.08"
            x = f"(iw-iw/zoom)*on/{frames_n}" if motion == "pan" else "iw/2-(iw/zoom/2)"
            vin = ["-loop", "1", "-framerate", str(self.fps), "-t", f"{d:.3f}", "-i", str(sc.frames[0][0])]
            vf = (f"scale={w * 2}:{h * 2},zoompan=z='{z}':x='{x}':y='ih/2-(ih/zoom/2)'"
                  f":d=1:s={w}x{h}:fps={self.fps},")
        else:
            listing = self.work / f"scene{sc.index:03}.txt"
            lines = []
            for p, dur in sc.frames:
                lines += [f"file '{p.as_posix()}'", f"duration {dur:.3f}"]
            lines.append(f"file '{sc.frames[-1][0].as_posix()}'")  # concat demuxer quirk
            listing.write_text("\n".join(lines) + "\n")
            vin = ["-f", "concat", "-safe", "0", "-i", str(listing)]
            vf = f"fps={self.fps},"
        fade = sc.spec.get("fade", True)  # fade through black; set false for hard cuts
        if fade:
            vf += f"fade=t=in:st=0:d={FADE},fade=t=out:st={max(0, d - FADE):.3f}:d={FADE},"
        vf += "format=yuv420p,setsar=1"

        if sc.audio:
            ain = ["-i", str(sc.audio)]
            af = (f"aresample=48000,aformat=channel_layouts=stereo,"
                  f"adelay={int(LEAD_IN * 1000)}:all=1,apad,atrim=0:{d:.3f}")
        else:
            ain = ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]
            af = f"atrim=0:{d:.3f}"

        ffmpeg(*vin, *ain, "-filter_complex", f"[0:v]{vf}[v];[1:a]{af}[a]",
               "-map", "[v]", "-map", "[a]", "-t", f"{d:.3f}",
               "-c:v", "libx264", "-preset", "ultrafast" if self.preview else "medium",
               "-crf", "28" if self.preview else "18", "-r", str(self.fps),
               "-c:a", "aac", "-b:a", "192k", "-ar", "48000", str(clip))
        sc.clip = clip

    def assemble(self, scenes: list[Scene], total: float) -> None:
        listing = self.work / "scenes.txt"
        listing.write_text("".join(f"file '{s.clip.as_posix()}'\n" for s in scenes))
        body = self.work / "body.mp4"
        ffmpeg("-f", "concat", "-safe", "0", "-i", str(listing), "-c", "copy", str(body))

        sub_cfg = self.cfg.get("subtitles", {}) or {}
        cues = []
        for sc in scenes:
            if sc.narration and sc.voice_seconds:
                cues += list(subtitles.word_timed_chunks(
                    sc.narration, sc.words, sc.start + LEAD_IN, sc.start + LEAD_IN + sc.voice_seconds,
                    int(sub_cfg.get("max_chars", 42))))
        self.cues = cues
        srt = self.out.with_suffix(".srt")
        srt.write_text(subtitles.to_srt(cues), encoding="utf-8")

        inputs = ["-i", str(body)]
        filters, vlabel, alabel = [], "0:v", "0:a"

        music = self.cfg.get("music")
        if music:
            music = {"file": music} if isinstance(music, str) else music
            inputs += ["-stream_loop", "-1", "-i", str(self.path(music["file"]))]
            vol = float(music.get("volume", 0.15))
            fade_out = float(music.get("fade_out", 3))
            filters.append(f"[1:a]aresample=48000,aformat=channel_layouts=stereo,volume={vol},"
                           f"atrim=0:{total:.3f},afade=t=in:d=1,afade=t=out:st={max(0, total - fade_out):.3f}:d={fade_out}[m]")
            if music.get("duck", True):  # lower music while the voice is speaking
                filters.append("[0:a]asplit=2[voice][sc]")
                filters.append("[m][sc]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=400[md]")
                filters.append("[voice][md]amix=inputs=2:duration=first:normalize=0[a]")
            else:
                filters.append("[0:a][m]amix=inputs=2:duration=first:normalize=0[a]")
            alabel = "[a]"

        if sub_cfg.get("burn", True) and cues:
            portrait = self.size[1] > self.size[0]
            style = sub_cfg.get("style") or (
                f"Fontname={sub_cfg.get('font', 'DejaVu Sans')},Bold=1,"
                f"Fontsize={sub_cfg.get('size', 13 if portrait else 18)},"
                "PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,"
                f"BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV={sub_cfg.get('margin', 55 if portrait else 22)}"
            )
            shutil.copy(srt, self.work / "captions.srt")
            filters.append(f"[0:v]subtitles=captions.srt:force_style='{style}'[v]")
            vlabel = "[v]"

        # Normalize to YouTube's playback loudness (-14 LUFS) so the video isn't quieter than others.
        src = alabel if alabel.startswith("[") else f"[{alabel}]"
        filters.append(f"{src}loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[aout]")
        alabel = "[aout]"
        args = [*inputs, "-filter_complex", ";".join(filters), "-map", vlabel, "-map", alabel]
        args += ["-c:v", "libx264", "-preset", "ultrafast" if self.preview else "medium",
                 "-crf", "28" if self.preview else "18", "-pix_fmt", "yuv420p"] if vlabel != "0:v" else ["-c:v", "copy"]
        args += ["-c:a", "aac", "-b:a", "192k"]
        args += ["-movflags", "+faststart", str(self.out)]
        ffmpeg(*args, cwd=self.work)

    def write_extras(self, scenes: list[Scene], total: float) -> None:
        # Thumbnail (1280x720 is YouTube's recommended size)
        th = self.cfg.get("thumbnail", {}) or {}
        if th is not False:
            img_path = self.path(th["image"]) if th.get("image") else None
            if th.get("frame_at") is not None:  # grab a frame of the finished video
                img_path = self.work / "thumb-frame.png"
                ffmpeg("-ss", str(th["frame_at"]), "-i", str(self.out), "-frames:v", "1", str(img_path))
            portrait = self.size[1] > self.size[0]
            slides.render_thumbnail((720, 1280) if portrait else (1280, 720), self.theme,
                                    th.get("text", self.cfg.get("title", "")), img_path, th.get("badge")
                                    ).save(self.out.with_suffix(".thumbnail.png"))

        # Description with chapters. YouTube needs: first at 0:00, >= 3 chapters, each >= 10s.
        chapters = [(sc.start, sc.spec["chapter"]) for sc in scenes if sc.spec.get("chapter")]
        if chapters and chapters[0][0] > 0:
            chapters.insert(0, (0.0, "Intro"))
        ends = [c[0] for c in chapters[1:]] + [total]
        chapters_ok = len(chapters) >= 3 and all(e - s >= 10 for (s, _), e in zip(chapters, ends))
        if chapters and not chapters_ok:
            log("note: chapters skipped in description (YouTube needs 3+ chapters, each at least 10s long)")

        parts = [self.cfg.get("title", ""), "", str(self.cfg.get("description", "")).strip()]
        if chapters_ok:
            parts += ["", "Chapters:"] + [f"{_ts(s)} {name}" for s, name in chapters]
        tags = self.cfg.get("tags") or []
        if tags:
            parts += ["", " ".join("#" + str(t).replace(" ", "") for t in tags[:3])]
            parts += ["", "Tags (paste into YouTube Studio): " + ", ".join(map(str, tags))]
        self.out.with_suffix(".description.txt").write_text("\n".join(parts).strip() + "\n", encoding="utf-8")
        log(f"length {_ts(total)} | captions, thumbnail and description written next to the video")
