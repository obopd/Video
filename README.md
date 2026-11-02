# Video

Make YouTube videos from a plain-text script.

You write a short YAML file listing your scenes and what the narrator says. One command turns it into:

| File | What it's for |
| --- | --- |
| `name.mp4` | The video: 1080p H.264/AAC, ready to upload |
| `name.srt` | Captions. Upload them in YouTube Studio → Subtitles |
| `name.thumbnail.png` | A 1280×720 thumbnail |
| `name.description.txt` | Title, description, chapter timestamps and tags to paste into YouTube |

Each scene gets a generated slide or your own image, an AI voiceover, captions timed to the voice, and background music that gets quieter while the narrator talks. Set `resolution: shorts` to make vertical 9:16 Shorts.

## Setup

1. Install **Python 3.10+** and **FFmpeg** (`brew install ffmpeg`, `sudo apt install ffmpeg`, or `winget install ffmpeg`).
2. Install the Python packages:

   ```bash
   pip install -r requirements.txt
   ```

## Make your first video

```bash
python -m ytvideo examples/morning-routine.yaml
```

The video is written to `examples/output/`. To check timing and layout quickly, add `--preview`. That renders at half resolution in a fraction of the time.

To make your own, copy `examples/morning-routine.yaml`, edit it, and run the command on your copy.

## Writing a script

```yaml
title: "My Video Title"
description: "Shown in the YouTube description."
tags: [tag one, tag two]
resolution: landscape          # landscape | 720p | 4k | shorts | [width, height]

voice:
  engine: auto                 # auto | edge | espeak | none
  name: en-US-AndrewNeural     # see: edge-tts --list-voices
  rate: "+5%"

music: assets/music.mp3        # optional; or {file: ..., volume: 0.15, duck: true}

scenes:
  - type: title
    title: "Big title"
    subtitle: "Smaller line"
    narration: "What the narrator says during this scene."

  - type: bullets
    heading: "Three things"
    bullets: ["First", "Second", "Third"]   # revealed one at a time
    chapter: "Three things"                  # becomes a YouTube chapter
    narration: "..."

  - type: image
    image: assets/photo.jpg
    caption: "Optional caption"
    fit: cover                 # cover (fill the screen) or contain (show the whole image)
    motion: zoom               # zoom | zoom-out | pan | none
    narration: "..."

  - type: quote
    quote: "A memorable line."
    author: "Someone"

  - type: text
    heading: "Optional heading"
    text: "A paragraph of text."
    duration: 5                # seconds; used when there is no narration
```

Each scene lasts as long as its narration, plus a short pause. `duration` sets a minimum length.

### Voiceover options

- **`edge`** (default when installed) uses free, natural-sounding Microsoft neural voices through the `edge-tts` package. It needs an internet connection. List the voices with `edge-tts --list-voices`.
- **Your own voice:** record each scene and add `audio: recordings/scene1.mp3` to it. Keep the `narration` text as well, because the captions are made from it.
- **`espeak`** works offline but sounds robotic. It needs `espeak-ng` installed.
- **`none`** makes a silent video. Scene lengths are estimated from the narration word count, which is useful for previews.

Generated speech is cached in `output/.tts-cache/`, so only scenes whose narration changed are synthesized again.

### Other settings

```yaml
fps: 30
output: output/my-video.mp4
subtitles:
  burn: true          # draw captions on the video (set false if you only upload the .srt)
  size: 18            # caption font size
  max_chars: 42       # characters per caption line
theme:                # colors (hex) and optional font files
  background: "#0f172a"
  background2: "#1e293b"
  text: "#f8fafc"
  muted: "#94a3b8"
  accent: "#f59e0b"
  font_bold: /path/to/Font-Bold.ttf
  font_regular: /path/to/Font-Regular.ttf
thumbnail:
  text: "Short Punchy Text"
  image: assets/photo.jpg
  badge: "NEW"
keep_build: false     # keep intermediate files for debugging
```

## Uploading tips

- **Chapters:** YouTube only shows chapters when there are at least 3, the first starts at 0:00, and each lasts 10 seconds or more. The tool adds an "Intro" chapter at 0:00 and leaves chapters out of the description if those rules aren't met.
- **Music:** only use music you have the rights to, such as the YouTube Audio Library. The example `assets/ambient.mp3` was generated for this repo and is free to use.
- **AI voices:** in YouTube Studio, check the "altered or synthetic content" box only if the video shows realistic content that viewers could mistake for real. A plain narration over slides usually doesn't need it.
