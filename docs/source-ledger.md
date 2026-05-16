# OSS Preflight — Public Data Source Ledger

> Required by the IBM Bob Hackathon guide (May 2026, p.4 — *"Data from public
> websites may be used, if the terms allow for commercial use, but please keep
> a list of the websites you use."*). This ledger lists every external data
> source OSS Preflight reads, what it reads, and the commercial-use status.
> **Resolve every "⏳ to verify" before final submission** (enforced by
> `.bob/rules-reviewer/01-review-floor.md` §B).

## Compliance statement

- No client data, no personal information (PI), no social-media data, no
  company-confidential data is used (hackathon guide p.4–5).
- Only **public registry metadata** is fetched. **No package is installed or
  executed** — metadata only (see `docs/architecture.md` §15).
- No user data is logged or persisted beyond the session.

## Sources

| # | Source | Endpoint / URL | Data used | Commercial-use terms | Status in product |
|---|---|---|---|---|---|
| 1 | npm registry | `https://registry.npmjs.org/{name}/latest` | package name, version, license, dist-tags | ⏳ verify npm registry ToS allows automated metadata read for commercial use | live + cached (6h TTL) |
| 2 | GitHub REST API | `https://api.github.com/repos/{owner}/{repo}` (+ contributors) | stars, last commit, releases, license | ⏳ verify GitHub API ToS (authenticated, rate-limited) | live + cache-fallback (2h TTL) |
| 3 | PyPI JSON API | `https://pypi.org/pypi/{name}/json` | package name, version, license | ⏳ verify PyPI ToS | should-ship; live + cached (6h TTL) |
| 4 | OpenSSF Scorecard | Scorecard API | security score | ⏳ verify OpenSSF terms | should-ship; live + cached (24h TTL); missing → `null` |
| 5 | Anthropic Claude API | Anthropic API (Haiku, low temp) | intent parsing + tradeoff narration only — **never asserts package facts** | ✅ commercial API under Anthropic commercial terms (API key, paid) | live; outputs labeled `inferred` |

## Cached / fixture data

- Pre-warmed cache snapshots of the exact demo packages (discord.js,
  discord.py, the starter repo) are committed under `.oss-preflight/cache/`
  as live-API insurance for the demo. Every cached fact is labeled `cached`
  (and `(rate-limited)` / `(not available)` where relevant) in the UI — the
  honesty is part of the pitch.
- Any fixture data used in tests is synthetic and labeled as fixture; it is
  never presented to a judge as a live fact.

## Notes

- This is a should-ship artifact that must be **complete and verified before
  submission** — see `docs/implementation-plan.md` §10 checklist.
- If a source's terms turn out to disallow the use, remove that collector and
  degrade to fixture data rather than ship non-compliant.
