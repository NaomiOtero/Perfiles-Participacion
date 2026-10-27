(function () {
  "use strict";
  const D = window.DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const fmt = (n, d = 1) => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toFixed(d);

  /* ---------- Pestañas ---------- */
  function showTab(id) {
    document.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === id)));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === id));
    try { localStorage.setItem("tab", id); } catch (e) {}
    if (id === "clima" && !climaCargado) cargarNoticias();
  }
  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", (ev) => { ev.preventDefault(); showTab(b.dataset.tab); window.scrollTo({ top: 0, behavior: "smooth" }); }));

  /* ---------- Perfiles ---------- */
  function renderPerfiles() {
    const total = D.perfiles.reduce((s, p) => s + p.lista, 0);
    $("#barra").innerHTML = D.perfiles.map((p, i) => `<div style="--c:${p.color};--d:${0.3 + i * 0.08}s;flex:${p.lista}" title="${p.id} ${esc(p.nombre)}: ${p.lista} % de la lista" data-id="${p.id}">${p.id}</div>`).join("");
    $("#barra-ley").innerHTML = D.perfiles.map((p) => `<span style="--c:${p.color}">${p.id} · ${Math.round((p.lista / total) * 1000) / 10} %</span>`).join("");
    document.querySelectorAll("#barra div").forEach((d) => d.addEventListener("click", () => detallePerfil(d.dataset.id)));
    $("#perfil-cards").innerHTML = D.perfiles.map((p, i) => `
      <button class="card pcard" style="--c:${p.color};--d:${0.35 + i * 0.06}s" data-id="${p.id}" aria-pressed="false">
        <div class="id"><span>${p.id}</span>${p.prioridad ? '<span class="tag">Prioritario</span>' : ""}</div>
        <div class="nom">${esc(p.nombre)}</div>
        <div class="big">${p.nivel.toFixed(1)}<small> %</small></div>
        <div class="mini" aria-hidden="true"><i style="width:${p.nivel}%"></i></div>
        <div class="muted small">participación media · ${p.lista} % de la lista</div>
        <div class="small" style="margin-top:8px">${esc(p.rasgo)}</div>
      </button>`).join("");
    document.querySelectorAll(".pcard").forEach((c) => c.addEventListener("click", () => detallePerfil(c.dataset.id)));
  }
  function detallePerfil(id) {
    const p = D.perfiles.find((x) => x.id === id);
    const estr = D.estrategias.filter((e) => e.perfil === id);
    const el = $("#perfil-detalle");
    document.querySelectorAll(".pcard").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.id === id)));
    el.hidden = false;
    el.style.setProperty("--c", p.color);
    el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
    el.innerHTML = `
      <h3 style="margin-top:0">${p.id} · ${esc(p.nombre)}</h3>
      <p>${esc(p.resumen)}</p>
      <p class="muted">${esc(p.quienes)}. Más presencia en ${esc(p.estados)}.</p>
      <div class="kv">
        <div><span>Salto presidencial</span>${fmt(p.salto)} pp</div>
        <div><span>Tendencia 2009–2024</span>${fmt(p.tendencia)} pp</div>
        <div><span>Regularidad (alta = errática)</span>${p.regularidad}</div>
        <div><span>18 a 34 años</span>${p.jovenes} %</div>
        <div><span>60 años o más</span>${p.mayores} %</div>
        <div><span>Mujeres</span>${p.mujeres} %</div>
        <div><span>Urbano / rural</span>${p.urbano} / ${p.rural} %</div>
        <div><span>Robustez</span>${esc(p.robustez)}</div>
      </div>
      <p style="margin-top:14px"><strong>Estrategia:</strong> ${estr.map((e) => esc(e.mensaje)).join(" · ")}</p>
      <button class="btn ghost" id="ir-estr">Ver estrategia completa →</button>`;
    $("#ir-estr").addEventListener("click", () => { showTab("estrategias"); selEstrategia(estr[0].id); });
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ---------- Estrategias ---------- */
  const MESES = ["Feb", "Mar", "Abr", "May", "Jun"];
  const CAL = { P1H: [1, 2, 3], P1M: [0, 1], P2: [3, 4], P3: [2, 3, 4], P4: [0, 1], P5: [3, 4], P6: [3, 4] };
  function renderEstrategias() {
    $("#estr-chips").innerHTML = D.estrategias.map((e) => `<button class="chip" aria-pressed="false" data-id="${e.id}">${esc(e.titulo)}</button>`).join("");
    document.querySelectorAll("#estr-chips .chip").forEach((c) => c.addEventListener("click", () => selEstrategia(c.dataset.id)));
    selEstrategia(D.estrategias[0].id);

    const filas = D.estrategias.map((e) => `<tr><th>${esc(e.titulo)}</th>${MESES.map((_, i) => `<td class="${CAL[e.id].includes(i) ? "on" : ""}"></td>`).join("")}</tr>`).join("");
    $("#calendario").innerHTML = `<table><thead><tr><th></th>${MESES.map((m) => `<th>${m}</th>`).join("")}</tr></thead><tbody>
      <tr class="tv"><th>Transversal · visita del capacitador</th>${MESES.map((_, i) => `<td class="${i < 2 ? "on" : ""}"></td>`).join("")}</tr>${filas}</tbody></table>
      <p class="muted small">Jornada: domingo ${D.eleccion.fecha}.</p>`;

    $("#transversales").innerHTML = D.transversales.map((t, i) => `<div class="card"><span class="tag">Transversal ${i + 1}</span><h4>${esc(t.titulo)}</h4><p class="small">${esc(t.texto)}</p></div>`).join("");
  }
  function selEstrategia(id) {
    const e = D.estrategias.find((x) => x.id === id);
    document.querySelectorAll("#estr-chips .chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.id === id)));
    $("#estr-detalle").innerHTML = `
      <div class="estr">
        <div class="card"><h4>Mensaje</h4>${esc(e.mensaje)}</div>
        <div class="card"><h4>Canal</h4>${esc(e.canal)}</div>
        <div class="card"><h4>Momento</h4>${esc(e.momento)}</div>
        <div class="card"><h4>Cómo se mide</h4>${esc(e.medir)}</div>
      </div>
      <p class="porque"><b>Por qué:</b> ${esc(e.nota)}</p>
      <button class="btn ghost" id="ir-gen">Generar un mensaje para este perfil →</button>`;
    $("#ir-gen").addEventListener("click", () => { $("#g-perfil").value = id; showTab("mensajes"); generar(); });
  }

  /* ---------- Evidencia ---------- */
  function renderTacticas() {
    const canales = ["Todos", ...new Set(D.tacticas.map((t) => t.canal))];
    let f = "Todos";
    $("#f-canal").innerHTML = canales.map((c) => `<button class="chip" aria-pressed="${c === f}" data-c="${esc(c)}">${esc(c)}</button>`).join("");
    document.querySelectorAll("#f-canal .chip").forEach((b) => b.addEventListener("click", () => {
      f = b.dataset.c;
      document.querySelectorAll("#f-canal .chip").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      pintar();
    }));
    const max = Math.max(...D.tacticas.map((t) => Math.abs(t.valor || 0)));
    function pintar() {
      $("#tacticas").innerHTML = D.tacticas.filter((t) => f === "Todos" || t.canal === f).map((t, i) => {
        const w = t.valor == null ? 0 : (Math.abs(t.valor) / max) * 100;
        return `<div class="tac" style="animation-delay:${i * 0.04}s">
          <div><strong>${esc(t.tactica)}</strong><div class="small muted">${esc(t.contexto)} · <a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.fuente)}</a></div>
          <span class="ine ${/evitar|no recom/i.test(t.inePuede) ? "evitar" : ""}">En el INE: ${esc(t.inePuede)}</span></div>
          <div><div class="barwrap">${t.valor == null ? "" : `<div class="bar ${t.valor < 0 ? "neg" : ""}" style="width:${Math.max(w, 1)}%"></div>`}</div>
          <div class="ef">${esc(t.efecto)}</div></div></div>`;
      }).join("");
    }
    pintar();
  }

  /* ---------- Clima informativo por estado ---------- */
  let climaCargado = false;
  const TEMAS = Object.keys(D.temas);
  const ESTADO = Object.fromEntries(D.estados.map(([k, n, c, r]) => [k, { k, n, c, r }]));
  function clasificar(titulo) {
    const t = " " + norm(titulo) + " ";
    for (const k of TEMAS) if (D.temas[k].claves.some((c) => t.includes(c))) return k;
    return "otros";
  }
  function normNota(a, estado) {
    const o = Array.isArray(a) ? { t: a[0], f: a[1], d: a[2] && a[2].length === 5 ? "2026-" + a[2] : a[2] } : a;
    const t = " " + norm(o.t) + " ";
    const tema = clasificar(o.t);
    return { ...o, tema, e: estado || o.e || "",
      claves: D.temas[tema] ? D.temas[tema].claves.filter((c) => t.includes(c)).map((c) => c.trim()) : [],
      negs: D.negativas.filter((w) => t.includes(w)),
      get neg() { return this.negs.length > 0; },
      directo: !!o.u,
      u: o.u || "https://news.google.com/search?q=" + encodeURIComponent(o.t) + "&hl=es-419&gl=MX&ceid=MX:es-419" };
  }
  function resumen(notas) {
    const n = notas.length, cuenta = {};
    notas.forEach((a) => (cuenta[a.tema] = (cuenta[a.tema] || 0) + 1));
    const alerta = notas.filter((a) => D.temas[a.tema] && D.temas[a.tema].alerta).length;
    const neg = notas.filter((a) => a.neg).length;
    const indice = n ? Math.round(100 * (0.7 * (alerta / n) + 0.3 * (neg / n))) : null;
    const principal = TEMAS.filter((k) => D.temas[k].alerta).sort((a, b) => (cuenta[b] || 0) - (cuenta[a] || 0))[0];
    return { n, cuenta, alerta, neg, indice, principal };
  }
  function colorIndice(v) { // escala secuencial: papel → cempasúchil → coral
    if (v == null) return "var(--paper-2)";
    const x = Math.min(v / 60, 1);
    const stops = [[245, 236, 214], [236, 170, 70], [190, 60, 40]];
    const [a, b, f] = x < 0.5 ? [stops[0], stops[1], x / 0.5] : [stops[1], stops[2], (x - 0.5) / 0.5];
    return `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * f)).join(",")})`;
  }
  let DATOS = null, sel = "NAC", filtroTema = "";
  function cargarNoticias() {
    climaCargado = true;
    const c = window.NOTICIAS_CACHE;
    if (!c || !c.estados) {
      $("#clima-estado").textContent = "Aún no hay noticias guardadas. Corre: python3 scripts/actualizar_noticias.py";
      return;
    }
    const estados = {};
    for (const [k, arr] of Object.entries(c.estados)) { const notas = arr.map((a) => normNota(a, k)); estados[k] = { notas, r: resumen(notas) }; }
    const vistos = new Set(), todas = [];
    [...(c.nacional || []).map((a) => normNota(a)), ...Object.values(estados).flatMap((e) => e.notas)].forEach((a) => { const k = norm(a.t); if (!vistos.has(k)) { vistos.add(k); todas.push(a); } });
    DATOS = { estados, nacional: { notas: todas, r: resumen(todas) } };
    const f = new Date(c.generado);
    $("#clima-estado").textContent = `Actualizado el ${f.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })} · ${todas.length} notas únicas · ${c.fuente}, últimos ${c.dias || 14} días` + (c.muestra ? " · muestra inicial" : "");
    pintarMapa(); pintarRanking(); pintarDetalle();
  }
  /* Mapa SVG con zoom: clic en un estado para acercar; botones, Ctrl/⌘ + rueda o pellizco; arrastrar para mover. */
  const BASE = { x: 0, y: 0, w: 0, h: 0 };
  let VB = null, anim = 0, svgEl = null;
  function pintarMapa() {
    const M = window.MAPA_MX, m = $("#mapa");
    if (!M) return pintarMosaico();
    if (svgEl) return actualizarMapa();
    Object.assign(BASE, { w: M.w, h: M.h }); VB = { ...BASE };
    m.classList.add("svg");
    m.innerHTML = `<svg viewBox="0 0 ${M.w} ${M.h}" role="group" aria-label="Mapa de México por estado">
      <g class="edos">${D.estados.map(([k]) => `<path class="edo" d="${M.estados[k].d}" data-k="${k}" tabindex="0" role="button"></path>`).join("")}</g>
      <path class="hover-ol" d=""></path><path class="sel-ol" d=""></path>
      <g class="lbls">${D.estados.map(([k]) => { const c = M.estados[k].c; return `<text class="lbl" data-k="${k}" x="${c[0]}" y="${c[1]}"><tspan class="lk" x="${c[0]}">${k}</tspan><tspan class="lv" x="${c[0]}"></tspan></text>`; }).join("")}</g>
    </svg>
    <div class="zoom-ctrl" role="group" aria-label="Zoom del mapa">
      <button type="button" data-z="in" aria-label="Acercar">+</button>
      <button type="button" data-z="out" aria-label="Alejar">−</button>
      <button type="button" data-z="reset" aria-label="Ver todo el país">⤢</button>
    </div>
    <p class="zoom-hint">Toca un estado para acercarte · Ctrl/⌘ + rueda o pellizca para hacer zoom · arrastra para moverte</p>
    <div class="mapa-tip" hidden></div>`;
    svgEl = m.querySelector("svg");
    const tip = m.querySelector(".mapa-tip"), hoverOl = svgEl.querySelector(".hover-ol");
    let arrastre = null, movio = false;

    m.querySelectorAll(".edo").forEach((p) => {
      const k = p.dataset.k;
      p.addEventListener("click", () => { if (!movio) seleccionar(k); });
      p.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); seleccionar(k); } });
      const mostrar = (x, y) => {
        const e = DATOS.estados[k], r = e ? e.r : null;
        tip.innerHTML = `<b>${esc(ESTADO[k].n)}</b><span>Índice <b>${r ? r.indice : "–"}</b> · ${r ? r.n : 0} notas</span>${r && r.principal && r.cuenta[r.principal] ? `<small>${esc(D.temas[r.principal].nombre)}</small>` : ""}`;
        tip.hidden = false;
        const box = m.getBoundingClientRect();
        tip.style.left = Math.max(0, Math.min(x - box.left + 14, box.width - 190)) + "px";
        tip.style.top = (y - box.top + 14) + "px";
      };
      p.addEventListener("pointerenter", () => { if (!arrastre) hoverOl.setAttribute("d", M.estados[k].d); });
      p.addEventListener("pointermove", (ev) => { if (!arrastre || !movio) mostrar(ev.clientX, ev.clientY); });
      p.addEventListener("focus", () => { hoverOl.setAttribute("d", M.estados[k].d); const r = p.getBoundingClientRect(); mostrar(r.left + r.width / 2, r.top + r.height / 2); });
      p.addEventListener("pointerleave", () => { tip.hidden = true; hoverOl.setAttribute("d", ""); });
      p.addEventListener("blur", () => { tip.hidden = true; hoverOl.setAttribute("d", ""); });
    });

    // Botones
    m.querySelector(".zoom-ctrl").addEventListener("click", (ev) => {
      const z = ev.target.closest("button"); if (!z) return;
      if (z.dataset.z === "reset") return irA(BASE);
      zoomEn(z.dataset.z === "in" ? 1 / 1.6 : 1.6, VB.x + VB.w / 2, VB.y + VB.h / 2);
    });
    // Ctrl/⌘ + rueda y pellizco del trackpad (llega como wheel con ctrlKey)
    svgEl.addEventListener("wheel", (ev) => {
      if (!ev.ctrlKey && !ev.metaKey) return;
      ev.preventDefault();
      const [px, py] = aSvg(ev.clientX, ev.clientY);
      zoomEn(Math.exp(ev.deltaY * 0.01), px, py, false);
    }, { passive: false });
    // Arrastrar para mover (ratón y un dedo) y pellizcar (dos dedos)
    const punteros = new Map();
    svgEl.addEventListener("pointerdown", (ev) => {
      punteros.set(ev.pointerId, [ev.clientX, ev.clientY]);
      movio = false;
      arrastre = { x: ev.clientX, y: ev.clientY, vb: { ...VB }, dist: punteros.size === 2 ? distancia(punteros) : 0 };
    });
    svgEl.addEventListener("pointermove", (ev) => {
      if (!arrastre || !punteros.has(ev.pointerId)) return;
      punteros.set(ev.pointerId, [ev.clientX, ev.clientY]);
      const r = svgEl.getBoundingClientRect(), esc_ = VB.w / r.width;
      if (punteros.size === 2 && arrastre.dist) {
        const f = arrastre.dist / distancia(punteros);
        const [cx, cy] = centro(punteros), [px, py] = aSvg(cx, cy);
        movio = true; tip.hidden = true;
        return zoomEn(f, px, py, false, arrastre.vb);
      }
      const dx = ev.clientX - arrastre.x, dy = ev.clientY - arrastre.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) { movio = true; tip.hidden = true; svgEl.classList.add("moviendo"); }
      if (movio && VB.w < BASE.w) { VB = limitar({ ...VB, x: arrastre.vb.x - dx * esc_, y: arrastre.vb.y - dy * esc_ }); aplicar(); }
    });
    const soltar = (ev) => { punteros.delete(ev.pointerId); if (!punteros.size) { arrastre = null; svgEl.classList.remove("moviendo"); setTimeout(() => (movio = false), 0); } };
    svgEl.addEventListener("pointerup", soltar);
    svgEl.addEventListener("pointercancel", soltar);
    actualizarMapa();
  }
  const distancia = (p) => { const [a, b] = [...p.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]); };
  const centro = (p) => { const [a, b] = [...p.values()]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
  function aSvg(cx, cy) { const r = svgEl.getBoundingClientRect(); return [VB.x + ((cx - r.left) / r.width) * VB.w, VB.y + ((cy - r.top) / r.height) * VB.h]; }
  function limitar(v) {
    const w = Math.min(BASE.w, Math.max(BASE.w / 14, v.w)), h = w * (BASE.h / BASE.w);
    return { w, h, x: Math.min(BASE.w - w, Math.max(0, v.x)), y: Math.min(BASE.h - h, Math.max(0, v.y)) };
  }
  function zoomEn(f, px, py, animar = true, desde = VB) {
    const w = desde.w * f, h = desde.h * f;
    const v = limitar({ w, h, x: px - (px - desde.x) * f, y: py - (py - desde.y) * f });
    animar ? irA(v) : ((VB = v), aplicar());
  }
  function irA(dest) {
    cancelAnimationFrame(anim);
    const ini = { ...VB }, t0 = performance.now(), dur = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450;
    const paso = (t) => {
      const u = dur ? Math.min(1, (t - t0) / dur) : 1, e = 1 - Math.pow(1 - u, 3);
      VB = { x: ini.x + (dest.x - ini.x) * e, y: ini.y + (dest.y - ini.y) * e, w: ini.w + (dest.w - ini.w) * e, h: ini.h + (dest.h - ini.h) * e };
      aplicar();
      if (u < 1) anim = requestAnimationFrame(paso);
    };
    anim = requestAnimationFrame(paso);
  }
  function zoomAEstado(k) {
    const bb = window.MAPA_MX.estados[k].b, b = bb ? { x: bb[0], y: bb[1], width: bb[2], height: bb[3] } : svgEl.querySelector(`.edo[data-k="${k}"]`).getBBox();
    const pad = 0.6, minW = 110;
    let w = Math.max(b.width * (1 + pad), (b.height * (1 + pad)) * (BASE.w / BASE.h), minW);
    const h = w * (BASE.h / BASE.w);
    irA(limitar({ w, h, x: b.x + b.width / 2 - w / 2, y: b.y + b.height / 2 - h / 2 }));
  }
  function aplicar() {
    svgEl.setAttribute("viewBox", `${VB.x} ${VB.y} ${VB.w} ${VB.h}`);
    const s = BASE.w / VB.w, M = window.MAPA_MX;
    svgEl.style.setProperty("--s", s);
    svgEl.querySelectorAll(".lbl").forEach((t) => {
      const k = t.dataset.k, visible = M.estados[k].a * s * s > 1400 || (s > 1.5 && M.estados[k].a * s * s > 350);
      t.style.display = visible ? "" : "none";
      t.firstElementChild.setAttribute("font-size", 10 / s);
      t.lastElementChild.setAttribute("font-size", 14 / s);
      t.lastElementChild.setAttribute("dy", 15 / s);
    });
    const zc = $("#mapa .zoom-ctrl");
    if (zc) zc.classList.toggle("acercado", s > 1.05);
  }
  function actualizarMapa() {
    svgEl.querySelectorAll(".edo").forEach((p) => {
      const k = p.dataset.k, e = DATOS.estados[k], v = e ? e.r.indice : null;
      p.setAttribute("fill", colorIndice(v));
      p.setAttribute("aria-pressed", String(sel === k));
      p.setAttribute("aria-label", `${ESTADO[k].n}: índice ${v ?? "sin datos"}`);
      svgEl.querySelector(`.lbl[data-k="${k}"] .lv`).textContent = v ?? "–";
    });
    svgEl.querySelector(".sel-ol").setAttribute("d", sel !== "NAC" ? window.MAPA_MX.estados[sel].d : "");
    svgEl.classList.toggle("con-sel", sel !== "NAC");
    if (sel === "NAC") irA(BASE); else zoomAEstado(sel);
  }
  function pintarMosaico() {
    const cols = 1 + Math.max(...D.estados.map((e) => e[2])), rows = 1 + Math.max(...D.estados.map((e) => e[3]));
    const m = $("#mapa");
    m.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    m.style.gridTemplateRows = `repeat(${rows}, auto)`;
    m.innerHTML = D.estados.map(([k, n, c, r]) => {
      const e = DATOS.estados[k], v = e ? e.r.indice : null;
      return `<button class="tile" style="grid-column:${c + 1};grid-row:${r + 1};--bg:${colorIndice(v)}" data-k="${k}" aria-pressed="${sel === k}" title="${esc(n)}: índice ${v ?? "sin datos"}">
        <span class="tk">${k}</span><span class="tv">${v ?? "–"}</span></button>`;
    }).join("");
    m.querySelectorAll(".tile").forEach((b) => b.addEventListener("click", () => seleccionar(b.dataset.k)));
  }
  function pintarRanking() {
    const top = Object.entries(DATOS.estados).filter(([, e]) => e.r.n >= 5).sort((a, b) => b[1].r.indice - a[1].r.indice).slice(0, 6);
    $("#ranking").innerHTML = top.map(([k, e]) => `<li><button data-k="${k}"><span>${esc(ESTADO[k].n)}</span>
      <i style="width:${e.r.indice}%;background:${colorIndice(e.r.indice)}"></i><b>${e.r.indice}</b></button>
      <small>${e.r.principal && e.r.cuenta[e.r.principal] ? esc(D.temas[e.r.principal].nombre) : ""}</small></li>`).join("");
    $("#ranking").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => seleccionar(b.dataset.k)));
  }
  function seleccionar(k) {
    sel = sel === k ? "NAC" : k; filtroTema = "";
    $("#btn-nacional").setAttribute("aria-pressed", String(sel === "NAC"));
    pintarMapa();
    pintarDetalle();
    $("#clima-detalle").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  $("#btn-nacional").addEventListener("click", () => seleccionar("NAC"));
  let VISIBLES = [];
  const fechaCorta = (d) => new Date(d + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  function abrirNota(a) {
    const dlg = $("#nota-modal"), t = D.temas[a.tema];
    const generable = t && !t.sinMensaje;
    $("#nota-modal .modal-body").innerHTML = `
      <div><span class="pill" style="--c:${t ? t.color : "#8a8378"}">${t ? esc(t.nombre) : "Otros"}</span>${a.neg ? '<span class="negtag">tono negativo</span>' : ""}</div>
      <h3 id="nota-titulo">${esc(a.t)}</h3>
      <p class="meta">${esc(a.f || "Fuente sin nombre")}${a.d ? " · " + new Date(a.d + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }) : ""}${a.e ? " · " + esc(ESTADO[a.e].n) : ""}</p>
      <div class="por-que">
        <p class="eyebrow" style="margin:0 0 .4rem">Por qué la clasificamos así</p>
        ${a.claves.length ? `<p>El titular menciona: ${a.claves.map((c) => `<code>${esc(c)}</code>`).join(" ")}</p>` : "<p>No coincide con ninguna palabra clave de los temas.</p>"}
        ${a.negs.length ? `<p>Tono negativo por: ${a.negs.map((c) => `<code>${esc(c)}</code>`).join(" ")}</p>` : ""}
      </div>
      ${t ? `<div class="resp" style="--c:${t.color}"><p><b>Qué preocupa:</b> ${esc(t.preocupa)}</p><p><b>Responder con:</b> ${esc(t.responder)}</p><p class="muted"><b>Evitar:</b> ${esc(t.evitar)}</p></div>` : ""}
      <div class="modal-acc">
        <a class="btn" href="${esc(a.u)}" target="_blank" rel="noopener">${a.directo ? `Leer en ${esc(a.f || "el medio")} ↗` : "Buscar la nota en Google News ↗"}</a>
        ${generable ? `<button class="btn ghost" id="modal-gen">Generar mensaje con este tema</button>` : ""}
      </div>
      <p class="muted small">Mostramos el titular y nuestro análisis; el texto completo se lee en el sitio del medio.</p>`;
    const g = $("#modal-gen");
    if (g) g.addEventListener("click", () => { dlg.close(); $("#g-tema").value = a.tema; showTab("mensajes"); generar(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    if (typeof dlg.showModal === "function") dlg.showModal(); else window.open(a.u, "_blank", "noopener");
  }
  $("#nota-modal").addEventListener("click", (ev) => { if (ev.target.id === "nota-modal" || ev.target.closest(".modal-cerrar")) $("#nota-modal").close(); });

  function pintarDetalle() {
    const dato = sel === "NAC" ? DATOS.nacional : DATOS.estados[sel];
    const nombre = sel === "NAC" ? "Todo el país" : ESTADO[sel].n;
    const { r, notas } = dato;
    const orden = TEMAS.filter((k) => r.cuenta[k]).sort((a, b) => r.cuenta[b] - r.cuenta[a]);
    const p = r.principal && r.cuenta[r.principal] ? D.temas[r.principal] : null;
    $("#clima-detalle").innerHTML = `
      <div class="det-head">
        <div><p class="eyebrow" style="margin:0">${sel === "NAC" ? "Nacional" : "Estado"}</p><h3 style="margin:.2rem 0">${esc(nombre)}</h3>
        <p class="muted small" style="margin:0">${r.n} notas · ${r.alerta} sobre temas de preocupación · ${r.neg} con tono negativo</p></div>
        <div class="indice" style="--bg:${colorIndice(r.indice)}"><span>${r.indice ?? "–"}</span><small>índice</small></div>
      </div>
      ${p ? `<div class="card recomendacion" style="--c:${p.color}">
        <p class="eyebrow" style="margin:0 0 .3rem">Preocupación principal: ${esc(p.nombre)}</p>
        <p><b>Qué preocupa:</b> ${esc(p.preocupa)}</p><p><b>Responder con:</b> ${esc(p.responder)}</p><p class="muted"><b>Evitar:</b> ${esc(p.evitar)}</p>
        <button class="btn" data-gen="${r.principal}">Generar mensaje para ${esc(nombre)}</button></div>` : ""}
      <div class="temas-bar" role="img" aria-label="Distribución de notas por tema">${orden.map((k) => `<i style="flex:${r.cuenta[k]};background:${D.temas[k].color}" title="${esc(D.temas[k].nombre)}: ${r.cuenta[k]}"></i>`).join("")}</div>
      <div class="chips" id="tema-chips">
        <button class="chip" aria-pressed="${!filtroTema}" data-t="">Todas (${r.n})</button>
        ${orden.map((k) => `<button class="chip" aria-pressed="${filtroTema === k}" data-t="${k}"><span class="dotc" style="background:${D.temas[k].color}"></span>${esc(D.temas[k].nombre)} (${r.cuenta[k]})</button>`).join("")}
        ${r.cuenta.otros ? `<button class="chip" aria-pressed="${filtroTema === "otros"}" data-t="otros">Otros (${r.cuenta.otros})</button>` : ""}
      </div>
      <div class="card lista-notas">${(VISIBLES = notas.filter((a) => !filtroTema || a.tema === filtroTema).slice(0, 40)).map((a, i) => {
        const t = D.temas[a.tema];
        return `<button class="nota" data-i="${i}"><span class="pill" style="--c:${t ? t.color : "#8a8378"}">${t ? esc(t.nombre) : "Otros"}</span>${a.neg ? '<span class="negtag">tono negativo</span>' : ""}
          <span class="nt">${esc(a.t)}</span>
          <span class="meta">${esc(a.f || "")}${a.d ? " · " + fechaCorta(a.d) : ""}${sel === "NAC" && a.e ? " · " + esc(ESTADO[a.e].n) : ""}</span></button>`;
      }).join("")}</div>`;
    $("#clima-detalle").querySelectorAll(".lista-notas .nota").forEach((b) => b.addEventListener("click", () => abrirNota(VISIBLES[+b.dataset.i])));
    $("#clima-detalle").querySelectorAll("#tema-chips .chip").forEach((b) => b.addEventListener("click", () => { filtroTema = b.dataset.t; pintarDetalle(); }));
    const g = $("#clima-detalle [data-gen]");
    if (g) g.addEventListener("click", () => { $("#g-tema").value = g.dataset.gen; showTab("mensajes"); generar(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  /* ---------- Generador de mensajes ---------- */
  const F = D.eleccion.fecha;
  const G = {
    P1H: { titular: "Tu segundo voto también cuenta", gancho: `Tu voto de 2024 contó. El domingo ${F} se elige a quién te representa en el Congreso.`, cierre: "Ubica tu casilla y vota." },
    P1M: { titular: "Credencial y voto, más cerca de usted", gancho: "Si a usted o a una persona mayor de 75 años de su familia se le dificulta ir al módulo, el INE puede tramitar la credencial en casa.", cierre: "Pregunte en el módulo del INE más cercano o pida a su familia que lo consulte." },
    P2: { titular: "En 2027 también se decide", gancho: `El domingo ${F} se eligen ${D.eleccion.cargos}.`, cierre: "Ese día vota: ubica tu casilla con tiempo." },
    P3: { titular: "Así de fácil se vota", gancho: `El domingo ${F} solo necesitas tu credencial para votar vigente y saber dónde está tu casilla.`, cierre: "Si cambiaste de domicilio, actualiza tu credencial a tiempo." },
    P4: { titular: "Tu comunidad vota cada vez más", gancho: `En tu comunidad cada elección vota más gente. El domingo ${F}, sigue la racha.`, cierre: "Si te toca ser funcionaria o funcionario de casilla, acepta: tu sección cuenta contigo." },
    P5: { titular: "Vota con tu familia", gancho: `El domingo ${F}, vayan juntos a votar.`, norma: "En tu colonia, la mayoría votó en la última elección.", cierre: "Pónganse de acuerdo desde hoy: ¿a qué hora van?" },
    P6: { titular: "Lleva a alguien de tu casa", gancho: `Tú siempre votas. El domingo ${F}, invita a alguien de tu casa o de tu familia a ir contigo.`, cierre: "Un voto acompañado suma dos." },
  };
  const CERTEZA = {
    seguridad: "Tu casilla la atienden vecinas y vecinos sorteados y capacitados; si notas algo irregular, repórtalo al INE.",
    confianza: "Los votos los cuentan ciudadanas y ciudadanos sorteados, frente a representantes y observadores, y los resultados por casilla son públicos.",
    desinformacion: `Dato oficial: la elección es el domingo ${F} y solo necesitas tu credencial para votar vigente. Infórmate en fuentes oficiales del INE.`,
    reglas: `Para ti no cambia: con tu credencial vigente votas el ${F} en la casilla de tu sección.`,
    practico: "Revisa que tu credencial esté vigente y ubica tu casilla con anticipación.",
  };
  const CTA = "Consulta tu casilla en ine.mx.";

  function componer(perfil, canal, tema, norma) {
    const g = G[perfil];
    const partes = [];
    if (perfil === "P5" && norma) partes.push(g.norma);
    partes.push(g.gancho);
    if (tema) partes.push(CERTEZA[tema]);
    partes.push(g.cierre);
    const cuerpo = partes.join(" ");
    switch (canal) {
      case "sms": return `${tema ? CERTEZA[tema].split(";")[0].replace(/\.$/, "") + ". " : ""}${perfil === "P5" && norma ? g.norma + " " : ""}${g.gancho} ${CTA}`.trim();
      case "visita": return `Guion de 30 segundos (al final de la visita de notificación)\n\n1. «Antes de irme, un dato rápido:»\n2. ${partes.slice(0, -1).join(" ")}\n3. ${g.cierre}\n4. «¡Gracias por su tiempo!»`;
      case "radio": return `[Cortinilla]\nVOZ 1: ${g.titular}.\nVOZ 2: ${cuerpo}\nVOZ 1: ${CTA}\n[Cierre]`;
      case "redes": return `${g.titular} 🗳️\n\n${cuerpo}\n\n${CTA}`;
      case "cartel": return `${g.titular.toUpperCase()}\n\n${cuerpo}\n\n${CTA}`;
    }
    return cuerpo;
  }
  function validar(texto) {
    const t = norm(texto);
    const fallas = D.reglasValidador.filter((r) => r.patron.test(t)).map((r) => r.motivo);
    const extra = [];
    if ($("#g-canal").value === "sms" && texto.length > 320) extra.push(`Largo para SMS (${texto.length} caracteres; ideal ≤ 320).`);
    if (/en tu colonia, la mayoria/.test(t) && !$("#g-norma").checked) extra.push("Usa norma social sin confirmar que la mayoría votó en la sección.");
    const todas = fallas.concat(extra);
    $("#g-chequeo").className = todas.length ? "badbox" : "okbox";
    $("#g-chequeo").innerHTML = todas.length
      ? `<p class="bad"><strong>Revisar:</strong></p><ul>${todas.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`
      : `<p class="ok"><strong>✓ Cumple las reglas:</strong> sin miedo, sin culpa, sin partidos, tono positivo.</p>`;
  }
  function generar() {
    const perfil = $("#g-perfil").value, canal = $("#g-canal").value, tema = $("#g-tema").value, norma = $("#g-norma").checked;
    const txt = componer(perfil, canal, tema, norma);
    $("#g-texto").value = txt;
    validar(txt);
    const e = D.estrategias.find((x) => x.id === perfil);
    $("#g-porque").innerHTML = `<p><b>Por qué:</b> ${esc(e.nota)}</p>` + (tema ? `<p><b>Clima:</b> ${esc(D.temas[tema].responder)}</p>` : "") +
      `<p>Momento sugerido: ${esc(e.momento)}. Medir: ${esc(e.medir)}.</p>`;
  }
  function initGenerador() {
    $("#g-perfil").innerHTML = D.estrategias.map((e) => `<option value="${e.id}">${esc(e.titulo)}</option>`).join("");
    $("#g-tema").innerHTML += Object.entries(D.temas).filter(([, t]) => !t.sinMensaje).map(([k, t]) => `<option value="${k}">${esc(t.nombre)}</option>`).join("");
    $("#gen-form").addEventListener("submit", (ev) => { ev.preventDefault(); generar(); });
    ["#g-perfil", "#g-canal", "#g-tema", "#g-norma"].forEach((s) => $(s).addEventListener("change", generar));
    $("#g-texto").addEventListener("input", (ev) => validar(ev.target.value));
    $("#g-copiar").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText($("#g-texto").value); $("#g-copiar").textContent = "Copiado"; }
      catch (e) { $("#g-texto").select(); $("#g-copiar").textContent = "Selecciona y copia"; }
      setTimeout(() => ($("#g-copiar").textContent = "Copiar"), 1500);
    });
    generar();
  }

  /* ---------- Piloto: EMD ---------- */
  function initEMD() {
    const s = $("#s-sigma"), n = $("#s-n"), r = $("#s-r2");
    function calc() {
      const sigma = +s.value, nn = +n.value, r2 = +r.value;
      const emd = 2.8 * sigma * Math.sqrt(2 / nn) * Math.sqrt(1 - r2);
      $("#o-sigma").textContent = sigma; $("#o-n").textContent = nn.toLocaleString("es-MX"); $("#o-r2").textContent = r2.toFixed(2);
      $("#o-emd").textContent = emd.toFixed(2);
    }
    [s, n, r].forEach((x) => x.addEventListener("input", calc));
    calc();
  }

  renderPerfiles();
  renderEstrategias();
  renderTacticas();
  initGenerador();
  initEMD();
  let inicial = "perfiles";
  try { inicial = localStorage.getItem("tab") || "perfiles"; } catch (e) {}
  if (document.getElementById(inicial)) showTab(inicial);
})();
