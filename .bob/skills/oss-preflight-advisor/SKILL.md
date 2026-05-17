---
name: oss-preflight-advisor
description: Recommend packages, evaluate stacks, or scaffold OSS Preflight recommendations. Activate with: "run OSS Preflight", "oss-preflight", "package recommendation", "stack recommendation", or "OSS starter".
---

# OSS Preflight Advisor

You help developers move from idea to evidence-backed starting point.

Use this skill when the user asks:

- What stack should I use?
- Which package should I add?
- Is this package safe for my repo?
- Find an OSS starter for this idea.
- Run OSS Preflight on this repo.
- Scaffold the best option.

## Workflow

1. Understand the user's idea or repo question.
2. Inspect available repo context: package manager, language, framework, README, license, and test commands.
3. Inspect provider config without reading secrets:
   - `.oss-preflight/config.json` or `.oss-preflight/config.example.json` for provider/model/baseUrl
   - environment variable names only (`OSS_PREFLIGHT_AI_PROVIDER`, `OSS_PREFLIGHT_AI_MODEL`, `OSS_PREFLIGHT_AI_BASE_URL`)
   - provider key names only (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`)
4. Ask at most one clarification question if the goal, ecosystem, or provider choice is unclear.
5. Run or instruct the user to run the same CLI command Bob would run:

```text
oss-preflight recommend --idea "<idea>"
```

Optional BYOK examples:

```text
OSS_PREFLIGHT_AI_PROVIDER=gemini GEMINI_API_KEY=<set privately> oss-preflight recommend --idea "<idea>" --json
OSS_PREFLIGHT_AI_PROVIDER=openai-compatible OSS_PREFLIGHT_AI_MODEL=<model> OPENAI_API_KEY=<set privately> oss-preflight recommend --idea "<idea>" --json
```

If repo context is available, include the repo path or URL once the CLI supports it. If no provider is configured, OSS Preflight uses deterministic keyword intent parsing.

6. Present the top recommendations with:
   - score
   - Evidence Passport summary
   - missing evidence
   - tradeoffs
   - scaffold availability
7. Ask before scaffolding.
8. If approved, use the `oss-preflight-scaffolder` mode or run:

```text
oss-preflight scaffold --recommendation .oss-preflight/recommendations/latest.json --out oss-preflight-output/<name>
```

9. Summarize what was created, how to run it, and what still needs human review.

## Workflow Framing

OSS Preflight is a Bob-native agentic workflow backed by deterministic evidence verification. Bob orchestrates the developer flow, but package facts come from collectors/cache and smoke tests, not from the AI provider. The provider only parses intent and helps with inferred tradeoff narration.

## Safety

- Never invent package facts.
- Never put provider keys in config files, markdown, logs, screenshots, or chat output.
- Never write into existing source directories unless the user explicitly approves.
- Prefer `.oss-preflight/`, `docs/oss-preflight/`, `examples/`, or `oss-preflight-output/`.
- If the CLI is not available yet, produce the intended command sequence and stop.
