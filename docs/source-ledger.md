# OSS Preflight - Public Data Source Ledger

> Required by the IBM Bob Hackathon guide (May 2026, p.4): "Data from public
> websites may be used, if the terms allow for commercial use, but please keep
> a list of the websites you use." This ledger lists every external data source
> OSS Preflight reads, what it reads, and the commercial-use status.
> **Resolve every unverified entry before final submission** (enforced by
> `.bob/rules-reviewer/01-review-floor.md` section B).

## Compliance Statement

- No client data, no personal information (PI), no social-media data, no
  company-confidential data is used (hackathon guide p.4-5). Registry
  maintainer emails and author fields are stripped before metadata is returned
  or cached.
- Only public registry metadata is fetched. No package is installed or executed
  during collection; metadata only (see `docs/architecture.md` section 15).
- No user data is logged or persisted beyond the session.

## Sources

| # | Source | Endpoint / URL | Data used | Commercial-use terms | Status in product |
|---|---|---|---|---|---|
| 1 | npm registry | `https://registry.npmjs.org/{name}/latest` | package name, version, description, license, homepage, repository URL, tarball URL | Verified 2026-05-17: npm Open Source Terms govern the Public Registry and public APIs, and state npm Open Source may be used for commercial projects/business purposes. Source: https://docs.npmjs.com/policies/open-source-terms/ | live + cached (6h TTL); maintainer/user/contributor fields stripped |
| 2 | GitHub REST API | `https://api.github.com/repos/{owner}/{repo}` (+ contributors) | stars, last commit, releases, license | Verified 2026-05-17: GitHub Terms do not restrict lawful access to public repositories; REST API docs permit unauthenticated public-data reads and recommend authenticated, rate-limit-aware requests. Sources: https://docs.github.com/en/site-policy/github-terms/github-terms-of-service and https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api | live + cache-fallback (2h TTL) |
| 3 | PyPI JSON API | `https://pypi.org/pypi/{name}/json` | package name, version, summary, license, homepage/project URLs, distribution URLs | Verified 2026-05-17: PyPI officially documents the JSON API for package metadata; AUP distinguishes API collection from scraping and forbids spam/personal-info resale, which OSS Preflight does not do. Sources: https://docs.pypi.org/api/ and https://policies.python.org/pypi.org/Acceptable-Use-Policy/ | should-ship; live + cached (6h TTL); author/email fields stripped |
| 4 | OpenSSF Scorecard | `https://api.scorecard.dev/projects/github.com/{owner}/{repo}` | security score | Verified 2026-05-17: Scorecard documents the REST API for pre-calculated scores and states REST API data is licensed under CDLA Permissive 2.0. Source: https://github.com/ossf/scorecard#scorecard-rest-api | should-ship; live + cached (24h TTL); missing -> `null` |
| 5 | Anthropic Claude API | Anthropic Messages API | intent parsing + tradeoff narration only; never asserts package facts | Verified 2026-05-17: Claude API use requires an API key and is subject to Anthropic/Claude Commercial Terms. Sources: https://support.claude.com/en/articles/8987200-can-i-use-the-claude-api-for-individual-use and https://platform.claude.com/docs/en/api/overview | live; outputs labeled `inferred` |
| 6 | OpenAI-compatible AI provider | `/v1/chat/completions` compatible endpoint | intent parsing + tradeoff narration only; never asserts package facts | Unresolved: terms/commercial-use verification must be completed for the specific configured provider before final submission. Reference docs: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create and provider-specific terms. | optional BYOK; outputs labeled `inferred` |
| 7 | Google Gemini API | Gemini `generateContent` endpoint | intent parsing + tradeoff narration only; never asserts package facts | Unresolved: terms/commercial-use verification must be completed before final submission. Reference docs: https://ai.google.dev/api and https://ai.google.dev/gemini-api/terms_preview | optional BYOK; outputs labeled `inferred` |

## Cached / Fixture Data

- Pre-warmed cache snapshots of the exact demo packages (`discord.js`,
  `discord.py`, and `eris`) are committed under `.oss-preflight/cache/` as
  live-API insurance for the demo. The committed snapshots are sanitized and
  contain only the fields listed above.
- Every cached fact is labeled `cached` (and `(rate-limited)` /
  `(not available)` where relevant) in the UI. The honesty is part of the
  pitch.
- Any fixture data used in tests is synthetic and labeled as fixture; it is
  never presented to a judge as a live fact.

## Notes

- This is a should-ship artifact that must be complete and verified before
  submission; see `docs/implementation-plan.md` section 10 checklist.
- If a source's terms turn out to disallow the use, remove that collector and
  degrade to fixture data rather than ship non-compliant.
