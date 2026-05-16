---
name: evidence-discipline
description: Ensure OSS Preflight recommendations, Evidence Passports, and scoring code separate verified facts from AI inference and never invent package evidence. Activates on the Orchestrator REVIEW or TEST step, or "check evidence discipline", "verify the fact/inference split", "is this fact sourced", "audit the passport", when working on collectors, scoring, recommendations, Passports, or evidence-displaying UI.
---

# Evidence Discipline

Use this skill whenever working on OSS Preflight collectors, scoring, recommendations,
Passports, or UI views that display package evidence.

## Rules

1. Package facts must come from collectors, fixtures, or cached raw responses.
2. Missing evidence must be explicit: use "no data" or "not available", never silence or imply a fact.
3. Every source link must be stored with the fact it supports.
4. Scores must be explainable from visible inputs.
5. LLM-generated fields must be clearly labeled as inference or assessment, never presented as fact.
6. Scaffold status must be expressed honestly as pass or fail.
7. Avoid overclaiming language such as "guaranteed", "perfect", or "proves best".

## Required checks

Before finishing a task, verify:

- New recommendation fields identify whether they are fact, inference, or mixed.
- Tests cover missing evidence.
- Tests cover stale/cache fallback where relevant.
- Demo-facing copy avoids overclaim.

