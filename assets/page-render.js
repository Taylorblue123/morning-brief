// Generic inner-page renderer.
// URL: /page.html?path=<kind>/<slug>  ->  fetches data/pages/<kind>/<slug>.json
// Page JSON schema:
//   { kind, slug, title, eyebrow, subtitle, meta: [..strings..], updated, blocks: [...] }
// Block types: prose, code, callout, embed, checklist, gallery, quote, chart(html)

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

async function fetchWithRetry(url, attempts = 3) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      const bust = `${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url + bust, { cache: "no-store", signal: ctrl.signal });
      clearTimeout(to);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) { last = e; if (i < attempts - 1) await new Promise(r => setTimeout(r, 1500 * (i + 1))); }
  }
  throw last;
}

const BLOCKS = {
  prose: (b) => `<div class="block block-prose">${marked.parse(b.markdown || b.text || "")}</div>`,
  code: (b) => `<div class="block">
    <div class="block-code"><span class="code-lang">${esc(b.language || "code")}</span><pre>${esc(b.code || "")}</pre></div>
  </div>`,
  callout: (b) => `<div class="block"><div class="block-callout">
    ${b.label ? `<span class="block-callout-label">${esc(b.label)}</span>` : ""}
    ${marked.parseInline(b.text || "")}
  </div></div>`,
  quote: (b) => `<div class="block"><div class="block-quote">
    "${esc(b.text || "")}"
    ${b.cite ? `<span class="block-quote-cite">— ${esc(b.cite)}</span>` : ""}
  </div></div>`,
  embed: (b) => `<div class="block block-embed">
    <iframe src="${esc(b.src)}" height="${esc(b.height || 520)}" frameborder="0" loading="lazy" allowfullscreen></iframe>
  </div>`,
  checklist: (b) => {
    const storeKey = `mb.checklist.${b.id || Math.random().toString(36).slice(2)}`;
    const stored = JSON.parse(localStorage.getItem(storeKey) || "{}");
    return `<div class="block"><ul class="block-checklist" data-store="${storeKey}">
      ${(b.items || []).map((it, i) => `
        <li data-idx="${i}" class="${stored[i] ? "done" : ""}">${esc(it)}</li>
      `).join("")}
    </ul></div>`;
  },
  gallery: (b) => `<div class="block block-gallery">
    ${(b.images || []).map(img => `<img src="${esc(img.src)}" alt="${esc(img.alt || "")}"/>`).join("")}
  </div>`,
  html: (b) => `<div class="block">${b.html || ""}</div>`,
};

function bindChecklists() {
  document.querySelectorAll(".block-checklist").forEach(ul => {
    const key = ul.dataset.store;
    ul.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (!li) return;
      li.classList.toggle("done");
      const state = {};
      ul.querySelectorAll("li").forEach(n => { if (n.classList.contains("done")) state[n.dataset.idx] = 1; });
      localStorage.setItem(key, JSON.stringify(state));
    });
  });
}

async function main() {
  const root = document.getElementById("content");
  const params = new URLSearchParams(location.search);
  const path = params.get("path");
  if (!path) {
    root.innerHTML = `<div class="error">No page specified. Use <code>?path=kind/slug</code>.</div>`;
    return;
  }
  try {
    const res = await fetchWithRetry(`./data/pages/${path}.json`);
    const p = await res.json();
    document.title = `${p.title || path} · Morning Brief`;
    marked.setOptions({ gfm: true, breaks: false });
    const backKind = p.kind || path.split("/")[0] || "";
    root.innerHTML = `
      <div class="page-hero">
        <a class="page-back" href="./${backKind ? `section.html?kind=${esc(backKind)}` : "index.html"}">← ${esc(backKind || "home")}</a>
        ${p.eyebrow ? `<div class="page-eyebrow">${esc(p.eyebrow)}</div>` : ""}
        <h1 class="page-title">${esc(p.title || "")}</h1>
        ${p.subtitle ? `<div class="page-subtitle">${esc(p.subtitle)}</div>` : ""}
        ${p.meta && p.meta.length ? `<div class="page-meta">${p.meta.map(m => `<span>${esc(m)}</span>`).join("")}</div>` : ""}
      </div>
      <div class="page-body">
        ${(p.blocks || []).map(b => (BLOCKS[b.type] || (x => `<div class="error">unknown block type: ${esc(x.type)}</div>`))(b)).join("")}
      </div>
      <div class="footer">${p.updated ? `Updated ${esc(p.updated)} · ` : ""}<a href="./index.html">morning brief</a> · <a href="./section.html?kind=${esc(backKind)}">all ${esc(backKind)}</a></div>`;
    bindChecklists();
  } catch (e) {
    root.innerHTML = `<div class="error">Could not load page: ${esc(e.message || e)}</div>`;
  }
}
main();
