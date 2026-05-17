# OSS Preflight — Production Demo Guide

This is the live runbook for demonstrating OSS Preflight (on screen, to judges,
or while recording the screen-capture portion of the submission video). Every
command is copy-paste ready and was verified against the P9 validation gate
(`pnpm validate:production` → 12/12, 0 blockers).

> **One sentence:** You have an idea. OSS Preflight uses IBM Bob and live
> open-source evidence to hand you the right stack — recommendations,
> tradeoffs, and a working starter — before you lose the energy to build it.

---

## 0. Pre-flight checklist (do this 30 min before any demo)

Run these once, in order, from the repo root. Expected results are stated so you
can confirm green before you are live.

```powershell
# 1. Install dependencies
pnpm install
# Expected: completes with no dependency-resolution errors.

# 2. Build every workspace package
pnpm build
# Expected: packages/core, packages/collectors, packages/scaffold,
# packages/cli, apps/web all report a successful build.

# 3. Prove the whole product works (build + tests + live CLI + bridge)
pnpm validate:production
# Expected: "Passed: 12/12  Failed: 0/12  Blockers: 0"
```

If all three are green, the demo will work. Keep that terminal open.

**Reset between rehearsals** (so the demo always looks fresh):

```powershell
Remove-Item -Recurse -Force .\demo-output -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\.oss-preflight\runs -ErrorAction SilentlyContinue
```

The committed evidence cache (`.oss-preflight/cache`) is intentionally **kept** —
it lets the demo run with no network and no API keys.

---

## 1. The four-minute story (what you are proving)

| Section | Time | Claim you are making |
|---|---|---|
| Problem | 0:00–0:35 | Choosing a stack burns momentum before you write useful code. |
| Solution | 0:35–1:05 | One honest pipeline: idea → evidence → scaffold → smoke test. |
| Feature walk-through | 1:05–3:15 | It actually runs, ranks deterministically, and separates fact from inference. |
| Bob evidence | 3:15–3:45 | Bob is part of the SDLC, not just final polish; shipped *as* a Bob skill. |
| Close | 3:45–4:00 | Built in 48h with Bob; you can run the same workflow in your own repo. |

---

## 2. Live demo path A — CLI (most reliable, recommend for the recording)

This is the path the validation gate exercises end-to-end. It cannot silently
break because it uses the committed cache.

### A1. Idea → recommendations → scaffold → smoke test (one command)

```powershell
node packages\cli\dist\index.js run --idea "Discord bot that summarizes channel activity" --out .\demo-output
```

**What to say while it runs:** "I gave it one sentence. It parsed the intent,
discovered candidates across npm and GitHub, gathered public evidence, ranked
them deterministically, scaffolded a starter, and ran its smoke test."

**What to point at on screen:**
- Three ranked recommendations, with `discord.js` at rank 1.
- The generated starter file list under `.\demo-output`.
- The smoke test reporting a passing status.

### A2. Show the recommendation detail + Evidence Passport (the core innovation)

```powershell
node packages\cli\dist\index.js recommend --idea "Discord bot that summarizes channel activity" --json --save
```

Then open the saved file and talk through the **fact / inference split**:

```powershell
code .\.oss-preflight\recommendations\latest.json
```

**What to say:** "Every recommendation carries an Evidence Passport. The left
side is measured fact — registry metadata, license, latest version, last
commit, downloads, OpenSSF score, and the fetch timestamp. The right side is
OSS Preflight's interpretation — goal fit, tradeoffs, warnings. A judge can see
at a glance what is measured and what is assessed. That split is enforced in the
data model, not just the UI."

### A3. (Optional) Audit an existing project — the second real flow

```powershell
node packages\cli\dist\index.js audit --repo fixtures\npm-project --json --out .\demo-output\audit-npm
node packages\cli\dist\index.js audit --repo fixtures\python-project --json --out .\demo-output\audit-py
```

**What to say:** "Same engine, pointed at an existing repo — npm *or* Python.
It detects the stack, runs Evidence Passports over the dependencies, and the
workflow trace records the true ecosystem and discovery method, not a hardcoded
default."

---

## 3. Live demo path B — Web UI (more visual, use if screen-recording the UI)

Two terminals from the repo root.

**Terminal 1 — API server:**

```powershell
pnpm --filter @oss-preflight/web server
# Expected: OSS Preflight API server running on http://localhost:3001
```

**Terminal 2 — Web UI:**

```powershell
pnpm --filter @oss-preflight/web dev -- --host 127.0.0.1
# Expected: Vite prints  Local: http://localhost:3000/
```

Then in the browser:

1. Open `http://localhost:3000`.
2. Enter exactly: `Discord bot that summarizes channel activity`
3. **Expected:** three recommendations appear, `discord.js` is rank 1.
4. Click **Generate Scaffold**. **Expected:** generated files listed, smoke
   test shows passing.
5. Click **Build Proof** in the top navigation. **Expected:** Bob modes,
   skills, session exports, build report, and Bob-assisted commit evidence are
   visible.

The web UI spawns the *real* CLI through the bridge (`/api/recommend`,
`/api/scaffold`, `/api/audit`) — it is not a mock.

---

## 4. Bob evidence to show (judging criterion: Bob as SDLC partner)

Open these and narrate them briefly:

- `bob_sessions/build-report.md` — single evidence ledger.
- `bob_sessions/` — per-session export folders.
- `.bob/skills/oss-preflight-advisor/SKILL.md` — OSS Preflight shipped *as* a
  Bob skill, so the same workflow runs inside the user's own repo.
- `bob_sessions/S09-production-readiness/validation-results.txt` — the real
  gate output (12/12).

**Closing line:** "We built OSS Preflight in 48 hours with Bob. And we shipped
OSS Preflight *as* a Bob skill, so you can run the same workflow inside your own
repo."

---

## 5. Recovery / failure handling (if something goes wrong live)

| Symptom | Fix |
|---|---|
| `node ... dist/index.js` not found | You skipped the build. Run `pnpm build`. |
| Recommendations look empty / network error | The cache should cover it. Re-run; the demo path is offline-safe via `.oss-preflight/cache`. |
| Web UI blank | Confirm **both** terminals are up (3001 API + 3000 Vite). |
| Different package at rank 1 | You changed the idea text. Use the exact string `Discord bot that summarizes channel activity`. |
| Want a clean slate mid-demo | Run the reset commands from section 0. |

**Golden rule for the recording:** record demo **path A (CLI)**. It has the
fewest moving parts and is the path the validation gate proves.

---

## 6. Honest limitations to acknowledge (do not overclaim)

If asked, state these plainly — it is part of the project's evidence discipline:

- Browser e2e is currently a mocked UI smoke; real CLI-path coverage comes from
  the integration tests and the validation gate.
- Live registry search quality varies by ecosystem; offline runs fall back to
  the labeled catalog/cache.
- No public deployment / git tag yet — out of scope, pending human approval.

These are documented in [submission-readiness.md](./submission-readiness.md).
