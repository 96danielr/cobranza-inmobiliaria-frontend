// 3D hero scene, ported from the approved prototype (./planes/2026-10-05-landing-fuentes/hero-v49.html).
// Kept as plain JS on purpose: the engine is long, imperative and already approved; this module only adds
// scoping to `root`, a stop flag for the frame loop, and a cleanup that disconnects observers.

export function mountHeroScene(root) {
  const $ = id => (root.id === id ? root : root.querySelector('#' + id));
  const pl = $('pl'), scene = pl && pl.parentElement;
  if (!pl || pl.dataset.init) return () => {};
  pl.dataset.init = '1';
  let alive = true; const observers = [], timers = new Set(); const ac = new AbortController();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
  const LW = 64, LD = 60, GAP = 9, O = 12, PW = 380, PH = 300;
  const lotXY = (c, r) => [O + c * (LW + GAP), O + r * (LD + GAP)];
  const div = (cls, css, parent = pl) => { const d = document.createElement('div'); d.className = cls; Object.assign(d.style, css); parent.appendChild(d); return d; };
  // road markings
  for (let k = 0; k < 4; k++) div('dash v', { left: (O + LW + GAP / 2 - .5 + k * (LW + GAP)) + 'px', top: O + 'px', height: (4 * LD + 3 * GAP) + 'px' });
  for (let k = 0; k < 3; k++) div('dash h', { left: O + 'px', top: (O + LD + GAP / 2 - .5 + k * (LD + GAP)) + 'px', width: (5 * LW + 4 * GAP) + 'px' });
  div('dash h', { left: '0px', top: (O + 4 * LD + 3 * GAP + 10) + 'px', width: PW + 'px' });
  div('dash v', { left: '5.5px', top: '0px', height: PH + 'px' });
  // lots
  const sold = ['0,0', '3,0', '4,0', '4,2', '0,3', '2,3', '3,3'], lotQueue = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
    if ((c === 1 || c === 2) && (r === 1 || r === 2)) continue;
    const [x, y] = lotXY(c, r), isSold = sold.includes(c + ',' + r);
    lotQueue.push([x, y, isSold, c + ',' + r]);
  }
  const [sx, sy] = lotXY(1, 1), SW = LW * 2 + GAP, SD = LD * 2 + GAP;
  const site = div('site', { left: sx + 'px', top: sy + 'px', width: SW + 'px', height: SD + 'px' });
  const bx = sx + 12, by = sy + 12, bw = SW - 24, bd = SD - 24;
  const plinthQ = true;
  const bShadow = div('shadow', { left: (bx + 10) + 'px', top: (by - 6) + 'px', width: (bw + 6) + 'px', height: (bd + 2) + 'px', opacity: 0, transform: 'translateZ(1.5px)' });

  function box(parent, x, y, z, w, d, h, s) {
    const b = document.createElement('div'); b.className = 'b';
    Object.assign(b.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: d + 'px', transform: `translateZ(${z}px)` });
    const faces = [];
    const face = (css, bg, cls) => { const f = document.createElement('div'); f.className = 'f' + (cls ? ' ' + cls : ''); Object.assign(f.style, css); if (bg) f.style.background = bg; b.appendChild(f); faces.push(f); return f; };
    const fb = s.fCls || '', sbc = s.sCls || '';
    face({ left: '0px', top: '0px', width: w + 'px', height: d + 'px', transform: `translateZ(${h}px)`, boxShadow: s.noLine ? '' : 'inset 0 0 0 .6px rgba(11,27,51,.2)' }, s.top || '#FFFFFF', s.tCls);
    face({ left: '0px', top: '0px', width: w + 'px', height: h + 'px', transformOrigin: '50% 0', transform: 'rotateX(90deg)' }, fb ? null : s.back, fb);
    face({ left: '0px', top: '0px', width: h + 'px', height: d + 'px', transformOrigin: '0 50%', transform: 'rotateY(-90deg)' }, sbc ? null : s.left, sbc);
    face({ left: w + 'px', top: '0px', width: h + 'px', height: d + 'px', transformOrigin: '0 50%', transform: 'rotateY(-90deg)' }, sbc ? null : s.right, sbc);
    const front = face({ left: '0px', top: d + 'px', width: w + 'px', height: h + 'px', transformOrigin: '50% 0', transform: 'rotateX(90deg)' }, fb ? null : s.front, fb);
    parent.appendChild(b); b._faces = faces; b._front = front; return b;
  }
  const group = (parent = pl) => div('g', {}, parent);
  const CURB = { front: '#C7C1B3', back: '#D3CDC0', left: '#D3CDC0', right: '#B9B2A3', noLine: true };
  const lotEl = {};
  lotQueue.forEach(([x, y, s, key]) => { lotEl[key] = div('plan ' + (s ? 'sold' : 'free'), { left: x + 'px', top: y + 'px', width: LW + 'px', height: LD + 'px' }); });
  // each sold lot turns green when its buyer is up to date: one lot per step, the last step closes two
  const PAY_ORDER = ['0,0', '3,0', '4,0', '4,2', '0,3', '2,3', '3,3'], PAY_STEP = [2, 3, 3, 4, 5, 6, 6];
  const PIN = '<div class="pin p1"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#E3B23C" stroke="#fff" stroke-width="1.6"/><text x="10" y="14.3" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" font-family="Inter, system-ui, sans-serif">&#36;</text></svg><i></i></div>'
    + '<div class="pin p2"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#0FA37F" stroke="#fff" stroke-width="1.6"/><path d="M5.9 10.3l2.7 2.7 5.5-5.9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><i></i></div>';
  const pins = PAY_ORDER.map(key => { const [c, r] = key.split(',').map(Number), [x, y] = lotXY(c, r);
    const g = div('bb', { left: (x + LW / 2) + 'px', top: (y + LD / 2) + 'px' }); g.innerHTML = PIN; return g; });
  const sitePin = div('bb', { left: (sx + SW / 2) + 'px', top: (sy + SD / 2) + 'px' }); sitePin.innerHTML = PIN;   // rides on the growing roof
  const addFill = el => { const f = document.createElement('i'); f.className = 'lfill'; el.appendChild(f); return f; };
  const QUOTAS = 6;                                                    // instalments drawn per lot
  // sidewalk around the tower site (plan outline)
  const PAVE = { ...CURB, top: 'repeating-linear-gradient(90deg, rgba(11,27,51,.07) 0 .5px, transparent .5px 5px), repeating-linear-gradient(0deg, rgba(11,27,51,.07) 0 .5px, transparent .5px 5px), #ECE9E2' }, RW = 11;
  div('plan', { left: sx + 'px', top: sy + 'px', width: SW + 'px', height: SD + 'px' });                      // sidewalk outline
  div('plan', { left: (sx + RW) + 'px', top: (sy + RW) + 'px', width: (SW - 2 * RW) + 'px', height: (SD - 2 * RW) + 'px' });
  // shared materials
  const CONC = { top: '#CFC9BC', front: '#B4AD9F', back: '#B4AD9F', left: '#B4AD9F', right: '#9E9789', noLine: true };
  const POST = { top: '#3A4556', front: '#2A3442', back: '#2A3442', left: '#2A3442', right: '#1E2733', noLine: true };
  const lamp = (x, y, dir) => { box(pl, x, y, 1.4, 1, 1, 17, POST); box(pl, dir > 0 ? x : x - 4, y, 17.4, 5, 1, .8, POST);
    box(pl, dir > 0 ? x + 3.5 : x - 4.5, y - .5, 16.2, 2, 2, 1.2, { top: '#FFF6D8', front: '#F3E3A6', back: '#F3E3A6', left: '#F3E3A6', right: '#E2CF8A', noLine: true }); };
  const C = { top: '#FFFFFF', front: '#E4E1D9', back: '#DCD8CE', left: '#DCD8CE', right: '#C2BDB2' };
  const DARK = { top: '#1A2B45', front: '#0B1B33', back: '#0B1B33', left: '#0B1B33', right: '#081426' };
  const TRUNK = { top: '#8D8577', front: '#7A7365', back: '#7A7365', left: '#7A7365', right: '#665F53', noLine: true };
  const LEAF = { top: '#93CBAE', front: '#6FAF8E', back: '#6FAF8E', left: '#6FAF8E', right: '#5A977A', noLine: true };
  const LEAF2 = { top: '#A6D6BC', front: '#7DBB9B', back: '#7DBB9B', left: '#7DBB9B', right: '#66A285', noLine: true };
  const PLANT = { top: '#7FBF9D', front: '#C9C4B8', back: '#C9C4B8', left: '#C9C4B8', right: '#B5AFA2' };
  const GREY = { top: '#E9E6DF', front: '#C9C4B8', back: '#C9C4B8', left: '#C9C4B8', right: '#B5AFA2' };
  const LATM = { top: 'transparent', fCls: 'latM', sCls: 'latMS', noLine: true };
  const LATJ = { top: 'transparent', tCls: 'latJT', fCls: 'latJ', sCls: 'latJS', noLine: true };
  const YEL = { top: '#EDC45A', front: '#E3B23C', back: '#E3B23C', left: '#E3B23C', right: '#C99A2E', noLine: true };
  const put = (el, prop, v) => { const c = el._c || (el._c = {}); if (c[prop] !== v) { c[prop] = v; el.style[prop] = v; } };
  const setOp = (b, o) => { if (b._op === o) return; b._op = o; b._faces.forEach(f => { f.style.opacity = o; }); };

  // houses as plan footprints
  // white massing houses that buyers build after their lot is paid off (only some lots)
  const WHITE = { top: '#FFFFFF', front: '#EFEDE7', back: '#E6E3DC', left: '#E6E3DC', right: '#D3CFC6' };
  const ROOFW = { top: '#F7F6F2', front: '#DCD8CF', back: '#DCD8CF', left: '#DCD8CF', right: '#C8C3B8', noLine: true };
  const HOUSE_LOTS = { '0,0': 0, '4,2': 0, '3,3': 0 };                 // lot key -> house group
  Object.keys(HOUSE_LOTS).forEach(k => { const [c, r] = k.split(',').map(Number), [x, y] = lotXY(c, r);
    const g = group(); box(g, x + 17, y + 16, 0, 30, 26, 11, WHITE); box(g, x + 15.5, y + 14.5, 11, 33, 29, 1.6, ROOFW);
    box(g, x + 39, y + 19, 12.6, 4, 4, 3, WHITE);                       // small rooftop volume
    g.style.visibility = 'hidden'; HOUSE_LOTS[k] = g; });
  const HOUSE_H = 14.2, HOUSE_DELAY = 1500, HOUSE_DUR = 1200;
  // trees as plan symbols
  const tree = (x, y, s = 1) => { const g = group(); div('plan tree', { left: x + 'px', top: y + 'px', width: (9 * s) + 'px', height: (9 * s) + 'px' }, g); return g; };   // plan symbol
  const trees = [[sx + 10, sy + SD - 10], [sx + SW - 20, sy + SD - 10]]
    .map(([x, y], i) => tree(x, y, i % 2 ? 1.15 : 1));

  // tower: 12 levels; each level extrudes from its base (scale Z)
  const levels = []; let z = 0;
  for (let i = 0; i < 12; i++) {
    const g = group(); const set = i >= 9, inset = set ? 16 : 0;
    const x = bx + inset, y = by + inset, w = bw - inset * 2, d = bd - inset * 2, bodyH = i === 0 ? 17 : 8;
    if (i === 9) { for (let k = 0; k < 4; k++) box(g, bx + 6 + k * 26, by + bd - 9, 0, 18, 5, 3, PLANT);
                   for (let k = 0; k < 3; k++) box(g, bx + bw - 9, by + 8 + k * 26, 0, 5, 18, 3, PLANT); }
    box(g, x - 1.5, y - 1.5, 0, w + 3, d + 3, 2, C);
    const body = box(g, x, y, 2, w, d, bodyH, { fCls: i === 0 ? 'lobbyF' : set ? 'gF2' : 'gF', sCls: set ? 'gS2' : 'gS', top: i === 8 ? 'radial-gradient(rgba(30,110,75,.22) .8px, transparent .9px) 0 0/4px 4px, #CFE6D9' : '#FFFFFF' });
    { const k = i / 11, mix = (a, b) => '#' + a.match(/../g).map((h, j) => Math.round(parseInt(h, 16) + (parseInt(b.match(/../g)[j], 16) - parseInt(h, 16)) * k).toString(16).padStart(2, '0')).join('');
      body.style.setProperty('--glass', mix('2B4A76', '4D6F9C')); body.style.setProperty('--glassD', mix('1B3358', '2E4D78')); }
    if (i >= 1 && i <= 8) box(g, x + w, y + 34, 2, 2.5, 26, bodyH, { top: '#F4F2EC', front: '#E4E1D9', back: '#DCD8CE', left: '#DCD8CE', right: '#C2BDB2', noLine: true }); // concrete core
    if (i === 9) { const RAIL = { top: 'rgba(255,255,255,.7)', front: 'rgba(150,182,210,.45)', back: 'rgba(150,182,210,.45)', left: 'rgba(150,182,210,.45)', right: 'rgba(120,152,182,.5)', noLine: true };
      box(g, bx, by + bd - 1, 0, bw, .8, 3.4, RAIL); box(g, bx + bw - 1, by, 0, .8, bd, 3.4, RAIL); }
    if (i === 0) { const dr = document.createElement('div'); dr.className = 'door'; body._front.appendChild(dr);
      const cxL = x + w / 2 - 20, cyL = y + d;
      box(g, cxL, cyL, 15, 40, 8, 1.5, DARK);
      box(g, cxL + 1.5, cyL + 6, 0, 1.2, 1.2, 15, POST); box(g, cxL + 37.3, cyL + 6, 0, 1.2, 1.2, 15, POST);
      box(g, x - 3, y - 3, -1.2, w + 6, d + 6, 1.2, { top: '#D8D3C8', front: '#BDB6A8', back: '#C9C3B6', left: '#C9C3B6', right: '#A9A193', noLine: true }); }
    levels.push({ g, z, h: 2 + bodyH }); z += 2 + bodyH;
  }
  const TOP = z;
  const roofG = group(); const rX = bx + 16, rY = by + 16, rw = bw - 32, rd = bd - 32;
  box(roofG, rX - 1.5, rY - 1.5, 0, rw + 3, rd + 3, 2, { ...C, top: 'radial-gradient(rgba(90,84,72,.22) .55px, transparent .65px) 0 0/3px 3px, radial-gradient(rgba(90,84,72,.14) .5px, transparent .6px) 1.5px 1.5px/3px 3px, #F1EFE9' });
  box(roofG, rX + 8, rY + 8, 2, 22, 16, 6, GREY); box(roofG, rX + 36, rY + 10, 2, 12, 12, 10, GREY); box(roofG, rX + 10, rY + 34, 2, 30, 4, 2, DARK);
  const PV = { top: '#2A4A78', front: '#1B3358', back: '#1B3358', left: '#1B3358', right: '#132744', noLine: true };
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) box(roofG, rX + 44 + c * 9, rY + 30 + r * 7, 2, 7.5, 5.5, .9, PV);
  // telecom mast: concrete base, three tapering sections, cross arms with panel antennas, small dish, guy wires, aviation light
  const ax = rX + rw - 9, ay = rY + 4;
  const STEEL = { top: '#8E97A6', front: '#6E7887', back: '#6E7887', left: '#6E7887', right: '#58616F', noLine: true };
  const PANEL = { top: '#FFFFFF', front: '#F1EFEA', back: '#E4E1D9', left: '#E4E1D9', right: '#CFCAC0', noLine: true };
  box(roofG, ax - 2, ay - 2, 2, 5.6, 5.6, 1.4, CONC);                               // base plinth
  box(roofG, ax, ay, 3.4, 1.6, 1.6, 7, STEEL);                                      // section 1
  box(roofG, ax + .2, ay + .2, 10.4, 1.2, 1.2, 6, STEEL);                           // section 2
  box(roofG, ax + .4, ay + .4, 16.4, .8, .8, 5, STEEL);                             // section 3
  box(roofG, ax - 2.6, ay + .5, 9.6, 6.8, .6, .6, STEEL); box(roofG, ax + .5, ay - 2.6, 13.6, .6, 6.8, .6, STEEL); // cross arms
  box(roofG, ax - 3.2, ay + .2, 7.2, .7, 1.2, 3.4, PANEL); box(roofG, ax + 4.1, ay + .2, 7.2, .7, 1.2, 3.4, PANEL); // panel antennas
  box(roofG, ax + .2, ay - 3.4, 11.2, 1.2, .7, 3.4, PANEL);
  box(roofG, ax + 1.6, ay + 1.6, 5.2, 2.6, .5, 2.6, { top: '#FFFFFF', front: '#E9E6DF', back: '#E9E6DF', left: '#E9E6DF', right: '#D2CDC2', noLine: true }); // small dish
  const guy = (deg, rot) => { const g = group(roofG); g.style.transform = `translate3d(${ax + .8}px, ${ay + .8}px, 20px) rotateZ(${rot}deg) rotateY(${deg}deg)`;
    box(g, -.15, -.15, 0, .3, .3, 19, { top: '#9AA2AE', front: '#9AA2AE', back: '#9AA2AE', left: '#9AA2AE', right: '#7F8794', noLine: true }); return g; };
  guy(180 - 22, 45); guy(180 - 22, 225);                                             // guy wires down to the roof
  const beacon = box(roofG, ax + .3, ay + .3, 21.4, 1, 1, 1, { top: '#FF6B6B', front: '#E5484D', back: '#E5484D', left: '#E5484D', right: '#C93A3F', noLine: true });

  // tower crane at the site's right corner; mast grows with the building, jib slews
  const mx0 = sx + SW - 8.5, my0 = sy + 2.5, MAST = TOP + 30;
  const craneMast = group();
  box(craneMast, mx0, my0, 0, 6, 6, MAST, LATM);                                   // lattice mast
  const craneBase = [box(pl, mx0 - 3.5, my0 - 3.5, 1.4, 13, 13, 2.2, CONC),          // foundation pad
                     box(pl, mx0 - 2, my0 - 2, 3.6, 10, 2.5, 2, CONC), box(pl, mx0 - 2, my0 + 5.5, 3.6, 10, 2.5, 2, CONC)]; // ballast
  const jib = group();                                                              // origin at the mast axis, top of mast
  const cx = mx0 + 3, cy = my0 + 3;
  box(jib, -4, -4, 0, 8, 8, 2, { top: '#3A4556', front: '#2A3442', back: '#2A3442', left: '#2A3442', right: '#1E2733', noLine: true }); // slewing ring
  box(jib, -96, -2, 2, 99, 4, 4, LATJ);                                             // jib
  box(jib, -99, -1.5, 2.5, 3, 3, 3, YEL);                                           // jib tip
  box(jib, 3, -2.5, 2, 22, 5, 2.4, LATJ);                                           // counter-jib
  for (let k = 0; k < 3; k++) box(jib, 16 + k * 2.6, -3.5, 4.4 - 0, 2.4, 7, 5 - k * .4, CONC); // stacked counterweights
  box(jib, -1.5, -1.5, 2, 3, 3, 13, YEL);                                           // tower head (apex)
  box(jib, -4.5, 3, -4, 6, 5, 6, { top: '#FFFFFF', fCls: 'cabF', sCls: '', front: '#F4F2EC', back: '#E2DED5', left: '#E2DED5', right: '#CFCAC0' }); // operator cab
  // pendant ties from the apex to the jib and counter-jib (thin bars, rotated in the XZ plane)
  const tie = (len, deg, toNeg) => { const g = group(jib); g.style.transform = `translateZ(15px) rotateY(${deg}deg)`;
    box(g, toNeg ? -len : 0, -.3, 0, len, .6, .6, { top: '#2A3442', front: '#2A3442', back: '#2A3442', left: '#2A3442', right: '#1E2733', noLine: true }); return g; };
  const tieA = tie(Math.hypot(62, 9), -Math.atan2(9, 62) * 180 / Math.PI, true), tieB = tie(Math.hypot(20, 9), Math.atan2(9, 20) * 180 / Math.PI, false);
  // trolley with double hoist cable and hook block
  const trolley = group(jib);
  box(trolley, -2.5, -2.5, 1, 5, 5, 1.6, DARK);
  box(trolley, -1, -.4, -20, .5, .5, 21, DARK); box(trolley, .5, -.4, -20, .5, .5, 21, DARK);
  box(trolley, -2, -2, -23.5, 4, 4, 3.5, YEL); box(trolley, -.5, -.5, -26, 1, 1, 2.5, DARK);
  const craneParts = [...craneMast.querySelectorAll('.b'), ...jib.querySelectorAll('.b'), ...craneBase];

  // single 3D progress bar on the ground, parallel to the plane's front edge
  const hud = group(); hud.classList.add('hud');
  const BY = 12, BL = PW - 28;                                // full length on the long edges
  const trackG = group(hud); box(trackG, 0, 0, 0, BL, 7, 2, { top: '#E1DCD0', front: '#CFC9BB', back: '#CFC9BB', left: '#CFC9BB', right: '#BDB6A7', noLine: true });
  const barG = group(hud); const barBox = box(barG, 0, 0, 0, BL, 7, 3.4, { top: '#EDC45A', front: '#E3B23C', back: '#E3B23C', left: '#E3B23C', right: '#C99A2E', noLine: true });
  barG.classList.add('bf');
  const BAR_Y = ['#EDC45A', '#E3B23C', '#E3B23C', '#E3B23C', '#C99A2E', '#E3B23C'], BAR_G = ['#2BBD93', '#0FA37F', '#0FA37F', '#0FA37F', '#0B8A6B', '#0FA37F'];
  const barColor = cols => barBox._faces.forEach((f, i) => { f.style.background = 'none'; f.style.backgroundColor = cols[i]; });
  barColor(BAR_Y);
  // labels lying flat on the ground, parallel to the bar
  const TPIV = BY + 11;                                       // hinge line, just outside the bar
  const tg = group(hud);
  const lblN = div('tx n', { left: '14px', top: '1px' }, tg);
  const pool = [0, 1, 2, 3].map(() => { const el = div('tx m', { left: '14px', top: '11px', opacity: 0 }, tg); el._slot = 9; return el; });
  // slot 0 = current (large), 1 = previous (smaller, dimmed), 2 = third level (fades out), -1 = entering from above
  const SLOT = { '-1': ['translateY(-16px) scale(1)', 0], 0: ['translateY(0px) scale(1)', 1], 1: ['translateY(23px) scale(.66)', .5], 2: ['translateY(38px) scale(.55)', 0] };
  const place = (el, s) => { el._slot = s; const [tr, op] = SLOT[Math.min(s, 2)]; el.style.transform = tr; el.style.opacity = op; };
  // copy per instalment (only features that exist in Operix today)
  const NS = 6;                                                  // steps (instalments) shown; each one raises two floors
  const COPY = ['Lotes vendidos, cuotas por recaudar',          // what the real-estate company sees (only existing features)
    'Recibo enviado por WhatsApp y correo', 'Pago reportado desde el portal', 'Apruebas el pago en un clic',
    'Estados de cuenta siempre al día', 'Comisiones de asesores calculadas', 'Cartera recaudada'];
  const EDGES = [
    { tr: `translate3d(0px, ${PH}px, 0) rotateZ(0deg)`, len: PW, down: a => Math.cos(a) },     // front
    { tr: `translate3d(${PW}px, ${PH}px, 0) rotateZ(-90deg)`, len: PH, down: a => Math.sin(a) }, // right
    { tr: `translate3d(${PW}px, 0px, 0) rotateZ(180deg)`, len: PW, down: a => -Math.cos(a) },   // back
    { tr: `translate3d(0px, 0px, 0) rotateZ(90deg)`, len: PH, down: a => -Math.sin(a) }];      // left
  let edge = 0, edgeBusy = false, lenK = 1; hud.style.transform = EDGES[0].tr;
  // text never runs past the edge: shrink the font only when the line is longer than the available length
  const fitText = el => { el.style.fontSize = ''; const avail = EDGES[edge].len - 28, w = el.scrollWidth;
    if (w > avail) el.style.fontSize = (17 * avail / w).toFixed(2) + 'px'; };
  const fitTrack = () => { lenK = (EDGES[edge].len - 28) / BL; trackG.style.transform = `translate3d(14px, ${BY}px, 0) scale3d(${lenK.toFixed(4)},1,1)`; pool.forEach(fitText); };
  fitTrack();
  // Choose the edge whose text reads best on screen: its direction (after the scene's Z rotation and the camera tilt)
  // is the closest to horizontal, left-to-right, with the edge facing the viewer. Switch only when another edge is
  // clearly better (8 degrees), so the label never flickers at the boundary.
  const TAN = [[1, 0], [0, -1], [-1, 0], [0, 1]], NOR = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  function readAngle(i, a, cp) {
    const rot = ([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
    const [tx, ty] = rot(TAN[i]), [, ny] = rot(NOR[i]);
    if (ny * cp <= .02 || tx <= 0) return 999;                           // facing away or would read upside down
    return Math.abs(Math.atan2(ty * cp, tx)) * 180 / Math.PI; }
  function pickEdge(degZ, degX) {
    if (edgeBusy) return; const a = degZ * Math.PI / 180, cp = Math.cos(degX * Math.PI / 180);
    const cur = readAngle(edge, a, cp); let best = edge, bestV = cur;
    EDGES.forEach((E, i) => { const v = readAngle(i, a, cp); if (v < bestV) { best = i; bestV = v; } });
    if (best === edge || bestV > cur - 8) return;
    edgeBusy = true; hud.classList.add('out');
    later(() => { edge = best; hud.style.transform = EDGES[best].tr; fitTrack(); barG._c = null; requestAnimationFrame(() => { hud.classList.remove('out'); edgeBusy = false; }); }, 130); }
  const lines = $('lines'), n2 = $('n2'), fill2 = $('fill2');
  const pool2 = [0, 1, 2, 3].map(() => { const el = document.createElement('div'); el.className = 'ln'; el.style.opacity = 0; el._slot = 9; lines.appendChild(el); return el; });
  // Stack layout from real heights: the current line (slot 0) sits on top; slot 1 starts right below the
  // current line's real height; slot 2 below slot 1's scaled height. Recomputed on every change, so a
  // two-line message can never cover the one below it.
  const S1 = .7, S2 = .6, LGAP = 6;
  const layout2 = () => {
    const at = s => pool2.find(x => x._slot === s);
    const c = at(0), p = at(1);
    const y1 = (c ? c.offsetHeight : 24) + LGAP, y2 = y1 + (p ? p.offsetHeight * S1 : 17) + LGAP;
    pool2.forEach(el => {
      if (el._slot === 0) { el.style.transform = 'translateY(0px) scale(1)'; el.style.opacity = 1; }
      else if (el._slot === 1) { el.style.transform = `translateY(${y1.toFixed(1)}px) scale(${S1})`; el.style.opacity = .45; }
      else if (el._slot >= 2 && el._slot < 9) { el.style.transform = `translateY(${y2.toFixed(1)}px) scale(${S2})`; el.style.opacity = 0; }
      else { el.style.opacity = 0; } }); };
  // fit a line to the screen: shrink from 20px down to 15px; if it still overflows, wrap to two lines
  const fit2 = el => { el.style.whiteSpace = 'nowrap'; el.style.width = ''; el.style.fontSize = '';
    const avail = lines.clientWidth || 300, w = el.scrollWidth; if (w <= avail) return;
    el.style.fontSize = Math.max(15, 20 * avail / w).toFixed(1) + 'px';
    if (el.scrollWidth > avail) { el.style.whiteSpace = 'normal'; el.style.width = avail + 'px'; } };
  let shown = -1, green = false;
  function say(k) { if (k === shown) return; shown = k;
    if (k === 0) pool2.forEach(el => { el._slot = 9; }); else pool2.forEach(el => { if (el._slot < 9) el._slot += 1; });
    { const e2 = pool2.find(x => x._slot >= 2) || pool2[0];
      e2.innerHTML = k === NS ? COPY[k] + '<svg class="ck" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#0FA37F"/><path d="M5.8 10.4l2.8 2.8 5.6-6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : COPY[k];
      fit2(e2);
      e2.style.transition = 'none'; e2.style.transform = 'translateY(-18px) scale(1)'; e2.style.opacity = 0; void e2.offsetWidth; e2.style.transition = '';
      e2._slot = 0; layout2(); }
    if (k === 0) pool.forEach(el => place(el, 9));          // new cycle: clear the stack
    else pool.forEach(el => { if (el._slot < 9) place(el, el._slot + 1); });
    const el = pool.find(x => x._slot >= 2) || pool[0];
    el.innerHTML = k === NS ? COPY[k] + '<svg class="ck" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#0FA37F"/><path d="M5.8 10.4l2.8 2.8 5.6-6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : COPY[k];
    fitText(el);
    el.style.transition = 'none'; place(el, -1); void el.offsetWidth; el.style.transition = ''; place(el, 0); }
  say(0);

  const N = 12, T0 = 1200, STEP = 2300, DUR = 1100, BUILD_DELAY = 900;
  const LOTS = PAY_ORDER.map((key, i) => { const done = T0 + (PAY_STEP[i] - 1) * STEP + STEP * .6;
    return { key, el: lotEl[key], pin: pins[i], fill: addFill(lotEl[key]), done, start: Math.max(T0 + 300 + i * 120, done - 2.8 * STEP), st: -1 }; });
  LOTS.push({ key: 'site', el: site, pin: sitePin, fill: addFill(site), start: 250, done: T0, st: -1 });
  let recaudo = 0, lastPct = '';
  const CYCLE = T0 + BUILD_DELAY + (NS - 1) * STEP + STEP * .45 + DUR + 3800;
  const easeOut = t => 1 - Math.pow(1 - t, 3), clamp = v => Math.min(Math.max(v, 0), 1);
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const stage = $('ox');
  const listen = (type, fn) => stage.addEventListener(type, fn, { signal: ac.signal });   // removed by ac.abort() in the cleanup
  const wrap = $('oxw');
  const fitStage = () => { const w = stage.clientWidth || 800, mobile = window.innerWidth < 760 || w < 420;   // layout follows the viewport
    wrap.classList.toggle('mobile', mobile);
    pl.style.setProperty('--s', Math.min(1.4, w / 560).toFixed(3));
    pl.style.top = mobile ? '38%' : '';
    if (mobile) { pool2.forEach(el => { if (el._slot <= 1) fit2(el); }); layout2(); }                                   // lift the model to leave room for the 2D HUD
    stage.style.height = Math.round(mobile ? 300 + w * .42 + 70 : Math.min(620, 300 + w * .42)) + 'px'; };
  fitStage(); if (window.ResizeObserver) { const ro = new ResizeObserver(fitStage); ro.observe(stage); observers.push(ro); }
  let onScreen = true; if (window.IntersectionObserver) { const io = new IntersectionObserver(es => { onScreen = es[0].isIntersecting; }); io.observe(stage); observers.push(io); }
  let mx = 0, my = 0, rz = 0, ryv = 0, paidS = 0;
  listen('mousemove', e => { const r = stage.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5; });
  listen('mouseleave', () => { mx = 0; my = 0; });
  let dz = 0, dx = 0, vz = 0, vx = 0, dragging = false, lastX = 0, lastY = 0, lastMove = 0;
  listen('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; vz = vx = 0; stage.setPointerCapture(e.pointerId); stage.classList.add('dragging'); });
  listen('pointermove', e => { if (!dragging) return;
    const ddx = e.clientX - lastX, ddy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; lastMove = performance.now();
    vz = -ddx * .35; vx = -ddy * .2; dz += vz; dx = Math.min(14, Math.max(-16, dx + vx)); });
  const endDrag = () => { dragging = false; stage.classList.remove('dragging'); lastMove = performance.now(); };
  listen('pointerup', endDrag); listen('pointercancel', endDrag);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  function frame(now) {
    if (!alive) return;
    if (!onScreen) { requestAnimationFrame(frame); return; }      // paused while off screen
    const t = reduce ? CYCLE - 2100 : (now - start) % CYCLE;   // reduced motion: the finished scene (crane gone, 100 %)
    let built = 0, paid = 0, top = 0;
    levels.forEach((L, i) => {
      const t0 = T0 + BUILD_DELAY + Math.floor(i / 2) * STEP + (i % 2) * STEP * .45, e = easeOut(clamp((t - t0) / DUR));   // two floors per step, after the sale
      built += e; if (e > 0) top = L.z + L.h * e;
      put(L.g, 'visibility', e > .002 ? 'visible' : 'hidden');
      put(L.g, 'transform', `translateZ(${L.z}px) scale3d(1,1,${Math.max(e, .002).toFixed(3)})`);
    });
    for (let j = 0; j < NS; j++) if (t >= T0 + j * STEP) paid = j + 1;
    const endT = T0 + BUILD_DELAY + (NS - 1) * STEP + STEP * .45 + DUR, re = easeOut(clamp((t - endT + 150) / 600));
    put(roofG, 'visibility', re > .002 ? 'visible' : 'hidden');
    put(roofG, 'transform', `translateZ(${TOP}px) scale3d(1,1,${Math.max(re, .002).toFixed(3)})`);
    if (re > 0) top = TOP + 12 * re;
    setOp(beacon, re > .98 ? (Math.floor((now - start) / 700) % 2 ? '1' : '.3') : '1');
    // crane: appears, follows the top, slews; retracts after completion
    const cIn = easeOut(clamp((t - 200) / 700)), cOut = easeIO(clamp((t - endT - 500) / 1100));
    const cVis = cIn * (1 - cOut);
    const mastK = clamp((Math.max(top, 18) + 26) / MAST) * (1 - cOut * .9);
    put(craneMast, 'transform', `scale3d(1,1,${Math.max(mastK, .002).toFixed(3)})`);
    const slew = Math.sin(t / 1300) * 22 - 8, trolleyX = -40 - 45 * (.5 + .5 * Math.sin(t / 900));
    put(jib, 'transform', `translate3d(${cx}px, ${cy}px, ${(MAST * mastK).toFixed(1)}px) rotateZ(${slew.toFixed(1)}deg)`);
    put(trolley, 'transform', `translate3d(${trolleyX.toFixed(1)}px, 0, 0)`);
    const cv = cVis.toFixed(2); craneParts.forEach(b => setOp(b, cv));
    // trees and context
    trees.forEach((g, k) => { const e = easeOut(clamp((t - 250 - k * 80) / 650)); put(g, 'transform', `scale3d(1,1,${Math.max(e, .002).toFixed(3)})`); put(g, 'visibility', e > .002 ? 'visible' : 'hidden'); });
    put(bShadow, 'opacity', (built / N).toFixed(2));
    // every lot pays its own instalments; yellow fill + peso-sign pin while paying, green + check when fully paid
    let sum = 0;
    LOTS.forEach(L => { const p = clamp((t - L.start) / (L.done - L.start)), q = Math.floor(p * QUOTAS + 1e-6) / QUOTAS; sum += q;
      const st = q >= 1 ? 2 : q > 0 ? 1 : 0;
      if (L.st !== st) { L.st = st; L.el.classList.toggle('paid', st === 2); L.pin.classList.toggle('prog', st === 1); L.pin.classList.toggle('done', st === 2); }
      put(L.fill, 'transform', `scaleY(${q.toFixed(3)})`); });
    recaudo = sum / LOTS.length;
    PAY_ORDER.forEach((key, i) => {
      // a house rises on some lots a while after they are fully paid; its pin rides on the roof
      let hz = 0; const hg = HOUSE_LOTS[key];
      if (hg) { const tp = LOTS[i].done, e = easeOut(clamp((t - tp - HOUSE_DELAY) / HOUSE_DUR)); hz = HOUSE_H * e;
        put(hg, 'visibility', e > .002 ? 'visible' : 'hidden'); put(hg, 'transform', `scale3d(1,1,${Math.max(e, .002).toFixed(3)})`); }
      put(pins[i], 'transform', `translateZ(${(hz + 1).toFixed(1)}px) rotateZ(${(34 - rz).toFixed(2)}deg) rotateX(${(-(56 + ryv)).toFixed(2)}deg)`); });
    put(sitePin, 'transform', `translateZ(${(top + 2.5).toFixed(1)}px) rotateZ(${(34 - rz).toFixed(2)}deg) rotateX(${(-(56 + ryv)).toFixed(2)}deg)`);
    // bar = average collection across all lots; turns green when the whole portfolio is collected
    paidS += (recaudo - paidS) * .12;
    const pct = `RECAUDO ${Math.round(recaudo * 100)} %`; if (pct !== lastPct) { lastPct = pct; lblN.textContent = pct; n2.textContent = pct; }
    put(barG, 'transform', `translate3d(14px, ${BY}px, 0) scale3d(${Math.max(paidS * lenK, .002).toFixed(3)},1,1)`);
    const isDone = t > endT;
    if (isDone !== green) { green = isDone; barColor(isDone ? BAR_G : BAR_Y); fill2.classList.toggle('done', isDone); }
    put(fill2, 'width', (paidS * 100).toFixed(1) + '%');
    say(t > endT ? NS : Math.min(paid, NS - 1));
    const fo = t > CYCLE - 1200 ? clamp((CYCLE - t) / 1200) : 1, fi = clamp(t / 600);
    put(scene, 'opacity', Math.min(fo, fi).toFixed(2));
    if (t < 60) paidS = 0;
    if (!dragging) { dz += vz; dx = Math.min(14, Math.max(-16, dx + vx)); vz *= .92; vx *= .88;
      if (now - lastMove > 2600) { dz += (0 - dz) * .03; dx += (0 - dx) * .03; } }
    const hover = dragging ? 0 : 1;
    rz += (mx * 8 * hover + dz - rz) * .12; ryv += (-my * 4 * hover + dx - ryv) * .12;
    pickEdge(-34 + rz, 56 + ryv);                   // real scene rotation and camera tilt
    put(tg, 'transform', `translate3d(0px, ${TPIV}px, 0) rotateX(${(-(56 + ryv) * .85).toFixed(1)}deg)`);   // hanging label facing the camera                                  // relative to the rest pose, so the margin is symmetric
    const rzs = rz.toFixed(2) + 'deg', rys = ryv.toFixed(2) + 'deg'; if (pl._rz !== rzs || pl._ry !== rys) { pl._rz = rzs; pl._ry = rys; pl.style.setProperty('--rz', rzs); pl.style.setProperty('--ry', rys); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return () => {
    alive = false; ac.abort(); timers.forEach(clearTimeout); observers.forEach(o => o.disconnect());
    // empty the generated nodes so a remount (React Strict Mode) starts clean
    pl.replaceChildren(); $('lines').replaceChildren(); delete pl.dataset.init;
  };
}
