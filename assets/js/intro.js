/* =========================================================
   Intro splash · "Desarrollado por Nativo Estudio"
   A layer above the deck, shown on load (no hash or #0) and when going
   back from the very first step. The first click / → plays it out and
   starts slide 1. It is not a deck slide, so slide numbers, notes and
   slide hooks stay exactly as they were.
   ========================================================= */
(function () {
  const root = document.getElementById('nv-intro');
  if (!root) { window.Intro = null; return; }
  const body = document.body;
  const Intro = window.Intro = { active: false };

  const WORDS = ['páginas web', 'tiendas online', 'sistemas a medida', 'menús digitales', 'catálogos online'];
  const HOLD = 2300;           // ms a finished word stays on screen
  const typed = root.querySelector('.nv-typed');
  const chips = Array.from(root.querySelectorAll('.nv-services li'));
  const headline = root.querySelector('.nv-headline');
  let timers = [];
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const reduced = () => window.Deck && Deck.reduced;

  /* ---------- ticker ---------- */
  (function () {
    const items = ['Páginas web', 'Tiendas online', 'Sistemas a medida', 'Menús digitales', 'Catálogos online', '<b>Hacé crecer tu negocio</b>', '<b>Realizá tu consulta</b>'];
    const half = items.concat(items).map(t => `<span>${t}</span>`).join('');
    root.querySelector('.nv-track').innerHTML = half + half;   // two identical halves → seamless -50% loop
  })();

  /* Keep "Desarrollamos" still while the word types: give the line the width of its longest version. */
  function fixHeadlineWidth() {
    const keep = typed.textContent;
    headline.style.width = "";
    let max = 0;
    WORDS.forEach(w => { typed.textContent = w; max = Math.max(max, headline.scrollWidth); });
    typed.textContent = keep;
    headline.style.width = Math.ceil(max) + 'px';
  }

  /* ---------- typewriter, synced with the service chips ---------- */
  function setChip(i) {
    chips.forEach((c, k) => c.classList.toggle('on', k === i));
  }
  function cycle(i, first) {
    const word = WORDS[i % WORDS.length], idx = i % WORDS.length;
    if (reduced()) {
      typed.textContent = word; setChip(idx);
      later(() => cycle(i + 1), HOLD + 900);
      return;
    }
    root.classList.add('typing');
    let n = first ? word.length : 0;
    if (!first) typed.textContent = '';
    setChip(-1);
    const typeStep = () => {
      if (n <= word.length) { typed.textContent = word.slice(0, n++); later(typeStep, 48 + Math.random() * 40); return; }
      root.classList.remove('typing');
      chips[idx].style.setProperty('--hold', HOLD + 'ms');
      setChip(idx);
      later(erase, HOLD);
    };
    const erase = () => {
      root.classList.add('typing');
      let m = word.length;
      const back = () => {
        if (m >= 0) { typed.textContent = word.slice(0, m--); later(back, 24); return; }
        later(() => cycle(i + 1), 160);
      };
      back();
    };
    typeStep();
  }

  /* ---------- starfield, in the style of the site's hero ---------- */
  const cv = root.querySelector('.nv-sky'), g = cv.getContext('2d');
  const W = 1920, H = 1080, CX = W / 2, CY = H * 0.44;
  const TINTS = ['255,255,255', '255,255,255', '255,255,255', '200,236,196', '244,230,160', '170,205,245'];
  const stars = [], glows = [];
  function star(fresh) {
    return { x: (Math.random() * 2 - 1) * 1.15, y: (Math.random() * 2 - 1) * 0.75,
      z: fresh ? 1 : 0.06 + Math.random() * 0.94, tw: Math.random() * 6.28, ts: 0.6 + Math.random() * 2.2,
      c: TINTS[(Math.random() * TINTS.length) | 0], streak: Math.random() < 0.22 };
  }
  for (let i = 0; i < 520; i++) stars.push(star(false));
  // soft green / yellow / blue bokeh like the site
  function sprite(rgb) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.25, `rgba(${rgb},.45)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return c;
  }
  const SPRITES = [sprite('120,210,130'), sprite('235,215,110'), sprite('90,150,230'), sprite('120,210,130')];
  for (let i = 0; i < 22; i++) glows.push({ x: Math.random() * W, y: Math.random() * H, r: 24 + Math.random() * 70,
    s: SPRITES[i % SPRITES.length], p: Math.random() * 6.28, ps: 0.3 + Math.random() * 0.8,
    vx: (Math.random() - .5) * 6, vy: (Math.random() - .5) * 4, a: 0.12 + Math.random() * 0.22 });

  const BASE = 0.018;
  let raf = 0, last = 0, t = 0, boost = 0, warp = 0;
  Intro.boost = v => { boost = Math.max(boost, v); };
  function proj(s, z) { const k = 0.62 / z; return [CX + s.x * W * k * 0.5, CY + s.y * W * k * 0.5]; }
  function frame(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now; t += dt;
    boost *= Math.exp(-dt * 1.8);
    const v = BASE + boost * 0.9 + warp;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#010101'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    for (const gl of glows) {
      gl.x += gl.vx * dt; gl.y += gl.vy * dt; gl.p += gl.ps * dt;
      if (gl.x < -100) gl.x = W + 100; if (gl.x > W + 100) gl.x = -100;
      if (gl.y < -100) gl.y = H + 100; if (gl.y > H + 100) gl.y = -100;
      g.globalAlpha = gl.a * (0.55 + 0.45 * Math.sin(gl.p));
      g.drawImage(gl.s, gl.x - gl.r, gl.y - gl.r, gl.r * 2, gl.r * 2);
    }
    g.globalAlpha = 1;
    g.lineCap = 'round';
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const pz = s.z; s.z -= v * dt * (0.5 + (1 - s.z));
      s.tw += s.ts * dt;
      const [x, y] = proj(s, Math.max(s.z, 0.02));
      if (s.z <= 0.03 || x < -60 || x > W + 60 || y < -60 || y > H + 60) { stars[i] = star(true); continue; }
      const depth = 1 - s.z;
      const a = Math.min(1, depth * 1.5 + 0.12) * (0.55 + 0.45 * Math.sin(s.tw));
      const len = s.z * ((s.streak ? 0.035 : 0) + (v - BASE) * 0.35);
      if (len > 0.004) {
        const [x0, y0] = proj(s, Math.min(1.2, pz + len));
        g.strokeStyle = `rgba(${s.c},${a * 0.75})`; g.lineWidth = 0.6 + depth * 1.6;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x, y); g.stroke();
      } else {
        g.fillStyle = `rgba(${s.c},${a})`;
        const r = 0.5 + depth * 1.7;
        g.fillRect(x - r / 2, y - r / 2, r, r);
      }
    }
    raf = requestAnimationFrame(frame);
  }
  function startSky() {
    cancelAnimationFrame(raf); last = 0; warp = 0;
    if (reduced()) { requestAnimationFrame(now => { frame(now); cancelAnimationFrame(raf); }); return; }
    raf = requestAnimationFrame(frame);
  }
  function stopSky() { cancelAnimationFrame(raf); raf = 0; }

  /* ---------- show / hide ---------- */
  Intro.show = function (opts) {
    const play = !(opts && opts.instant) && !reduced();
    clearTimers();
    Intro.active = true;
    body.classList.add('nv-on');
    root.classList.remove('leave', 'play', 'typing');
    root.setAttribute('aria-hidden', 'false');
    void root.offsetWidth;
    root.classList.add('active');
    if (play) root.classList.add('play');
    fixHeadlineWidth();
    typed.textContent = WORDS[0]; setChip(-1);
    startSky();
    if (play) {
      typed.textContent = '';
      later(() => Intro.boost(0.55), 1950);         // the cursor's click kicks the stars forward
      later(() => cycle(0, false), 2700);
    } else {
      later(() => cycle(0, true), 200);
    }
    try { history.replaceState(null, '', '#0'); } catch (e) {}
  };

  /** Plays the exit (unless instant) and calls done() when the deck should take over. */
  Intro.hide = function (instant, done) {
    if (!Intro.active) { if (done) done(); return; }
    Intro.active = false;
    clearTimers();
    body.classList.remove('nv-on');
    root.setAttribute('aria-hidden', 'true');
    if (instant || reduced()) {
      root.classList.remove('active', 'play', 'leave');
      stopSky();
      if (done) done();
      return;
    }
    root.classList.add('leave');
    warp = 0; Intro.boost(2.4);
    const t0 = performance.now();
    (function ramp() { warp = Math.min(1.6, (performance.now() - t0) / 400); if (root.classList.contains('leave')) requestAnimationFrame(ramp); })();
    setTimeout(() => { if (done) done(); }, 380);
    setTimeout(() => {
      if (Intro.active) return;                       // shown again meanwhile
      root.classList.remove('active', 'play', 'leave');
      stopSky();
    }, 1150);
  };

  document.fonts && document.fonts.ready && document.fonts.ready.then(() => { if (Intro.active) fixHeadlineWidth(); });
})();
