# VOICE.md — Narrator Voice Spec (Axol's Lab, MCAT series)

Claude Code: read this file before generating any narration. It defines one unique narrator voice, how to create it, and how to remove the common signs of AI-generated speech.

---

## 0. Ground rules

- **Unique, invented voice.** Never clone or imitate a real person, including the narrators of TED-Ed, Kurzgesagt or Amoeba Sisters.
- **Claude cannot hear audio.** Every voice decision ends with Marvin listening. Claude Code automates the measurable checks in section 5 and reports what it flags.
- **Target sound: a professional human narrator in a quiet studio.** Do NOT add deliberate "mess" (fake coughs, stutters, fake noise, fake mic movement). Imperfection added on purpose sounds more artificial, not less.
- **Lock everything** once Marvin approves (section 7). A narrator who sounds slightly different each episode is itself a tell.

---

## 1. Voice identity

| Trait | Spec |
|---|---|
| Role | Off-screen narrator (Axol stays a visual character unless Marvin says otherwise) |
| Personality | A curious, warm friend one step ahead of the viewer. Quiet enthusiasm, an occasional dry joke. Never a hype voice, never a lecturer |
| Accent | Neutral General American (most MCAT takers are in the US/Canada) |
| Age / pitch | Late 20s to early 30s, mid-to-low pitch |
| Average pace | 145–165 words per minute |
| Slow down | 120–135 wpm on new terms, equations, and the key takeaway of each section |
| Speed up | Slightly, on asides and jokes |
| Energy | 6/10: calm but awake. Avoid the over-caffeinated "AI hype" delivery |

---

## 2. Creating the voice (pick ONE route)

### Route A — ElevenLabs Voice Design (most human result, paid)

1. Use the Voice Design API to generate previews from Description A and Description B below (both read the same 45-second test script from section 4).
2. Marvin listens and picks one preview. Save it as a permanent voice.
3. Store the voice ID in `.env` as `NARRATOR_VOICE_ID`.
4. Before publishing, confirm the plan allows commercial use and that its monthly quota covers ~300 minutes (10 min/day).

**Description A (male):**
> A warm, curious male narrator in his late twenties with a neutral General American accent. Mid-low pitch, relaxed conversational pace, like a friend explaining something fascinating over coffee. Natural rises and falls, a slight smile in the voice, clear consonants. Recorded close to a high-quality microphone in a quiet, treated studio.

**Description B (female):**
> A warm, curious female narrator in her late twenties with a neutral General American accent. Mid pitch, relaxed conversational pace, like a friend explaining something fascinating over coffee. Natural rises and falls, a slight smile in the voice, clear consonants. Recorded close to a high-quality microphone in a quiet, treated studio.

### Route B — Kokoro (free, runs offline)

1. Install Kokoro-82M (Apache-2.0 at time of writing; re-check the license).
2. Create a unique voice by **weighted blending** of built-in voice styles. Starting candidates:
   - Female: `af_heart`, `af_bella`, `af_nicole`
   - Male: `am_michael`, `am_fenrir`, `am_puck`
3. Generate 8–12 blends at different weights reading the same test script. Marvin picks one.
4. Save the chosen blend as a fixed voice file (`voices/narrator.pt` or `.bin`) so every run is identical.

**Limits:** fewer natural breaths and less emotional range than Route A, and the male base voices are generally weaker than the female ones. Use this route if budget matters more than the last bit of realism.

---

## 3. AI-voice tells and the fix for each

| # | Tell (what listeners notice) | Fix |
|---|---|---|
| 1 | Perfectly even pace, every sentence the same speed | Script varies sentence length; slow down on key terms (section 1); small per-chunk speed changes (±5%) |
| 2 | Sing-song or flat intonation; the same rise and fall repeating | Vary sentence openings; mix statements and questions; make 2–3 takes of a flagged chunk and keep the one with the most natural pitch range |
| 3 | Stress on the wrong word | Mark the one key word per sentence in the script; rephrase any sentence the model keeps misreading |
| 4 | A term pronounced right once, wrong later | Shared pronunciation dictionary for MCAT terms (IPA), reused in every video; speech-to-text check (section 5) |
| 5 | No breathing, or mechanical evenly spaced breaths | Keep the breaths the model produces, lowered 6–10 dB. Never delete all of them. Never paste in artificial breaths |
| 6 | Words separated too cleanly | Write contractions and natural phrasing ("it's", "that's why"); write symbols as spoken words |
| 7 | Overdone or mismatched emotion | Energy 6/10; carry emotion through the wording, not stacked style tags; exclamation marks only for real surprises |
| 8 | Pitch or tone jumps between stitched clips | Generate by paragraph, not by sentence; pass neighbouring text as context if the API supports it; identical settings for every chunk; 10–20 ms crossfades |
| 9 | Glitches, metallic undertone, stretched syllables | Automated glitch check; regenerate flagged chunks; don't cram many pause tags into one request (known to cause instability) |
| 10 | Silence that drops to dead digital zero | Continuous, very quiet room-tone bed under the whole narration |
| 11 | Too clean, voice floating in no space | Very subtle small-room reverb and gentle EQ, identical every video |
| 12 | Over-compressed, flattened dynamics | Light compression only (section 6) |
| 13 | Same delivery pattern for 10 minutes straight | Vary paragraph rhythm; short beat before reveals; rotate example styles; no recurring template phrases |
| 14 | "Over-caffeinated" AI accent | Speed ≤ 1.0, moderate expressiveness; test a calmer setting first |

---

## 4. Script rules (the biggest lever)

- **Write for the ear, not the page.** Read every line as if saying it to one friend.
- **Sentence length:** average 12–16 words, but mix very short sentences (3–5 words) with longer ones.
- **One idea per sentence.** Use spoken transitions: "Here's the catch.", "Okay, so…", "Now watch what happens."
- **Spell out symbols and formulas as spoken:** `ΔG = ΔH − TΔS` → "delta G equals delta H minus T delta S". Units and numbers too: "3.0 × 10⁸ m/s" → "three times ten to the eighth meters per second".
- **Pauses:** commas and dashes for short pauses, a paragraph break for a longer beat. Explicit pause tags only where truly needed.
- **Banned phrases** (AI-script tells): "Let's dive in", "delve", "In today's video", "It's important to note", "In conclusion", "Buckle up", "fascinating world of".
- **Length check:** estimate duration at 155 wpm; total must fit the 8–10 minute target.

**Test script (use for every voice audition):**
> Okay, quick question. Why does ice float? Almost every other solid sinks in its own liquid. Water is the weird one. Here's the catch: when water freezes, its molecules lock into a pattern that takes up *more* space, not less. More space, same mass, lower density. And that tiny quirk is the reason lakes freeze from the top down, and why fish survive the winter. So, next time you drop ice in a drink, you're watching hydrogen bonding win an argument with gravity.

---

## 5. Automated quality checks (because Claude can't listen)

Run on every narration chunk:

1. **Accuracy:** transcribe with a local speech-to-text model (e.g. Whisper) and compare with the script. Flag word error rate above 3%, or ANY mismatch on an MCAT term.
2. **Pace:** flag chunks outside 120–175 wpm.
3. **Pitch range:** measure pitch variation; flag chunks unusually narrow (monotone) or unusually wide (sing-song) compared with the voice's own baseline.
4. **Glitches:** flag clipped samples, clicks, and sudden spectral spikes.
5. **Retakes:** for flagged chunks, generate up to 3 takes and keep the best by these scores.
6. **Report:** list the timestamps of anything still flagged so Marvin can listen to those spots first.

Marvin's listening pass: spot-check each finished video for ~2 minutes, on headphones and on a phone speaker.

---

## 6. Audio chain (fixed, same for every video)

1. Trim leading/trailing silence to natural short beats (never to zero).
2. High-pass around 80 Hz; gentle cut of any harshness; light de-essing.
3. Light compression (about 2:1 to 3:1, a few dB of gain reduction).
4. Very subtle small-room reverb.
5. Quiet room-tone bed under the full narration.
6. Background music ducked about 10–12 dB under the voice.
7. Final loudness: about −14 LUFS integrated, true peak ≤ −1 dBTP.

---

## 7. Lock it

After Marvin approves the voice, save in `voice.config.json`:
- Route (A or B), voice ID or blend file path
- Model name and version
- All voice settings (speed, stability/expressiveness, etc.)
- Audio-chain parameters
- Path to the pronunciation dictionary

Do not change any of these without Marvin's approval.

---

## 8. Disclosure

YouTube requires disclosure for realistic AI content that viewers could mistake for a real person, place or event. An invented narrator over animation usually falls outside that, but YouTube states that disclosure does not limit reach or monetization, so tick it when unsure.

---

## 9. First-run instructions for Claude Code

1. Read this file.
2. Set up Route A (or Route B if Marvin chooses free).
3. Generate the auditions using the section 4 test script and send them to Marvin.
4. After Marvin picks, build the pronunciation dictionary from the Chem/Phys terms in the current script, run section 5 checks, and lock the config (section 7).

---

## Research sources

- Dr Iain McGregor, "How to hear AI-generated or heavily edited audio" — https://www.asoundeffect.com/how-to-detect-ai-generated-or-edited-audio/
- "How to tell if audio is AI-generated? 10 obvious signs" — https://async.com/blog/how-to-tell-if-audio-is-ai-generated/
- "The 'AI accent'…" — https://www.aol.com/articles/ai-accent-might-easiest-way-120018498.html
- ElevenLabs Voice Design API — https://elevenlabs.io/docs/api-reference/text-to-voice/design
- ElevenLabs TTS best practices (pauses, IPA pronunciation) — https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices
- Kokoro voice blending — https://libraries.io/pypi/kokoro-tts
- YouTube: Disclosing use of GenAI content — https://support.google.com/youtube/answer/14328491
