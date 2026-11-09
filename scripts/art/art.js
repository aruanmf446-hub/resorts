/*
 * THE WORLD BEYOND — procedural editorial imagery.
 * Generates original, licence-free placeholder artwork for the demo presets.
 * Clients replace these files with their own photography (see docs).
 * Runs in a browser (Playwright) — window.render(spec) → dataURL.
 */
(() => {
  // ---------- seeded utilities ----------
  const mulberry = (a) => () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let rnd = mulberry(1);
  const R = (a = 0, b = 1) => a + (b - a) * rnd();
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (t) => t * t * (3 - 2 * t);

  const hex = (h) => {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const mix = (a, b, t) => {
    const A = hex(a), B = hex(b);
    return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`;
  };
  const mixHex = (a, b, t) => {
    const A = hex(a), B = hex(b);
    return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join('');
  };
  const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };

  // value noise
  let perm = [];
  const seedNoise = () => { perm = Array.from({ length: 512 }, () => rnd()); };
  const n1 = (x) => { const i = Math.floor(x), f = x - i; const a = perm[i & 255], b = perm[(i + 1) & 255]; return lerp(a, b, smooth(f)); };
  const fbm1 = (x, oct = 5, rough = 0.5) => { let v = 0, amp = 1, sum = 0, fr = 1; for (let o = 0; o < oct; o++) { v += n1(x * fr + o * 17.3) * amp; sum += amp; amp *= rough; fr *= 2.03; } return v / sum; };
  const n2 = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const h = (i, j) => perm[(i + perm[j & 255] * 255) & 255];
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    const u = smooth(xf), v = smooth(yf);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  };
  const fbm2 = (x, y, oct = 4) => { let v = 0, amp = 1, s = 0, f = 1; for (let o = 0; o < oct; o++) { v += n2(x * f, y * f) * amp; s += amp; amp *= 0.5; f *= 2; } return v / s; };

  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // ---------- painters ----------
  function sky(ctx, w, h, p, horizon) {
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, p.skyTop);
    g.addColorStop(0.55, p.skyMid || mixHex(p.skyTop, p.skyHorizon, 0.55));
    g.addColorStop(1, p.skyHorizon);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, horizon + 2);
    if (p.stars) {
      for (let i = 0; i < 420; i++) {
        const y = Math.pow(R(), 1.6) * horizon * 0.9;
        ctx.fillStyle = `rgba(255,250,235,${R(0.15, 0.85) * (1 - y / horizon)})`;
        const s = R(0.4, 1.5);
        ctx.fillRect(R(0, w), y, s, s);
      }
    }
    if (p.sun) {
      const sx = p.sun.x * w, sy = p.sun.y * h, r = p.sun.r * h;
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * (p.sun.glow || 9));
      glow.addColorStop(0, rgba(p.sunColor, 0.75));
      glow.addColorStop(0.18, rgba(p.sunColor, 0.28));
      glow.addColorStop(1, rgba(p.sunColor, 0));
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      if (p.sun.disc !== false) {
        ctx.fillStyle = rgba(p.sunDisc || '#fff8ea', p.moon ? 0.92 : 0.95);
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
      }
    }
    // soft cloud strata
    const clouds = p.clouds ?? 6;
    for (let i = 0; i < clouds; i++) {
      const cy = R(0.08, 0.8) * horizon, cw = R(0.25, 0.7) * w, ch = R(6, 26) * (h / 1000);
      const cx = R(-0.1, 1) * w;
      ctx.save(); ctx.filter = `blur(${R(8, 22) * (h / 1000)}px)`;
      ctx.fillStyle = rgba(p.cloud || '#ffffff', R(0.1, 0.32));
      ctx.beginPath(); ctx.ellipse(cx, cy, cw / 2, ch, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  function ridgePath(ctx, w, h, base, amp, freq, seed, rough, periodic) {
    ctx.beginPath(); ctx.moveTo(0, h);
    const steps = Math.max(200, Math.round(w / 4));
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * w;
      let v;
      if (periodic) {
        const a = (i / steps) * Math.PI * 2;
        v = fbm2(Math.cos(a) * freq + seed, Math.sin(a) * freq + seed, 5);
      } else v = fbm1(x / w * freq + seed, 6, rough);
      const sharp = Math.pow(v, 1.6);
      ctx.lineTo(x, base - sharp * amp);
    }
    ctx.lineTo(w, h); ctx.closePath();
  }

  function ridges(ctx, w, h, p, horizon, opts = {}) {
    const layers = p.ridges || [];
    const n = layers.length;
    layers.forEach((col, i) => {
      const t = n === 1 ? 1 : i / (n - 1);
      const base = horizon - lerp(opts.farLift ?? 0.06, opts.nearLift ?? -0.005, t) * h;
      const amp = lerp(opts.farAmp ?? 0.16, opts.nearAmp ?? 0.08, t) * h * (p.relief ?? 1);
      ctx.save();
      ctx.filter = `blur(${lerp(2.2, 0, t) * (h / 1000)}px)`;
      ridgePath(ctx, w, h, base, amp, lerp(2.2, 4.5, t) * (opts.freq ?? 1), i * 13.7 + 3, lerp(0.55, 0.42, t), opts.periodic);
      const g = ctx.createLinearGradient(0, base - amp, 0, horizon + 4);
      g.addColorStop(0, mix(col, p.haze, 0.08));
      g.addColorStop(1, mix(col, p.haze, lerp(0.55, 0.25, t)));
      ctx.fillStyle = g; ctx.fill();
      // snow caps
      if (p.snow && i < n - 1) {
        ctx.save(); ctx.clip();
        const sg = ctx.createLinearGradient(0, base - amp, 0, base - amp * 0.45);
        sg.addColorStop(0, rgba(p.snow, 0.95)); sg.addColorStop(1, rgba(p.snow, 0));
        ctx.fillStyle = sg; ctx.fillRect(0, base - amp, w, amp);
        ctx.restore();
      }
      ctx.restore();
      // mist at the foot of each ridge
      if (p.mist) {
        const mg = ctx.createLinearGradient(0, base - amp * 0.2, 0, horizon);
        mg.addColorStop(0, rgba(p.haze, 0));
        mg.addColorStop(1, rgba(p.haze, p.mist * lerp(0.9, 0.35, t)));
        ctx.fillStyle = mg; ctx.fillRect(0, base - amp * 0.2, w, horizon - base + amp * 0.2);
      }
    });
  }

  function water(ctx, w, h, p, horizon, bottom = h) {
    const g = ctx.createLinearGradient(0, horizon, 0, bottom);
    g.addColorStop(0, mix(p.water, p.skyHorizon, 0.45));
    g.addColorStop(0.35, p.water);
    g.addColorStop(1, p.waterDeep);
    ctx.fillStyle = g; ctx.fillRect(0, horizon, w, bottom - horizon);
    // mirrored sky glow
    if (p.sun) {
      const sx = p.sun.x * w;
      const ref = ctx.createRadialGradient(sx, horizon, 0, sx, horizon, (bottom - horizon) * 1.2);
      ref.addColorStop(0, rgba(p.sunColor, 0.35)); ref.addColorStop(1, rgba(p.sunColor, 0));
      ctx.fillStyle = ref; ctx.fillRect(0, horizon, w, bottom - horizon);
      // glitter path
      for (let i = 0; i < 520; i++) {
        const t = Math.pow(R(), 1.4);
        const y = horizon + 2 + t * (bottom - horizon);
        const spread = lerp(0.015, 0.16, t) * w;
        const x = sx + (R() + R() + R() - 1.5) * spread;
        const len = lerp(3, 46, t) * R(0.4, 1.2) * (w / 1600);
        ctx.fillStyle = rgba(p.glitter || '#fff6dc', R(0.12, 0.6) * (1 - t * 0.6));
        ctx.fillRect(x - len / 2, y, len, Math.max(1, lerp(0.6, 2.2, t) * (h / 1000)));
      }
    }
    // horizontal shimmer
    for (let i = 0; i < 260; i++) {
      const t = R();
      const y = horizon + Math.pow(t, 1.3) * (bottom - horizon);
      const len = lerp(10, 220, t) * R(0.3, 1) * (w / 1600);
      ctx.fillStyle = R() > 0.5 ? rgba('#ffffff', R(0.03, 0.12)) : rgba(p.waterDeep, R(0.05, 0.18));
      ctx.fillRect(R(0, w), y, len, Math.max(1, t * 2.5 * (h / 1000)));
    }
    // horizon line light
    ctx.fillStyle = rgba('#ffffff', 0.18); ctx.fillRect(0, horizon - 0.5, w, 1.2);
  }

  function reflectRidges(ctx, w, h, src, horizon, p) {
    // mirror the band above the horizon into the water, softened
    const band = Math.round(h * 0.22);
    ctx.save();
    ctx.globalAlpha = p.reflect ?? 0.32;
    ctx.filter = `blur(${3 * (h / 1000)}px)`;
    ctx.translate(0, horizon * 2);
    ctx.scale(1, -1);
    ctx.drawImage(src, 0, horizon - band, w, band, 0, horizon - band, w, band);
    ctx.restore();
  }

  function palm(ctx, x, y, s, col, lean) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.strokeStyle = col;
    const hgt = 260 * s, topX = lean * hgt * 0.35, topY = -hgt;
    ctx.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const t0 = i / 18, t1 = (i + 1) / 18;
      const bx = (t) => topX * t * t, by = (t) => topY * t;
      ctx.lineWidth = lerp(11, 5, t0) * s;
      ctx.beginPath(); ctx.moveTo(bx(t0), by(t0)); ctx.lineTo(bx(t1), by(t1)); ctx.stroke();
    }
    const fronds = 9;
    for (let f = 0; f < fronds; f++) {
      const a = (f / fronds) * Math.PI * 2 + R(-0.2, 0.2);
      const len = R(90, 140) * s;
      const dx = Math.cos(a) * len, dy = Math.sin(a) * len * 0.45 - 20 * s;
      ctx.beginPath(); ctx.moveTo(topX, topY);
      const cx = topX + dx * 0.55, cy = topY + dy * 0.2 - 30 * s;
      const ex = topX + dx, ey = topY + Math.abs(dy) * 0.9 + 25 * s;
      ctx.quadraticCurveTo(cx, cy, ex, ey);
      ctx.lineWidth = 4 * s; ctx.stroke();
      // leaflets
      for (let k = 1; k < 16; k++) {
        const t = k / 16;
        const qx = (1 - t) * (1 - t) * topX + 2 * (1 - t) * t * cx + t * t * ex;
        const qy = (1 - t) * (1 - t) * topY + 2 * (1 - t) * t * cy + t * t * ey;
        const ll = (1 - t * 0.6) * 34 * s;
        ctx.lineWidth = 1.6 * s;
        ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(qx + ll * 0.4, qy + ll); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(qx - ll * 0.4, qy + ll); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function pine(ctx, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = col;
    const hgt = 300 * s;
    ctx.fillRect(-3 * s, -hgt * 0.15, 6 * s, hgt * 0.15);
    const tiers = 12;
    ctx.beginPath(); ctx.moveTo(0, -hgt);
    for (let i = 0; i <= tiers; i++) {
      const t = i / tiers; const yy = -hgt + t * hgt * 0.88; const wd = (t * 0.9 + 0.08) * 52 * s;
      ctx.lineTo(wd * R(0.85, 1.1), yy + 10 * s); ctx.lineTo(wd * 0.45, yy + 6 * s);
    }
    for (let i = tiers; i >= 0; i--) {
      const t = i / tiers; const yy = -hgt + t * hgt * 0.88; const wd = (t * 0.9 + 0.08) * 52 * s;
      ctx.lineTo(-wd * 0.45, yy + 6 * s); ctx.lineTo(-wd * R(0.85, 1.1), yy + 10 * s);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function cypress(ctx, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(0, -150 * s, 22 * s, 150 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function grasses(ctx, w, h, y0, col, count, height) {
    ctx.strokeStyle = col; ctx.lineCap = 'round';
    for (let i = 0; i < count; i++) {
      const x = R(0, w), hh = R(0.4, 1) * height, bend = R(-0.4, 0.4) * hh;
      ctx.lineWidth = R(0.8, 2.2) * (h / 1000);
      ctx.globalAlpha = R(0.5, 1);
      ctx.beginPath(); ctx.moveTo(x, y0 + R(0, 20));
      ctx.quadraticCurveTo(x + bend * 0.3, y0 - hh * 0.6, x + bend, y0 - hh); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function leafShadows(ctx, w, h, col, alpha, count = 14) {
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    ctx.filter = `blur(${14 * (h / 1000)}px)`; ctx.fillStyle = rgba(col, alpha);
    const clusters = 3;
    for (let c = 0; c < clusters; c++) {
      const cx = R(0.55, 1.15) * w, cy = R(-0.25, 0.25) * h;
      for (let i = 0; i < Math.ceil(count / clusters); i++) {
        const a = R(0.3, 2.6), len = R(0.25, 0.55) * h;
        ctx.save(); ctx.translate(cx + R(-60, 60), cy + R(-40, 40)); ctx.rotate(a);
        // a frond: central rib with broad tapered leaflets
        for (let k = 3; k < 20; k++) {
          const t = k / 20, lw = len * 0.13 * Math.sin(t * Math.PI);
          ctx.save(); ctx.translate(len * t, 0);
          ctx.rotate(0.9); ctx.beginPath(); ctx.ellipse(lw * 0.5, 0, lw * 0.6, lw * 0.11 + 3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.rotate(-1.8); ctx.beginPath(); ctx.ellipse(lw * 0.5, 0, lw * 0.6, lw * 0.11 + 3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function finish(ctx, w, h, p) {
    // bloom
    if (p.sun) {
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      const g = ctx.createRadialGradient(p.sun.x * w, p.sun.y * h, 0, p.sun.x * w, p.sun.y * h, w * 0.6);
      g.addColorStop(0, rgba(p.sunColor, p.bloom ?? 0.18)); g.addColorStop(1, rgba(p.sunColor, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.restore();
    }
    // vignette
    const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.62);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${p.vignette ?? 0.32})`);
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    // grain
    const img = ctx.getImageData(0, 0, w, h); const d = img.data; const amt = p.grain ?? 14;
    for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    ctx.putImageData(img, 0, 0);
  }

  // ---------- compositions ----------
  function vista(ctx, w, h, p) {
    const horizon = Math.round((p.horizon ?? 0.6) * h);
    sky(ctx, w, h, p, horizon);
    ridges(ctx, w, h, p, horizon, p.ridgeOpts || {});
    if (p.hasWater) {
      const snap = mk(w, h); snap.getContext('2d').drawImage(ctx.canvas, 0, 0);
      water(ctx, w, h, p, horizon);
      reflectRidges(ctx, w, h, snap, horizon, p);
    } else {
      const g = ctx.createLinearGradient(0, horizon, 0, h);
      g.addColorStop(0, mix(p.ground, p.haze, 0.3)); g.addColorStop(1, p.groundDeep || p.ground);
      ctx.fillStyle = g; ctx.fillRect(0, horizon, w, h - horizon);
    }
    if (p.sail) {
      const sx = p.sail * w, sy = horizon + 0.02 * h, s = h / 1000;
      ctx.fillStyle = rgba('#fffaf0', 0.9);
      ctx.beginPath(); ctx.moveTo(sx, sy - 70 * s); ctx.lineTo(sx + 26 * s, sy - 6 * s); ctx.lineTo(sx, sy - 6 * s); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx - 2 * s, sy - 58 * s); ctx.lineTo(sx - 20 * s, sy - 8 * s); ctx.lineTo(sx - 2 * s, sy - 8 * s); ctx.fill();
      ctx.fillStyle = rgba(p.ink || '#1a1a1a', 0.7); ctx.fillRect(sx - 22 * s, sy - 5 * s, 50 * s, 4 * s);
    }
    foreground(ctx, w, h, p, horizon);
  }

  function foreground(ctx, w, h, p, horizon) {
    const s = h / 1000; const col = p.fg || '#14211b';
    if (p.foreground === 'palms') {
      const spots = p.palmSpots || [[0.06, 1.15, 1.4, 0.5], [0.16, 1.05, 1.0, -0.3], [0.9, 1.1, 1.3, -0.6]];
      spots.forEach(([x, y, sc, lean]) => palm(ctx, x * w, y * h, sc * s * 1.6, col, lean));
    } else if (p.foreground === 'pines') {
      for (let i = 0; i < 26; i++) {
        const x = R(-0.05, 1.05) * w; if (x > 0.3 * w && x < 0.7 * w && R() > 0.25) continue;
        pine(ctx, x, h + R(0, 40) * s, R(0.9, 2.1) * s, mix(col, p.haze, R(0, 0.25)));
      }
    } else if (p.foreground === 'cypress') {
      [[0.08, 1.4], [0.13, 1.1], [0.88, 1.3]].forEach(([x, sc]) => cypress(ctx, x * w, h + 10, sc * s * 2.2, col));
    }
    if (p.grass) grasses(ctx, w, h, h + 6, col, 520, 120 * s);
  }

  function interior(ctx, w, h, p) {
    // wall
    const wallG = ctx.createLinearGradient(0, 0, w, 0);
    wallG.addColorStop(0, mixHex(p.wall, '#000000', 0.25)); wallG.addColorStop(0.5, p.wall); wallG.addColorStop(1, mixHex(p.wall, '#000000', 0.18));
    ctx.fillStyle = wallG; ctx.fillRect(0, 0, w, h);
    const floorY = (p.floorY ?? 0.74) * h;
    // window aperture
    const win = p.window || { x: 0.18, y: 0.1, w: 0.64, h: 0.6 };
    const wx = win.x * w, wy = win.y * h, ww = win.w * w, wh = Math.min(win.h * h, floorY - wy);
    const v = mk(Math.round(ww), Math.round(wh)); const vc = v.getContext('2d');
    vista(vc, v.width, v.height, { ...p, ...(p.view || {}), grain: 0, vignette: 0, foreground: p.view?.foreground ?? 'none' });
    ctx.drawImage(v, wx, wy);
    // light spill on floor
    const fg = ctx.createLinearGradient(0, floorY, 0, h);
    fg.addColorStop(0, mixHex(p.floor, '#000000', 0.1)); fg.addColorStop(1, mixHex(p.floor, '#000000', 0.35));
    ctx.fillStyle = fg; ctx.fillRect(0, floorY, w, h - floorY);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.filter = `blur(${18 * (h / 1000)}px)`;
    ctx.fillStyle = rgba(p.sunColor || '#fff2d6', 0.35);
    ctx.beginPath(); ctx.moveTo(wx, floorY); ctx.lineTo(wx + ww, floorY); ctx.lineTo(wx + ww + 0.12 * w, h); ctx.lineTo(wx - 0.08 * w, h); ctx.fill();
    ctx.restore();
    // window reflection on floor
    ctx.save(); ctx.globalAlpha = 0.18; ctx.filter = `blur(${6 * (h / 1000)}px)`;
    ctx.translate(0, floorY * 2); ctx.scale(1, -1); ctx.drawImage(v, 0, v.height * 0.55, v.width, v.height * 0.45, wx, floorY - (h - floorY), ww, h - floorY);
    ctx.restore();
    // frame & mullions
    ctx.fillStyle = p.frame || mixHex(p.wall, '#000000', 0.55);
    const t = Math.max(3, 0.006 * w);
    ctx.fillRect(wx - t, wy - t, ww + 2 * t, t); ctx.fillRect(wx - t, wy + wh, ww + 2 * t, t);
    ctx.fillRect(wx - t, wy, t, wh); ctx.fillRect(wx + ww, wy, t, wh);
    const mull = p.mullions ?? 2;
    for (let i = 1; i <= mull; i++) ctx.fillRect(wx + (ww * i) / (mull + 1) - t / 3, wy, t * 0.66, wh);
    // furniture
    if (p.furniture === 'bed') {
      const bx = 0.06 * w, by = floorY - 0.02 * h, bw = 0.42 * w, bh = 0.13 * h;
      ctx.save(); ctx.filter = `blur(${14 * (h / 1000)}px)`; ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(bx, by + bh * 0.7, bw * 1.05, bh * 0.5); ctx.restore();
      ctx.fillStyle = p.linen || '#efe9df'; ctx.fillRect(bx, by, bw, bh * 0.55);
      ctx.fillStyle = mixHex(p.linen || '#efe9df', '#000', 0.12); ctx.fillRect(bx, by + bh * 0.55, bw, bh * 0.45);
      ctx.fillStyle = mixHex(p.linen || '#efe9df', '#ffffff', 0.4);
      ctx.fillRect(bx + bw * 0.04, by - bh * 0.25, bw * 0.28, bh * 0.3); ctx.fillRect(bx + bw * 0.36, by - bh * 0.25, bw * 0.28, bh * 0.3);
      ctx.fillStyle = p.accent || '#9a7650'; ctx.fillRect(bx + bw * 0.6, by + bh * 0.05, bw * 0.4, bh * 0.5);
    } else if (p.furniture === 'bench') {
      const bx = 0.52 * w, by = floorY + 0.06 * h;
      ctx.save(); ctx.filter = `blur(${12 * (h / 1000)}px)`; ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(bx, by + 0.05 * h, 0.4 * w, 0.04 * h); ctx.restore();
      ctx.fillStyle = p.accent || '#7a5a3a'; ctx.fillRect(bx, by, 0.4 * w, 0.035 * h);
      ctx.fillRect(bx + 0.02 * w, by, 0.012 * w, 0.08 * h); ctx.fillRect(bx + 0.36 * w, by, 0.012 * w, 0.08 * h);
    } else if (p.furniture === 'tub') {
      const bx = 0.3 * w, by = floorY + 0.03 * h, bw = 0.4 * w, bh = 0.11 * h;
      ctx.save(); ctx.filter = `blur(${16 * (h / 1000)}px)`; ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(bx + bw / 2, by + bh, bw * 0.55, bh * 0.3, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      const tg = ctx.createLinearGradient(0, by, 0, by + bh); tg.addColorStop(0, '#f6f2ea'); tg.addColorStop(1, '#bdb6aa');
      ctx.fillStyle = tg; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh * 0.5); ctx.fill();
      ctx.fillStyle = rgba(p.water || '#7fb3b0', 0.7); ctx.beginPath(); ctx.ellipse(bx + bw / 2, by + bh * 0.18, bw * 0.45, bh * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (p.plant) leafShadows(ctx, w, h, '#1d241d', 0.22, 10);
    if (p.lamp) {
      const lx = p.lamp * w, ly = 0.42 * h;
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 0.25 * h); g.addColorStop(0, rgba('#ffcf8a', 0.55)); g.addColorStop(1, rgba('#ffcf8a', 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
  }

  function pool(ctx, w, h, p) {
    const horizon = Math.round((p.horizon ?? 0.42) * h);
    sky(ctx, w, h, p, horizon);
    ridges(ctx, w, h, p, horizon, p.ridgeOpts || {});
    if (p.sea) water(ctx, w, h, { ...p, water: p.sea, waterDeep: p.seaDeep || p.sea }, horizon, h);
    const edge = horizon + (p.edgeOffset ?? 0.06) * h;
    // pool surface reflects sky
    const g = ctx.createLinearGradient(0, edge, 0, h);
    g.addColorStop(0, mix(p.pool, p.skyHorizon, 0.4)); g.addColorStop(0.4, p.pool); g.addColorStop(1, p.poolDeep);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, edge); ctx.lineTo(w, edge); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    // caustic ripples
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 160; i++) {
      const t = Math.pow(R(), 0.8), y = edge + t * (h - edge);
      ctx.strokeStyle = rgba('#ffffff', R(0.04, 0.16) * t + 0.02);
      ctx.lineWidth = lerp(0.6, 3, t) * (h / 1000);
      ctx.beginPath();
      const x0 = R(-0.1, 1) * w, len = lerp(40, 360, t) * (w / 1600);
      for (let k = 0; k <= 20; k++) { const xx = x0 + (k / 20) * len; ctx.lineTo(xx, y + Math.sin(k * 0.9 + i) * lerp(1, 7, t)); }
      ctx.stroke();
    }
    ctx.restore();
    // infinity edge line
    ctx.fillStyle = rgba('#ffffff', 0.55); ctx.fillRect(0, edge - 1, w, 1.5);
    // deck
    if (p.deck) {
      ctx.fillStyle = p.deck;
      ctx.beginPath(); ctx.moveTo(0, h * 0.78); ctx.lineTo(w * 0.22, edge + 0.03 * h); ctx.lineTo(w * 0.24, edge + 0.03 * h); ctx.lineTo(w * 0.06, h); ctx.lineTo(0, h); ctx.fill();
      ctx.strokeStyle = rgba('#000000', 0.18); ctx.lineWidth = 1;
      for (let i = 1; i < 10; i++) { const t = i / 10; ctx.beginPath(); ctx.moveTo(0, lerp(h * 0.78, h, t)); ctx.lineTo(lerp(w * 0.22, w * 0.06, t), lerp(edge + 0.03 * h, h, t)); ctx.stroke(); }
    }
    foreground(ctx, w, h, p, horizon);
    if (p.plant) leafShadows(ctx, w, h, '#0e1a18', 0.25, 8);
  }

  function texture(ctx, w, h, p) {
    const kind = p.texture;
    ctx.fillStyle = p.base; ctx.fillRect(0, 0, w, h);
    if (kind === 'sand') {
      for (let y = -40; y < h + 40; y += 9 * (h / 1000)) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) { const yy = y + Math.sin(x / (w * 0.08) + y * 0.05) * 14 + (fbm2(x / 300, y / 300) - 0.5) * 60; x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
        ctx.strokeStyle = rgba(p.shade, 0.22); ctx.lineWidth = 3 * (h / 1000); ctx.stroke();
        ctx.translate(0, -2); ctx.strokeStyle = rgba(p.light, 0.25); ctx.lineWidth = 1.5; ctx.stroke(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    } else if (kind === 'caustics') {
      const img = ctx.getImageData(0, 0, w, h); const d = img.data; const A = hex(p.base), B = hex(p.light), C = hex(p.shade);
      for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
        const u = x / w * 9, v = y / h * 6;
        const n = Math.abs(Math.sin(u + fbm2(u * 0.7, v * 0.7) * 6) * Math.sin(v * 1.3 + fbm2(v, u) * 6));
        const c = Math.pow(1 - n, 9);
        const depth = y / h;
        const i = (y * w + x) * 4;
        for (let k = 0; k < 3; k++) d[i + k] = lerp(lerp(A[k], C[k], depth * 0.7), B[k], c * 0.85);
        d[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    } else if (kind === 'stones') {
      leafShadows(ctx, w, h, p.shade, 0.15, 6);
      const stones = p.stones || [[0.5, 0.78, 0.2], [0.5, 0.62, 0.15], [0.5, 0.5, 0.11], [0.5, 0.41, 0.075]];
      stones.forEach(([x, y, r]) => {
        const cx = x * w, cy = y * h, rx = r * w * 0.6, ry = r * h * 0.36;
        ctx.save(); ctx.filter = `blur(${16 * (h / 1000)}px)`; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(cx + rx * 0.1, cy + ry * 0.7, rx, ry * 0.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        const g = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.5, ry * 0.1, cx, cy, rx * 1.1);
        g.addColorStop(0, p.light); g.addColorStop(1, p.stone);
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      });
    } else if (kind === 'linen') {
      for (let y = 0; y < h; y += 2) { ctx.fillStyle = rgba(R() > 0.5 ? p.light : p.shade, R(0.02, 0.08)); ctx.fillRect(0, y, w, 1); }
      for (let x = 0; x < w; x += 2) { ctx.fillStyle = rgba(R() > 0.5 ? p.light : p.shade, R(0.02, 0.06)); ctx.fillRect(x, 0, 1, h); }
      leafShadows(ctx, w, h, p.shade, 0.32, 14);
    } else if (kind === 'steam') {
      const g = ctx.createRadialGradient(w * 0.5, h * 0.9, 0, w * 0.5, h * 0.9, h);
      g.addColorStop(0, rgba(p.light, 0.25)); g.addColorStop(1, rgba(p.light, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.filter = `blur(${24 * (h / 1000)}px)`; ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 26; i++) {
        ctx.strokeStyle = rgba(p.light, R(0.08, 0.22)); ctx.lineWidth = R(20, 70) * (h / 1000);
        ctx.beginPath(); let x = R(0.25, 0.75) * w, y = h;
        ctx.moveTo(x, y);
        for (let k = 0; k < 8; k++) { const nx = x + R(-0.12, 0.12) * w, ny = y - R(0.08, 0.16) * h; ctx.quadraticCurveTo(x + R(-0.1, 0.1) * w, (y + ny) / 2, nx, ny); x = nx; y = ny; }
        ctx.stroke();
      }
      ctx.restore();
      if (p.bowl) {
        const cx = w * 0.5, cy = h * 0.86;
        ctx.fillStyle = p.stone; ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.2, h * 0.06, 0, 0, Math.PI); ctx.fill();
        ctx.fillStyle = mixHex(p.stone, '#fff', 0.2); ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.2, h * 0.025, 0, 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'bark') {
      for (let x = 0; x < w; x += 3) {
        const v = fbm1(x / 60 + 2, 4, 0.6);
        ctx.fillStyle = mix(p.shade, p.light, v); ctx.fillRect(x, 0, 3, h);
      }
      for (let i = 0; i < 400; i++) { ctx.fillStyle = rgba(p.shade, R(0.1, 0.4)); ctx.fillRect(R(0, w), R(0, h), R(1, 3), R(20, 120)); }
    }
  }

  function table(ctx, w, h, p) {
    const horizon = Math.round((p.horizon ?? 0.45) * h);
    sky(ctx, w, h, p, horizon);
    ridges(ctx, w, h, p, horizon, p.ridgeOpts || {});
    if (p.hasWater) { const snap = mk(w, h); snap.getContext('2d').drawImage(ctx.canvas, 0, 0); water(ctx, w, h, p, horizon); reflectRidges(ctx, w, h, snap, horizon, p); }
    const top = (p.tableY ?? 0.62) * h;
    ctx.fillStyle = p.tableTop;
    ctx.beginPath(); ctx.moveTo(w * 0.1, top); ctx.lineTo(w * 0.9, top); ctx.lineTo(w * 1.3, h); ctx.lineTo(-w * 0.3, h); ctx.fill();
    const tg = ctx.createLinearGradient(0, top, 0, h); tg.addColorStop(0, 'rgba(255,255,255,0.12)'); tg.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = tg; ctx.fill();
    const s = h / 1000;
    const settings = [[0.3, 0.78, 1], [0.7, 0.78, 1], [0.42, 0.67, 0.65], [0.6, 0.67, 0.65]];
    settings.forEach(([x, y, sc]) => {
      const cx = x * w, cy = y * h, rx = 110 * s * sc, ry = 34 * s * sc;
      ctx.save(); ctx.filter = `blur(${6 * s}px)`; ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx + 6, cy + 8, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.fillStyle = p.plate || '#f1ece3'; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = mixHex(p.plate || '#f1ece3', '#000', 0.08); ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.62, ry * 0.62, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = p.food || '#8c5a3c'; ctx.beginPath(); ctx.ellipse(cx, cy - 3 * s, rx * 0.22, ry * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      // glass
      const gx = cx + rx * 0.9, gy = cy - ry * 1.4;
      ctx.fillStyle = rgba('#ffffff', 0.18); ctx.fillRect(gx - 12 * s * sc, gy - 70 * s * sc, 24 * s * sc, 50 * s * sc);
      ctx.fillStyle = rgba(p.wine || '#6d1f2a', 0.7); ctx.fillRect(gx - 12 * s * sc, gy - 40 * s * sc, 24 * s * sc, 20 * s * sc);
      ctx.fillStyle = rgba('#ffffff', 0.35); ctx.fillRect(gx - 1 * s, gy - 20 * s * sc, 2 * s, 24 * s * sc);
    });
    if (p.candles) {
      [[0.5, 0.7], [0.36, 0.64], [0.64, 0.64]].forEach(([x, y]) => {
        const cx = x * w, cy = y * h;
        ctx.fillStyle = '#efe6d6'; ctx.fillRect(cx - 5 * s, cy - 40 * s, 10 * s, 40 * s);
        const g = ctx.createRadialGradient(cx, cy - 48 * s, 0, cx, cy - 48 * s, 180 * s);
        g.addColorStop(0, rgba('#ffd28a', 0.9)); g.addColorStop(0.08, rgba('#ffb85a', 0.45)); g.addColorStop(1, rgba('#ffb85a', 0));
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.restore();
      });
    }
  }

  function path(ctx, w, h, p) {
    const horizon = Math.round((p.horizon ?? 0.55) * h);
    sky(ctx, w, h, p, horizon);
    ridges(ctx, w, h, p, horizon, p.ridgeOpts || {});
    const g = ctx.createLinearGradient(0, horizon, 0, h); g.addColorStop(0, mix(p.ground, p.haze, 0.4)); g.addColorStop(1, p.groundDeep || p.ground);
    ctx.fillStyle = g; ctx.fillRect(0, horizon, w, h - horizon);
    // trail
    ctx.fillStyle = p.trail || mixHex(p.ground, '#ffffff', 0.3);
    ctx.beginPath(); ctx.moveTo(w * 0.49, horizon); ctx.lineTo(w * 0.51, horizon);
    ctx.bezierCurveTo(w * 0.56, h * 0.75, w * 0.72, h * 0.85, w * 0.78, h); ctx.lineTo(w * 0.36, h);
    ctx.bezierCurveTo(w * 0.42, h * 0.85, w * 0.46, h * 0.72, w * 0.49, horizon); ctx.fill();
    // trunks in depth
    for (let i = 0; i < 80; i++) {
      const depth = Math.pow(R(), 1.8); // 0 near .. 1 far
      const x = R() < 0.5 ? R(-0.05, 0.42) * w : R(0.58, 1.05) * w;
      const tw = lerp(60, 4, depth) * (w / 1600);
      const base = lerp(h * 1.05, horizon + 4, depth);
      ctx.fillStyle = mix(p.fg, p.haze, depth * 0.85);
      ctx.fillRect(x - tw / 2, -10, tw, base + 10);
    }
    // god rays
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.filter = `blur(${24 * (h / 1000)}px)`;
    for (let i = 0; i < 7; i++) {
      const x = R(0.25, 0.8) * w; ctx.fillStyle = rgba(p.sunColor || '#fff1cf', R(0.08, 0.18));
      ctx.beginPath(); ctx.moveTo(x, -20); ctx.lineTo(x + 40, -20); ctx.lineTo(x + 260 + R(0, 140), h); ctx.lineTo(x + 120, h); ctx.fill();
    }
    ctx.restore();
    if (p.grass) grasses(ctx, w, h, h + 6, p.fg, 400, 90 * (h / 1000));
  }

  function panorama(ctx, w, h, p) {
    const horizon = Math.round(h * 0.52);
    sky(ctx, w, h, { ...p, clouds: 14 }, horizon);
    ridges(ctx, w, h, p, horizon, { ...(p.ridgeOpts || {}), periodic: true, farAmp: 0.08, nearAmp: 0.04, farLift: 0.03, freq: 1.4 });
    if (p.hasWater) { water(ctx, w, h, p, horizon); }
    else { const g = ctx.createLinearGradient(0, horizon, 0, h); g.addColorStop(0, mix(p.ground, p.haze, 0.3)); g.addColorStop(1, p.groundDeep || p.ground); ctx.fillStyle = g; ctx.fillRect(0, horizon, w, h - horizon); }
  }

  const comps = { vista, interior, pool, texture, table, path, panorama };

  window.render = (spec) => {
    rnd = mulberry(spec.seed || 1); seedNoise();
    const c = mk(spec.w, spec.h); const ctx = c.getContext('2d', { willReadFrequently: true });
    comps[spec.comp](ctx, spec.w, spec.h, spec);
    finish(ctx, spec.w, spec.h, spec);
    return c.toDataURL('image/webp', spec.quality ?? 0.8);
  };
})();
