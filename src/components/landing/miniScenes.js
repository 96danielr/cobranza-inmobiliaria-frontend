// Small 3D vignettes for the security and closing cards, ported from the approved prototype
// (./planes/2026-10-05-landing-fuentes/minis.js). Only the engine and the two vignettes in use are kept;
// the runner is per host and returns a cleanup so React can mount and unmount it safely.

// ---------- tiny engine (same box model as the hero scene) ----------
const RX = 56, RZ = -34;
const PIN = '<div class="pin p1"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#E3B23C" stroke="#fff" stroke-width="1.6"/><text x="10" y="14.3" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" font-family="Inter, system-ui, sans-serif">&#36;</text></svg><i></i></div>'
  + '<div class="pin p2"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#0FA37F" stroke="#fff" stroke-width="1.6"/><path d="M5.9 10.3l2.7 2.7 5.5-5.9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><i></i></div>';
const WHITE = { top: '#FFFFFF', front: '#EFEDE7', back: '#E6E3DC', left: '#E6E3DC', right: '#D3CFC6' };
const INK = { top: '#22375A', front: '#0B1B33', back: '#0B1B33', left: '#0B1B33', right: '#081426', noLine: true };
const GREEN = { top: '#2BBD93', front: '#0FA37F', back: '#0FA37F', left: '#0FA37F', right: '#0B8A6B', noLine: true };
const clamp = v => Math.min(Math.max(v, 0), 1), easeOut = t => 1 - Math.pow(1 - t, 3);
const put = (el, prop, v) => { const c = el._c || (el._c = {}); if (c[prop] !== v) { c[prop] = v; el.style[prop] = v; } };
const cls = (el, name, on) => { const k = '_' + name; if (el[k] !== on) { el[k] = on; el.classList.toggle(name, on); } };

function mk(host, W, D, opts = {}) {
  host.classList.add('mx'); if (opts.dark) host.classList.add('dark');
  const pl = document.createElement('div'); pl.className = 'pl'; host.appendChild(pl);
  Object.assign(pl.style, { width: W + 'px', height: D + 'px', margin: `${-D / 2}px 0 0 ${-W / 2}px` });
  const fit = () => { const s = Math.min((host.clientWidth || 300) / (W * (opts.zoom || .98)), (host.clientHeight || 300) / (D * 1.45));   /* fit width and height */ pl.style.transform = `scale3d(${s},${s},${s}) rotateX(${opts.rx || RX}deg) rotateZ(${opts.rz || RZ}deg)`; };
  fit(); if (window.ResizeObserver) { const ro = new ResizeObserver(fit); ro.observe(host); (host._observers = host._observers || []).push(ro); }
  const div = (c, x, y, w, d, parent = pl) => { const e = document.createElement('div'); e.className = c; Object.assign(e.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: d + 'px' }); parent.appendChild(e); return e; };
  const group = (parent = pl) => { const g = document.createElement('div'); g.className = 'g'; parent.appendChild(g); return g; };
  function box(parent, x, y, z, w, d, h, s) {
    const b = document.createElement('div'); b.className = 'b';
    Object.assign(b.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: d + 'px', transform: `translateZ(${z}px)` });
    const f = (css, bg) => { const e = document.createElement('div'); e.className = 'f'; Object.assign(e.style, css); e.style.background = bg; b.appendChild(e); return e; };
    f({ left: '0px', top: '0px', width: w + 'px', height: d + 'px', transform: `translateZ(${h}px)`, boxShadow: s.noLine ? '' : 'inset 0 0 0 .6px rgba(11,27,51,.2)' }, s.top);
    f({ left: '0px', top: '0px', width: w + 'px', height: h + 'px', transformOrigin: '50% 0', transform: 'rotateX(90deg)' }, s.back);
    f({ left: '0px', top: '0px', width: h + 'px', height: d + 'px', transformOrigin: '0 50%', transform: 'rotateY(-90deg)' }, s.left);
    f({ left: w + 'px', top: '0px', width: h + 'px', height: d + 'px', transformOrigin: '0 50%', transform: 'rotateY(-90deg)' }, s.right);
    b._front = f({ left: '0px', top: d + 'px', width: w + 'px', height: h + 'px', transformOrigin: '50% 0', transform: 'rotateX(90deg)' }, s.front);
    parent.appendChild(b); return b; }
  const pin = (x, y) => { const p = div('bb', x, y, 0, 0); p.innerHTML = PIN; return p; };
  const card = (x, y, html, extra = '') => { const holder = div('bb', x, y, 0, 0); const c = document.createElement('div'); c.className = 'card ' + extra; c.innerHTML = html; holder.appendChild(c); holder._card = c; return holder; };
  const bill = z => `translateZ(${z}px) rotateZ(${-(opts.rz || RZ)}deg) rotateX(${-(opts.rx || RX)}deg)`;     // faces the camera
  const lot = (x, y, w, d) => { const l = div('lot', x, y, w, d); const fl = document.createElement('i'); fl.className = 'lfill'; l.appendChild(fl); l._fill = fl; return l; };
  return { pl, div, group, box, pin, bill, lot, card };
}


const V = {};
// security · backup layers with a check on top (dark section)
V.secure = host => { const m = mk(host, 220, 170, { dark: true, zoom: .68 });
  // 1) three data layers drop in and stack  2) a large padlock lands on top and its shackle closes (green)
  // 3) a ring pulses out over the stack, then the stack rests with a slow breathing motion
  const LAY = { top: '#1E3A63', front: '#14294A', back: '#14294A', left: '#14294A', right: '#0E1F3A', noLine: true };
  const plates = [0, 1, 2].map(k => { const g = m.group(); m.box(g, 55, 40, 0, 110, 86, 7, k === 2 ? { ...LAY, top: '#2B4F84' } : LAY); g._faces = [...g.querySelectorAll('.f')]; return g; });
  const ring = m.div('sec-ring', 110 - 40, 83 - 40, 80, 80);
  const lk = m.div('bb', 110, 83, 0, 0);
  lk.innerHTML = '<div class="sec-lock"><svg viewBox="0 0 64 76" aria-hidden="true">'
    + '<g class="shk"><path d="M17 36V24a15 15 0 0 1 30 0v12" fill="none" stroke-width="7" stroke-linecap="round"/></g>'
    + '<rect class="bd" x="6" y="34" width="52" height="38" rx="10"/>'
    + '<circle cx="32" cy="50" r="5.5" fill="#0B1B33"/><rect x="29.5" y="52" width="5" height="10" rx="2.5" fill="#0B1B33"/></svg></div>';
  const lock = lk.firstChild, shk = lock.querySelector('.shk');
  return { period: 7000, update(t) { const s = t / 1000;
    plates.forEach((g, k) => { const e = easeOut(clamp((t - k * 260) / 700));
      const z = 6 + k * 18 + 40 * (1 - e) + (t > 3200 ? Math.sin((t - 3200) / 1000 * 1.2 + k * .7) * 1.6 : 0);
      put(g, 'transform', `translateZ(${z.toFixed(2)}px)`); g._faces.forEach(f => put(f, 'opacity', e.toFixed(2))); });
    const land = easeOut(clamp((t - 1100) / 600)), top = 6 + 2 * 18 + 7;
    put(lk, 'transform', m.bill(top + 4 + 46 * (1 - land)));
    put(lock, 'opacity', land.toFixed(2));
    const close = clamp((t - 1900) / 360), b = close < 1 ? close * close : 1;   // shackle snaps down
    put(shk, 'transform', `translateY(${(-9 * (1 - b)).toFixed(2)}px)`);
    cls(lock, 'closed', close >= 1);
    const r = clamp((t - 2250) / 1100);
    put(ring, 'transform', `translateZ(${top + 1}px) scale(${(.4 + 1.3 * easeOut(r)).toFixed(3)})`);
    put(ring, 'opacity', (r > 0 && r < 1 ? (1 - r) * .9 : 0).toFixed(2)); } }; };
// closing · the whole portfolio collected, one buyer builds
V.close = host => { const m = mk(host, 250, 180, { zoom: 1.24 }); const lots = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { const x = 10 + c * 78, y = 24 + r * 70, l = m.lot(x, y, 70, 60); l.classList.add('sold'); lots.push({ l, p: m.pin(x + 35, y + 30) }); }
  const house = m.group(); m.box(house, 10 + 78 + 18, 24 + 70 + 14, 0, 34, 30, 12, WHITE); m.box(house, 10 + 78 + 16.5, 24 + 70 + 12.5, 12, 37, 33, 1.6, { ...WHITE, top: '#F7F6F2', noLine: true });
  return { period: 7000, update(t) {
    lots.forEach((o, k) => { const s = 300 + k * 420, q = Math.floor(clamp((t - s) / 1300) * 4 + 1e-6) / 4;
      put(o.l._fill, 'transform', `scaleY(${q})`); cls(o.l, 'paid', q >= 1); cls(o.p, 'prog', q > 0 && q < 1); cls(o.p, 'done', q >= 1);
      put(o.p, 'transform', m.bill(k === 4 ? 1 + 13.6 * easeOut(clamp((t - 4300) / 900)) : 1)); });
    const e = easeOut(clamp((t - 4300) / 900)); put(house, 'visibility', e > .01 ? 'visible' : 'hidden'); put(house, 'transform', `scale3d(1,1,${Math.max(e, .01).toFixed(3)})`); } }; };

/** Builds the vignette `kind` inside `host`, animates it while on screen, and returns a cleanup. */
export function mountMiniScene(host, kind) {
  if (!V[kind] || host.dataset.init) return () => {};
  host.dataset.init = '1';
  const v = V[kind](host);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let on = false, t0 = 0, raf = 0;
  const io = new IntersectionObserver(([e]) => { const was = on; on = e.isIntersecting; if (on && !was) { t0 = performance.now(); if (!reduce) raf = requestAnimationFrame(loop); } }, { threshold: .2 });
  io.observe(host);
  v.update(reduce ? v.period - 1 : 0);
  const loop = now => {
    if (on) {
      const t = (now - t0) % v.period;
      put(host, 'opacity', t > v.period - 500 ? clamp((v.period - t) / 500).toFixed(2) : t < 300 ? clamp(t / 300).toFixed(2) : '1');
      v.update(t);
    }
    if (on) raf = requestAnimationFrame(loop);   // stops off screen; the observer restarts it
  };
  return () => {
    cancelAnimationFrame(raf); io.disconnect(); (host._observers || []).forEach(o => o.disconnect());
    host._observers = []; host.replaceChildren(); host.classList.remove('mx', 'dark'); host.style.opacity = ''; host._c = null; delete host.dataset.init;
  };
}
