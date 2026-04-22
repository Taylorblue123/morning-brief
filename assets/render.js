// Morning Brief renderer — data-driven.
// Loads data/latest.json (or data/YYYY-MM-DD.json via ?date=...) and renders components by section type.
// New section types only need a new render function registered in RENDERERS.

// ---- Theme (Apple-style: auto-follow OS + user override) ----
(function initTheme() {
  const KEY = "morningbrief.theme";
  const stored = localStorage.getItem(KEY);
  if (stored === "light" || stored === "dark") {
    document.documentElement.setAttribute("data-theme", stored);
  }
  window.__toggleTheme = () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const osPref = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const next = cur ? (cur === "dark" ? "light" : "dark") : (osPref === "dark" ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(KEY, next);
    const btn = document.querySelector(".theme-toggle");
    if (btn) btn.textContent = next === "dark" ? "◐ light" : "◑ dark";
  };
})();

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

function renderInline(text) {
  // very light markdown: **bold**, `code`, [text](url)
  if (text == null) return "";
  let s = esc(text);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}

// ---- Section renderers ----
const RENDERERS = {
  "focus-cards": (s) => `
    <div class="section">
      <div class="section-head">
        <span class="section-icon">${s.icon || "🎯"}</span>
        <span class="section-title">${esc(s.title || "Top for today")}</span>
        ${s.meta ? `<span class="section-meta">${esc(s.meta)}</span>` : ""}
      </div>
      <div class="focus-grid${s.items && s.items[0] && s.items[0].priority === "hero" ? " has-hero" : ""}">
        ${(s.items || []).map((it, i) => `
          <div class="focus-card${it.priority === "hero" ? " is-hero" : ""}">
            <div class="focus-num">${String(i+1).padStart(2,"0")}</div>
            <div class="focus-title">${esc(it.title)}</div>
            <div class="focus-desc">${renderInline(it.desc)}</div>
            ${it.tag ? `<div class="focus-tag">${esc(it.tag)}</div>` : ""}
            ${it.eta ? `<div class="focus-eta">⏱ ${esc(it.eta)}</div>` : ""}
          </div>
        `).join("")}
      </div>
    </div>`,

  "hero-stats": (s) => `
    <div class="section hero-stats-section">
      ${s.title ? `<div class="section-head">
        <span class="section-icon">${s.icon || "📊"}</span>
        <span class="section-title">${esc(s.title)}</span>
        ${s.meta ? `<span class="section-meta">${esc(s.meta)}</span>` : ""}
      </div>` : ""}
      <div class="kpi-strip">
        ${(s.stats || []).map(k => `
          <div class="kpi-tile${k.tone ? " tone-" + esc(k.tone) : ""}">
            <div class="kpi-value">${esc(k.value)}${k.unit ? `<span class="kpi-unit">${esc(k.unit)}</span>` : ""}</div>
            <div class="kpi-label">${esc(k.label)}</div>
            ${k.delta ? `<div class="kpi-delta ${esc(k.deltaTone || "neutral")}">${esc(k.delta)}</div>` : ""}
            ${k.sub ? `<div class="kpi-sub">${esc(k.sub)}</div>` : ""}
          </div>
        `).join("")}
      </div>
    </div>`,

  "pulse-grid": (s) => `
    <div class="section">
      <div class="section-head">
        <span class="section-icon">${s.icon || "💼"}</span>
        <span class="section-title">${esc(s.title || "Pulse")}</span>
        ${s.meta ? `<span class="section-meta">${esc(s.meta)}</span>` : ""}
      </div>
      <div class="pulse-grid" style="${(s.cards || []).length === 1 ? 'grid-template-columns:1fr;' : ''}">
        ${(s.cards || []).map(card => `
          <div class="pulse-card">
            ${(card.rows || []).map(r => {
              const hasBar = r.bar != null;
              const dotCls = r.dot ? `<span class="dot ${esc(r.dot)}"></span>` : "";
              const barCls = r.barColor || "gray";
              return `<div class="pulse-row ${hasBar ? "" : "simple"}">
                <span class="pulse-label">${dotCls}${esc(r.label)}</span>
                ${hasBar ? `<span class="mini-bar"><span class="mini-bar-fill ${esc(barCls)}" style="width:${Math.max(0, Math.min(100, r.bar))}%"></span></span>` : ""}
                <span class="pulse-value">${esc(r.value)}</span>
              </div>`;
            }).join("")}
          </div>
        `).join("")}
      </div>
    </div>`,

  "project-tiles": (s) => `
    <div class="section">
      <div class="section-head">
        <span class="section-icon">${s.icon || "🚀"}</span>
        <span class="section-title">${esc(s.title || "Projects")}</span>
        ${s.meta ? `<span class="section-meta">${esc(s.meta)}</span>` : ""}
      </div>
      <div class="proj-grid">
        ${(s.items || []).map(p => `
          <div class="proj-tile">
            ${p.thumb ? `<div class="proj-thumb"><img src="${esc(p.thumb)}" alt="${esc(p.name)} preview" loading="lazy"></div>` : ""}
            <div class="proj-head">
              <div class="proj-name">${esc(p.name)}</div>
              ${p.activity != null ? `<span class="proj-activity" title="recent commits">●${esc(p.activity)}</span>` : ""}
            </div>
            <div class="proj-status">${p.dot ? `<span class="dot ${esc(p.dot)}"></span>` : ""}${esc(p.status || "")}</div>
            <div class="proj-bar"><div class="proj-bar-fill" style="width:${Math.max(0, Math.min(100, p.progress ?? 0))}%"></div></div>
            ${p.next ? `<div class="proj-next"><span class="proj-next-label">NEXT</span>${esc(p.next)}</div>` : ""}
            ${p.links && p.links.length ? `<div class="proj-links">${p.links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("")}</div>` : ""}
          </div>
        `).join("")}
      </div>
    </div>`,

  "ideas": (s) => `
    <div class="section">
      <div class="section-head">
        <span class="section-icon">${s.icon || "💡"}</span>
        <span class="section-title">${esc(s.title || "Ideas")}</span>
        ${s.meta ? `<span class="section-meta">${esc(s.meta)}</span>` : ""}
      </div>
      <div class="ideas-card">
        ${(s.items || []).map(it => `
          <div class="idea-item">
            <div class="idea-title">${esc(it.title)}</div>
            ${it.quote ? `<div class="idea-quote">"${esc(it.quote)}"</div>` : ""}
            ${it.tags && it.tags.length ? `<div class="idea-tags">${it.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
          </div>
        `).join("")}
      </div>
    </div>`,

  "markdown": (s) => `
    <div class="section">
      <div class="section-head">
        <span class="section-icon">${s.icon || "📝"}</span>
        <span class="section-title">${esc(s.title || "Notes")}</span>
        ${s.meta ? `<span class="section-meta">${esc(s.meta)}</span>` : ""}
      </div>
      <div class="md-block">${s.html || renderInline(s.text || "")}</div>
    </div>`,

  "html": (s) => `
    <div class="section">
      <div class="section-head">
        <span class="section-icon">${s.icon || "📊"}</span>
        <span class="section-title">${esc(s.title || "Custom")}</span>
        ${s.meta ? `<span class="section-meta">${esc(s.meta)}</span>` : ""}
      </div>
      ${s.html || ""}
    </div>`,

  "paper-brief": (s) => {
    const p = s.paper || {};
    return `
    <div class="section">
      <div class="section-head">
        <span class="section-icon">${s.icon || "📄"}</span>
        <span class="section-title">${esc(s.title || "Paper of the day")}</span>
        ${s.meta ? `<span class="section-meta">${esc(s.meta)}</span>` : ""}
      </div>
      <div class="paper-card">
        <div class="paper-meta-row">
          ${p.venue ? `<span class="paper-pill">${esc(p.venue)}</span>` : ""}
          ${p.arxiv_id ? `<span class="paper-pill mono">arXiv:${esc(p.arxiv_id)}</span>` : ""}
          ${p.published ? `<span class="paper-pill mono">${esc(p.published)}</span>` : ""}
          ${p.citations != null ? `<span class="paper-pill">⭐ ${esc(p.citations)} cites</span>` : ""}
        </div>
        <div class="paper-title">${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)}</a>` : esc(p.title)}</div>
        ${p.authors ? `<div class="paper-authors">${esc(p.authors)}</div>` : ""}
        ${p.tldr ? `<div class="paper-tldr"><span class="paper-label">TL;DR</span>${renderInline(p.tldr)}</div>` : ""}
        ${p.why ? `<div class="paper-why"><span class="paper-label">WHY IT MATTERS</span>${renderInline(p.why)}</div>` : ""}
        ${p.key_findings && p.key_findings.length ? `
          <ul class="paper-findings">
            ${p.key_findings.map(f => `<li>${renderInline(f)}</li>`).join("")}
          </ul>` : ""}
        ${p.url ? `<div class="paper-actions"><a class="paper-link" href="${esc(p.url)}" target="_blank" rel="noopener">📖 Read paper →</a>${p.pdf_url ? `<a class="paper-link" href="${esc(p.pdf_url)}" target="_blank" rel="noopener">PDF</a>` : ""}</div>` : ""}
      </div>
    </div>`;
  },

  "trends": (s) => `
    <div class="section">
      <div class="section-head">
        <span class="section-icon">${s.icon || "📈"}</span>
        <span class="section-title">${esc(s.title || "Industry pulse")}</span>
        ${s.meta ? `<span class="section-meta">${esc(s.meta)}</span>` : ""}
      </div>
      <div class="trends-grid">
        ${(s.items || []).map((t, i) => `
          <div class="trend-card">
            <div class="trend-num">${String(i+1).padStart(2,"0")}</div>
            <div class="trend-source">
              ${t.source ? `<span class="trend-pill">${esc(t.source)}</span>` : ""}
              ${t.score != null ? `<span class="trend-pill mono">▲ ${esc(t.score)}</span>` : ""}
            </div>
            <div class="trend-title">${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.title)}</a>` : esc(t.title)}</div>
            ${t.summary ? `<div class="trend-summary">${renderInline(t.summary)}</div>` : ""}
            ${t.why ? `<div class="trend-why"><span class="trend-label">SO WHAT</span>${renderInline(t.why)}</div>` : ""}
          </div>
        `).join("")}
      </div>
    </div>`,

  "review-points": (s) => `
    <div class="section">
      <div class="section-head">
        <span class="section-icon">${s.icon || "🔍"}</span>
        <span class="section-title">${esc(s.title || "Review & feedback")}</span>
        ${s.meta ? `<span class="section-meta">${esc(s.meta)}</span>` : ""}
      </div>
      <div class="review-card">
        ${(s.items || []).map((it, i) => `
          <div class="review-item">
            <div class="review-num">${String(i+1).padStart(2,"0")}</div>
            <div class="review-body">
              <div class="review-q">${renderInline(it.question || it.title)}</div>
              ${it.context ? `<div class="review-ctx">${renderInline(it.context)}</div>` : ""}
              ${it.options && it.options.length ? `<div class="review-opts">${it.options.map(o => `<span class="review-opt">${esc(o)}</span>`).join("")}</div>` : ""}
            </div>
          </div>
        `).join("")}
      </div>
    </div>`,

  "overnight-log": (s) => {
    const items = s.items || [];
    const lowValue = it => it.status === "skipped" || it.status === "info";
    const headline = items.filter(it => !lowValue(it));
    const muted    = items.filter(it => lowValue(it));
    return `
    <div class="section">
      <div class="section-head">
        <span class="section-icon">${s.icon || "🌙"}</span>
        <span class="section-title">${esc(s.title || "Overnight iteration log")}</span>
        ${s.meta ? `<span class="section-meta">${esc(s.meta)}</span>` : ""}
      </div>
      <div class="log-card">
        ${headline.map(it => `
          <div class="log-item">
            <div class="log-time mono">${esc(it.time || "")}</div>
            <div class="log-body">
              <div class="log-title">${it.status ? `<span class="log-status log-${esc(it.status)}">${esc(it.status)}</span>` : ""}${renderInline(it.title)}</div>
              ${it.detail ? `<div class="log-detail">${renderInline(it.detail)}</div>` : ""}
              ${it.links && it.links.length ? `<div class="log-links">${it.links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</div>` : ""}
            </div>
          </div>
        `).join("")}
        ${muted.length ? `
          <details class="log-collapsed">
            <summary class="log-collapse-summary">+ ${muted.length} skipped/info entries</summary>
            ${muted.map(it => `
              <div class="log-item log-muted">
                <div class="log-time mono">${esc(it.time || "")}</div>
                <div class="log-body">
                  <div class="log-title">${it.status ? `<span class="log-status log-${esc(it.status)}">${esc(it.status)}</span>` : ""}${renderInline(it.title)}</div>
                  ${it.detail ? `<div class="log-detail">${renderInline(it.detail)}</div>` : ""}
                </div>
              </div>
            `).join("")}
          </details>
        ` : ""}
      </div>
    </div>`;
  },

  "drilldown-cards": (s) => `
    <div class="section">
      <div class="section-head">
        <span class="section-icon">${s.icon || "🧭"}</span>
        <span class="section-title">${esc(s.title || "Dive deeper")}</span>
        ${s.meta ? `<span class="section-meta">${esc(s.meta)}</span>` : ""}
      </div>
      <div class="drilldown-grid">
        ${(s.items || []).map(it => `
          <a class="drilldown-card" href="${esc(it.href)}">
            <span class="drilldown-icon">${esc(it.icon || "📎")}</span>
            <div class="drilldown-title">${esc(it.title)}</div>
            <div class="drilldown-sub">${renderInline(it.subtitle || "")}</div>
            ${it.stats && it.stats.length ? `<div class="drilldown-stats">${it.stats.map(st => `<span>${renderInline(st)}</span>`).join("")}</div>` : ""}
            <div class="drilldown-cta">${esc(it.cta || "Open →")}</div>
          </a>
        `).join("")}
      </div>
    </div>`,
};

async function fetchWithRetry(url, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const bust = `${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url + bust, { cache: "no-store", signal: ctrl.signal });
      clearTimeout(to);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw lastErr;
}

async function loadBrief() {
  const root = document.getElementById("root");
  const params = new URLSearchParams(window.location.search);
  const date = params.get("date");
  const url = date ? `./data/${date}.json` : "./data/latest.json";

  try {
    const b = await fetchWithRetry(url, 3);

    const generated = b.generated_at ? new Date(b.generated_at).toLocaleString() : "";
    const sectionsHtml = (b.sections || []).map(s => {
      const fn = RENDERERS[s.type];
      if (!fn) return `<div class="section"><div class="error">Unknown section type: ${esc(s.type)}</div></div>`;
      return fn(s);
    }).join("");

    root.innerHTML = `
      <div class="header">
        <div class="date-line">${esc(b.date_display || b.date || "")}</div>
        <div class="stamp">
          ${esc(b.version || "morning-brief v1")}
          <a href="./proposal.html">proposals</a>
          <a href="./feedback.html">feedback</a>
          <a href="./archive.html">archive</a>
          <button class="theme-toggle" onclick="window.__toggleTheme()">◑ theme</button>
        </div>
      </div>
      <h1>${esc(b.greeting || "Good morning.")}</h1>
      ${b.tldr ? `<div class="tldr"><div class="tldr-label">TL;DR</div><div class="tldr-text">${renderInline(b.tldr)}</div></div>` : ""}
      ${sectionsHtml}
      <div class="footer">
        Delivered by Hermes · Linear.app design system
        ${generated ? ` · generated ${esc(generated)}` : ""}
      </div>`;
    document.title = `Morning Brief — ${b.date || ""}`;
  } catch (e) {
    root.innerHTML = `<div class="error">
      Could not load brief: ${esc(e.message || e)}.<br><br>
      <button onclick="location.reload()" style="
        background: rgba(113,112,255,0.1); color: #f7f8f8;
        border: 1px solid rgba(113,112,255,0.3); padding: 8px 16px;
        border-radius: 6px; font: 510 14px 'Inter', sans-serif; cursor: pointer;
      ">↻ Retry</button>
      <div style="margin-top:20px;font-size:11px;color:#72767d;">
        If this persists, the CDN may be updating. Try again in ~30s or
        <a href="./data/latest.json" style="color:#7170ff;">open the raw JSON</a>.
      </div>
    </div>`;
  }
}

// Auto-retry once on network hiccup when the page regains focus.
window.addEventListener("online", () => location.reload());

loadBrief();
