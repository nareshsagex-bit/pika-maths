// pikachu.js — a ghost-hooded pikachu, drawn with nothing but for loops.
// grid: 184 × 203 cells (the reference image ÷ 4), x right, y down.
// every part() loops over cells and calls g.plot(x, y). Parts are listed
// back to front; the engine outlines each one, then fills the colour.

part("ground shadow", "#DDD3C5", function draw(g) {
  for (let x = 28; x <= 156; x++) {
    const t = (x - 92) / 64;
    for (let y = 182; y <= 182 + (1 - t * t) * 1.6; y++) g.plot(x, y);
  }
}, { line: false });

part("tail", "#F9D84A", function draw(g) {
  const P = [[8, 138], [46, 128], [50, 145], [37, 148], [41, 157], [60, 151], [63, 165], [31, 172], [26, 156], [13, 154]];
  for (let y = 120; y < 180; y++) {
    for (let x = 0; x < 70; x++) {
      let inside = false;
      for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
        const [xi, yi] = P[i], [xj, yj] = P[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) g.plot(x, y);
    }
  }
});

part("ears", "#F9D84A", function draw(g) {
  const E = [[62, 66, 22, 92, 13], [126, 62, 148, 84, 10]];
  for (const [bx, by, tx, ty, r] of E) {
    const dx = tx - bx, dy = ty - by, L2 = dx * dx + dy * dy, L = Math.sqrt(L2);
    for (let y = 48; y < 100; y++) {
      for (let x = 10; x < 165; x++) {
        const t = ((x - bx) * dx + (y - by) * dy) / L2;
        const s = ((x - bx) * dy - (y - by) * dx) / L;
        if (t >= 0 && t <= 1 && Math.abs(s) <= r * Math.sin(Math.PI * (0.3 + 0.7 * t))) g.plot(x, y);
      }
    }
  }
});

part("ear tips", "#3A2430", function draw(g) {
  const E = [[62, 66, 22, 92, 13], [126, 62, 148, 84, 10]];
  for (const [bx, by, tx, ty, r] of E) {
    const dx = tx - bx, dy = ty - by, L2 = dx * dx + dy * dy, L = Math.sqrt(L2);
    for (let y = 48; y < 100; y++) {
      for (let x = 10; x < 165; x++) {
        const t = ((x - bx) * dx + (y - by) * dy) / L2;
        const s = ((x - bx) * dy - (y - by) * dx) / L;
        if (t >= 0.64 && t <= 1 && Math.abs(s) <= r * Math.sin(Math.PI * (0.3 + 0.7 * t))) g.plot(x, y);
      }
    }
  }
});

part("body", "#F9D84A", function draw(g) {
  for (let y = 120; y <= 182; y++) {
    for (let x = 52; x <= 134; x++) {
      const u = (x - 93) / 36, v = (y - 152) / 28;
      if (u * u + v * v <= 1) g.plot(x, y);
    }
  }
});

part("feet", "#F9D84A", function draw(g) {
  for (const cx of [73, 112]) {
    for (let y = 170; y <= 184; y++) {
      for (let x = cx - 12; x <= cx + 12; x++) {
        const u = (x - cx) / 11, v = (y - 177) / 5.5;
        if (u * u + v * v <= 1) g.plot(x, y);
      }
    }
  }
});

part("cloak", "#FBF8F4", function draw(g) {
  for (let y = 108; y <= 176; y++) {
    const half = 31 + (y - 108) * 0.36;
    for (let x = Math.floor(93 - half); x <= 93 + half; x++) {
      const zig = Math.abs(((x - 40) / 6) % 2 - 1);
      const hem = 158 + 10 * (1 - Math.abs(x - 88) / 56) + 4 * zig;
      if (y <= hem) g.plot(x, y);
    }
  }
});

part("hood", "#FBF8F4", function draw(g) {
  for (let y = 34; y <= 130; y++) {
    for (let x = 42; x <= 146; x++) {
      const u = (x - 94) / 49, v = (y - 82) / 47;
      if (Math.abs(u) ** 2.3 + Math.abs(v) ** 2.1 <= 1) g.plot(x, y);
    }
  }
});

part("hood shadow", "#E8DFE9", function draw(g) {
  for (let y = 58; y <= 126; y++) {
    for (let x = 50; x <= 136; x++) {
      const u = (x - 93) / 41, v = (y - 92) / 31;
      if (Math.abs(u) ** 2.2 + Math.abs(v) ** 2.2 <= 1) g.plot(x, y);
    }
  }
});

part("face", "#F9D84A", function draw(g) {
  for (let y = 60; y <= 122; y++) {
    for (let x = 54; x <= 132; x++) {
      const u = (x - 93) / 37, v = (y - 91) / 27;
      if (Math.abs(u) ** 2.3 + Math.abs(v) ** 2.3 <= 1) g.plot(x, y);
    }
  }
});

part("eyes", "#2A1A22", function draw(g) {
  for (const cx of [75, 113]) {
    for (let y = 87; y <= 101; y++) {
      for (let x = cx - 6; x <= cx + 6; x++) {
        const u = (x - cx) / 4.6, v = (y - 94) / 5.3;
        if (u * u + v * v <= 1) g.plot(x, y);
      }
    }
  }
});

part("eye shine", "#FFFFFF", function draw(g) {
  for (const cx of [74, 112]) {
    for (let y = 89; y <= 94; y++) {
      for (let x = cx - 3; x <= cx + 3; x++) {
        if ((x - cx) ** 2 + (y - 91.5) ** 2 <= 2.6) g.plot(x, y);
      }
    }
  }
}, { line: false });

part("cheeks", "#F28B76", function draw(g) {
  for (const cx of [65, 122]) {
    for (let y = 97; y <= 115; y++) {
      for (let x = cx - 9; x <= cx + 9; x++) {
        if ((x - cx) ** 2 + (y - 106) ** 2 <= 7.6 ** 2) g.plot(x, y);
      }
    }
  }
}, { line: false });

part("nose + mouth", "#3A2430", function draw(g) {
  for (let x = -1; x <= 1; x++) g.plot(94 + x, 99);
  for (let t = -2.5; t <= 2.5; t += 0.25) g.plot(94 + t, 101.6 + Math.abs(t) * 0.6);
}, { line: false });

part("ghost face", "#2A1A22", function draw(g) {
  for (const [cx, cy] of [[71, 52], [109, 51]]) {
    for (let y = cy - 6; y <= cy + 6; y++) {
      for (let x = cx - 6; x <= cx + 6; x++) {
        const u = (x - cx) / 4.4, v = (y - cy) / 5;
        if (u * u + v * v <= 1) g.plot(x, y);
      }
    }
  }
  for (let x = 82; x <= 102; x += 0.2) {
    const y = 54 + 1.6 * Math.abs(((x - 82) / 2.5) % 2 - 1);
    g.plot(x, y);
    g.plot(x, y + 0.6);
  }
}, { line: false });

part("whiskers", "#EFA54C", function draw(g) {
  for (const x0 of [61, 114]) {
    for (let k = 0; k < 3; k++) {
      for (let j = 0; j < 3; j++) g.plot(x0 + k * 2.5 + j * 0.4, 58 + j);
    }
  }
}, { line: false });

part("blade", "#ECE7E8", function draw(g) {
  for (let t = 0; t <= 1; t += 0.002) {
    const x = (1 - t) ** 2 * 39 + 2 * (1 - t) * t * 112 + t * t * 172;
    const y = (1 - t) ** 2 * 27 + 2 * (1 - t) * t * -2 + t * t * 74;
    const dx = 2 * (1 - t) * 73 + 2 * t * 60, dy = 2 * (1 - t) * -29 + 2 * t * 76;
    const len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    const w = 19 * Math.sin(Math.PI * t * 0.85) ** 0.8;
    for (let s = 0; s <= w; s += 0.5) g.plot(x + nx * s, y + ny * s);
  }
});

part("blade spine", "#4A2B3A", function draw(g) {
  for (let t = 0; t <= 1; t += 0.002) {
    const x = (1 - t) ** 2 * 39 + 2 * (1 - t) * t * 112 + t * t * 172;
    const y = (1 - t) ** 2 * 27 + 2 * (1 - t) * t * -2 + t * t * 74;
    const dx = 2 * (1 - t) * 73 + 2 * t * 60, dy = 2 * (1 - t) * -29 + 2 * t * 76;
    const len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    const w = 19 * Math.sin(Math.PI * t * 0.85) ** 0.8;
    for (let s = 0; s <= w * 0.5; s += 0.5) g.plot(x + nx * s, y + ny * s);
  }
});

part("staff", "#3E2433", function draw(g) {
  const ax = 41, ay = 178, bx = 171, by = 71, r = 2.8;
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
  for (let y = 66; y <= 184; y++) {
    for (let x = 36; x <= 176; x++) {
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2));
      if (Math.hypot(x - ax - t * dx, y - ay - t * dy) <= r) g.plot(x, y);
    }
  }
});

part("hands", "#F9D84A", function draw(g) {
  for (const [cx, cy, rx, ry] of [[107, 128, 6.5, 5.5], [72, 145, 6, 4.8]]) {
    for (let y = cy - 7; y <= cy + 7; y++) {
      for (let x = cx - 8; x <= cx + 8; x++) {
        const u = (x - cx) / rx, v = (y - cy) / ry;
        if (u * u + v * v <= 1) g.plot(x, y);
      }
    }
  }
});
