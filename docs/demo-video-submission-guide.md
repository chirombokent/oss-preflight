# OSS Preflight — Demo Video + Submission Guide (one path, no options)

This is the single, definitive, copy-paste production plan. It is **interview
style**: an AI **Host** avatar asks about OSS Preflight and an AI **Expert**
avatar answers, intercut with a screen recording of the real product under an
AI voice-over. Everything visible is AI-generated except the actual terminal
output of the demo (which must be real — that is the point of the demo).

**Tools chosen for you (decision made, do not substitute):**

| Job | Tool | Why this one |
|---|---|---|
| Interview avatars (Host + Expert) | **HeyGen Studio** (`app.heygen.com/create-v4`) | Multi-scene, multi-avatar in one timeline — built for two-speaker interviews. Free: 3 videos/mo, 1 min each, 720p, watermark. |
| Cinematic intro/outro B-roll | **Google Flow / Veo 3.1** (`labs.google/fx/tools/flow`) | Free for any Google account, ~7 clips day one. |
| Screen-recording voice-over | **Edge TTS** | Free, unlimited, no API key — needed because HeyGen free is video-limited and the demo VO is long. |
| Screen recording | **Clipchamp recorder** | 1080p, no watermark, unlimited retakes. |
| Final assembly | **CapCut** | Full editor, 1080p export, no watermark. |

Runtime target: **under 4:00**. Work top to bottom; each step ends with a
**Validate:** line so you know it worked before moving on.

---

## STEP 0 — Project pre-flight (must pass before recording)

From the repo root in PowerShell:

```powershell
pnpm install
pnpm build
pnpm validate:production
```

**Validate:** the last command prints `Passed: 12/12  Failed: 0/12  Blockers: 0`.
If not, fix the product before making the video. Then create the asset folder:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\Desktop\ossp-demo-assets" | Out-Null
```

**Validate:** the folder exists on your Desktop.

---

## STEP 1 — The interview script (final, already written)

Total ≈ 470 words ≈ 3:40 spoken + visuals = under 4:00. Five blocks:

| Block | Speaker / source | Where it is made |
|---|---|---|
| Q1 + A1 — Problem & solution | Host avatar → Expert avatar | HeyGen Video 1 |
| VO — Product walkthrough | AI voice over screen recording | Edge TTS |
| Q2 + A2 — Bob, trust & close | Host avatar → Expert avatar | HeyGen Video 2 |

### HeyGen Video 1 — Q1 (Host) then A1 (Expert)

**HOST (Q1):**
```
So you built OSS Preflight for the IBM Bob Hackathon. In one breath — what problem does it actually solve?
```

**EXPERT (A1):**
```
AI made writing code cheap. It did not make choosing what to build with cheap. Every project stalls in the same gap: you have an idea, but npm, PyPI, GitHub, and a hundred starter templates give you more options than anyone can vet by hand. So package choice ends up driven by memory, popularity, or whatever ranked first in search, and facts get mixed up with guesses. OSS Preflight closes that gap at the moment of decision. You give it one sentence. It turns that into a structured intent, discovers real candidates across open-source registries, gathers public evidence on each, ranks them deterministically, and then scaffolds a working starter with a passing smoke test. You leave with running code, not just an opinion.
```

### Screen-recording voice-over (Edge TTS) — Product walkthrough

```
Here it is on a real idea. I ask for a Discord bot that summarizes channel activity, and one command runs the whole workflow. It parses the intent, discovers candidates across npm and GitHub, collects evidence, and returns three ranked recommendations, with discord dot js at rank one. Now look at the Evidence Passport. On the left are measured facts: license, latest version, last commit, downloads, OpenSSF score, and the exact timestamp the data was fetched. On the right is OSS Preflight's interpretation: goal fit, tradeoffs, and warnings. You always know what was measured versus what was assessed, and that split is enforced in the data model, not just on screen. Then it scaffolds a starter project with mocked messages and a runnable smoke test, and the test passes. The same engine also audits an existing repository, npm or Python, and reports the true stack it found.
```

### HeyGen Video 2 — Q2 (Host) then A2 (Expert)

**HOST (Q2):**
```
That's the product. Where does IBM Bob fit in, and why should anyone trust these recommendations?
```

**EXPERT (A2):**
```
Bob was the engineering partner across the whole lifecycle, not just final polish. Bob modes, skills, session exports, and a single build-report ledger are all committed in the repo as evidence. A production validation gate runs the real product end to end and reports twelve of twelve checks with zero blockers, and its real output is committed as an artifact, so the claims are verifiable, not marketing. On trust: OSS Preflight gives evidence-backed confidence, not certainty — it never hides what is a measured fact and what is its own inference. And the part we like most: OSS Preflight ships as a Bob skill itself. We built it in forty-eight hours with Bob, and you can run the exact same workflow inside your own repository. OSS Preflight — the right stack, before you lose the energy to build it.
```

---

## STEP 2 — Generate the interview in HeyGen Studio

Open `https://app.heygen.com/create-v4` and sign in (free plan). This opens
**HeyGen Studio**. You will make **two** videos here.

### 2A. HeyGen Video 1 (Q1 + A1)

1. You are in the Studio editor. On the **right panel**, click the **Avatar
   icon**, then click the **Avatar Name** to open the avatar picker. Pick a
   free stock avatar to be the **HOST** (choose any professional-looking one).
   **Validate:** the avatar appears in the scene preview.
2. Still on the right panel, open **Voice**. Set a clear professional voice
   (use a male English voice such as **"Andrew"** or similar — this matches the
   Edge TTS voice you will use for the screen recording so the video sounds
   consistent). Click **Play ▶︎** to preview. **Validate:** you hear the voice.
3. In the script text field for **Scene 1**, paste the **HOST (Q1)** text from
   Step 1. **Validate:** the estimated duration shows roughly 8–12 seconds.
4. Click **+ Scene** below the script → choose **+ Blank Scene**.
   **Validate:** a Scene 2 thumbnail appears in the bottom timeline.
5. With **Scene 2** selected, click the **Avatar icon** → **Avatar Name** and
   pick a **different** free avatar to be the **EXPERT**. **Validate:** Scene 2
   preview shows the second avatar (different from Scene 1).
6. Set the **Expert's voice** the same as the Host's (or a second clear voice).
   In the Scene 2 script field, paste the **EXPERT (A1)** text from Step 1.
   **Validate:** Scene 2 estimated duration is roughly 40–55 seconds; total of
   both scenes is **under 60 seconds** (free-plan limit). If over 60s, trim the
   last sentence of A1.
7. Optional polish: place the cursor between sentences and click **Pause** (use
   the +/– to set ~0.5s) for natural pacing.
8. Click **Submit** / **Generate** (top right). Review any "No Avatar in Video"
   warning pop-up — it should not appear since both scenes have avatars; if a
   different warning appears, fix the named scene and submit again.
   **Validate:** the job shows "Processing"; when done it lands in **Projects**
   / **Home**.
9. Download the MP4 (hover the finished video → **Download**) to
   `Desktop\ossp-demo-assets` and rename it `heygen-1.mp4`.
   **Validate:** `heygen-1.mp4` plays, ≤60s, 720p, HeyGen watermark present
   (expected on free plan).

### 2B. HeyGen Video 2 (Q2 + A2)

Repeat 2A exactly with a **New video** (top-left **+ Create Video** →
**Landscape** → Studio), using the **same two avatars and voices** (Host for
Scene 1 = Q2, Expert for Scene 2 = A2). **Validate:** total under 60s; download
as `heygen-2.mp4`. You have now used 2 of your 3 free monthly videos — keep the
third in reserve for a re-take.

---

## STEP 3 — Generate intro/outro B-roll in Google Flow (Veo 3.1)

Open `https://labs.google/fx/tools/flow` and sign in with a personal Google
account (18+). **Validate:** the Flow workspace loads.

1. Click **+ New project**. **Validate:** an empty project opens with a prompt
   box at the bottom.
2. In the settings before generating, set: **Aspect ratio = Landscape (16:9)**,
   **Generator model = Veo 3.1**, **Variations = 1**. **Validate:** the
   settings panel shows Veo 3.1 selected.
3. In the bottom toolbar choose **"Video from description"**, then paste the
   **intro** prompt and submit:
   ```
   Chaotic glowing code dependencies and package icons swirling around a single overwhelmed developer at a desk, dark navy cinematic lighting, slow camera push-in, abstract, no text
   ```
   **Validate:** after ~30–60s an 8-second clip appears.
4. Click the **down arrow** at the top-right of the clip → choose the **1080p
   ("detailed")** download. Save to `Desktop\ossp-demo-assets` as
   `broll-intro.mp4`. **Validate:** file plays.
5. New prompt in the same project for the **outro**, generate, download as
   `broll-outro.mp4`:
   ```
   A clean paper airplane made of glowing code lines launching over a calm horizon at dawn, teal and gold palette, cinematic slow motion, no text
   ```
   **Validate:** `broll-outro.mp4` plays. (Each clip costs 20 of your free 50
   daily credits + 100 first-time bonus, so two clips is well within budget.)

---

## STEP 4 — Generate the screen-recording voice-over (Edge TTS)

Install once, then generate the single VO file:

```powershell
pip install edge-tts
cd "$env:USERPROFILE\Desktop\ossp-demo-assets"

edge-tts --voice en-US-AndrewNeural --text "Here it is on a real idea. I ask for a Discord bot that summarizes channel activity, and one command runs the whole workflow. It parses the intent, discovers candidates across npm and GitHub, collects evidence, and returns three ranked recommendations, with discord dot js at rank one. Now look at the Evidence Passport. On the left are measured facts: license, latest version, last commit, downloads, OpenSSF score, and the exact timestamp the data was fetched. On the right is OSS Preflight's interpretation: goal fit, tradeoffs, and warnings. You always know what was measured versus what was assessed, and that split is enforced in the data model, not just on screen. Then it scaffolds a starter project with mocked messages and a runnable smoke test, and the test passes. The same engine also audits an existing repository, npm or Python, and reports the true stack it found." --write-media demo-vo.mp3
```

**Validate:** `demo-vo.mp3` exists and, on playback, is ~75–90 seconds of clear
speech. Use the **same voice family** (`Andrew`) you picked in HeyGen so the
narration is consistent across the video.

---

## STEP 5 — Record the screen (Clipchamp recorder)

Record demo **path A (CLI)** from
[production-demo-guide.md](./production-demo-guide.md) — the offline-safe,
gate-proven path.

Prep:

```powershell
cd "c:\Users\Computer\Documents\Dreamverse Holdings\Main Projects\oss-preflight"
Remove-Item -Recurse -Force .\demo-output -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\.oss-preflight\runs -ErrorAction SilentlyContinue
```

Increase terminal font size, full-screen the terminal, silence notifications.

1. Go to `https://clipchamp.com`, log in with a Microsoft account.
   **Validate:** the editor opens.
2. Click **Create a video** → **Record & create** → **Screen recording**.
   Choose **full screen**, **no microphone** (the VO is from Edge TTS).
   **Validate:** the screen-record control bar appears.
3. Click **Record**, then run these in order, pausing ~2s on each meaningful
   output so it can be synced to the VO:
   ```powershell
   node packages\cli\dist\index.js run --idea "Discord bot that summarizes channel activity" --out .\demo-output
   node packages\cli\dist\index.js recommend --idea "Discord bot that summarizes channel activity" --json --save
   code .\.oss-preflight\recommendations\latest.json
   node packages\cli\dist\index.js audit --repo fixtures\npm-project --json --out .\demo-output\audit-npm
   node packages\cli\dist\index.js audit --repo fixtures\python-project --json --out .\demo-output\audit-py
   ```
   While `latest.json` is open, scroll slowly so the facts-vs-interpretation
   split is visible.
4. Stop the recording. **Validate:** the clip appears in the Clipchamp project;
   `discord.js` is visibly rank 1 and the smoke test shows passing.
5. Export just this recording: **Export → 1080p**. Save to
   `Desktop\ossp-demo-assets` as `screen-demo.mp4`. **Validate:** it plays at
   1080p with no watermark.

---

## STEP 6 — Assemble in CapCut (1080p, no watermark)

1. `https://www.capcut.com` → sign in → **New project**. **Validate:** editor
   opens with an empty timeline.
2. Upload from `Desktop\ossp-demo-assets`: `broll-intro.mp4`, `heygen-1.mp4`,
   `screen-demo.mp4`, `demo-vo.mp3`, `heygen-2.mp4`, `broll-outro.mp4`.
   **Validate:** all six appear in the media bin.
3. Lay the timeline left to right in this exact order:
   1. `broll-intro.mp4` (~6s) + title card **"OSS Preflight — IBM Bob
      Hackathon"**.
   2. `heygen-1.mp4` (Host Q1 + Expert A1, ~55s).
   3. `screen-demo.mp4`, **muted**, with `demo-vo.mp3` on the audio track under
      it (~80s). Speed up any slow command waits so video matches the VO
      length.
   4. `heygen-2.mp4` (Host Q2 + Expert A2, ~55s).
   5. `broll-outro.mp4` (~6s) + closing title card with the repo URL.
4. Add **lower-third captions** for each CLI command shown, and on-screen labels
   **"Facts"** vs **"Interpretation"** during the `latest.json` scroll.
5. Run **Auto captions** for accessibility; proofread them.
   **Validate:** preview total runtime is **under 4:00**; audio is continuous
   with no gaps between blocks; the demo VO lines up with the matching screen
   action.

---

## STEP 7 — Final checks and export

- **Continuity:** Host→Expert→demo VO→Host→Expert flows as one conversation; no
  dead air; the screen recording is muted under the Edge TTS VO.
- **Runtime:** under **4:00**. Trim/ speed up if over.
- **Watermarks:** present only on `heygen-1/2.mp4` (HeyGen free) and acceptable;
  CapCut/Flow/Clipchamp parts are clean.
- **Preview** the whole video once end to end.
- **Export:** CapCut **Export → 1080p → Export**. Save as
  `oss-preflight-demo.mp4`. **Validate:** final file is 1080p, under 4 minutes,
  plays start to finish with synced audio.

---

## STEP 8 — Submit (sequential checklist)

Do these in order; stop at the first failure.

1. **Re-run the gate** (prove submitted code is green):
   ```powershell
   cd "c:\Users\Computer\Documents\Dreamverse Holdings\Main Projects\oss-preflight"
   pnpm validate:production
   ```
   **Validate:** `12/12, 0 blockers`.
2. **Clean transient demo output:**
   ```powershell
   Remove-Item -Recurse -Force .\demo-output -ErrorAction SilentlyContinue
   ```
3. **Confirm submission docs exist:** `README.md`,
   `docs/submission-readiness.md`, `docs/production-demo-guide.md`,
   `docs/demo-video-submission-guide.md`,
   `docs/oss-preflight-submission-deck.pdf`, `bob_sessions/build-report.md`,
   `bob_sessions/` session folders,
   `bob_sessions/S09-production-readiness/validation-results.txt`.
4. **Upload the video** to YouTube (Unlisted) or the platform the hackathon
   requires. Copy the public link. **Validate:** the link plays in an incognito
   window.
5. **Add the video link to the README.** Tell me the URL and I will insert a
   "Demo Video" section, or add it yourself near the top of `README.md`.
6. **Commit and tag — only on your explicit go-ahead** (I will not push without
   it):
   ```powershell
   git add -A
   git status
   # on your approval:
   # git commit -m "Submission: OSS Preflight final"
   # git tag -a submission -m "IBM Bob Hackathon submission"
   ```
7. **Submit on lablab.ai:** title **OSS Preflight**, the repo URL, the video
   link, and the one-line pitch:
   > You have an idea. OSS Preflight uses IBM Bob and live open-source evidence
   > to hand you the right stack — recommendations, tradeoffs, and a working
   > starter — before you lose the energy to build it.
8. **Final sanity check:** open the submitted repo link in incognito; confirm
   README renders, the video link works, and the Bob evidence folders are
   present.

---

## Sources used to verify the tool steps

- [HeyGen — Create your first video in Studio](https://help.heygen.com/en/articles/11049837-create-your-first-video-in-our-studio)
- [HeyGen Avatar IV complete guide](https://help.heygen.com/en/articles/11269603-heygen-avatar-iv-complete-guide)
- [Google Veo 3.1 free — how to use (2026)](https://www.veo3ai.io/blog/google-veo-3-1-free-how-to-use-guide-2026)
- [How to create a video in Google Flow / Veo 3.1](https://incrypted.com/en/how-create-video-googles-veo-31/)
