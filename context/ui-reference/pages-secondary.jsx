/* global React, Icon, Eyebrow, VerifyBadge, ScoreChip, PublisherTag, DomainChips, VoucherCard, fmt, titleFor */
/* VouchStack secondary pages */
const { useState: useS2, useEffect: useE2, useMemo: useM2 } = React;

// ===========================================================================
// SEARCH
// ===========================================================================
function SearchPage({ vouchers, publishers, onNav, initialFilters }) {
  const [q, setQ] = useS2(initialFilters?.q || "");
  const [task, setTask] = useS2(initialFilters?.task || "all");
  const [lang, setLang] = useS2(initialFilters?.lang || "all");
  const [minR10, setMinR10] = useS2(initialFilters?.min_r10 || 0);
  const [sortBy, setSortBy] = useS2("issued_at");

  const taskTypes = useM2(() => [...new Set(vouchers.map(v => v.context.task_type))], [vouchers]);
  const langs = useM2(() => [...new Set(vouchers.map(v => v.context.language))], [vouchers]);

  const filtered = useM2(() => {
    let r = vouchers.filter(v => {
      if (q) {
        const hay = (v.subject.candidate + " " + v.context.domain_tags.join(" ") + " " + v.publisher.label).toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (task !== "all" && v.context.task_type !== task) return false;
      if (lang !== "all" && v.context.language !== lang) return false;
      if (v.metrics.retrieval_at_10 < minR10) return false;
      return true;
    });
    if (sortBy === "issued_at") r.sort((a,b) => new Date(b.issued_at) - new Date(a.issued_at));
    else if (sortBy === "retrieval_at_10") r.sort((a,b) => b.metrics.retrieval_at_10 - a.metrics.retrieval_at_10);
    else if (sortBy === "latency_p95") r.sort((a,b) => a.metrics.latency_p95_ms - b.metrics.latency_p95_ms);
    else if (sortBy === "openssf") r.sort((a,b) => (b.security.openssf_score || 0) - (a.security.openssf_score || 0));
    return r;
  }, [vouchers, q, task, lang, minR10, sortBy]);

  const clearAll = () => { setQ(""); setTask("all"); setLang("all"); setMinR10(0); };

  return (
    <React.Fragment>
      <div style={{ marginBottom: 24 }}>
        <Eyebrow>Search the ledger</Eyebrow>
        <h1 style={{ fontFamily: "var(--dv-font-display)", fontSize: 36, color: "var(--dv-forest-deep)", marginTop: 8, fontWeight: 600, letterSpacing: "-0.015em" }}>
          {filtered.length} {filtered.length === 1 ? "voucher" : "vouchers"} <em style={{ color: "var(--dv-copper-dark)", fontWeight: 500 }}>matching your filters</em>
        </h1>
      </div>

      <div className="vs-search-bar">
        <div className="vs-input-icon">
          <Icon name="search" size={16} />
          <input className="vs-input" placeholder="Search candidate, domain, publisher…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="vs-select" value={task} onChange={e => setTask(e.target.value)}>
          <option value="all">All task types</option>
          {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="vs-select" value={lang} onChange={e => setLang(e.target.value)}>
          <option value="all">All languages</option>
          {langs.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="vs-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="issued_at">Recent first</option>
          <option value="retrieval_at_10">Best retrieval@10</option>
          <option value="latency_p95">Fastest p95</option>
          <option value="openssf">Highest OpenSSF</option>
        </select>
      </div>

      <div className="vs-filter-chips">
        <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--dv-text-tertiary)", fontWeight: 500 }}>
          <Icon name="filter" size={11} style={{ verticalAlign: "-2px", marginRight: 4 }} />
          Quick filters:
        </span>
        <button className="vs-filter-chip" onClick={() => setMinR10(0.9)}>retrieval@10 ≥ 90%</button>
        <button className="vs-filter-chip" onClick={() => setTask("rag")}>RAG only</button>
        <button className="vs-filter-chip" onClick={() => setTask("embedding")}>Embeddings only</button>
        <button className="vs-filter-chip" onClick={() => setTask("agent")}>Agents only</button>
        {(q || task !== "all" || lang !== "all" || minR10 > 0) && (
          <button className="vs-filter-chip" onClick={clearAll} style={{ background: "var(--dv-forest-deep)", color: "var(--dv-ivory)", border: "none" }}>
            <Icon name="x" size={11} /> Clear all
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="vs-empty">
          <h3>No vouchers match</h3>
          <p style={{ marginTop: 8 }}>Try widening your filters or clearing them all.</p>
          <button className="vs-btn vs-btn-primary" style={{ marginTop: 20 }} onClick={clearAll}>Clear filters</button>
        </div>
      ) : (
        <div className="vs-grid">
          {filtered.map(v => <VoucherCard key={v.voucher_id} voucher={v} onClick={(id) => onNav("/voucher/" + id)} />)}
        </div>
      )}
    </React.Fragment>
  );
}

// ===========================================================================
// COMPONENT DETAIL
// ===========================================================================
function ComponentDetailPage({ name, vouchers, onNav }) {
  const componentVouchers = useM2(() => vouchers.filter(v => v.subject.candidate === name), [vouchers, name]);
  if (componentVouchers.length === 0) {
    return (
      <div className="vs-empty">
        <h3>No vouchers for "{name}"</h3>
        <button className="vs-btn vs-btn-primary" style={{ marginTop: 20 }} onClick={() => onNav("/")}>Back to ledger</button>
      </div>
    );
  }
  const sample = componentVouchers[0];
  const avgR10 = componentVouchers.reduce((s,v) => s + v.metrics.retrieval_at_10, 0) / componentVouchers.length;
  const avgLat = componentVouchers.reduce((s,v) => s + v.metrics.latency_p95_ms, 0) / componentVouchers.length;
  const ossf = sample.security.openssf_score;
  const license = sample.security.license;

  // distribution of retrieval@10 by domain
  const byDomain = {};
  componentVouchers.forEach(v => {
    const d = v.context.domain_tags[0] || v.context.task_type;
    if (!byDomain[d]) byDomain[d] = [];
    byDomain[d].push(v.metrics.retrieval_at_10);
  });

  return (
    <React.Fragment>
      <button className="vs-btn vs-btn-ghost vs-btn-sm" style={{ marginBottom: 16 }} onClick={() => onNav("/")}>
        ← All vouchers
      </button>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 32, alignItems: "start" }}>
        <div>
          <Eyebrow>Component</Eyebrow>
          <h1 style={{ fontFamily: "var(--dv-font-display)", fontSize: 44, color: "var(--dv-forest-deep)", marginTop: 8, fontWeight: 600, letterSpacing: "-0.02em" }}>
            {name}
          </h1>
          <p style={{ fontSize: 16, color: "var(--dv-text-secondary)", marginTop: 12, maxWidth: 540 }}>
            {componentVouchers.length} {componentVouchers.length === 1 ? "Voucher" : "Vouchers"} published across {Object.keys(byDomain).length} {Object.keys(byDomain).length === 1 ? "domain" : "domains"}.
            License: {license} · OpenSSF Scorecard: {ossf?.toFixed(1) || "—"}.
          </p>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <a className="vs-btn vs-btn-ghost vs-btn-sm" href={sample.subject.repo_url} target="_blank" rel="noreferrer">
              <Icon name="github" size={13} /> Source repo <Icon name="external-link" size={11} />
            </a>
            <button className="vs-btn vs-btn-ghost vs-btn-sm" onClick={() => onNav("/compare?ids=" + componentVouchers.slice(0,3).map(v => v.voucher_id).join(","))}>
              <Icon name="bar-chart" size={13} /> Compare versions
            </button>
          </div>
        </div>

        <div className="vs-stats" style={{ margin: 0, gridTemplateColumns: "1fr 1fr" }}>
          <div className="vs-stat">
            <div className="vs-stat-value">{fmt.pct(avgR10)}</div>
            <div className="vs-stat-label">Avg retrieval@10</div>
          </div>
          <div className="vs-stat" style={{ borderRight: 0 }}>
            <div className="vs-stat-value">{fmt.ms(Math.round(avgLat))}</div>
            <div className="vs-stat-label">Avg p95</div>
          </div>
        </div>
      </div>

      {/* Distribution chart */}
      <div className="vs-card">
        <div className="vs-card-head">
          <div className="vs-icon-well"><Icon name="bar-chart" size={16} /></div>
          <h3>retrieval@10 across teams & domains</h3>
          <Eyebrow>real Trials</Eyebrow>
        </div>
        <div className="vs-chart">
          {componentVouchers.map(v => (
            <div key={v.voucher_id} className="vs-chart-row" style={{ cursor: "pointer" }} onClick={() => onNav("/voucher/" + v.voucher_id)}>
              <div className="vs-chart-label">
                <PublisherTag publisher={v.publisher} />
              </div>
              <div className="vs-chart-bar-bg">
                <div className="vs-chart-bar" style={{ width: (v.metrics.retrieval_at_10 * 100) + "%" }} />
              </div>
              <div className="vs-chart-value">{fmt.pct(v.metrics.retrieval_at_10)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="vs-section">
        <div className="vs-section-head">
          <h2>All Vouchers for <span style={{ fontFamily: "var(--dv-font-mono)" }}>{name}</span></h2>
        </div>
        <div className="vs-grid">
          {componentVouchers.map(v => <VoucherCard key={v.voucher_id} voucher={v} onClick={(id) => onNav("/voucher/" + id)} />)}
        </div>
      </div>
    </React.Fragment>
  );
}

// ===========================================================================
// COMPARE
// ===========================================================================
function ComparePage({ idList, vouchers, onNav }) {
  // If no ids provided, default to the three demo champions
  const auto = vouchers.filter(v => v.context.repo_remote && v.context.repo_remote.endsWith("vouchstack-demo-tickets")).slice(0, 3);
  const compared = useM2(() => {
    if (idList && idList.length > 0) return idList.map(id => vouchers.find(v => v.voucher_id === id)).filter(Boolean);
    return auto;
  }, [vouchers, idList]);

  const [selected, setSelected] = useS2(compared.map(v => v.voucher_id));
  const items = selected.map(id => vouchers.find(v => v.voucher_id === id)).filter(Boolean);

  if (items.length === 0) {
    return (
      <div className="vs-empty">
        <h3>Nothing to compare</h3>
        <p style={{ marginTop: 8 }}>Pick at least one voucher to compare.</p>
      </div>
    );
  }

  // Compute winners per metric
  const winnerForCol = (key, lowerIsBetter = false) => {
    let bestIdx = 0, bestVal = items[0].metrics[key];
    items.forEach((v, i) => {
      const val = v.metrics[key];
      if (lowerIsBetter ? val < bestVal : val > bestVal) { bestVal = val; bestIdx = i; }
    });
    return bestIdx;
  };
  const winners = {
    retrieval_at_5: winnerForCol("retrieval_at_5"),
    retrieval_at_10: winnerForCol("retrieval_at_10"),
    latency_p50_ms: winnerForCol("latency_p50_ms", true),
    latency_p95_ms: winnerForCol("latency_p95_ms", true),
    tokens_per_query: winnerForCol("tokens_per_query", true),
    cost_per_1k_queries_usd: winnerForCol("cost_per_1k_queries_usd", true),
    memory_peak_mb: winnerForCol("memory_peak_mb", true),
  };

  const ossfWinner = items.reduce((b, v, i) => (v.security.openssf_score || 0) > (items[b].security.openssf_score || 0) ? i : b, 0);

  const rows = [
    { label: "retrieval@5", get: v => fmt.pct(v.metrics.retrieval_at_5), winner: winners.retrieval_at_5 },
    { label: "retrieval@10", get: v => fmt.pct(v.metrics.retrieval_at_10), winner: winners.retrieval_at_10 },
    { label: "latency p50", get: v => fmt.ms(v.metrics.latency_p50_ms), winner: winners.latency_p50_ms },
    { label: "latency p95", get: v => fmt.ms(v.metrics.latency_p95_ms), winner: winners.latency_p95_ms },
    { label: "tokens / query", get: v => fmt.num(v.metrics.tokens_per_query) + (v.metrics.tokens_estimated ? " est." : ""), winner: winners.tokens_per_query },
    { label: "cost / 1k queries", get: v => fmt.usd(v.metrics.cost_per_1k_queries_usd), winner: winners.cost_per_1k_queries_usd },
    { label: "memory peak", get: v => v.metrics.memory_peak_mb + " MB", winner: winners.memory_peak_mb },
    { label: "OpenSSF Scorecard", get: v => (v.security.openssf_score?.toFixed(1) || "—"), winner: ossfWinner },
    { label: "License", get: v => v.security.license, winner: -1 },
    { label: "Semgrep findings", get: v => v.security.semgrep_findings_count, winner: -1 },
  ];

  return (
    <React.Fragment>
      <div style={{ marginBottom: 28 }}>
        <Eyebrow>Side‑by‑side</Eyebrow>
        <h1 style={{ fontFamily: "var(--dv-font-display)", fontSize: 36, color: "var(--dv-forest-deep)", marginTop: 8, fontWeight: 600, letterSpacing: "-0.015em" }}>
          Compare <em style={{ color: "var(--dv-copper-dark)", fontWeight: 500 }}>{items.length} vouchers</em>
        </h1>
        <p style={{ fontSize: 15, color: "var(--dv-text-secondary)", marginTop: 8, maxWidth: 600 }}>
          Winners are highlighted per metric. Lower is better for latency, tokens, cost, and memory.
        </p>
      </div>

      <div className="vs-compare">
        <table>
          <thead>
            <tr>
              <th></th>
              {items.map(v => (
                <th key={v.voucher_id} style={{ minWidth: 200 }}>
                  <div style={{ fontFamily: "var(--dv-font-mono)", fontSize: 13, color: "var(--dv-charcoal)", fontWeight: 600 }}>
                    {v.subject.candidate}<span style={{ color: "var(--dv-copper-dark)" }}>@{v.subject.version}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--dv-text-tertiary)", marginTop: 4, fontWeight: 400 }}>
                    {v.publisher.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label}>
                <td>{row.label}</td>
                {items.map((v, i) => (
                  <td key={v.voucher_id} className={i === row.winner ? "winner" : ""}>{row.get(v)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <td>Voucher</td>
              {items.map(v => (
                <td key={v.voucher_id}>
                  <button className="vs-btn vs-btn-ghost vs-btn-sm" onClick={() => onNav("/voucher/" + v.voucher_id)}>
                    Open <Icon name="arrow-right" size={11} />
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="vs-card" style={{ marginTop: 24 }}>
        <div className="vs-card-head">
          <div className="vs-icon-well"><Icon name="circle-dot-dashed" size={16} /></div>
          <h3>Radar — normalized metrics</h3>
          <Eyebrow>higher = better</Eyebrow>
        </div>
        <div className="vs-radar"><RadarChart items={items} /></div>
      </div>
    </React.Fragment>
  );
}

// ── Radar chart (custom SVG) ────────────────────────────
function RadarChart({ items }) {
  const axes = [
    { key: "retrieval@10", get: v => v.metrics.retrieval_at_10, max: 1, higher: true },
    { key: "speed (1/p95)", get: v => 1500 / v.metrics.latency_p95_ms, max: 2.5, higher: true },
    { key: "memory eff", get: v => 400 / v.metrics.memory_peak_mb, max: 3, higher: true },
    { key: "cost eff", get: v => v.metrics.cost_per_1k_queries_usd === 0 ? 1 : 0.5, max: 1, higher: true },
    { key: "security", get: v => (v.security.openssf_score || 0) / 10, max: 1, higher: true },
    { key: "freshness", get: v => Math.max(0, 1 - (Date.now() - new Date(v.maintenance.last_commit_iso).getTime()) / (1000*60*60*24*30)), max: 1, higher: true },
  ];
  const cx = 220, cy = 220, r = 160;
  const angle = (i) => (i / axes.length) * Math.PI * 2 - Math.PI / 2;
  const colors = ["#2D3B2D", "#C9A96E", "#B8944F", "#4A7A4A"];

  return (
    <svg viewBox="0 0 440 460" width="440" height="460" style={{ maxWidth: "100%" }}>
      {/* Grid */}
      {[0.25, 0.5, 0.75, 1].map((f, gi) => (
        <polygon key={gi} fill="none" stroke="var(--dv-border)" strokeWidth="1"
          points={axes.map((_, i) => {
            const a = angle(i);
            return `${cx + Math.cos(a) * r * f},${cy + Math.sin(a) * r * f}`;
          }).join(" ")}
        />
      ))}
      {/* Axes */}
      {axes.map((ax, i) => {
        const a = angle(i);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        const tx = cx + Math.cos(a) * (r + 24);
        const ty = cy + Math.sin(a) * (r + 24);
        return (
          <g key={ax.key}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--dv-border)" strokeWidth="1" />
            <text x={tx} y={ty} fontSize="11" fontFamily="DM Sans, sans-serif" fill="var(--dv-text-secondary)" textAnchor="middle" dominantBaseline="middle">{ax.key}</text>
          </g>
        );
      })}
      {/* Items */}
      {items.map((v, ii) => {
        const points = axes.map((ax, i) => {
          const val = Math.min(1, ax.get(v) / ax.max);
          const a = angle(i);
          return `${cx + Math.cos(a) * r * val},${cy + Math.sin(a) * r * val}`;
        }).join(" ");
        const c = colors[ii % colors.length];
        return <polygon key={v.voucher_id} fill={c} fillOpacity="0.12" stroke={c} strokeWidth="2" points={points} />;
      })}
      {/* Legend */}
      <g transform={`translate(20, ${440 - 8})`}>
        {items.map((v, ii) => (
          <g key={v.voucher_id} transform={`translate(${ii * 130}, 0)`}>
            <rect width="10" height="10" fill={colors[ii % colors.length]} rx="2" />
            <text x="16" y="9" fontSize="11" fontFamily="DM Sans, sans-serif" fill="var(--dv-text-secondary)">{v.subject.candidate}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ===========================================================================
// PUBLISHER
// ===========================================================================
function PublisherPage({ pubkey, vouchers, publishers, onNav }) {
  const publisher = publishers.find(p => p.pubkey === pubkey);
  const items = vouchers.filter(v => v.publisher_pubkey === pubkey);
  if (!publisher) {
    return (
      <div className="vs-empty">
        <h3>Publisher not found</h3>
        <button className="vs-btn vs-btn-primary" style={{ marginTop: 20 }} onClick={() => onNav("/")}>Back to ledger</button>
      </div>
    );
  }

  const initials = publisher.label.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <React.Fragment>
      <button className="vs-btn vs-btn-ghost vs-btn-sm" style={{ marginBottom: 16 }} onClick={() => onNav("/")}>← All vouchers</button>

      <div className="vs-card" style={{ display: "flex", alignItems: "center", gap: 24, padding: 32 }}>
        <div style={{ width: 72, height: 72, borderRadius: 16, background: "var(--dv-forest-deep)", color: "var(--dv-copper-warm)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, fontFamily: "var(--dv-font-display)" }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <Eyebrow>Publisher</Eyebrow>
          <h1 style={{ fontFamily: "var(--dv-font-display)", fontSize: 32, color: "var(--dv-forest-deep)", marginTop: 6, fontWeight: 600 }}>{publisher.label}</h1>
          {publisher.verified_github_user && (
            <div style={{ fontSize: 13, color: "var(--dv-text-secondary)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="github" size={13} /> github.com/{publisher.verified_github_user}
              <span className="vs-score good" style={{ marginLeft: 6 }}><Icon name="circle-check" size={11} />Verified</span>
            </div>
          )}
          <div style={{ fontFamily: "var(--dv-font-mono)", fontSize: 11, color: "var(--dv-text-tertiary)", marginTop: 10, wordBreak: "break-all" }}>
            {publisher.pubkey}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--dv-font-display)", fontSize: 40, fontWeight: 600, color: "var(--dv-forest-deep)" }}>{items.length}</div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--dv-text-secondary)" }}>vouchers issued</div>
        </div>
      </div>

      <div className="vs-section">
        <div className="vs-section-head">
          <h2>All Vouchers from {publisher.label}</h2>
        </div>
        <div className="vs-grid">
          {items.map(v => <VoucherCard key={v.voucher_id} voucher={v} onClick={(id) => onNav("/voucher/" + id)} />)}
        </div>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { SearchPage, ComponentDetailPage, ComparePage, PublisherPage });
