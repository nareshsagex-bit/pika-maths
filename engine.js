"use strict";
// engine.js — collects the part() calls from figure.js, types their source
// into the code column, sweeps each part's outline, then fills the colour.

const W = 184, H = 203, N = W * H;
const PARTS = [];

function part(name, color, draw, opts = {}) {
  PARTS.push({ name, color, draw, line: opts.line !== false, hidden: false });
}

const HEADER = `// pikachu.js — a ghost-hooded pikachu, drawn with nothing but for loops.
// grid: 184 × 203 cells (the reference image ÷ 4), x right, y down.
// every part() loops over cells and calls g.plot(x, y). Parts are listed
// back to front; the engine outlines each one, then fills the colour.

`;

const FILL_CODE = `// ── fill · colour every cell by the part that owns it ─────────────
for (let i = 0; i < parts.length; i++) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (owner[y * W + x] === i) paint(x, y, parts[i].color);
    }
  }
}
`;

const INK = [58, 36, 48], INK_LIGHT = [236, 226, 204];
const ASCII_RAMP = "@%#*+=-:. ";

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function partSource(p, i) {
  const label = `// ── ${String(i + 1).padStart(2, "0")} · ${p.name} `;
  const opts = p.line ? "" : ", { line: false }";
  return `${label}${"─".repeat(Math.max(4, 66 - label.length))}\npart("${p.name}", "${p.color}", ${p.draw.toString()}${opts});\n\n`;
}

const TOKEN = /(\/\/[^\n]*)|("[^"\n]*"?)|\b(const|let|for|if|return|function|of|true|false)\b|(\b\d+(?:\.\d+)?)|([A-Za-z_$][\w$]*)(?=\s*\()|\b(Math|g|parts|owner)\b/g;
const TOKEN_CLASS = ["com", "str", "kw", "num", "fn", "obj"];

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlight(src) {
  let out = "", last = 0, m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(src))) {
    out += escapeHtml(src.slice(last, m.index));
    const k = m.slice(1).findIndex((v) => v !== undefined);
    out += `<span class="${TOKEN_CLASS[k]}">${escapeHtml(m[0])}</span>`;
    last = TOKEN.lastIndex;
  }
  return out + escapeHtml(src.slice(last));
}

window.addEventListener("DOMContentLoaded", () => {
  const $ = (s) => document.querySelector(s);
  const codeScroll = $("#code"), doneEl = $("#codeDone"), liveEl = $("#codeLive");
  const canvas = $("#canvas"), ctx = canvas.getContext("2d");
  const stage = $("#stage"), partsEl = $("#parts"), refImg = $("#refImg");
  const off = document.createElement("canvas");
  off.width = W;
  off.height = H;
  const offCtx = off.getContext("2d");
  const img = offCtx.createImageData(W, H);

  // ── run every part's for loops once to get its cell mask ──
  for (const p of PARTS) {
    const mask = new Uint8Array(N);
    p.draw({
      plot(x, y) {
        x = Math.round(x);
        y = Math.round(y);
        if (x >= 0 && x < W && y >= 0 && y < H) mask[y * W + x] = 1;
      },
    });
    p.mask = mask;
    p.rgb = hexToRgb(p.color);
  }

  // ── stack the masks: each cell belongs to the front-most part ──
  let owner, isLine, rank, shade, info;
  function compose() {
    owner = new Int16Array(N).fill(-1);
    PARTS.forEach((p, i) => {
      if (!p.hidden) for (let c = 0; c < N; c++) if (p.mask[c]) owner[c] = i;
    });
    isLine = new Uint8Array(N);
    rank = new Int32Array(N);
    shade = new Float32Array(N);
    const box = PARTS.map(() => ({ x0: W, x1: -1, y0: H, y1: -1, n: 0, sx: 0, sy: 0, lines: [] }));
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const c = y * W + x, o = owner[c];
        if (o < 0) continue;
        const b = box[o];
        b.n++;
        if (x < b.x0) b.x0 = x;
        if (x > b.x1) b.x1 = x;
        if (y < b.y0) b.y0 = y;
        if (y > b.y1) b.y1 = y;
        if (!PARTS[o].line) continue;
        // the front part owns the line between two parts
        const edge = x === 0 || y === 0 || x === W - 1 || y === H - 1 ||
          owner[c - 1] < o || owner[c + 1] < o || owner[c - W] < o || owner[c + W] < o;
        if (edge) {
          isLine[c] = 1;
          b.lines.push(c);
          b.sx += x;
          b.sy += y;
        }
      }
    }
    info = box.map((b) => {
      const n = b.lines.length || 1, cx = b.sx / n, cy = b.sy / n;
      const angle = (c) => (Math.atan2((c % W) - cx, cy - ((c / W) | 0)) + 2 * Math.PI) % (2 * Math.PI);
      const keyed = b.lines.map((c) => [angle(c), c]).sort((a, d) => a[0] - d[0]);
      keyed.forEach(([, c], k) => (rank[c] = k));
      return { cells: b.n, lines: b.lines.length, x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1 };
    });
    for (let c = 0; c < N; c++) {
      const o = owner[c];
      if (o < 0) continue;
      const b = info[o];
      if (b.cells < 150) { shade[c] = 1; continue; }
      const ny = (((c / W) | 0) - b.y0) / (b.y1 - b.y0 + 1), nx = ((c % W) - b.x0) / (b.x1 - b.x0 + 1);
      shade[c] = 1.05 - 0.13 * ny - 0.05 * nx;
    }
  }
  compose();

  // ── timeline: header → each part (type, then outline) → fill code → fill sweep ──
  const SEGS = [{ kind: "head", text: HEADER }]
    .concat(PARTS.map((p, i) => ({ kind: "part", i, text: partSource(p, i) })))
    .concat([{ kind: "fill", text: FILL_CODE }]);
  const FULL_CODE = SEGS.map((s) => s.text).join("");

  let st, outline, fillRows, speed = 1, dirty = true, follow = true;
  const fx = { sparks: false, glow: false, ink: false, dark: false, overlay: false, mode: "pixels" };

  function reset() {
    st = { seg: 0, typed: 0, fillPart: 0, done: false };
    outline = new Float64Array(PARTS.length);
    fillRows = new Float64Array(PARTS.length);
    doneEl.innerHTML = "";
    liveEl.innerHTML = "";
    follow = true;
    dirty = true;
    updateStatus();
  }

  function skip() {
    doneEl.innerHTML = highlight(FULL_CODE);
    liveEl.innerHTML = '<span class="cursor"></span>';
    st = { seg: SEGS.length, typed: 0, fillPart: PARTS.length, done: true };
    outline.fill(1e9);
    fillRows.fill(1e9);
    dirty = true;
    updateStatus();
  }

  function step() {
    if (st.done) return;
    if (st.seg < SEGS.length) {
      const seg = SEGS[st.seg];
      if (st.typed < seg.text.length) {
        st.typed = Math.min(seg.text.length, st.typed + 2.4 * speed);
        liveEl.innerHTML = highlight(seg.text.slice(0, Math.floor(st.typed))) + '<span class="cursor"></span>';
        if (follow) codeScroll.scrollTop = codeScroll.scrollHeight;
        return;
      }
      if (seg.kind === "part" && outline[seg.i] < info[seg.i].lines) {
        outline[seg.i] += 5 * speed;
        dirty = true;
        return;
      }
      if (seg.kind === "part") outline[seg.i] = 1e9;
      doneEl.insertAdjacentHTML("beforeend", highlight(seg.text));
      liveEl.innerHTML = '<span class="cursor"></span>';
      st.seg++;
      st.typed = 0;
      updateStatus();
      return;
    }
    while (st.fillPart < PARTS.length && (PARTS[st.fillPart].hidden || info[st.fillPart].cells === 0)) {
      fillRows[st.fillPart++] = 1e9;
    }
    if (st.fillPart < PARTS.length) {
      const i = st.fillPart;
      fillRows[i] += 1.6 * speed;
      dirty = true;
      if (fillRows[i] > info[i].y1 - info[i].y0 + 1) {
        fillRows[i] = 1e9;
        st.fillPart++;
        updateStatus();
      }
    } else {
      st.done = true;
      updateStatus();
    }
  }

  // ── status: part counter, phase label, parts list ──
  function updateStatus() {
    const typingPart = st.seg < SEGS.length && SEGS[st.seg].kind === "part" ? SEGS[st.seg].i : -1;
    const filling = st.seg >= SEGS.length && !st.done ? st.fillPart : -1;
    const outlined = PARTS.filter((_, i) => outline[i] >= 1e9).length;
    $("#partCount").textContent = `${outlined} / ${PARTS.length} parts`;
    $("#phase").textContent = st.done ? "done" : st.seg >= SEGS.length - 1 ? "filling colour" : "line art";
    partsEl.innerHTML = PARTS.map((p, i) => {
      const filled = fillRows[i] >= 1e9 && !p.hidden;
      const cls = [
        p.hidden ? "hidden" : "",
        i === typingPart || i === filling ? "active" : "",
        outline[i] >= 1e9 ? "outlined" : "",
      ].join(" ");
      const sw = filled ? ` style="background:${p.color}"` : "";
      return `<li class="${cls}" data-i="${i}" title="click to hide / show"><i${sw}></i>${p.name}</li>`;
    }).join("");
  }

  // ── view: fit, zoom where you point, drag to pan ──
  const dpr = () => window.devicePixelRatio || 1;
  let view = { cs: 3, ox: 0, oy: 0 };
  function fit() {
    const w = stage.clientWidth, h = stage.clientHeight;
    const cs = Math.max(1, Math.min((w - 40) / W, (h - 40) / H));
    view = { cs, ox: (w - W * cs) / 2, oy: (h - H * cs) / 2 };
    dirty = true;
  }
  function resize() {
    canvas.width = Math.round(stage.clientWidth * dpr());
    canvas.height = Math.round(stage.clientHeight * dpr());
    fit();
  }
  new ResizeObserver(resize).observe(stage);

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    const k = Math.exp(-e.deltaY * 0.0015);
    view.ox = px - (px - view.ox) * k;
    view.oy = py - (py - view.oy) * k;
    view.cs *= k;
    dirty = true;
  }, { passive: false });
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    view.ox += e.clientX - drag.x;
    view.oy += e.clientY - drag.y;
    drag = { x: e.clientX, y: e.clientY };
    dirty = true;
  });
  canvas.addEventListener("pointerup", () => (drag = null));
  canvas.addEventListener("dblclick", fit);

  // ── effects: electric sparks off the cheeks ──
  const bolts = [];
  function spawnBolt() {
    const left = Math.random() < 0.5;
    let x = left ? 57 : 130, y = 106, a = (left ? Math.PI : 0) + (Math.random() - 0.5) * 1.8;
    const pts = [[x, y]];
    for (let k = 0; k < 8 + Math.random() * 6; k++) {
      a += (Math.random() - 0.5) * 1.5;
      x += Math.cos(a) * 3.4;
      y += Math.sin(a) * 3.4;
      pts.push([x, y]);
    }
    bolts.push({ pts, life: 1 });
  }

  // ── draw one frame ──
  function render(time) {
    const d = dpr(), w = canvas.width / d, h = canvas.height / d;
    const { cs, ox, oy } = view;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.fillStyle = fx.dark ? "#17141b" : "#fbf8f1";
    ctx.fillRect(0, 0, w, h);
    if (fx.overlay && refImg.complete && refImg.naturalWidth) {
      ctx.globalAlpha = 0.35;
      ctx.drawImage(refImg, ox, oy, W * cs, H * cs);
      ctx.globalAlpha = 1;
    }

    const px = img.data;
    for (let c = 0; c < N; c++) {
      const o = owner[c], k = c * 4;
      if (o < 0) { px[k + 3] = 0; continue; }
      const y = (c / W) | 0;
      const filled = !fx.ink && y - info[o].y0 < fillRows[o];
      let rgb = null, s = 1;
      if (isLine[c] && rank[c] < outline[o]) rgb = filled || !fx.dark ? INK : INK_LIGHT;
      else if (filled) { rgb = PARTS[o].rgb; s = shade[c]; }
      if (!rgb) { px[k + 3] = 0; continue; }
      px[k] = Math.min(255, rgb[0] * s);
      px[k + 1] = Math.min(255, rgb[1] * s);
      px[k + 2] = Math.min(255, rgb[2] * s);
      px[k + 3] = 255;
    }

    if (fx.mode === "pixels") {
      offCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, ox, oy, W * cs, H * cs);
    } else if (fx.mode === "dots") {
      const r = cs * 0.36;
      for (let c = 0; c < N; c++) {
        const k = c * 4;
        if (!px[k + 3]) continue;
        ctx.fillStyle = `rgb(${px[k]},${px[k + 1]},${px[k + 2]})`;
        ctx.beginPath();
        ctx.arc(ox + ((c % W) + 0.5) * cs, oy + (((c / W) | 0) + 0.5) * cs, r, 0, 6.2832);
        ctx.fill();
      }
    } else {
      ctx.font = `600 ${cs * 2.3}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let y = 0; y < H; y += 2) {
        for (let x = 0; x < W; x += 2) {
          let best = -1, lum = 2;
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              const k = ((y + dy) * W + x + dx) * 4;
              if (y + dy >= H || x + dx >= W || !px[k + 3]) continue;
              const l = (0.3 * px[k] + 0.59 * px[k + 1] + 0.11 * px[k + 2]) / 255;
              if (l < lum) { lum = l; best = k; }
            }
          }
          if (best < 0) continue;
          const ch = ASCII_RAMP[Math.min(ASCII_RAMP.length - 2, Math.floor((fx.dark ? 1 - lum : lum) * (ASCII_RAMP.length - 1) * 0.6))];
          const dim = fx.dark ? 1 : 0.8;
          ctx.fillStyle = `rgb(${px[best] * dim | 0},${px[best + 1] * dim | 0},${px[best + 2] * dim | 0})`;
          ctx.fillText(ch, ox + (x + 1) * cs, oy + (y + 1) * cs);
        }
      }
    }

    if (fx.glow) {
      const pulse = 0.28 + 0.12 * Math.sin(time / 260);
      for (const cx of [65, 122]) {
        const gx = ox + cx * cs, gy = oy + 106 * cs, gr = 16 * cs;
        const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        grad.addColorStop(0, `rgba(255,120,90,${pulse})`);
        grad.addColorStop(1, "rgba(255,120,90,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
      }
    }

    if (fx.sparks) {
      if (Math.random() < 0.3) spawnBolt();
      for (let b = bolts.length - 1; b >= 0; b--) {
        const bolt = bolts[b];
        ctx.fillStyle = `rgba(255,236,90,${bolt.life})`;
        for (let i = 1; i < bolt.pts.length; i++) {
          const [x0, y0] = bolt.pts[i - 1], [x1, y1] = bolt.pts[i];
          for (let t = 0; t <= 1; t += 0.2) {
            const x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t);
            ctx.fillRect(ox + x * cs, oy + y * cs, cs, cs);
          }
        }
        bolt.life -= 0.09;
        if (bolt.life <= 0) bolts.splice(b, 1);
      }
    }
  }

  function frame(time) {
    step();
    if (dirty || fx.sparks || fx.glow) {
      render(time);
      dirty = false;
    }
    requestAnimationFrame(frame);
  }

  // ── controls ──
  document.querySelectorAll("[data-speed]").forEach((b) =>
    b.addEventListener("click", () => {
      speed = +b.dataset.speed;
      document.querySelectorAll("[data-speed]").forEach((o) => o.classList.toggle("on", o === b));
    }));
  $("#skip").addEventListener("click", skip);
  $("#replay").addEventListener("click", reset);
  document.querySelectorAll("[data-mode]").forEach((b) =>
    b.addEventListener("click", () => {
      fx.mode = b.dataset.mode;
      document.querySelectorAll("[data-mode]").forEach((o) => o.classList.toggle("on", o === b));
      dirty = true;
    }));
  document.querySelectorAll("[data-fx]").forEach((b) =>
    b.addEventListener("click", () => {
      fx[b.dataset.fx] = !fx[b.dataset.fx];
      b.classList.toggle("on", fx[b.dataset.fx]);
      document.body.classList.toggle("dark-render", fx.dark);
      dirty = true;
    }));
  $("#copy").addEventListener("click", async (e) => {
    try {
      await navigator.clipboard.writeText(FULL_CODE);
      e.target.textContent = "copied";
    } catch {
      e.target.textContent = "failed";
    }
    setTimeout(() => (e.target.textContent = "copy"), 1200);
  });
  partsEl.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    const p = PARTS[+li.dataset.i];
    p.hidden = !p.hidden;
    compose();
    dirty = true;
    updateStatus();
  });
  codeScroll.addEventListener("wheel", () => {
    follow = codeScroll.scrollTop + codeScroll.clientHeight >= codeScroll.scrollHeight - 60;
  });
  codeScroll.addEventListener("scroll", () => {
    if (codeScroll.scrollTop + codeScroll.clientHeight >= codeScroll.scrollHeight - 30) follow = true;
  });

  // drop any image on the reference column to swap it
  const refCol = $("#refCol");
  refCol.addEventListener("dragover", (e) => {
    e.preventDefault();
    refCol.classList.add("drop");
  });
  refCol.addEventListener("dragleave", () => refCol.classList.remove("drop"));
  refCol.addEventListener("drop", (e) => {
    e.preventDefault();
    refCol.classList.remove("drop");
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) refImg.src = URL.createObjectURL(file);
  });
  refImg.addEventListener("load", () => (dirty = true));

  reset();
  requestAnimationFrame(frame);
});
