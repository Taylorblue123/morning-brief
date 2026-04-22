// Morning Brief renderer — data-driven.
// Loads data/latest.json (or data/YYYY-MM-DD.json via ?date=...) and renders components by section type.
// New section types only need a new render function registered in RENDERERS.

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
      <div class="focus-grid">
        ${(s.items || []).map((it, i) => `
          <div class="focus-card">
            <div class="focus-num">${String(i+1).padStart(2,"0")}</div>
            <div class="focus-title">${esc(it.title)}</div>
            <div class="focus-desc">${renderInline(it.desc)}</div>
            ${it.tag ? `<div class="focus-tag">${esc(it.tag)}</div>` : ""}
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
            <div class="proj-name">${esc(p.name)}</div>
            <div class="proj-status">${p.dot ? `<span class="dot ${esc(p.dot)}"></span>` : ""}${esc(p.status || "")}</div>
            <div class="proj-bar"><div class="proj-bar-fill" style="width:${Math.max(0, Math.min(100, p.progress ?? 0))}%"></div></div>
            ${p.next ? `<div class="proj-next"><span class="proj-next-label">NEXT</span>${esc(p.next)}</div>` : ""}
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
};

async function loadBrief() {
  const root = document.getElementById("root");
  const params = new URLSearchParams(window.location.search);
  const date = params.get("date");
  const url = date ? `./data/${date}.json` : "./data/latest.json";

  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const b = await res.json();

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
          <a href="./archive.html">archive</a>
          <a href="https://github.com/Taylorblue123/morning-brief" target="_blank" rel="noopener">source</a>
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
    root.innerHTML = `<div class="error">Could not load brief: ${esc(e.message)}.<br>Try again in a minute (GitHub Pages may still be publishing).</div>`;
  }
}

loadBrief();
