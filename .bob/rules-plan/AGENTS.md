# Plan Mode - Project-Specific Rules

## Plan Mode Constraints

From `.bob/custom_modes.yaml` lines 47-52:
- **Markdown-only by design**: Can only edit `docs/`, `context/`, `bob/`, `.bob/` markdown/txt/yaml
- Cannot edit application code - this enforces spec-before-code discipline
- No `command` or `browser` groups - read and MCP only
- Cannot activate skills (no `skill` group) - relies on always-on `.bob/rules/` floor

## Phase Spec Contract (Non-Negotiable)

From `.bob/rules-plan/01-spec-quality.md`:

A phase spec is INVALID until it satisfies EVERY field:
- Objective with correlation to project goal (`docs/architecture.md` §17)
- Self-contained context (`@/` mentions only)
- Scope (in/out/cutline)
- Preconditions
- Acceptance criteria (binary, testable)
- Quality gates (each names its enforcing rule/skill)
- Test scenarios (including must-test list)
- Integration success (one-pipeline contract)
- Loop config
- Evidence artifact
- Definition of Done

**Zero open questions** - resolve ALL ambiguity by asking user BEFORE writing spec.

## Phase-Plan Generator Pattern

From `docs/implementation-plan.md` §4 and `docs/bob-build-guide.md` §7:
- `docs/phase-plan.md` is a GENERATED artifact (not hand-written)
- Created by Plan mode using the generator prompt (`docs/bob-prompts.md` §3)
- One self-contained, Orchestrator-ready spec per P-phase
- Each phase spec must be independently executable by Orchestrator

## Plan Council Gate (Mandatory)

From `.bob/custom_modes.yaml` lines 107-112:
- Before ANY phase builds, `docs/phase-plan.md` must have `## Council Verdict = PASS`
- If absent/stale/FAIL, run `plan-council` skill (5 adversarial teams)
- Gate = MIN team score ≥9 AND zero blockers (never averaged)
- Cap 3 revision rounds, then STOP and escalate
- Never lower the bar

## Mermaid Diagram Rules

From `.bob/custom_modes.yaml` lines 43-44:
- Include Mermaid diagrams where they clarify
- Avoid double quotes and parentheses inside square brackets in Mermaid
- This prevents Mermaid parsing errors

## Spec References Architecture

From `.bob/custom_modes.yaml` lines 41-42:
- Specs reference `docs/architecture.md` as source of truth
- Treat Bob evidence artifacts as must-ship
- Never contradict architecture.md

## Todo List Format

From `.bob/custom_modes.yaml` lines 39-41:
- Each todo item must be: specific, ordered, single-outcome
- Executable by another mode independently
- No nested or dependent todos

## Handoff Protocol

From `.bob/custom_modes.yaml` lines 45-46:
- End by asking user to approve spec
- Then request switch to code mode (or hand back to Orchestrator)
- Never proceed to implementation without approval

## Cutline Awareness

From `docs/implementation-plan.md` §2:
- Must ship: npm/GitHub collectors, Discord scaffold, web UI, CLI, Bob proof
- Should ship: PyPI, OpenSSF, repo flow
- Cut first: Hugging Face, MCP, Bobalytics, multiple templates

When scope is ambiguous, STOP and ask clarifying question.