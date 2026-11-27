/* =========================================================
   FX — one shared particle canvas (1920×1080 logical).
   Modes: drift | ghost | petals | form (text) | dissolve | stars | off
   ========================================================= */
(function () {
  const W = 1920, H = 1080, MAX = 1500;
  const FX = window.FX = {};
  let canvas, ctx, raf = 0, last = 0, t = 0;
  let mode = 'off', modeT = 0, opts = {};
  let reduced = false, running = false;
  const P = [];

  // ---------- sprites ----------
  function glowSprite(rgb, size, core) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'); const r = size / 2;
    const grd = g.createRadialGradient(r, r, 0, r, r, r);
    grd.addColorStop(0, `rgba(255,255,255,${core})`);
    grd.addColorStop(0.18, `rgba(${rgb},0.9)`);
    grd.addColorStop(0.45, `rgba(${rgb},0.28)`);
    grd.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grd; g.fillRect(0, 0, size, size);
    return c;
  }
  function petalSprite(fill, edge) {
    const c = document.createElement('canvas'); c.width = 48; c.height = 30;
    const g = c.getContext('2d');
    g.beginPath(); g.moveTo(3, 15);
    g.bezierCurveTo(14, 0, 34, 0, 45, 15);
    g.bezierCurveTo(34, 30, 14, 30, 3, 15);
    g.fillStyle = fill; g.fill();
    g.strokeStyle = edge; g.lineWidth = 1.5; g.stroke();
    g.beginPath(); g.moveTo(6, 15); g.lineTo(40, 15); g.strokeStyle = 'rgba(255,255,255,.25)'; g.stroke();
    return c;
  }
  const SPR = {};

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function makeParticle(i) {
    return {
      x: rnd(0, W), y: rnd(0, H), vx: 0, vy: 0,
      s: 1, a: 0, ta: 0, tw: rnd(0, 6.28), sp: rnd(.4, 1.4), seed: rnd(0, 1000),
      tx: 0, ty: 0, hasT: false, spr: 'gold', rot: rnd(0, 6.28), vr: rnd(-1, 1), flip: rnd(0, 6.28),
      big: i % 11 === 0
    };
  }

  FX.init = function (cv) {
    canvas = cv; ctx = cv.getContext('2d');
    SPR.gold = glowSprite('243,201,105', 64, .95);
    SPR.parch = glowSprite('245,236,215', 64, 1);
    SPR.ghost = glowSprite('190,212,255', 64, .9);
    SPR.petalR = petalSprite('rgba(178,52,62,.85)', 'rgba(255,210,200,.35)');
    SPR.petalG = petalSprite('rgba(217,164,65,.85)', 'rgba(255,240,200,.4)');
    SPR.petalP = petalSprite('rgba(236,214,196,.8)', 'rgba(255,255,255,.4)');
    for (let i = 0; i < MAX; i++) P.push(makeParticle(i));
  };

  FX.setReduced = function (r) { reduced = r; if (running || mode !== 'off') kick(); };

  // ---------- configure modes ----------
  function ambientSet(n, spr, sizeMin, sizeMax, alpha) {
    for (let i = 0; i < MAX; i++) {
      const p = P[i];
      p.hasT = false;
      if (i < n) {
        p.spr = spr;
        p.s = p.big ? rnd(sizeMax * 1.8, sizeMax * 3.2) : rnd(sizeMin, sizeMax);
        p.base = p.big ? alpha * .35 : alpha * rnd(.5, 1);
        p.on = true;
      } else { p.on = false; }
    }
  }

  FX.setMode = function (m, o) {
    o = o || {};
    const prev = mode;
    mode = m; opts = o; modeT = 0;
    if (m === 'drift') ambientSet(o.count || 230, o.spr || 'gold', 1.6, 4.6, o.alpha || .8);
    else if (m === 'ghost') ambientSet(170, 'ghost', 2, 6, .55);
    else if (m === 'petals') {
      for (let i = 0; i < MAX; i++) {
        const p = P[i]; p.hasT = false;
        if (i < 46) {
          p.on = true; p.petal = true;
          p.spr = ['petalR', 'petalG', 'petalP'][i % 3];
          p.s = rnd(.6, 1.15); p.base = rnd(.45, .8);
          if (prev !== 'petals') { p.x = rnd(0, W); p.y = rnd(-H, H); p.a = 0; }
          p.vy = rnd(25, 55);
        } else if (i < 46 + 140) {
          p.on = true; p.petal = false; p.spr = 'gold'; p.s = rnd(1.4, 3.6); p.base = rnd(.3, .7);
        } else p.on = false;
      }
    }
    else if (m === 'stars') {
      for (let i = 0; i < MAX; i++) {
        const p = P[i]; p.hasT = false; p.petal = false;
        if (i < 340) {
          p.on = true; p.spr = i % 5 ? 'parch' : 'gold';
          p.sx = rnd(0, W); p.sy = rnd(0, H);
          p.s = Math.random() < .08 ? rnd(4, 6.5) : rnd(1.1, 3.2);
          p.base = rnd(.35, 1);
        } else p.on = false;
      }
    }
    else if (m === 'dissolve') {
      for (const p of P) {
        if (!p.on) continue;
        const dx = p.x - W / 2, dy = p.y - H / 2, d = Math.hypot(dx, dy) || 1;
        p.vx += dx / d * rnd(60, 240); p.vy += dy / d * rnd(60, 240) - rnd(10, 60);
      }
    }
    else if (m === 'off') { /* fade out */ }
    if (m !== 'petals') for (const p of P) p.petal = false;
    kick();
  };

  /* Form text: particles fly to the pixels of the given elements' text.
     els: array of elements (each a single line). After `hold` ms they release into `then` mode. */
  FX.formText = function (els, o) {
    o = o || {};
    const stage = document.getElementById('stage');
    const sr = stage.getBoundingClientRect();
    const scale = sr.width / W;
    if (!FX._off) { FX._off = document.createElement('canvas'); FX._off.width = W; FX._off.height = H; }
    const off = FX._off;
    const g = off.getContext('2d', { willReadFrequently: true });
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    g.fillStyle = '#fff';
    let bx0 = W, by0 = H, bx1 = 0, by1 = 0;   // only read back the text's bounding box (fast)
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      g.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
      try { g.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing; } catch (e) {}
      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      const txt = el.textContent.trim();
      const m = g.measureText(txt);
      const cx = (r.left - sr.left + r.width / 2) / scale;
      const top = (r.top - sr.top) / scale, h = r.height / scale;
      const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
      const base = top + h / 2 + (asc - desc) / 2;
      g.fillText(txt, cx, base);
      bx0 = Math.min(bx0, cx - m.width / 2 - 40); bx1 = Math.max(bx1, cx + m.width / 2 + 40);
      by0 = Math.min(by0, base - asc - 40); by1 = Math.max(by1, base + desc + 40);
    });
    bx0 = Math.max(0, bx0 | 0); by0 = Math.max(0, by0 | 0);
    const bw = Math.max(1, Math.min(W, Math.ceil(bx1)) - bx0), bh = Math.max(1, Math.min(H, Math.ceil(by1)) - by0);
    const data = g.getImageData(bx0, by0, bw, bh).data;
    const pts = [];
    const gap = o.gap || 4;
    for (let y = 0; y < bh; y += gap) for (let x = 0; x < bw; x += gap) {
      if (data[(y * bw + x) * 4 + 3] > 140) pts.push([bx0 + x + rnd(-1, 1), by0 + y + rnd(-1, 1)]);
    }
    for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
    const n = Math.min(pts.length, MAX - 40);
    for (let i = 0; i < MAX; i++) {
      const p = P[i];
      p.petal = false;
      if (i < n) {
        p.on = true; p.hasT = true; p.tx = pts[i][0]; p.ty = pts[i][1];
        p.spr = (o.gold && o.gold(p.ty)) ? 'gold' : (o.spr || 'parch');
        p.s = rnd(2.2, 3.6); p.base = rnd(.55, .95);
        p.delay = rnd(0, .7);
        if (!(p.a > .02)) { // invisible: start from a random scattered position
          const ang = rnd(0, 6.28), rad = rnd(500, 1100);
          p.x = W / 2 + Math.cos(ang) * rad; p.y = H / 2 + Math.sin(ang) * rad * .6;
        }
      } else if (i < n + 40) { p.on = true; p.hasT = false; p.spr = 'gold'; p.s = rnd(2, 5); p.base = .5; }
      else p.on = false;
    }
    mode = 'form'; modeT = 0; opts = o;
    kick();
  };

  FX.release = function (next) {
    for (const p of P) {
      if (p.hasT) { p.hasT = false; p.vx = rnd(-40, 40); p.vy = rnd(-60, 10); }
    }
    const keep = next || 'drift';
    mode = keep; modeT = 0;
    // fade surplus particles out gradually
    let k = 0;
    for (const p of P) { if (p.on) { k++; if (k > 260) p.fadeOut = true; else { p.s = Math.max(1.4, p.s * .9); } } }
    kick();
  };

  // ---------- loop ----------
  function kick() {
    if (!ctx) return;
    if (reduced) { running = false; cancelAnimationFrame(raf); staticFrame(); return; }
    if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  }

  function staticFrame() {
    // Reduced motion: draw one calm frame, no movement.
    for (const p of P) {
      if (mode === 'off' || mode === 'dissolve') p.a = 0;
      else if (!p.on) p.a = 0;
      else {
        p.a = p.base || .5;
        if (p.hasT) { p.x = p.tx; p.y = p.ty; }
        if (mode === 'stars') { p.x = p.sx; p.y = p.sy; }
      }
    }
    draw();
  }

  function frame(now) {
    let dt = Math.min(.05, (now - last) / 1000); last = now;
    t += dt; modeT += dt;
    let alive = 0;
    const formK = 7.5, formC = 4.2;
    for (let i = 0; i < MAX; i++) {
      const p = P[i];
      // target alpha
      let ta = 0;
      if (p.on && !p.fadeOut && mode !== 'off' && mode !== 'dissolve') {
        if (mode === 'stars') ta = p.base * (.6 + .4 * Math.sin(t * p.sp * 1.6 + p.tw));
        else ta = p.base * (.65 + .35 * Math.sin(t * p.sp * 2 + p.tw));
      }
      if (p.fadeOut && p.a < .01) { p.fadeOut = false; p.on = false; }

      if (mode === 'form' && p.hasT) {
        if (modeT > p.delay) {
          p.vx += ((p.tx - p.x) * formK - p.vx * formC) * dt;
          p.vy += ((p.ty - p.y) * formK - p.vy * formC) * dt;
        }
        ta = modeT > p.delay ? p.base : 0;
        p.a += (ta - p.a) * Math.min(1, dt * 3);
      } else if (mode === 'stars' && p.on) {
        // glide from wherever they are to their star position
        p.vx += ((p.sx - p.x) * 1.4 - p.vx * 2.2) * dt;
        p.vy += ((p.sy - p.y) * 1.4 - p.vy * 2.2) * dt;
        p.a += (ta - p.a) * Math.min(1, dt * 1.5);
      } else if (mode === 'dissolve') {
        p.vy += 30 * dt; p.vx *= .995;
        p.a += (0 - p.a) * Math.min(1, dt * 1.6);
      } else if (p.petal) {
        p.vy += ((p.vyT || 40) - p.vy) * dt;
        p.vx = Math.sin(t * .8 + p.seed) * 40;
        p.rot += p.vr * dt; p.flip += dt * 2;
        p.a += (ta - p.a) * Math.min(1, dt * 1.2);
        if (p.y > H + 40) { p.y = -40; p.x = rnd(0, W); }
      } else {
        // drift: smooth flow field + gentle rise
        const k = mode === 'ghost' ? 10 : 18;
        const fx = Math.sin(p.y * .0032 + t * .25 + p.seed) * k + Math.cos(p.x * .002 - t * .15) * k * .5;
        const fy = Math.cos(p.x * .0035 + t * .2 + p.seed * .7) * k - (mode === 'ghost' ? 4 : 7);
        p.vx += (fx - p.vx) * dt * .8; p.vy += (fy - p.vy) * dt * .8;
        if (opts.attract && p.on) {
          const ax = opts.attract.x - p.x, ay = opts.attract.y - p.y, d = Math.hypot(ax, ay) + 1;
          if (d < 700) {
            const f = (1 - d / 700);
            p.vx += (ax / d * 26 + -ay / d * 60) * f * dt;
            p.vy += (ay / d * 26 + ax / d * 60) * f * dt;
          }
        }
        p.a += (ta - p.a) * Math.min(1, dt * 1.2);
        if (mode !== 'off') {
          if (p.x < -60) p.x += W + 120; else if (p.x > W + 60) p.x -= W + 120;
          if (p.y < -60) p.y += H + 120; else if (p.y > H + 60) p.y -= H + 120;
        }
      }
      if (mode === 'off') p.a += (0 - p.a) * Math.min(1, dt * 2.5);
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.a > .01) alive++;
    }
    draw();
    if ((mode === 'off' || mode === 'dissolve') && alive === 0) { running = false; return; }
    if (mode === 'dissolve' && modeT > 2.4) mode = 'off';
    raf = requestAnimationFrame(frame);
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // glows (additive)
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < MAX; i++) {
      const p = P[i];
      if (p.a < .01 || p.petal) continue;
      const s = p.s * 4;
      ctx.globalAlpha = p.a > 1 ? 1 : p.a;
      ctx.drawImage(SPR[p.spr], p.x - s, p.y - s, s * 2, s * 2);
    }
    // petals (normal blending)
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < MAX; i++) {
      const p = P[i];
      if (!p.petal || p.a < .01) continue;
      const c = Math.cos(p.rot), s = Math.sin(p.rot), fl = .35 + .65 * Math.abs(Math.cos(p.flip));
      ctx.setTransform(c * p.s, s * p.s, -s * p.s * fl, c * p.s * fl, p.x, p.y);
      ctx.globalAlpha = p.a;
      ctx.drawImage(SPR[p.spr], -24, -15);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
  }

  FX.mode = () => mode;
})();
