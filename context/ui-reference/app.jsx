/* global React, ReactDOM, Layout, HomePage, VoucherDetailPage, SearchPage, ComponentDetailPage, ComparePage, PublisherPage */
/* global TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakToggle */

const { useState: useAS, useEffect: useAE } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "brand": "vouchstack",
  "calm": false,
  "reducedMotion": false,
  "dark": false
}/*EDITMODE-END*/;

// ── Router (hash-based) ────────────────────────────────
function parseRoute(hash) {
  const h = hash.replace(/^#/, "").replace(/^\/+/, "/") || "/";
  const [pathPart, queryPart] = h.split("?");
  const segments = pathPart.split("/").filter(Boolean);
  const params = {};
  if (queryPart) queryPart.split("&").forEach(kv => {
    const [k, v] = kv.split("=");
    if (k) params[k] = decodeURIComponent(v || "");
  });
  return { path: pathPart || "/", segments, params };
}

function App() {
  const [route, setRoute] = useAS(() => window.location.hash || "#/");
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useAE(() => {
    const onHash = () => { setRoute(window.location.hash || "#/"); window.scrollTo({ top: 0, behavior: "instant" }); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Apply tweak attributes to root
  useAE(() => {
    const root = document.documentElement;
    root.setAttribute("data-brand", t.brand);
    root.setAttribute("data-calm", String(t.calm));
    root.setAttribute("data-reduced-motion", String(t.reducedMotion));
    if (t.dark) root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
  }, [t.brand, t.calm, t.reducedMotion, t.dark]);

  const onNav = (path) => { window.location.hash = "#" + path; };

  const parsed = parseRoute(route);
  const { vouchers, publishers } = window.VOUCHSTACK_DATA;

  let page;
  if (parsed.path === "/" || parsed.path === "") {
    page = <HomePage vouchers={vouchers} publishers={publishers} onNav={onNav} />;
  } else if (parsed.segments[0] === "voucher" && parsed.segments[1]) {
    page = <VoucherDetailPage voucherId={parsed.segments[1]} vouchers={vouchers} onNav={onNav} />;
  } else if (parsed.segments[0] === "search") {
    page = <SearchPage vouchers={vouchers} publishers={publishers} onNav={onNav} initialFilters={parsed.params} />;
  } else if (parsed.segments[0] === "components" && parsed.segments[1]) {
    page = <ComponentDetailPage name={parsed.segments[1]} vouchers={vouchers} onNav={onNav} />;
  } else if (parsed.segments[0] === "compare") {
    const idList = parsed.params.ids ? parsed.params.ids.split(",") : [];
    page = <ComparePage idList={idList} vouchers={vouchers} onNav={onNav} />;
  } else if (parsed.segments[0] === "publishers" && parsed.segments[1]) {
    page = <PublisherPage pubkey={decodeURIComponent(parsed.segments[1])} vouchers={vouchers} publishers={publishers} onNav={onNav} />;
  } else if (parsed.path === "/docs" || parsed.path === "/publish") {
    page = <ComingSoonPage title={parsed.path === "/docs" ? "Docs" : "Publish a Voucher"} onNav={onNav} />;
  } else {
    page = (
      <div className="vs-empty">
        <h3>Route not found</h3>
        <p style={{ marginTop: 8 }}>Couldn't resolve "{parsed.path}".</p>
        <button className="vs-btn vs-btn-primary" style={{ marginTop: 20 }} onClick={() => onNav("/")}>Home</button>
      </div>
    );
  }

  return (
    <React.Fragment>
      <Layout route={parsed.path} onNav={onNav}>{page}</Layout>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Brand layer">
          <TweakRadio
            label="Identity"
            value={t.brand}
            options={["core", "vouchstack", "slate"]}
            onChange={(v) => setTweak("brand", v)}
          />
        </TweakSection>
        <TweakSection label="Surface">
          <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak("dark", v)} />
          <TweakToggle label="Calm (drops shadows)" value={t.calm} onChange={(v) => setTweak("calm", v)} />
          <TweakToggle label="Reduced motion" value={t.reducedMotion} onChange={(v) => setTweak("reducedMotion", v)} />
        </TweakSection>
      </TweaksPanel>
    </React.Fragment>
  );
}

function ComingSoonPage({ title, onNav }) {
  return (
    <div className="vs-empty">
      <h3>{title}</h3>
      <p style={{ marginTop: 8 }}>This route is part of the v2 roadmap. Demo flow doesn't need it.</p>
      <button className="vs-btn vs-btn-primary" style={{ marginTop: 20 }} onClick={() => onNav("/")}>Back to ledger</button>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
