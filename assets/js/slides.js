/* =========================================================
   Per-slide choreography + generated artwork
   ========================================================= */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const S = Deck.slides;
  const H = Deck.hooks;
  const rnd = (a, b) => a + Math.random() * (b - a);
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  // seeded random so generated art is identical every time
  let seed = 7;
  const srand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const sr = (a, b) => a + srand() * (b - a);

  /* simple rAF loop manager: one loop per slide, runs only while that slide is active */
  function loop(fn) {
    let id = 0, on = false, last = 0, t = 0;
    const f = now => { const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; fn(t, dt); if (on) id = requestAnimationFrame(f); };
    return {
      start() { if (on) return; on = true; last = performance.now(); id = requestAnimationFrame(f); },
      stop() { on = false; cancelAnimationFrame(id); },
      once() { fn(t, 0); }
    };
  }

  /* =================== 1. COVER =================== */
  (function () {
    const s = S[0];
    const rays = $('.eye-rays', s);
    for (let i = 0; i < 36; i++) {
      const a = i / 36 * Math.PI * 2, r1 = i % 2 ? 150 : 140, r2 = i % 2 ? 190 : 235;
      el('line', { x1: Math.cos(a) * r1, y1: Math.sin(a) * r1 * .62, x2: Math.cos(a) * r2, y2: Math.sin(a) * r2 * .62 }, rays);
    }
    H[0] = {
      enter({ play }) {
        if (play) {
          s.classList.add('pre');
          FX.setMode('drift');
          const l1 = $('.cover-title .l1', s), l2 = $('.cover-title .l2', s);
          Deck.later(() => {
            const top2 = Deck.layoutRect(l2).y;
            FX.formText([l1, l2], { gold: y => y > top2 + 10, gap: 4 });
          }, 300);
          Deck.later(() => s.classList.remove('pre'), 2500);
          Deck.later(() => FX.release('drift'), 3900);
        } else {
          s.classList.remove('pre');
          FX.setMode('drift');
        }
      }
    };
  })();

  /* =================== 2. FIVE SENSES =================== */
  (function () {
    const s = S[1];
    function attract(on) {
      if (!on) return FX.setMode('drift');
      const r = Deck.layoutRect($('#qcard', s));
      FX.setMode('drift', { attract: { x: r.cx, y: r.cy }, count: 260 });
    }
    H[1] = {
      enter({ step }) { attract(step >= 1); },
      step(n) { attract(n >= 1); }
    };
  })();

  /* =================== 3. LOVE (tapestry) =================== */
  (function () {
    const s = S[2];
    const svg = $('.tapestry', s);
    // woven vines along the border band (centre line inset 31px)
    const vines = $('.tp-vines', svg);
    const inset = 31, x0 = inset, y0 = inset, x1 = 720 - inset, y1 = 860 - inset;
    const per = 2 * ((x1 - x0) + (y1 - y0));
    function perimPoint(d) {
      d = ((d % per) + per) % per;
      const w = x1 - x0, h = y1 - y0;
      if (d < w) return [x0 + d, y0, 0, 1];
      d -= w; if (d < h) return [x1, y0 + d, -1, 0];
      d -= h; if (d < w) return [x1 - d, y1, 0, -1];
      d -= w; return [x0, y1 - d, 1, 0];
    }
    const wl = 52;
    function strand(phase) {
      let dStr = '';
      const pts = [];
      for (let d = 0; d <= per; d += 4) {
        const [x, y, nx, ny] = perimPoint(d);
        const off = Math.sin(d / wl * Math.PI * 2 + phase) * 11;
        pts.push([x + nx * off, y + ny * off]);
      }
      pts.forEach((p, i) => { dStr += (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); });
      return dStr + 'Z';
    }
    el('path', { d: strand(0), class: 'v1', pathLength: 1 }, vines);
    el('path', { d: strand(Math.PI), class: 'v2', pathLength: 1 }, vines);
    // leaves at the crests
    let li = 0;
    for (let d = wl / 4; d < per; d += wl / 2) {
      const [x, y, nx, ny] = perimPoint(d);
      const side = (li % 2 ? 1 : -1);
      const ang = Math.atan2(ny, nx) * 180 / Math.PI;
      const cx = x + nx * side * 13, cy = y + ny * side * 13;
      const leaf = el('ellipse', { cx: cx.toFixed(1), cy: cy.toFixed(1), rx: 7, ry: 3.4, class: 'leaf' + (li % 3 === 0 ? ' b' : ''),
        transform: `rotate(${(ang + 45 * side).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})` }, vines);
      leaf.style.setProperty('--d', (0.8 + d / per * 2.6).toFixed(2) + 's');
      li++;
    }
    // corner rosettes
    const corners = $('.tp-corners', svg);
    [[31, 31], [689, 31], [31, 829], [689, 829]].forEach(([x, y], i) => {
      const g = el('g', {}, corners);
      g.style.setProperty('--d', (1.4 + i * .15) + 's');
      el('circle', { cx: x, cy: y, r: 22 }, g);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; el('circle', { cx: x + Math.cos(a) * 10, cy: y + Math.sin(a) * 10, r: 6, class: 'dot' }, g); }
    });
    // millefleurs (scattered tiny flowers on the red field)
    const fl = $('.tp-flowers', svg);
    const cols = ['#F1E4C7', '#F3C969', '#E59AA0', '#9CC3A4', '#C9B6E6'];
    let placed = 0, tries = 0;
    while (placed < 72 && tries < 3000) {
      tries++;
      const x = sr(70, 650), y = sr(70, 790);
      const dx = (x - 360) / 140, dy = (y - 440) / 140;
      if (dx * dx + dy * dy < 1.1) continue;               // keep the rosette clear
      if (y > 680 && y < 790 && x > 80 && x < 640) continue;  // keep the banner clear
      const c = cols[placed % cols.length], r = sr(3.2, 5.6);
      const g = el('g', {}, fl);
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + sr(0, 1); el('circle', { cx: (x + Math.cos(a) * r * 1.2).toFixed(1), cy: (y + Math.sin(a) * r * 1.2).toFixed(1), r: (r * .7).toFixed(1), fill: c, opacity: .8 }, g); }
      el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: (r * .55).toFixed(1), fill: '#F3C969' }, g);
      $$('circle', g).forEach(cc => cc.style.setProperty('--d', (0.9 + srand() * 2.2).toFixed(2) + 's'));
      placed++;
    }
    // six-lobed rosette: five pale lobes + one golden "sixth"
    const lobes = $('.lobes', svg);
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI / 2 + k * Math.PI / 3;
      const c = el('circle', { cx: (Math.cos(a) * 60).toFixed(1), cy: (Math.sin(a) * 60).toFixed(1), r: 50, pathLength: 1, class: k === 0 ? 'sixth' : '' }, lobes);
      c.style.setProperty('--d', (1.7 + k * .18) + 's');
    }
    H[2] = { enter() { FX.setMode('petals'); } };
  })();

  /* =================== 4. INTUITION (ECG + subliminal) =================== */
  (function () {
    const s = S[3];
    const cv = $('.ecg', s), g = cv.getContext('2d');
    const W = 1920, Hh = 220, mid = 128, beat = 560;
    const gs = (x, c, w) => Math.exp(-((x - c) / w) * ((x - c) / w));
    const ecgY = d => {
      const ph = (d % beat) / beat;
      return mid - 12 * gs(ph, .14, .03) + 12 * gs(ph, .245, .009) - 92 * gs(ph, .27, .011) + 34 * gs(ph, .297, .011) - 22 * gs(ph, .5, .045);
    };
    let dist = 0, lastX = 0, lastY = mid;
    function drawStatic() {
      g.clearRect(0, 0, W, Hh);
      g.lineWidth = 4; g.strokeStyle = 'rgba(243,201,105,.75)'; g.beginPath();
      for (let x = 0; x <= W; x += 2) { const y = ecgY(x + 200); x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    const L = loop((t, dt) => {
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = `rgba(0,0,0,${Math.min(1, dt * 1.15)})`;
      g.fillRect(0, 0, W, Hh);
      g.globalCompositeOperation = 'lighter';
      const speed = 560; // px per second → 60 beats per minute visually
      const steps = Math.max(1, Math.ceil(dt * speed / 3));
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (let k = 0; k < steps; k++) {
        dist += dt * speed / steps;
        const x = dist % W, y = ecgY(dist);
        if (x < lastX) { lastX = x; lastY = y; continue; }
        g.strokeStyle = 'rgba(217,164,65,.20)'; g.lineWidth = 16;
        g.beginPath(); g.moveTo(lastX, lastY); g.lineTo(x, y); g.stroke();
        g.strokeStyle = 'rgba(255,236,190,.95)'; g.lineWidth = 3.6;
        g.beginPath(); g.moveTo(lastX, lastY); g.lineTo(x, y); g.stroke();
        lastX = x; lastY = y;
      }
      // head glow
      g.fillStyle = 'rgba(255,245,215,.9)'; g.beginPath(); g.arc(lastX, lastY, 5, 0, 7); g.fill();
    });
    const sub = $('.subliminal', s);
    function flash() {
      sub.classList.remove('flash'); void sub.offsetWidth; sub.classList.add('flash');
    }
    H[3] = {
      enter() {
        FX.setMode('drift', { count: 170, alpha: .65 });
        if (Deck.reduced) { L.stop(); drawStatic(); }
        else { g.clearRect(0, 0, W, Hh); L.start(); }
      },
      leave() { L.stop(); sub.classList.remove('flash'); },
      step(n, p, o) { if (n === 1 && !o.instant) Deck.later(flash, 650); }
    };
  })();

  /* =================== 5. ESP (ghost text + broken link) =================== */
  (function () {
    const s = S[4];
    // split text into letters for the séance-style materialisation
    $$('.materialize', s).forEach(node => {
      const walk = n => {
        Array.from(n.childNodes).forEach(c => {
          if (c.nodeType === 3) {
            const frag = document.createDocumentFragment();
            for (const ch of c.textContent) {
              if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); continue; }
              const sp = document.createElement('span'); sp.className = 'ch'; sp.textContent = ch;
              sp.style.setProperty('--d', (Math.random() * .9).toFixed(2) + 's');
              frag.appendChild(sp);
            }
            c.replaceWith(frag);
          } else if (c.nodeType === 1) walk(c);
        });
      };
      walk(node);
    });
    // stagger the header lines
    const offs = { 'esp-title': .2, 'lead': 1.1, 'movies': 1.7 };
    $$('.s5-head .materialize', s).forEach(n => {
      const base = offs[n.classList[0]] || 0;
      $$('.ch', n).forEach(c => c.style.setProperty('--d', (base + parseFloat(c.style.getPropertyValue('--d'))).toFixed(2) + 's'));
    });

    const lines = $$('.wave-line', s), glows = $$('.wave-glow', s);
    const Lx = 400, Rx = 1520, Y0 = 290, MID = 960;  // matches the mind cores in .minds
    let brk = 0, brkTarget = 0;
    function render(t) {
      const b = brk;
      const gap = b * 230;
      const amp = 34 * (1 - .45 * b);
      const env = x => Math.pow(Math.sin(Math.PI * (x - Lx) / (Rx - Lx)), .6);
      const yAt = x => Y0 + (amp * Math.sin(x * .021 - t * 4.2) + 11 * Math.sin(x * .052 + t * 2.9)) * env(x);
      const seg = (a, z, droopAt) => {
        let d = '';
        for (let x = a; x <= z; x += 8) {
          let y = yAt(x);
          if (b > 0) {
            const u = droopAt === 'end' ? (x - a) / Math.max(1, z - a) : (z - x) / Math.max(1, z - a);
            y += b * 55 * Math.pow(u, 3);
          }
          d += (d ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
        }
        return d;
      };
      const left = seg(Lx, MID - gap, 'end'), right = seg(MID + gap, Rx, 'start');
      if (b < .02) {
        const whole = seg(Lx, Rx);
        lines[0].setAttribute('d', whole); glows[0].setAttribute('d', whole);
        lines[1].setAttribute('d', ''); glows[1].setAttribute('d', '');
      } else {
        lines[0].setAttribute('d', left); glows[0].setAttribute('d', left);
        lines[1].setAttribute('d', right); glows[1].setAttribute('d', right);
      }
      const op = 1 - .5 * b;
      lines.forEach(l => l.style.opacity = op); glows.forEach(l => l.style.opacity = op * .9);
    }
    const L = loop((t, dt) => {
      brk += (brkTarget - brk) * Math.min(1, dt * 2.2);
      render(t);
    });
    H[4] = {
      enter({ step }) {
        FX.setMode('ghost');
        brkTarget = brk = step >= 3 ? 1 : 0;
        if (Deck.reduced) { L.stop(); render(0); } else L.start();
      },
      leave() { L.stop(); },
      step(n, p, o) {
        brkTarget = n >= 3 ? 1 : 0;
        if (o.instant) brk = brkTarget;
        if (Deck.reduced) render(0);
      }
    };
  })();

  /* =================== 6. VERDICT =================== */
  H[5] = {
    enter({ play, from }) {
      if (play && from >= 0 && from <= 4) FX.setMode('dissolve');
      else FX.setMode('off');
    }
  };

  /* =================== 7. ARISTOTLE (inner ear) =================== */
  (function () {
    const s = S[6];
    const svg = $('.inner-ear', s);
    // cochlea: Archimedean spiral, 2.5 turns
    let d = '';
    const cx = 170, cy = 330;
    for (let k = 0; k <= 160; k++) {
      const th = k / 160 * Math.PI * 5;
      const r = 104 - th * 5.6;
      const x = cx + Math.cos(th + Math.PI * .1) * r, y = cy + Math.sin(th + Math.PI * .1) * r * .9;
      d += (k ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    // join the spiral to the vestibule
    d = 'M300 280 C280 300 270 318 ' + (cx + Math.cos(Math.PI * .1) * 104).toFixed(1) + ' ' + (cy + Math.sin(Math.PI * .1) * 104 * .9).toFixed(1) + d.replace(/^M/, 'L');
    $('.cochlea-o', svg).setAttribute('d', d);
    $('.cochlea-i', svg).setAttribute('d', d);
    const grid = $('.ie-grid', svg);
    for (let x = 0; x <= 640; x += 40) el('line', { x1: x, y1: 0, x2: x, y2: 470 }, grid);
    for (let y = 0; y <= 470; y += 40) el('line', { x1: 0, y1: y, x2: 640, y2: y }, grid);

    function placeCallout() {
      const ear = Deck.layoutRect($('.ear-organ', s));
      const panel = Deck.layoutRect($('.s7-right', s));
      // route above the other organ circles, into the side of the panel
      const x1 = ear.cx, y1 = ear.y - 6, x2 = panel.x - 6, yr = ear.y - 48, y2 = panel.y + 330;
      $('.callout-line', s).setAttribute('d',
        `M${x1} ${y1} C${x1} ${yr} ${x1 + 40} ${yr} ${x1 + 120} ${yr} L${x2 - 140} ${yr} C${x2 - 60} ${yr} ${x2 - 50} ${y2} ${x2} ${y2}`);
      const dot = $('.callout-dot', s); dot.setAttribute('cx', x1); dot.setAttribute('cy', y1);
    }
    H[6] = { enter() { FX.setMode('off'); placeCallout(); } };
  })();

  /* =================== 8. 22–33 =================== */
  (function () {
    const s = S[7];
    const ticks = $('.ticks', s);
    const T = [];
    for (let i = 1; i <= 33; i++) {
      const d = document.createElement('div');
      d.className = 'tick' + (i <= 7 ? ' s7t' : '');
      d.style.left = ((i - 1) / 32 * 100) + '%';
      ticks.appendChild(d); T.push(d);
    }
    const n1 = $('.n1', s), n2 = $('.n2', s), dash = $('.dash', s);
    let raf = 0;
    function setTicks(a, b) { // a: lit up to, b: range lit up to
      T.forEach((t, i) => {
        const k = i + 1;
        t.classList.toggle('l5', k <= 5);
        t.classList.toggle('lit', k > 5 && k <= a);
        t.classList.toggle('rng', k > 22 && k <= b);
      });
    }
    function centerN1(on) {
      n1.style.transform = on ? `translateX(${(dash.offsetWidth + n2.offsetWidth) / 2}px)` : 'none';
    }
    function finalState() {
      cancelAnimationFrame(raf);
      n1.textContent = '22'; n2.textContent = '33';
      s.classList.add('counted', 'wide'); centerN1(false); setTicks(22, 33);
    }
    function initialState() {
      cancelAnimationFrame(raf);
      n1.textContent = '5'; n2.textContent = '33';
      s.classList.remove('counted', 'wide');
      n1.style.transition = 'none'; centerN1(true); void n1.offsetWidth; n1.style.transition = '';
      setTicks(5, 0);
    }
    function count() {
      s.classList.add('counted');
      const t0 = performance.now(), d1 = 1700, pause = 450, d2 = 1100;
      const ease = x => 1 - Math.pow(1 - x, 3);
      let widened = false;
      const f = now => {
        const e = now - t0;
        if (e < d1) {
          const v = Math.round(5 + 17 * ease(e / d1));
          n1.textContent = v; setTicks(v, 0);
        } else {
          n1.textContent = '22';
          if (!widened && e > d1 + pause) { widened = true; s.classList.add('wide'); centerN1(false); }
          if (widened) {
            const u = Math.min(1, (e - d1 - pause) / d2);
            const v = Math.round(22 + 11 * ease(u));
            n2.textContent = v; setTicks(22, v);
            if (u >= 1) return;
          } else setTicks(22, 0);
        }
        raf = requestAnimationFrame(f);
      };
      n2.textContent = '22';
      raf = requestAnimationFrame(f);
    }
    function marks(n) { s.classList.toggle('range', n >= 2); s.classList.toggle('seven', n >= 3); }
    H[7] = {
      enter({ step }) {
        FX.setMode('off');
        if (step >= 1) finalState(); else initialState();
        marks(step);
      },
      leave() { cancelAnimationFrame(raf); },
      step(n, p, o) {
        if (n === 0) initialState();
        else if (n >= 1 && p === 0 && !o.instant) count();
        else if (n >= 1) finalState();
        marks(n);
      }
    };
  })();

  /* =================== 9–13. ONE SLIDE PER HIDDEN SENSE =================== */
  (function () {
    const s1 = $('.hs1'), s4 = $('.hs4'), s5 = $('.hs5');

    // --- 1. proprioception: two-link arm, solved with inverse kinematics ---
    const il1 = $('.il1', s1), arm = $('.arm', il1);
    $$('.seg', arm).forEach(p => p.remove());
    const segs = {};
    ['upper', 'fore'].forEach(k => { segs[k + 'o'] = el('path', { class: 'seg-o' }); segs[k + 'i'] = el('path', { class: 'seg-i' }); });
    arm.prepend(segs.upperi, segs.forei); arm.prepend(segs.uppero, segs.foreo);
    const sh = $('.sh', arm), elb = $('.el', arm), hand = $('.hand', arm), arc = $('.angle-arc', arm), target = $('.target', il1);
    const SX = 548, SY = 572, A = 152, B = 150;
    const nose = { x: 170 + 470 * .8 + 18, y: 40 + 340 * .8 + 2 };
    const rest = { x: 822, y: 560 };
    const ctrl = { x: 790, y: 330 };
    target.setAttribute('cx', nose.x); target.setAttribute('cy', nose.y);
    const bez = u => ({ x: (1 - u) * (1 - u) * rest.x + 2 * (1 - u) * u * ctrl.x + u * u * nose.x, y: (1 - u) * (1 - u) * rest.y + 2 * (1 - u) * u * ctrl.y + u * u * nose.y });
    let td = ''; for (let u = 0; u <= 1.0001; u += .05) { const p = bez(u); td += (td ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }
    $('.traj', il1).setAttribute('d', td);
    function pose(u) {
      const T = bez(u);
      const dx = T.x - SX, dy = T.y - SY;
      let d = Math.min(A + B - 1, Math.hypot(dx, dy));
      const base = Math.atan2(dy, dx);
      const cosA = (A * A + d * d - B * B) / (2 * A * d);
      const a1 = base + Math.acos(Math.max(-1, Math.min(1, cosA)));
      const ex = SX + Math.cos(a1) * A, ey = SY + Math.sin(a1) * A;
      const fa = Math.atan2(T.y - ey, T.x - ex);
      const hx = ex + Math.cos(fa) * B, hy = ey + Math.sin(fa) * B;
      const up = `M${SX} ${SY} L${ex.toFixed(1)} ${ey.toFixed(1)}`, fo = `M${ex.toFixed(1)} ${ey.toFixed(1)} L${hx.toFixed(1)} ${hy.toFixed(1)}`;
      segs.uppero.setAttribute('d', up); segs.upperi.setAttribute('d', up);
      segs.foreo.setAttribute('d', fo); segs.forei.setAttribute('d', fo);
      sh.setAttribute('cx', SX); sh.setAttribute('cy', SY);
      elb.setAttribute('cx', ex); elb.setAttribute('cy', ey);
      hand.setAttribute('cx', hx); hand.setAttribute('cy', hy);
      // angle arc at the elbow
      const b1 = Math.atan2(SY - ey, SX - ex), b2 = fa, r = 46;
      const p1 = [ex + Math.cos(b1) * r, ey + Math.sin(b1) * r], p2 = [ex + Math.cos(b2) * r, ey + Math.sin(b2) * r];
      let sweep = ((b2 - b1) + Math.PI * 4) % (Math.PI * 2);
      const large = 0, dir = sweep > Math.PI ? 0 : 1;
      arc.setAttribute('d', `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)} A${r} ${r} 0 ${large} ${dir} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`);
      target.classList.toggle('hit', u > .97);
    }
    const ez = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const armLoop = loop(t => {
      const P = 5.2, k = t % P;
      let u;
      if (k < .8) u = 0; else if (k < 2.4) u = ez((k - .8) / 1.6); else if (k < 3.5) u = 1; else if (k < 5.1) u = 1 - ez((k - 3.5) / 1.6); else u = 0;
      pose(u);
    });
    pose(1);

    // --- 4. pain: spark rays ---
    const spark = $('.spark', s4);
    for (let k = 0; k < 10; k++) {
      const a = k / 10 * Math.PI * 2, r1 = k % 2 ? 18 : 14, r2 = k % 2 ? 44 : 62;
      el('line', { x1: (Math.cos(a) * r1).toFixed(1), y1: (Math.sin(a) * r1).toFixed(1), x2: (Math.cos(a) * r2).toFixed(1), y2: (Math.sin(a) * r2).toFixed(1) }, spark);
    }
    // --- 5. temperature: heat shimmer + frost crystal + thermometer ticks ---
    const sh5 = $('.shimmer', s5);
    for (let k = 0; k < 7; k++) {
      const x = 50 + k * 46;
      let d = `M${x} 520`;
      for (let y = 520; y > 200; y -= 20) d += ` Q${x + (y / 20 % 2 ? 16 : -16)} ${y - 10} ${x} ${y - 20}`;
      const p = el('path', { d }, sh5);
      p.style.setProperty('--d', (-k * .45).toFixed(2) + 's');
    }
    const frost = $('.frost', s5);
    for (let k = 0; k < 6; k++) {
      const g = el('g', { transform: `rotate(${k * 60})` }, frost);
      const mk = (x1, y1, x2, y2, dl) => { const l = el('line', { x1, y1, x2, y2, pathLength: 1 }, g); l.style.setProperty('--d', dl + 's'); };
      mk(0, 0, 0, -150, 0);
      mk(0, -55, -32, -84, .4); mk(0, -55, 32, -84, .4);
      mk(0, -100, -26, -124, .7); mk(0, -100, 26, -124, .7);
      mk(0, -30, -16, -44, .25); mk(0, -30, 16, -44, .25);
    }
    const tt = $('.th-ticks', s5);
    for (let y = 160; y <= 480; y += 40) el('line', { x1: 436, y1: y, x2: 452, y2: y }, tt);

    // hot pan: heat rising from the pan
    const ph = $('.pan-heat', s5);
    for (let k = 0; k < 6; k++) {
      const x = 200 + k * 58;
      let d = `M${x} 460`;
      for (let y = 460; y > 220; y -= 20) d += ` Q${x + (y / 20 % 2 ? 14 : -14)} ${y - 10} ${x} ${y - 20}`;
      el('path', { d }, ph).style.setProperty('--d', (-k * .4).toFixed(2) + 's');
    }

    H[S.indexOf(s1)] = {
      enter() { FX.setMode('off'); if (Deck.reduced) { armLoop.stop(); pose(1); } else armLoop.start(); },
      leave() { armLoop.stop(); }
    };
    $$('.hs').forEach(x => { if (x !== s1) H[S.indexOf(x)] = { enter() { FX.setMode('off'); } }; });
  })();

  /* =================== 10. CONCLUSION (constellations on a star chart) =================== */
  (function () {
    const s = $('.s10');
    // background chart grid (precise, luminous)
    const cg = $('.chart-grid .cg-lines');
    const ox = 960, oy = 1900;
    for (let r = 900; r <= 2400; r += 150) el('circle', { cx: ox, cy: oy, r, class: r % 600 === 0 ? 'major' : '' }, cg);
    for (let a = -60; a <= 60; a += 7.5) {
      const rad = (a - 90) * Math.PI / 180;
      el('line', { x1: ox + Math.cos(rad) * 900, y1: oy + Math.sin(rad) * 900, x2: ox + Math.cos(rad) * 2600, y2: oy + Math.sin(rad) * 2600, class: a % 30 === 0 ? 'major' : '' }, cg);
    }
    function constellation(g, stars, links, t0) {
      links.forEach(([a, b], i) => {
        const l = el('line', { x1: stars[a].x, y1: stars[a].y, x2: stars[b].x, y2: stars[b].y, pathLength: 1 }, g);
        l.style.setProperty('--d', (t0 + .5 + i * .16).toFixed(2) + 's');
      });
      stars.forEach((st, i) => {
        const sg = el('g', { class: 'sg' }, g);
        sg.style.setProperty('--d', (t0 + i * .14).toFixed(2) + 's');
        sg.style.setProperty('--tw', (-i * .7).toFixed(2) + 's');
        const big = !!st.label;
        el('circle', { cx: st.x, cy: st.y, r: big ? 46 : 26, class: 'halo' }, sg);
        el('circle', { cx: st.x, cy: st.y, r: big ? 8 : 4.5, class: 'star' }, sg);
        if (st.label) {
          const tx = el('text', { x: st.x + (st.dx || 0), y: st.y + (st.dy || -36), 'text-anchor': st.anchor || 'middle' }, g);
          tx.textContent = st.label;
          tx.style.setProperty('--d', (t0 + i * .14).toFixed(2) + 's');
        }
      });
    }
    const c1 = [
      { x: 330, y: 470, label: 'Love', dy: -38 },
      { x: 520, y: 405 },
      { x: 740, y: 500 },
      { x: 660, y: 660, label: 'Intuition', dy: 58 },
      { x: 450, y: 640 },
      { x: 560, y: 545 }
    ];
    constellation($('.const.c1', s), c1, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [1, 5], [5, 3], [5, 4]], .1);
    const c2 = [
      { x: 1160, y: 470, label: 'Balance', dy: -38 },
      { x: 1420, y: 420, label: 'Proprioception', dy: -38 },
      { x: 1690, y: 440, label: 'Interoception', dy: -40 },
      { x: 1600, y: 690, label: 'Pain', dy: 58 },
      { x: 1250, y: 690, label: 'Temperature', dy: 58 },
      { x: 1430, y: 570 }
    ];
    constellation($('.const.c2', s), c2, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [5, 0], [5, 1], [5, 2], [5, 3], [5, 4]], .1);
    $('.bridge', s).setAttribute('d', 'M740 500 C860 380 1040 380 1160 460');
    H[S.indexOf(s)] = { enter() { FX.setMode('stars'); } };
  })();

  /* =================== 11. THANK YOU =================== */
  (function () {
    const s = $('.s11');
    H[S.indexOf(s)] = {
      enter({ play }) {
        if (play) {
          s.classList.add('pre');
          FX.setMode('drift', { count: 200 });
          Deck.later(() => FX.formText([$('.thanks .line', s)], { spr: 'gold', gap: 4 }), 250);
          Deck.later(() => s.classList.remove('pre'), 2400);
          Deck.later(() => FX.release('drift'), 3800);
        } else {
          s.classList.remove('pre');
          FX.setMode('drift', { count: 200 });
        }
      }
    };
  })();

  Deck.boot();
})();
