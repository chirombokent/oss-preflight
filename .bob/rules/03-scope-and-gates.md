# Scope & Gates (always on)

Protect the cutline. Favor the must-ship path: idea-to-recommendation,
Evidence Passport (fact/inference split), scaffold, smoke test, and Bob
build proof.

Cut first if behind: Hugging Face collector, MCP server, Bobalytics,
multiple scaffold templates, advanced repo similarity, live judge-repo audit.

Decision gates are binary and answered out loud:
- Hour 14: CLI works or drop the UI.
- Hour 24: UI works or drop the repo flow.
- Hour 38: three clean demo runs recorded or record the backup video now.

These are product/timeline cutlines, not Bob usage caps. Extra Bob loops may
be used before a gate only when they create measurable quality or readiness.

When scope, a gate, or a requirement is ambiguous: stop and ask a clarifying
question. Do not guess on scope.

The Orchestrator loop invariants are non-negotiable (see
`.bob/rules-orchestrator/`): never commit autonomously; never skip review or
test; refuse a phase spec missing any `bob-prompts.md` §4 field and escalate;
continue build loops while they produce measurable acceptance-criteria
progress; stop and escalate the precise gap when progress stalls or a real
external decision is required.

Full plan: docs/implementation-plan.md. Source of truth: docs/architecture.md.
