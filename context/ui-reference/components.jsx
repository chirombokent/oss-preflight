/* global React, ReactDOM */
/* VouchStack shared components */
const { useState, useEffect, useRef, useMemo } = React;

// ── Icon ────────────────────────────────────────────────
// We use lucide via CDN, but to keep things controlled we hand-roll the small set we need.
const ICON_PATHS = {
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  "shield-check": "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4",
  check: "M20 6 9 17l-5-5",
  x: "M18 6 6 18 M6 6l12 12",
  search: "M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0 M21 21l-4.3-4.3",
  filter: "M3 4h18 M7 12h10 M11 20h2",
  "arrow-right": "M5 12h14 M12 5l7 7-7 7",
  "arrow-up": "M12 19V5 M5 12l7-7 7 7",
  "arrow-down": "M12 5v14 M19 12l-7 7-7-7",
  "external-link": "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14L21 3",
  github: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22",
  lock: "M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z M7 11V7a5 5 0 0 1 10 0v4",
  "lock-open": "M7 11V7a5 5 0 0 1 9.9-1 M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z",
  key: "M12 8l8-8h2v2l-2 2 1 1-2 2-1-1-2 2-1-1-2 2-1-1-3 3v3H6v2H3v-3l3-3a6 6 0 1 1 6-6",
  "circle-check": "M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z M8 12l3 3 5-5",
  "circle-x": "M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z M15 9l-6 6 M9 9l6 6",
  "circle-alert": "M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z M12 8v4 M12 16h.01",
  "circle-dot-dashed": "M10.1 2.2a10 10 0 0 1 3.8 0 M13.9 21.8a10 10 0 0 1-3.8 0 M17.4 3.6a10 10 0 0 1 3 3 M20.4 16.4a10 10 0 0 1-3 3 M21.8 10.1a10 10 0 0 1 0 3.8 M2.2 13.9a10 10 0 0 1 0-3.8 M6.6 3.6a10 10 0 0 0-3 3 M3.6 17.4a10 10 0 0 0 3 3",
  rocket: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z",
  zap: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  sparkles: "M9 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1z M19 12l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7z M13 17l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z",
  database: "M12 6a9 3 0 1 0 0-6 9 3 0 0 0 0 6 M3 5v14a9 3 0 0 0 18 0V5 M3 12a9 3 0 0 0 18 0",
  cpu: "M4 4h16v16H4z M8 8h8v8H8z M9 1v3 M15 1v3 M9 20v3 M15 20v3 M20 9h3 M20 14h3 M1 9h3 M1 14h3",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",
  scale: "M3 6l3 1 3-1m6 0 3 1 3-1 M12 3v18 M6 21h12 M6 7l-3 9a4 4 0 0 0 6 0L6 7zm12 0-3 9a4 4 0 0 0 6 0l-3-9z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  "git-branch": "M6 3v12 M18 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M18 9v-3a2 2 0 0 0-2-2h-4 M14 15h2a2 2 0 0 0 2-2v-2",
  hash: "M4 9h16 M4 15h16 M10 3 8 21 M16 3l-2 18",
  "bar-chart": "M12 20V10 M18 20V4 M6 20v-6",
  copy: "M9 2h10a2 2 0 0 1 2 2v10 M5 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z",
  "alert-triangle": "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  fingerprint: "M14 19a6 6 0 1 0-8-5.66 M6.42 14.42a8 8 0 1 1 13.32-6.5 M12 12a4 4 0 0 1 4 4v.2 M12 8a8 8 0 0 1 5 9.83 M14 22a14.5 14.5 0 0 0 1.71-7.5 M2 12c0-1.5.36-3 1-4.3",
  globe: "M12 2a15 15 0 0 1 0 20 M12 2a15 15 0 0 0 0 20 M2 12h20 M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z",
};
function Icon({ name, size = 16, strokeWidth = 1.5, className = "", style }) {
  const d = ICON_PATHS[name] || "";
  const paths = d.split(" M").map((p, i) => (i === 0 ? p : "M" + p));
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

// ── Eyebrow ─────────────────────────────────────────────
function Eyebrow({ children }) {
  return <div className="vs-eyebrow">{children}</div>;
}

// ── Logo ────────────────────────────────────────────────
function Logo({ onClick }) {
  return (
    <div className="vs-logo" onClick={onClick}>
      <span className="vs-logo-mark">V</span>
      <span className="vs-logo-text">VouchStack</span>
    </div>
  );
}

// ── Format helpers ──────────────────────────────────────
const fmt = {
  pct: (n) => `${Math.round(n * 100)}%`,
  ms: (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}s` : `${n}ms`,
  num: (n) => {
    if (n == null) return "—";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
  },
  usd: (n) => n == null ? "—" : n === 0 ? "$0" : `$${n.toFixed(3)}`,
  ago: (iso) => {
    const t = new Date(iso).getTime();
    const ms = Date.now() - t;
    const m = Math.floor(ms / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
  },
  shaShort: (s) => s ? s.slice(0, 7) : "",
};

// ── Verify Badge (status pill) ─────────────────────────
function VerifyBadge({ status }) {
  if (status === "pending") return (
    <span className="vs-verify-badge pending">
      <Icon name="circle-dot-dashed" size={12} className="spin" /> Verifying…
    </span>
  );
  if (status === "tampered") return (
    <span className="vs-verify-badge tampered">
      <Icon name="circle-x" size={12} /> Tampered
    </span>
  );
  return (
    <span className="vs-verify-badge">
      <Icon name="circle-check" size={12} /> Signature verified
    </span>
  );
}

// ── Score chip ──────────────────────────────────────────
function ScoreChip({ score }) {
  if (score == null) return <span className="vs-score">—</span>;
  const tone = score >= 6.5 ? "good" : score >= 4.0 ? "warn" : "bad";
  return (
    <span className={"vs-score " + tone}>
      <Icon name={tone === "good" ? "circle-check" : tone === "warn" ? "circle-alert" : "circle-x"} size={11} />
      {score.toFixed(1)}
    </span>
  );
}

// ── Publisher Tag ───────────────────────────────────────
function PublisherTag({ publisher, onClick }) {
  if (!publisher) return null;
  const initials = publisher.label.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span className="vs-publisher" style={{ cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <span className="vs-publisher-dot">{initials}</span>
      {publisher.label}
    </span>
  );
}

// ── Domain Chips ────────────────────────────────────────
function DomainChips({ tags, taskType }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {taskType && <span className="vs-chip vs-chip-task"><Icon name="hash" size={10} />{taskType}</span>}
      {tags.map(t => <span key={t} className="vs-chip">{t}</span>)}
    </div>
  );
}

// ── Voucher Card (used in list views) ──────────────────
function VoucherCard({ voucher, onClick }) {
  const v = voucher;
  return (
    <article className={"vs-voucher-card " + (v.champion ? "champion" : "")} onClick={() => onClick(v.voucher_id)}>
      <div className="vs-vc-head">
        <div style={{ flex: 1 }}>
          <span className="vs-vc-candidate">{v.subject.candidate}<span className="ver">@{v.subject.version}</span></span>
          <h3 className="vs-vc-title" style={{ marginTop: 8 }}>{titleFor(v)}</h3>
        </div>
        <VerifyBadge />
      </div>

      <div className="vs-vc-meta">
        <DomainChips tags={v.context.domain_tags.slice(0, 2)} taskType={v.context.task_type} />
      </div>

      <div className="vs-vc-metrics">
        <div className="vs-vc-metric">
          <span className="vs-vc-metric-label">retrieval@10</span>
          <span className="vs-vc-metric-value">{fmt.pct(v.metrics.retrieval_at_10)}</span>
        </div>
        <div className="vs-vc-metric">
          <span className="vs-vc-metric-label">p95 latency</span>
          <span className="vs-vc-metric-value">{fmt.ms(v.metrics.latency_p95_ms)}</span>
        </div>
        <div className="vs-vc-metric">
          <span className="vs-vc-metric-label">OpenSSF</span>
          <span className="vs-vc-metric-value">{v.security.openssf_score != null ? v.security.openssf_score.toFixed(1) : "—"}</span>
        </div>
      </div>

      <div className="vs-vc-foot">
        <PublisherTag publisher={v.publisher} />
        <span style={{ fontSize: 12, color: "var(--dv-text-tertiary)" }}>{fmt.ago(v.issued_at)}</span>
      </div>
    </article>
  );
}

function titleFor(v) {
  // Build a human-readable title — compact for card grids
  const tag = v.context.domain_tags[0] || v.context.task_type;
  const prettyTag = tag.split("-").map(s => s[0].toUpperCase() + s.slice(1)).join(" ");
  return `Trial on ${prettyTag}`;
}

// ── Layout / Nav (shared shell) ────────────────────────
function Layout({ children, route, onNav }) {
  return (
    <div className="vs-shell">
      <header className="vs-header">
        <div className="vs-container vs-header-inner">
          <Logo onClick={() => onNav("/")} />
          <nav className="vs-nav">
            <a className={"vs-nav-link" + (route === "/" ? " active" : "")} onClick={() => onNav("/")}>Ledger</a>
            <a className={"vs-nav-link" + (route.startsWith("/search") ? " active" : "")} onClick={() => onNav("/search")}>Search</a>
            <a className={"vs-nav-link hide-mobile" + (route.startsWith("/compare") ? " active" : "")} onClick={() => onNav("/compare")}>Compare</a>
            <a className="vs-nav-link hide-mobile" onClick={() => onNav("/docs")}>Docs</a>
            <a className="vs-btn vs-btn-secondary vs-btn-sm" style={{ marginLeft: 8 }} onClick={() => onNav("/publish")}>
              <Icon name="zap" size={13} /> Publish a Voucher
            </a>
          </nav>
        </div>
      </header>

      <main className="vs-main">
        <div className="vs-container">{children}</div>
      </main>

      <footer className="vs-footer">
        <div className="vs-container">
          <div className="vs-footer-grid">
            <div>
              <Logo />
              <p style={{ fontSize: 14, marginTop: 16, color: "rgba(250,250,245,0.72)", maxWidth: 360 }}>
                A proof-based trust layer for open-source AI components. Every voucher is a real Trial — signed, persistent, verifiable in your browser.
              </p>
            </div>
            <div>
              <h4>Ledger</h4>
              <ul>
                <li><a onClick={() => onNav("/")}>Recent</a></li>
                <li><a onClick={() => onNav("/search")}>Search</a></li>
                <li><a onClick={() => onNav("/compare")}>Compare</a></li>
              </ul>
            </div>
            <div>
              <h4>Build</h4>
              <ul>
                <li><a>CLI</a></li>
                <li><a>Bob skill</a></li>
                <li><a>API</a></li>
              </ul>
            </div>
            <div>
              <h4>About</h4>
              <ul>
                <li><a>How it works</a></li>
                <li><a>Schema</a></li>
                <li><a><Icon name="github" size={13} style={{ marginRight: 6, verticalAlign: "-2px" }} />GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="vs-footer-bottom">
            <span>© 2026 VouchStack — built for the IBM Bob Hackathon</span>
            <span>MIT licensed · Ed25519 · RFC 8785</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

Object.assign(window, {
  Icon, Eyebrow, Logo, fmt, VerifyBadge, ScoreChip, PublisherTag, DomainChips,
  VoucherCard, Layout, titleFor,
});
