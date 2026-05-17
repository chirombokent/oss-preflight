# OSS Preflight BYOK Setup

OSS Preflight can parse intent with Anthropic, Gemini, any OpenAI-compatible
`/v1/chat/completions` endpoint, or the built-in keyword parser.

Provider selection is server-side:

1. CLI flags
2. `OSS_PREFLIGHT_*` environment variables
3. `.oss-preflight/config.json`
4. `ANTHROPIC_API_KEY` backward-compatible inference
5. keyword parser

Secrets stay out of config. `.oss-preflight/config.json` may contain only:

```json
{
  "ai": {
    "provider": "gemini",
    "model": "gemini-2.5-flash",
    "baseUrl": "https://generativelanguage.googleapis.com"
  }
}
```

Set the matching key in your private shell:

```powershell
$env:OSS_PREFLIGHT_AI_PROVIDER="gemini"
$env:GEMINI_API_KEY="..."
oss-preflight recommend --idea "Discord bot that summarizes channel activity" --json
```

For OpenAI-compatible gateways, the model is required:

```powershell
$env:OSS_PREFLIGHT_AI_PROVIDER="openai-compatible"
$env:OSS_PREFLIGHT_AI_MODEL="gpt-5.4-mini"
$env:OSS_PREFLIGHT_AI_BASE_URL="https://api.openai.com/v1"
$env:OPENAI_API_KEY="..."
oss-preflight recommend --idea "Discord bot" --json
```

Inside Bob IDE, use the `oss-preflight-provider` mode to prepare non-secret
examples and docs. Do not paste real provider keys into Bob or commit them.

