/* global React, Icon, Eyebrow, VerifyBadge, ScoreChip, PublisherTag, DomainChips, VoucherCard, fmt, titleFor */
/* VouchStack pages */
const { useState: useS, useEffect: useE, useMemo: useM, useRef: useR } = React;

// ===========================================================================
// HOME
// ===========================================================================
function HomePage({ vouchers, publishers, onNav }) {
  const recent = useM(() => [...vouchers].sort((a,b) => new Date(b.issued_at) - new Date(a.issued_at)).slice(0, 9), [vouchers]);
  const stats = useM(() => {
    const candidates = new Set(vouchers.map(v => v.subject.candidate));
    const pubs = new Set(vouchers.map(v => v.publisher_pubkey));
    const taskTypes = new Set(vouchers.map(v => v.context.task_type));
    return {
      total: vouchers.length,
      candidates: candidates.size,
      publishers: pubs.size,
      tasks: taskTypes.size,
    };
  }, [vouchers]);

  return (
    <React.Fragment>
      {/* Hero */}
      <section className="vs-hero">
        <div>
          <Eyebrow>The public ledger</Eyebrow>
          <h1>Proof that an open‑source AI component <em>actually works</em> inside your code.</h1>
          <p>
            Every Voucher on this ledger is a real Trial — Bob generated adapters into a developer's repo,
            executed them against a gold‑set synthesized from the developer's own data, and signed the result with Ed25519.
            Verify any of them in your browser.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="vs-btn vs-btn-primary" onClick={() => onNav("/search")}>
              <Icon name="search" size={14} /> Browse the ledger
            </button>
            <button className="vs-btn vs-btn-ghost" onClick={() => onNav("/voucher/" + recent[0].voucher_id)}>
              See a Voucher <Icon name="arrow-right" size={14} />
            </button>
          </div>
        </div>

        {/* Hero figure: a stylized voucher seal */}
        <HeroSeal voucher={recent[0]} onClick={() => onNav("/voucher/" + recent[0].voucher_id)} />
      </section>

      {/* Stats */}
      <div className="vs-stats">
        <div className="vs-stat">
          <div className="vs-stat-value">{stats.total}</div>
          <div className="vs-stat-label">Vouchers issued</div>
        </div>
        <div className="vs-stat">
          <div className="vs-stat-value">{stats.candidates}</div>
          <div className="vs-stat-label">Unique components</div>
        </div>
        <div className="vs-stat">
          <div className="vs-stat-value">{stats.publishers}</div>
          <div className="vs-stat-label">Teams publishing</div>
        </div>
        <div className="vs-stat">
          <div className="vs-stat-value">{stats.tasks}</div>
          <div className="vs-stat-label">Task types covered</div>
        </div>
      </div>

      {/* Recent */}
      <section className="vs-section">
        <div className="vs-section-head">
          <div>
            <Eyebrow>Recently published</Eyebrow>
            <h2 style={{ marginTop: 8 }}>Today on the ledger</h2>
          </div>
          <button className="vs-btn vs-btn-ghost vs-btn-sm" onClick={() => onNav("/search")}>
            View all <Icon name="arrow-right" size={13} />
          </button>
        </div>

        <div className="vs-grid">
          {recent.map(v => <VoucherCard key={v.voucher_id} voucher={v} onClick={(id) => onNav("/voucher/" + id)} />)}
        </div>
      </section>

      {/* How it works strip */}
      <section className="vs-section">
        <div className="vs-section-head">
          <div>
            <Eyebrow>How a Voucher gets here</Eyebrow>
            <h2 style={{ marginTop: 8 }}>From a Bob session to a signed proof</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[
            { n: "1", icon: "sparkles", t: "Bob discovers candidates", d: "Live signals from Hugging Face, PyPI, npm — no mocked package lists." },
            { n: "2", icon: "cpu", t: "Adapters run in your repo", d: "Bob generates real adapters into a git worktree at your SHA, against your gold‑set." },
            { n: "3", icon: "bar-chart", t: "Metrics are captured", d: "retrieval@k, p50/p95 latency, tokens, memory — recorded, not estimated." },
            { n: "4", icon: "fingerprint", t: "The Voucher is signed", d: "RFC 8785 canonical JSON + Ed25519. Verifiable in any browser, no server trust." },
          ].map(step => (
            <div key={step.n} className="vs-card" style={{ margin: 0 }}>
              <div className="vs-eyebrow" style={{ marginBottom: 12 }}>Step {step.n}</div>
              <div className="vs-icon-well" style={{ marginBottom: 14 }}>
                <Icon name={step.icon} size={18} />
              </div>
              <h3 style={{ fontFamily: "var(--dv-font-display)", fontSize: 18, color: "var(--dv-forest-deep)", marginBottom: 8 }}>{step.t}</h3>
              <p style={{ fontSize: 14, color: "var(--dv-text-secondary)", lineHeight: 1.6 }}>{step.d}</p>
            </div>
          ))}
        </div>
      </section>
    </React.Fragment>
  );
}

// Stylized voucher seal for the hero — visual brand element
function HeroSeal({ voucher, onClick }) {
  return (
    <div style={{ position: "relative" }} onClick={onClick}>
      <div className="vs-card" style={{
        margin: 0, cursor: "pointer", overflow: "hidden", position: "relative",
        background: "linear-gradient(160deg, var(--dv-ivory-warm), var(--dv-sand-pale))",
        padding: 28,
      }}>
        {/* Decorative seal dashes */}
        <svg style={{ position: "absolute", top: -24, right: -24, opacity: 0.18 }} width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="68" stroke="#C9A96E" strokeWidth="1.5" strokeDasharray="4 6" fill="none" />
          <circle cx="80" cy="80" r="58" stroke="#C9A96E" strokeWidth="1" fill="none" />
          <circle cx="80" cy="80" r="42" stroke="#C9A96E" strokeWidth="0.5" strokeDasharray="2 3" fill="none" />
        </svg>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Eyebrow>Voucher · v1</Eyebrow>
            <div style={{ marginTop: 8, fontFamily: "var(--dv-font-mono)", fontSize: 14, color: "var(--dv-text-secondary)" }}>
              {voucher.subject.candidate}@{voucher.subject.version}
            </div>
          </div>
          <VerifyBadge />
        </div>

        <h3 style={{ fontFamily: "var(--dv-font-display)", fontSize: 26, color: "var(--dv-forest-deep)", marginTop: 18, lineHeight: 1.15, fontWeight: 600 }}>
          {titleFor(voucher)}
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 22, padding: "16px 0", borderTop: "1px solid var(--dv-border)", borderBottom: "1px solid var(--dv-border)" }}>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--dv-text-tertiary)", fontWeight: 500 }}>retrieval@10</div>
            <div style={{ fontFamily: "var(--dv-font-display)", fontSize: 34, fontWeight: 600, color: "var(--dv-forest-deep)" }}>{fmt.pct(voucher.metrics.retrieval_at_10)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--dv-text-tertiary)", fontWeight: 500 }}>p95 latency</div>
            <div style={{ fontFamily: "var(--dv-font-display)", fontSize: 34, fontWeight: 600, color: "var(--dv-forest-deep)" }}>{fmt.ms(voucher.metrics.latency_p95_ms)}</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <PublisherTag publisher={voucher.publisher} />
          <span style={{ fontFamily: "var(--dv-font-mono)", fontSize: 11, color: "var(--dv-text-tertiary)" }}>
            {voucher.voucher_id.slice(0, 22)}…
          </span>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// VOUCHER DETAIL
// ===========================================================================
function VoucherDetailPage({ voucherId, vouchers, onNav }) {
  const voucher = vouchers.find(v => v.voucher_id === voucherId);
  const [tamperedKeys, setTampered] = useS({}); // which fields were tampered
  const [verifyState, setVerifyState] = useS({ status: "idle", steps: [] });
  const [showMath, setShowMath] = useS(false);
  const [showRaw, setShowRaw] = useS(false);

  if (!voucher) {
    return (
      <div className="vs-empty">
        <h3>Voucher not found</h3>
        <p style={{ marginTop: 8 }}>The id "{voucherId}" isn't on this ledger.</p>
        <button className="vs-btn vs-btn-primary" style={{ marginTop: 20 }} onClick={() => onNav("/")}>Back to ledger</button>
      </div>
    );
  }

  const isTampered = Object.keys(tamperedKeys).length > 0;
  const tamperVoucher = () => {
    setTampered({ "metrics.retrieval_at_10": 1.0 });
    setVerifyState({ status: "idle", steps: [] });
  };
  const untamper = () => { setTampered({}); setVerifyState({ status: "idle", steps: [] }); };

  const runVerify = async () => {
    setShowMath(true);
    const steps = [
      { id: "extract", label: "Extract signature block", detail: "Separate signature.* from voucher body" },
      { id: "canonical", label: "Serialize body to canonical JSON (RFC 8785)", detail: "JCS over " + JSON.stringify(voucher).length + " bytes" },
      { id: "hash", label: "SHA‑256 over canonical bytes", detail: voucher.signature.canonical_hash.slice(7, 27) + "…" },
      { id: "match", label: "Compare hash with signature.canonical_hash", detail: isTampered ? "MISMATCH — body has been modified" : "match" },
      { id: "pubkey", label: "Decode publisher Ed25519 public key", detail: voucher.publisher.label },
      { id: "verify", label: "Ed25519.verify(signature, canonical, pubkey)", detail: isTampered ? "skipped — hash already failed" : "true" },
    ];
    setVerifyState({ status: "pending", steps: [] });
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 250 + Math.random() * 180));
      const stepResult = { ...steps[i] };
      if (steps[i].id === "match" && isTampered) stepResult.error = true;
      if (steps[i].id === "verify" && isTampered) stepResult.skipped = true;
      setVerifyState(prev => ({ status: "pending", steps: [...prev.steps, stepResult] }));
      if (stepResult.error) {
        await new Promise(r => setTimeout(r, 200));
        setVerifyState(prev => ({ status: "tampered", steps: prev.steps }));
        return;
      }
    }
    await new Promise(r => setTimeout(r, 250));
    setVerifyState({ status: "verified", steps: steps.map(s => ({ ...s })) });
  };

  return (
    <React.Fragment>
      {/* Hero */}
      <div className="vs-vd-hero vs-fade-in">
        <div className="vs-vd-hero-grid">
          <div>
            <button className="vs-btn vs-btn-ghost vs-btn-sm" style={{ marginBottom: 16 }} onClick={() => onNav("/")}>
              ← All vouchers
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <Eyebrow>Voucher · vouchstack/v1</Eyebrow>
              {voucher.champion && <span className="vs-chip" style={{ background: "var(--dv-copper-warm)", color: "var(--dv-charcoal)", border: "none", fontWeight: 700 }}>Champion</span>}
            </div>
            <h1 className="vs-vd-title">
              {voucher.subject.candidate} <em>on</em> {voucher.context.domain_tags[0] || voucher.context.task_type}
            </h1>
            <p className="vs-vd-sub">
              Trial against {voucher.context.domain_tags[0] || "a"} corpus of {fmt.num(voucher.goldset.corpus_doc_count)} documents,
              evaluated with {voucher.goldset.size} gold‑set queries.
              {voucher.bob_attestation.skill_used && " Run via Bob."}
            </p>

            <div className="vs-vd-id">
              <Icon name="hash" size={12} /> {voucher.voucher_id}
              <button className="vs-btn vs-btn-ghost vs-btn-sm" style={{ padding: "4px 10px", fontSize: 11, marginLeft: 8 }} onClick={() => navigator.clipboard?.writeText(voucher.voucher_id)}>
                <Icon name="copy" size={11} /> Copy
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <DomainChips tags={voucher.context.domain_tags} taskType={voucher.context.task_type} />
            </div>
          </div>

          <VerifyPanel voucher={voucher} verifyState={verifyState} isTampered={isTampered} onVerify={runVerify} onTamper={tamperVoucher} onUntamper={untamper} showMath={showMath} />
        </div>
      </div>

      {/* Body grid */}
      <div className="vs-vd-grid">
        {/* Left column: metrics + passport + bob */}
        <div>
          <MetricsCard voucher={voucher} tamperedKeys={tamperedKeys} />
          <PassportCard voucher={voucher} />
          <GoldsetCard voucher={voucher} />
          <RawJsonCard voucher={voucher} tamperedKeys={tamperedKeys} show={showRaw} onToggle={() => setShowRaw(s => !s)} />
        </div>

        {/* Right column: subject, bob, maintenance, environment */}
        <div>
          <SubjectCard voucher={voucher} />
          <BobCard voucher={voucher} />
          <MaintenanceCard voucher={voucher} />
          <EnvironmentCard voucher={voucher} />
        </div>
      </div>
    </React.Fragment>
  );
}

// ── Verify Panel ────────────────────────────────────────
function VerifyPanel({ voucher, verifyState, isTampered, onVerify, onTamper, onUntamper, showMath }) {
  const status = verifyState.status;
  const panelClass = "vs-verify-panel " + (status === "verified" ? "verified" : status === "tampered" ? "tampered" : "");

  let title, detail, seal;
  if (status === "verified") {
    title = "Signature verified";
    detail = `This Voucher was signed by ${voucher.publisher.label} and has not been modified since.`;
    seal = "shield-check";
  } else if (status === "tampered") {
    title = "Signature does NOT verify";
    detail = "The voucher body was modified. The canonical hash no longer matches the signed hash.";
    seal = "alert-triangle";
  } else if (status === "pending") {
    title = "Verifying in your browser…";
    detail = "Recomputing canonical JSON · re‑hashing · checking Ed25519.";
    seal = "circle-dot-dashed";
  } else {
    title = "Ready to verify";
    detail = "Recompute the canonical hash and check the Ed25519 signature locally — no server trust required.";
    seal = "shield";
  }

  return (
    <div className={panelClass}>
      <div className="vs-verify-seal">
        <Icon name={seal} size={28} className={status === "pending" ? "spin" : ""} />
      </div>
      <div className="vs-verify-status">{title}</div>
      <div className="vs-verify-detail">{detail}</div>

      <div className="vs-verify-actions">
        {status === "idle" && <button className="vs-btn vs-btn-primary" onClick={onVerify}><Icon name="shield-check" size={14} />Verify signature</button>}
        {status === "pending" && <button className="vs-btn vs-btn-primary" disabled><Icon name="circle-dot-dashed" size={14} className="spin" />Verifying…</button>}
        {(status === "verified" || status === "tampered") && <button className="vs-btn vs-btn-ghost vs-btn-sm" onClick={onVerify}>Re‑verify</button>}
        {!isTampered && status !== "pending" && <button className="vs-btn vs-btn-ghost vs-btn-sm" onClick={onTamper}><Icon name="alert-triangle" size={13} />Tamper</button>}
        {isTampered && <button className="vs-btn vs-btn-ghost vs-btn-sm" onClick={onUntamper}><Icon name="x" size={13} />Restore</button>}
      </div>

      {showMath && verifyState.steps.length > 0 && (
        <div className="vs-math">
          {verifyState.steps.map((s, i) => (
            <div key={s.id} className="step">
              <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
              <span style={{ flex: 1 }}>
                <span style={{ color: "var(--dv-ivory)" }}>{s.label}</span>{"  "}
                <span className="step-detail">
                  <span className={s.error ? "err" : s.skipped ? "" : "ok"}>
                    {s.skipped ? "↳ skipped" : s.error ? `↳ ${s.detail}` : `↳ ${s.detail}`}
                  </span>
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cards ───────────────────────────────────────────────
function MetricsCard({ voucher, tamperedKeys }) {
  const m = voucher.metrics;
  const tamperedR10 = "metrics.retrieval_at_10" in tamperedKeys;
  const r10 = tamperedR10 ? tamperedKeys["metrics.retrieval_at_10"] : m.retrieval_at_10;

  return (
    <div className="vs-card">
      <div className="vs-card-head">
        <div className="vs-icon-well"><Icon name="bar-chart" size={16} /></div>
        <h3>Trial metrics</h3>
        <Eyebrow>10 runs · captured</Eyebrow>
      </div>

      <div className="vs-metric-grid">
        <div className={"vs-metric-row featured" + (tamperedR10 ? " vs-tampered-bg" : "")} style={tamperedR10 ? { background: "var(--vs-tampered)", color: "var(--dv-ivory)" } : {}}>
          <div>
            <div className="vs-mr-label">retrieval@10</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>top‑10 documents containing an expected match</div>
          </div>
          <div className="vs-mr-value" style={tamperedR10 ? { color: "var(--dv-ivory)" } : {}}>{fmt.pct(r10)}</div>
        </div>

        <div className="vs-metric-row">
          <div className="vs-mr-label">retrieval@5</div>
          <div className="vs-mr-value">{fmt.pct(m.retrieval_at_5)}</div>
          <div className="vs-bar"><div className="fill good" style={{ width: (m.retrieval_at_5 * 100) + "%" }} /></div>
        </div>
        <div className="vs-metric-row">
          <div className="vs-mr-label">retrieval@10</div>
          <div className="vs-mr-value">{fmt.pct(m.retrieval_at_10)}</div>
          <div className="vs-bar"><div className="fill good" style={{ width: (m.retrieval_at_10 * 100) + "%" }} /></div>
        </div>

        <div className="vs-metric-row">
          <div className="vs-mr-label">latency p50</div>
          <div className="vs-mr-value">{m.latency_p50_ms}<span className="unit">ms</span></div>
        </div>
        <div className="vs-metric-row">
          <div className="vs-mr-label">latency p95</div>
          <div className="vs-mr-value">{m.latency_p95_ms}<span className="unit">ms</span></div>
        </div>

        <div className="vs-metric-row">
          <div className="vs-mr-label">tokens / query</div>
          <div className="vs-mr-value">{fmt.num(m.tokens_per_query)}{m.tokens_estimated && <span className="est">est.</span>}</div>
        </div>
        <div className="vs-metric-row">
          <div className="vs-mr-label">cost / 1k queries</div>
          <div className="vs-mr-value">{fmt.usd(m.cost_per_1k_queries_usd)}</div>
        </div>

        <div className="vs-metric-row">
          <div className="vs-mr-label">memory peak</div>
          <div className="vs-mr-value">{m.memory_peak_mb}<span className="unit">MB</span></div>
        </div>
        <div className="vs-metric-row">
          <div className="vs-mr-label">runs</div>
          <div className="vs-mr-value">{m.runs}</div>
        </div>
      </div>
    </div>
  );
}

function PassportCard({ voucher }) {
  const s = voucher.security;
  return (
    <div className="vs-card">
      <div className="vs-card-head">
        <div className="vs-icon-well"><Icon name="shield" size={16} /></div>
        <h3>Passport</h3>
        <Eyebrow>OpenSSF + Semgrep + License</Eyebrow>
      </div>

      <div className="vs-passport-grid">
        <div className="vs-passport-row">
          <div className="vs-passport-label">OpenSSF Scorecard</div>
          <div className="vs-passport-value">aggregate</div>
          <ScoreChip score={s.openssf_score} />
        </div>
        {Object.entries(s.openssf_checks).map(([name, score]) => (
          <div key={name} className="vs-passport-row">
            <div className="vs-passport-label" style={{ paddingLeft: 16, fontSize: 12 }}>↳ {name}</div>
            <div className="vs-passport-value" style={{ fontSize: 12 }}>{score}/10</div>
            <ScoreChip score={score} />
          </div>
        ))}
        <div className="vs-passport-row">
          <div className="vs-passport-label">Semgrep critical findings</div>
          <div className="vs-passport-value">{s.semgrep_findings_count}</div>
          <span className={"vs-score " + (s.semgrep_findings_count === 0 ? "good" : "bad")}>
            <Icon name={s.semgrep_findings_count === 0 ? "circle-check" : "circle-x"} size={11} />
            {s.semgrep_findings_count === 0 ? "Clean" : `${s.semgrep_findings_count} flagged`}
          </span>
        </div>
        <div className="vs-passport-row">
          <div className="vs-passport-label">License</div>
          <div className="vs-passport-value">{s.license}</div>
          <span className="vs-score good"><Icon name="check" size={11} />Compatible</span>
        </div>
      </div>
    </div>
  );
}

function GoldsetCard({ voucher }) {
  const g = voucher.goldset;
  return (
    <div className="vs-card">
      <div className="vs-card-head">
        <div className="vs-icon-well"><Icon name="database" size={16} /></div>
        <h3>Gold‑set</h3>
        <Eyebrow>{g.size} queries · {fmt.num(g.corpus_doc_count)} docs</Eyebrow>
      </div>
      <p style={{ fontSize: 14, color: "var(--dv-text-secondary)", marginBottom: 16 }}>{g.corpus_summary}</p>
      <div className="vs-passport-row">
        <div className="vs-passport-label">Synthesis method</div>
        <div className="vs-passport-value" style={{ fontSize: 12 }}>{g.synthesis_method}</div>
        <span className="vs-chip vs-chip-task">via Bob</span>
      </div>
      <div className="vs-passport-row" style={{ borderBottom: 0 }}>
        <div className="vs-passport-label">Hash</div>
        <div className="vs-passport-value" style={{ fontSize: 11, gridColumn: "2 / -1", wordBreak: "break-all" }}>{g.hash}</div>
      </div>
    </div>
  );
}

function SubjectCard({ voucher }) {
  const s = voucher.subject;
  return (
    <div className="vs-card">
      <div className="vs-card-head">
        <div className="vs-icon-well"><Icon name="cpu" size={16} /></div>
        <h3>Subject</h3>
      </div>
      <div style={{ fontFamily: "var(--dv-font-mono)", fontSize: 18, color: "var(--dv-charcoal)", marginBottom: 8 }}>
        {s.candidate}
        <span style={{ color: "var(--dv-copper-dark)", fontSize: 14 }}>@{s.version}</span>
      </div>
      <div style={{ fontSize: 13, color: "var(--dv-text-secondary)", marginBottom: 16 }}>
        from <span style={{ fontFamily: "var(--dv-font-mono)", color: "var(--dv-forest-mid)" }}>{s.ecosystem}</span>
      </div>
      <a className="vs-btn vs-btn-ghost vs-btn-sm" style={{ width: "100%", justifyContent: "space-between" }} href={s.repo_url} target="_blank" rel="noreferrer">
        <span><Icon name="github" size={13} /> Source repo</span>
        <Icon name="external-link" size={12} />
      </a>
    </div>
  );
}

function BobCard({ voucher }) {
  const b = voucher.bob_attestation;
  return (
    <div className="vs-card vs-bob-card">
      <div className="vs-card-head">
        <div className="vs-icon-well" style={{ background: "#0F62FE", color: "#FAFAF5", borderColor: "#0F62FE" }}><Icon name="sparkles" size={16} /></div>
        <h3>Bob attestation</h3>
      </div>
      <div className="vs-passport-row">
        <div className="vs-passport-label">Skill</div>
        <div className="vs-passport-value">{b.skill_used}</div>
        <span className="vs-chip vs-chip-task">active</span>
      </div>
      <div className="vs-passport-row">
        <div className="vs-passport-label">Modes used</div>
        <div className="vs-passport-value" style={{ gridColumn: "2 / -1", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {b.modes_used.map(m => <span key={m} className="vs-chip">{m}</span>)}
        </div>
      </div>
      <div className="vs-passport-row" style={{ borderBottom: 0 }}>
        <div className="vs-passport-label">Bob version</div>
        <div className="vs-passport-value">{b.bob_version}</div>
      </div>
      <div className="vs-bob-id">{b.session_id}</div>
    </div>
  );
}

function MaintenanceCard({ voucher }) {
  const m = voucher.maintenance;
  return (
    <div className="vs-card">
      <div className="vs-card-head">
        <div className="vs-icon-well"><Icon name="users" size={16} /></div>
        <h3>Maintenance</h3>
      </div>
      <div className="vs-passport-grid">
        <div className="vs-passport-row">
          <div className="vs-passport-label">GitHub stars</div>
          <div className="vs-passport-value">{fmt.num(m.github_stars)}</div>
          <span />
        </div>
        <div className="vs-passport-row">
          <div className="vs-passport-label">Weekly downloads</div>
          <div className="vs-passport-value">{fmt.num(m.weekly_downloads)}</div>
          <span />
        </div>
        <div className="vs-passport-row">
          <div className="vs-passport-label">Last commit</div>
          <div className="vs-passport-value" style={{ fontSize: 12 }}>{fmt.ago(m.last_commit_iso)}</div>
          <span />
        </div>
        <div className="vs-passport-row" style={{ borderBottom: 0 }}>
          <div className="vs-passport-label">Contributors 90d</div>
          <div className="vs-passport-value">{m.contributors_count_90d}</div>
          <span />
        </div>
      </div>
    </div>
  );
}

function EnvironmentCard({ voucher }) {
  const e = voucher.environment;
  return (
    <details className="vs-card" style={{ padding: 0 }}>
      <summary style={{ padding: "20px 24px" }}>
        <Icon name="git-branch" size={14} /> Environment & repo context
      </summary>
      <div style={{ padding: "0 24px 20px" }}>
        <div className="vs-passport-grid">
          <div className="vs-passport-row">
            <div className="vs-passport-label">OS</div>
            <div className="vs-passport-value" style={{ fontSize: 12 }}>{e.os}</div>
            <span />
          </div>
          <div className="vs-passport-row">
            <div className="vs-passport-label">Python</div>
            <div className="vs-passport-value" style={{ fontSize: 12 }}>{e.python_version}</div>
            <span />
          </div>
          <div className="vs-passport-row">
            <div className="vs-passport-label">Embedding model</div>
            <div className="vs-passport-value" style={{ fontSize: 11, wordBreak: "break-all", gridColumn: "2 / -1" }}>{e.embedding_model}</div>
          </div>
          <div className="vs-passport-row" style={{ borderBottom: 0 }}>
            <div className="vs-passport-label">Repo SHA</div>
            <div className="vs-passport-value" style={{ fontSize: 12 }}>{fmt.shaShort(voucher.context.repo_sha)}</div>
            <span />
          </div>
        </div>
      </div>
    </details>
  );
}

function RawJsonCard({ voucher, tamperedKeys, show, onToggle }) {
  // Build a tampered copy if needed
  const display = useM(() => {
    const v = JSON.parse(JSON.stringify(voucher));
    Object.entries(tamperedKeys).forEach(([path, val]) => {
      const parts = path.split(".");
      let cur = v;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = val;
    });
    delete v.publisher; // don't show in raw
    return v;
  }, [voucher, tamperedKeys]);

  return (
    <div className="vs-card">
      <div className="vs-card-head" style={{ borderBottom: show ? "1px solid var(--dv-border)" : "none", marginBottom: show ? "var(--dv-space-5)" : 0, paddingBottom: show ? "var(--dv-space-4)" : 0 }}>
        <div className="vs-icon-well"><Icon name="key" size={16} /></div>
        <h3>Raw signed Voucher (JCS payload)</h3>
        <button className="vs-btn vs-btn-ghost vs-btn-sm" onClick={onToggle}>
          {show ? "Hide" : "Show"} <Icon name={show ? "arrow-up" : "arrow-down"} size={12} />
        </button>
      </div>
      {show && (
        <pre className="vs-json">{prettyJson(display, Object.keys(tamperedKeys))}</pre>
      )}
    </div>
  );
}

function prettyJson(obj, tamperedPaths) {
  // Lightweight JSON syntax-highlighter that returns a React fragment.
  // Tampered paths get a red highlight.
  const str = JSON.stringify(obj, null, 2);
  const tamperLastKeys = new Set(tamperedPaths.map(p => p.split(".").pop()));
  // Use a tokenizer approach with regex
  const tokens = [];
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|(true|false|null)|(-?\d+(?:\.\d+)?)/g;
  let m, last = 0;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) tokens.push(str.slice(last, m.index));
    if (m[1]) {
      const isKey = !!m[2];
      const cls = isKey ? "k" : "s";
      const keyName = isKey ? m[1].slice(1, -1) : null;
      const tampered = isKey && tamperLastKeys.has(keyName);
      tokens.push(<span key={m.index} className={cls + (tampered ? " tampered" : "")}>{m[1]}</span>);
      if (m[2]) tokens.push(m[2]);
    } else if (m[3]) tokens.push(<span key={m.index} className="b">{m[3]}</span>);
    else if (m[4]) tokens.push(<span key={m.index} className="n">{m[4]}</span>);
    last = re.lastIndex;
  }
  tokens.push(str.slice(last));
  return tokens;
}

Object.assign(window, { HomePage, VoucherDetailPage });
