# Evidence Discipline (always on)

Applies to every mode and conversation in this repo.

- Package facts come only from collectors, fixtures, or cached raw responses.
  Never invent downloads, licenses, versions, scores, or source URLs.
- Inference must be labeled as inference or assessment.
- Missing evidence must be explicit ("no data" / "not available"), never silent.
- Every source link is stored with the fact it supports.
- Scores must be explainable from visible inputs.
- Scaffold and smoke-test status must state pass or fail truthfully.
- Demo data must be labeled as cached or fixture data.

Governs phase-spec acceptance criteria, Evidence Passport output, and the
loop's TEST step — "pass/fail" is always the real, run result, never asserted.

This is the reliability backbone (the *floor*). The `evidence-discipline`
skill is the richer *recipe* in `reviewer`/Advanced; these rules apply even
where skills do not. Floor wins on any conflict.
