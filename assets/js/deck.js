/* =========================================================
   Deck core: scaling, slides/steps, keyboard, presenter view
   ========================================================= */
(function () {
  const Deck = window.Deck = { cur: 0, step: 0, hooks: {}, ready: false };
  const body = document.body;
  const stage = document.getElementById('stage');
  const slides = Deck.slides = Array.from(document.querySelectorAll('.slide'));
  const N = slides.length;
  const params = new URLSearchParams(location.search);
  const PREVIEW = Deck.preview = params.has('preview');
  let scale = 1;
  let timers = [];

  /* ---------- scaling: 1920×1080 → any screen, letterboxed, never cropped ---------- */
  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    scale = Math.min(vw / 1920, vh / 1080);
    stage.style.transform = `translate(-50%,-50%) scale(${scale})`;
  }
  Deck.scale = () => scale;
  window.addEventListener('resize', fit);
  document.addEventListener('fullscreenchange', fit);
  fit();

  /* ---------- reduced motion ---------- */
  function storedMotion() { try { return localStorage.getItem('sixthsense-reduced'); } catch (e) { return null; } }
  const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  Deck.reduced = PREVIEW ? true : (storedMotion() !== null ? storedMotion() === '1' : !!(mq && mq.matches));
  function applyMotion() {
    body.classList.toggle('reduced', Deck.reduced);
    body.classList.toggle('motion', !Deck.reduced);
    if (window.FX) FX.setReduced(Deck.reduced);
  }
  Deck.toggleMotion = function () {
    Deck.reduced = !Deck.reduced;
    try { localStorage.setItem('sixthsense-reduced', Deck.reduced ? '1' : '0'); } catch (e) {}
    applyMotion();
    const flag = document.getElementById('motion-flag');
    flag.classList.add('show');
    toast(Deck.reduced ? 'Reduced motion: ON' : 'Reduced motion: OFF');
    goTo(Deck.cur, Deck.step, 'jump', true);
  };

  /* ---------- helpers for slide scripts ---------- */
  Deck.later = function (fn, ms) { const id = setTimeout(fn, ms); timers.push(id); return id; };
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  /** Layout position of an element inside its slide (ignores CSS transforms). */
  Deck.layoutRect = function (el) {
    let x = 0, y = 0, n = el;
    const w = el.offsetWidth, h = el.offsetHeight;
    while (n && !n.classList.contains('slide')) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
  };
  Deck.maxStep = i => +slides[i].dataset.steps || 0;

  /* ---------- steps ---------- */
  function applySteps(slide, st, noTrans) {
    if (noTrans) slide.classList.add('no-trans');
    slide.dataset.step = st;
    slide.querySelectorAll('[data-step]').forEach(el => el.classList.toggle('on', st >= +el.dataset.step));
    slide.querySelectorAll('[data-only]').forEach(el => el.classList.toggle('on', st === +el.dataset.only));
    if (noTrans) { void slide.offsetWidth; requestAnimationFrame(() => requestAnimationFrame(() => slide.classList.remove('no-trans'))); }
  }

  /* ---------- navigation ----------
     how: 'fwd' = animated entrance; 'back' / 'jump' = show instantly in final state for that step */
  function goTo(i, st, how, force) {
    i = Math.max(0, Math.min(N - 1, i));
    st = Math.max(0, Math.min(Deck.maxStep(i), st));
    const prevI = Deck.cur, prevStep = Deck.step;
    const changing = force || i !== prevI || !Deck.ready;
    if (changing) {
      const from = slides[prevI];
      if (Deck.ready) {
        from.classList.remove('active', 'play');
        const hk = Deck.hooks[prevI]; if (hk && hk.leave) hk.leave();
      }
      clearTimers();
      const s = slides[i];
      const play = how === 'fwd' && !Deck.reduced && !PREVIEW;
      const prevPhase = body.dataset.phase;
      body.dataset.phase = s.dataset.phase;
      body.dataset.slide = i + 1;
      if (play && s.dataset.phase === 'science' && prevPhase !== 'science') {
        body.classList.remove('wake'); void body.offsetWidth; body.classList.add('wake');
        Deck.later(() => body.classList.remove('wake'), 1900);
      }
      s.classList.remove('play');
      applySteps(s, st, true);
      if (play) { void s.offsetWidth; s.classList.add('play'); }
      s.classList.add('active');
      Deck.cur = i; Deck.step = st;
      const hk = Deck.hooks[i];
      if (hk && hk.enter) hk.enter({ play, step: st, from: Deck.ready ? prevI : -1, instant: !play });
    } else {
      if (st === prevStep) return;
      const s = slides[i];
      const instant = Deck.reduced || PREVIEW;
      applySteps(s, st, false);
      Deck.step = st;
      const hk = Deck.hooks[i];
      if (hk && hk.step) hk.step(st, prevStep, { instant: instant || st < prevStep, back: st < prevStep });
    }
    Deck.ready = true;
    updateHud();
  }
  Deck.goTo = goTo;

  function next() {
    if (Deck.step < Deck.maxStep(Deck.cur)) goTo(Deck.cur, Deck.step + 1, 'fwd');
    else if (Deck.cur < N - 1) goTo(Deck.cur + 1, 0, 'fwd');
  }
  function prev() {
    if (Deck.step > 0) goTo(Deck.cur, Deck.step - 1, 'back');
    else if (Deck.cur > 0) goTo(Deck.cur - 1, Deck.maxStep(Deck.cur - 1), 'back');
  }
  Deck.next = next; Deck.prev = prev;

  /* ---------- HUD, hash, notes ---------- */
  const pad = n => String(n).padStart(2, '0');
  function updateHud() {
    document.getElementById('slide-num').textContent = `${pad(Deck.cur + 1)} / ${pad(N)}`;
    if (!PREVIEW) {
      try { history.replaceState(null, '', '#' + (Deck.cur + 1) + '.' + Deck.step); } catch (e) {}
      renderNotes();
      syncPresenter();
    }
  }

  function segmentsHtml(i, st) {
    const segs = (window.NOTES && NOTES[i]) || [];
    return segs.map(sg => {
      const cls = [sg.step === st ? 'now' : (sg.step < st ? 'past' : 'future'), sg.cue ? 'cue' : ''].join(' ');
      return `<p class="${cls}">${escapeHtml(sg.text)}</p>`;
    }).join('');
  }
  function escapeHtml(s) { return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

  const notesEl = document.getElementById('notes-overlay');
  function renderNotes() {
    notesEl.querySelector('.no-title').textContent =
      `Slide ${Deck.cur + 1} / ${N} — ${SLIDE_TITLES[Deck.cur]}   ·   step ${Deck.step + 1} / ${Deck.maxStep(Deck.cur) + 1}`;
    notesEl.querySelector('.no-body').innerHTML = segmentsHtml(Deck.cur, Deck.step);
    const now = notesEl.querySelector('p.now'); if (now && notesEl.classList.contains('open')) now.scrollIntoView({ block: 'nearest' });
  }

  /* ---------- timer (shared by notes overlay + presenter) ---------- */
  const timer = { start: 0, acc: 0, running: false };
  function timerMs() { return timer.acc + (timer.running ? Date.now() - timer.start : 0); }
  function timerStr() { const s = Math.floor(timerMs() / 1000); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); }
  function timerToggle() { if (timer.running) { timer.acc = timerMs(); timer.running = false; } else { timer.start = Date.now(); timer.running = true; } tick(); }
  function timerReset() { timer.acc = 0; timer.start = Date.now(); tick(); }
  function tick() {
    const str = timerStr();
    notesEl.querySelector('.no-timer').textContent = str + (timer.running ? '' : ' ⏸');
    if (pres && !pres.closed) {
      const d = pres.document, el = d.getElementById('p-timer');
      if (el) {
        el.textContent = str;
        const min = timerMs() / 60000;
        el.className = min >= 8 ? 'over' : (min >= 7 ? 'warn' : '');
        d.getElementById('p-pause').textContent = timer.running ? 'Pause (P)' : 'Start (P)';
        const c = new Date(); d.getElementById('p-clock').textContent = pad(c.getHours()) + ':' + pad(c.getMinutes());
      }
    }
  }
  setInterval(tick, 500);

  /* ---------- presenter window (S) ----------
     The popup is about:blank, so it shares this page's origin even on file://,
     and this window drives its DOM directly. */
  let pres = null;
  function openPresenter() {
    if (pres && !pres.closed) { pres.focus(); return; }
    pres = window.open('', 'sixthsense-presenter', 'width=1280,height=800');
    if (!pres) { toast('Pop-up blocked — allow pop-ups, or press N for notes'); return; }
    const d = pres.document;
    d.open();
    d.write(`<!doctype html><html><head><meta charset="utf-8"><title>Presenter — Do We Have a Sixth Sense?</title>
<style>
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{background:#0B0F1C;color:#E9E4D8;font:400 16px/1.45 'Segoe UI',system-ui,sans-serif;display:grid;grid-template-rows:auto 1fr auto;overflow:hidden}
header{display:flex;align-items:center;gap:24px;padding:12px 20px;border-bottom:1px solid #2A3150;background:#10162A}
#p-slide{font:600 20px Georgia,serif;color:#F3C969;flex:1}
#p-step{font:500 15px Consolas,monospace;color:#9FB0D0}
#p-timer{font:600 40px Consolas,monospace;color:#fff;min-width:150px;text-align:right}
#p-timer.warn{color:#F3C969}#p-timer.over{color:#FF7A6B}
#p-clock{font:500 18px Consolas,monospace;color:#9FB0D0}
button{background:#1C2440;color:#E9E4D8;border:1px solid #3A4570;border-radius:6px;padding:7px 12px;font:500 14px system-ui;cursor:pointer}
button:hover{border-color:#D9A441}
main{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:20px;padding:18px 20px;min-height:0}
#p-notes{overflow:auto;padding-right:10px;font-size:clamp(18px,1.9vw,28px);line-height:1.5}
#p-notes p{margin:0 0 .7em;opacity:.38;transition:opacity .3s}
#p-notes p.now{opacity:1;color:#fff;border-left:4px solid #D9A441;padding-left:14px;margin-left:-18px}
#p-notes p.past{opacity:.25}
#p-notes p.cue{font-style:italic;color:#9FB0D0}
aside{display:flex;flex-direction:column;gap:10px;min-height:0}
.lbl{font:600 13px Consolas,monospace;letter-spacing:.12em;text-transform:uppercase;color:#D9A441}
.frame{position:relative;width:100%;aspect-ratio:16/9;background:#000;border:1px solid #2A3150;border-radius:6px;overflow:hidden}
.frame iframe{position:absolute;left:0;top:0;width:100%;height:100%;border:0;pointer-events:none}
#p-nextinfo{font-size:16px;color:#C9D3EA}
#p-end{display:none;align-items:center;justify-content:center;position:absolute;inset:0;color:#9FB0D0;font:italic 22px Georgia,serif}
footer{padding:8px 20px;border-top:1px solid #2A3150;color:#7D8AAA;font:13px Consolas,monospace}
</style></head><body>
<header><div id="p-slide"></div><div id="p-step"></div>
<button id="p-prev">◀ Prev</button><button id="p-next">Next ▶</button>
<button id="p-pause">Pause (P)</button><button id="p-reset">Reset (R)</button>
<div id="p-clock"></div><div id="p-timer">00:00</div></header>
<main><div id="p-notes"></div>
<aside><div class="lbl">Next click</div><div id="p-nextinfo"></div>
<div class="lbl">Next slide</div><div class="frame"><iframe id="p-frame" title="Next slide preview"></iframe><div id="p-end">End of presentation</div></div>
<div class="lbl">Now on screen</div><div class="frame"><iframe id="p-cur" title="Current slide preview"></iframe></div></aside></main>
<footer>→ / Space / PageDown: next · ← / PageUp: back · P: pause timer · R: reset timer · Your clicker works in this window too. Target: 7–8 minutes.</footer>
</body></html>`);
    d.close();
    const base = location.href.split('#')[0].split('?')[0];
    const nf = d.getElementById('p-frame'), cf = d.getElementById('p-cur');
    nf.src = base + '?preview=next'; cf.src = base + '?preview=cur';
    nf.addEventListener('load', syncPresenter); cf.addEventListener('load', syncPresenter);
    d.getElementById('p-prev').onclick = () => prev();
    d.getElementById('p-next').onclick = () => next();
    d.getElementById('p-pause').onclick = () => timerToggle();
    d.getElementById('p-reset').onclick = () => timerReset();
    d.addEventListener('keydown', e => {
      if (e.key === 'p' || e.key === 'P') { timerToggle(); e.preventDefault(); return; }
      if (e.key === 'r' || e.key === 'R') { timerReset(); e.preventDefault(); return; }
      onKey(e);
    });
    if (!timer.running && timer.acc === 0) { timer.start = Date.now(); timer.running = true; }
    syncPresenter(); tick();
  }
  function syncPresenter() {
    if (!pres || pres.closed) return;
    const d = pres.document;
    if (!d.getElementById('p-notes')) return;
    const i = Deck.cur, st = Deck.step, max = Deck.maxStep(i);
    d.getElementById('p-slide').textContent = `${i + 1} / ${N} — ${SLIDE_TITLES[i]}`;
    d.getElementById('p-step').textContent = `step ${st + 1} of ${max + 1}`;
    const notes = d.getElementById('p-notes');
    notes.innerHTML = segmentsHtml(i, st);
    const now = notes.querySelector('p.now'); if (now) now.scrollIntoView({ block: 'center' });
    let info;
    if (st < max) info = `Reveals step ${st + 2} of ${max + 1} on this slide`;
    else if (i < N - 1) info = `Goes to slide ${i + 2}: ${SLIDE_TITLES[i + 1]}`;
    else info = 'This is the last slide';
    d.getElementById('p-nextinfo').textContent = info;
    const nf = d.getElementById('p-frame'), cf = d.getElementById('p-cur');
    const hasNext = i < N - 1;
    d.getElementById('p-end').style.display = hasNext ? 'none' : 'flex';
    nf.style.visibility = hasNext ? 'visible' : 'hidden';
    try { if (hasNext) nf.contentWindow.postMessage({ deck: 'show', slide: i + 1, step: Deck.maxStep(i + 1) }, '*'); } catch (e) {}
    try { cf.contentWindow.postMessage({ deck: 'show', slide: i, step: st }, '*'); } catch (e) {}
  }
  Deck.openPresenter = openPresenter;

  /* ---------- small UI ---------- */
  let toastEl = null, toastT = 0;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.style.cssText = 'position:fixed;left:50%;top:22px;transform:translateX(-50%);z-index:130;background:rgba(8,10,20,.95);color:#F3C969;border:1px solid #D9A441;border-radius:6px;padding:8px 16px;font:500 16px Consolas,monospace;transition:opacity .3s';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg; toastEl.style.opacity = 1;
    clearTimeout(toastT); toastT = setTimeout(() => { toastEl.style.opacity = 0; }, 1800);
  }
  Deck.toast = toast;

  function toggleFullscreen() {
    const de = document.documentElement;
    if (!document.fullscreenElement) { (de.requestFullscreen || de.webkitRequestFullscreen || function () {}).call(de); }
    else { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
  }

  /* ---------- keyboard (also clickers: PageUp/PageDown, arrows, B / .) ---------- */
  let digits = '', gotoEl = null, gotoT = 0;
  function showGoto() {
    if (!gotoEl) { gotoEl = document.createElement('div'); gotoEl.id = 'goto'; document.body.appendChild(gotoEl); }
    gotoEl.textContent = 'Go to slide ' + digits; gotoEl.style.display = digits ? 'block' : 'none';
    clearTimeout(gotoT); gotoT = setTimeout(() => { digits = ''; gotoEl.style.display = 'none'; }, 2500);
  }
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9]$/.test(k)) { digits += k; showGoto(); e.preventDefault(); return; }
    if (k === 'Enter' && digits) { const n = parseInt(digits, 10); digits = ''; showGoto(); if (n >= 1 && n <= N) goTo(n - 1, 0, 'fwd'); e.preventDefault(); return; }
    let handled = true;
    switch (k) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Spacebar': case 'Enter':
        if (e.shiftKey && k === 'ArrowRight') { if (Deck.cur < N - 1) goTo(Deck.cur + 1, 0, 'fwd'); }
        else next();
        break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace':
        if (e.shiftKey && k === 'ArrowLeft') { if (Deck.cur > 0) goTo(Deck.cur - 1, 0, 'jump'); }
        else prev();
        break;
      case 'Home': goTo(0, 0, 'fwd'); break;
      case 'End': goTo(N - 1, 0, 'fwd'); break;
      case 'f': case 'F': case 'F5': toggleFullscreen(); break;
      case 's': case 'S': openPresenter(); break;
      case 'n': case 'N': notesEl.classList.toggle('open'); renderNotes(); break;
      case 'm': case 'M': Deck.toggleMotion(); break;
      case 'b': case 'B': case '.': case 'w': case 'W': document.getElementById('blackout').classList.toggle('on'); break;
      case 'h': case 'H': case '?': document.getElementById('help-overlay').classList.toggle('open'); break;
      case 'Escape':
        document.getElementById('help-overlay').classList.remove('open');
        notesEl.classList.remove('open');
        document.getElementById('blackout').classList.remove('on');
        handled = false; break;
      default: handled = false;
    }
    if (handled) e.preventDefault();
  }

  /* ---------- boot ---------- */
  function makeGrain() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), img = g.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255 | 0; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    document.getElementById('grain').style.backgroundImage = `url(${c.toDataURL()})`;
  }

  /* Marble texture for slide 7: an SVG turbulence filter rendered ONCE at low resolution
     into a bitmap, instead of a live full-screen filter (much cheaper to paint). */
  function makeMarble() {
    const el = document.querySelector('.marble'); if (!el) return;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <filter id="m" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0048 0.018" numOctaves="4" seed="7"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.52  0 0 0 0 0.47  0 0 0 -2.2 1.35"/>
      </filter><rect width="640" height="360" filter="url(#m)"/></svg>`;
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = 640; c.height = 360;
        c.getContext('2d').drawImage(img, 0, 0);
        el.style.backgroundImage = `url(${c.toDataURL()})`;
      } catch (e) { el.style.backgroundImage = `url("${img.src}")`; }
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function startAt() {
    const m = /^#(\d+)(?:\.(\d+))?/.exec(location.hash);
    if (m && !PREVIEW) return [parseInt(m[1], 10) - 1, parseInt(m[2] || '0', 10)];
    return [0, 0];
  }

  Deck.boot = function () {
    if (PREVIEW) body.classList.add('preview');
    FX.init(document.getElementById('fx'));
    applyMotion();
    makeGrain();
    makeMarble();
    const [si, ss] = startAt();
    const go = () => goTo(si, ss, (si === 0 && ss === 0) ? 'fwd' : 'jump', true);
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise(r => setTimeout(r, 1500))]).then(() => requestAnimationFrame(go));

    if (PREVIEW) {
      window.addEventListener('message', e => {
        const d = e.data; if (!d || d.deck !== 'show') return;
        goTo(d.slide, d.step, 'jump', d.slide !== Deck.cur || true);
      });
      return;
    }
    document.addEventListener('keydown', onKey);
    // mouse click on the slide = next (ignores overlays)
    document.getElementById('viewport').addEventListener('click', e => {
      if (e.button !== 0) return;
      next();
    });
    // swipe
    let tx = null;
    window.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    window.addEventListener('touchend', e => {
      if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); }
    });
    // hide cursor when idle
    let ct = 0;
    window.addEventListener('mousemove', () => {
      body.classList.remove('hide-cursor'); clearTimeout(ct);
      ct = setTimeout(() => body.classList.add('hide-cursor'), 2200);
    });
    if (mq && mq.addEventListener) mq.addEventListener('change', () => {
      if (storedMotion() === null) { Deck.reduced = mq.matches; applyMotion(); goTo(Deck.cur, Deck.step, 'jump', true); }
    });
    window.addEventListener('beforeunload', () => { if (pres && !pres.closed) pres.close(); });
  };
})();
