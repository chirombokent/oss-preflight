# Plan Mode — Spec Quality (floor)

A phase spec is **invalid** until it satisfies *every* field of the phase-spec
contract in `docs/bob-prompts.md` §4:

objective · correlation & success measure vs the project goal
(`docs/architecture.md` §17) · self-contained context (`@/` mentions only) ·
scope (in / out / cutline) · preconditions · acceptance criteria ·
quality gates (each names its enforcing rule/skill) · test scenarios
(incl. the must-test list) · integration success (the one-pipeline contract) ·
loop config · evidence artifact · Definition of Done.

Non-negotiable:

- Resolve **all** ambiguity by asking the user *before* writing. A finalized
  spec has **zero open questions**.
- Every acceptance criterion is **binary** — a machine or reviewer says
  pass/fail with no judgement call.
- An Orchestrator must be able to run a phase from its spec **alone**. If it
  needs outside context, the spec is incomplete — fix it.
- Markdown only; no application code. `docs/architecture.md` is the source of
  truth; never contradict it.
- Do not finalize or hand off an incomplete spec. End by asking the user to
  approve `docs/phase-plan.md` before any phase launches.
