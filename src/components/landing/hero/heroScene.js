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
  const CAM_Z = 22, CAM_X = 56;                                  // rest pose: scene rotation and camera tilt
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
  // gable roof over a w x d footprint, ridge along x: two tiled slopes and the two end triangles
  const gableRoof = (parent, x, y, z, w, d, h, ov, colors) => {
    const g = div('g', { transform: `translateZ(${z}px)` }, parent), half = d / 2 + ov, L = Math.hypot(half, h), a = Math.atan2(h, half) * 180 / Math.PI;
    const slope = (bg, deg) => div('f', { left: (x - ov) + 'px', top: (y + d / 2) + 'px', width: (w + 2 * ov) + 'px', height: L + 'px', transformOrigin: '50% 0', transform: `translateZ(${h}px) rotateX(${deg}deg)`, background: bg, boxShadow: 'inset 0 0 0 .6px rgba(11,27,51,.18)' }, g);
    const end = ex => div('f', { left: ex + 'px', top: y + 'px', width: h + 'px', height: d + 'px', transformOrigin: '0 50%', transform: 'rotateY(-90deg)', background: colors[2], clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }, g);
    slope(colors[0], -a); slope(colors[1], -(180 - a)); end(x); end(x + w); return g; };
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
  const cls = (el, name, on) => { const k = '_' + name; if (el[k] !== on) { el[k] = on; el.classList.toggle(name, on); } };
  const setOp = (b, o) => { if (b._op === o) return; b._op = o; b._faces.forEach(f => { f.style.opacity = o; }); };

  // houses as plan footprints
  // white massing houses that buyers build after their lot is paid off (only some lots)
  const WHITE = { top: '#FFFFFF', front: '#EFEDE7', back: '#E6E3DC', left: '#E6E3DC', right: '#D3CFC6' };
  const ROOFW = { top: '#F7F6F2', front: '#DCD8CF', back: '#DCD8CF', left: '#DCD8CF', right: '#C8C3B8', noLine: true };
  const HOUSE_LOTS = { '0,0': 0, '4,2': 0, '3,3': 0 };                 // lot key -> house group
  Object.keys(HOUSE_LOTS).forEach(k => { const [c, r] = k.split(',').map(Number), [x, y] = lotXY(c, r);
    // small country houses (same language as the main one): white walls, tile gable roof, a lit window
    const g = group(); const hb = box(g, x + 15, y + 17, 0, 34, 24, 9, { top: '#FBF8F1', front: '#F1EBDD', back: '#E6DFCE', left: '#E6DFCE', right: '#DCD3C0' });
    const w1 = document.createElement('i'); w1.className = 'win lit'; Object.assign(w1.style, { left: '6px', top: '3px', width: '5px', height: '4.5px' }); hb._front.appendChild(w1);
    const dr = document.createElement('i'); dr.className = 'hdoor'; Object.assign(dr.style, { left: '20px', top: '2px', width: '5px', height: '7px' }); hb._front.appendChild(dr);
    gableRoof(g, x + 15, y + 17, 9, 34, 24, 8, 2.5, ['repeating-linear-gradient(90deg, rgba(0,0,0,.10) 0 .6px, transparent .6px 4px), #C8693F', 'repeating-linear-gradient(90deg, rgba(0,0,0,.12) 0 .6px, transparent .6px 4px), #A9532F', '#E6DFCE']);
    g.style.visibility = 'hidden'; HOUSE_LOTS[k] = g; });
  const HOUSE_H = 17, HOUSE_DELAY = 1500, HOUSE_DUR = 1200;
  // trees as plan symbols
  const tree = (x, y, s = 1) => { const g = group(); div('plan tree', { left: x + 'px', top: y + 'px', width: (9 * s) + 'px', height: (9 * s) + 'px' }, g); return g; };   // plan symbol
  const trees = [[sx + 10, sy + SD - 10], [sx + SW - 20, sy + SD - 10]]
    .map(([x, y], i) => tree(x, y, i % 2 ? 1.15 : 1));

  // country house (casa campestre) on the buyer's lot: it goes up as the instalments are paid (no scaffolding),
  // then it is lived in little by little: warm lights, chimney smoke and pets arriving one by one
  const WALL = { top: '#FBF8F1', front: '#F1EBDD', back: '#E6DFCE', left: '#E6DFCE', right: '#DCD3C0' };
  const WOOD = { top: '#9A6B47', front: '#8A5A3B', back: '#8A5A3B', left: '#8A5A3B', right: '#734A30', noLine: true };
  const TILE_A = 'repeating-linear-gradient(90deg, rgba(0,0,0,.10) 0 .6px, transparent .6px 4px), #C8693F';
  const TILE_B = 'repeating-linear-gradient(90deg, rgba(0,0,0,.12) 0 .6px, transparent .6px 4px), #A9532F';
  const hx = sx + 10, hy = sy + 28, hw = 80, hd = 44, WALL_H = 15, ROOF_H = 16, OV = 4;
  const N = 6;                                                   // build stages, one per paid instalment
  const slabG = group(); box(slabG, hx - 4, hy - 4, 0, hw + 8, hd + 18, 2, { ...CONC, top: '#D9D3C6' });
  // walls (scale up in Z), with door and windows on the two visible faces
  const wallG = group(); const walls = box(wallG, hx, hy, 2, hw, hd, WALL_H, WALL);
  const wins = [];
  const win = (face, l, t, w, h) => { const el = document.createElement('i'); el.className = 'win'; Object.assign(el.style, { left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px' }); face.appendChild(el); wins.push(el); return el; };
  [5, 16, 57, 68].forEach(l => win(walls._front, l, 4.5, 7, 6.5));
  const door = document.createElement('i'); door.className = 'hdoor'; Object.assign(door.style, { left: '36px', top: '3px', width: '8px', height: (WALL_H - 3) + 'px' }); walls._front.appendChild(door);
  [9, 27].forEach(tp => { win(walls._faces[2], 4.5, tp, 6.5, 8); win(walls._faces[3], 4.5, tp, 6.5, 8); });   // side faces: x runs up the wall, y along it
  // gable roof: two tiled slopes from the ridge plus the two wall triangles
  const roofG = group(); roofG.style.transform = `translateZ(${2 + WALL_H}px)`;
  const half = hd / 2 + OV, slopeL = Math.hypot(half, ROOF_H), ang = Math.atan2(ROOF_H, half) * 180 / Math.PI;
  const plane = (bg, deg) => div('f', { left: (hx - OV) + 'px', top: (hy + hd / 2) + 'px', width: (hw + 2 * OV) + 'px', height: slopeL + 'px', transformOrigin: '50% 0', transform: `translateZ(${ROOF_H}px) rotateX(${deg}deg)`, background: bg, boxShadow: 'inset 0 0 0 .6px rgba(11,27,51,.18)' }, roofG);
  const roofFaces = [plane(TILE_A, -ang), plane(TILE_B, -(180 - ang))];
  const gable = x => div('f', { left: x + 'px', top: hy + 'px', width: ROOF_H + 'px', height: hd + 'px', transformOrigin: '0 50%', transform: 'rotateY(-90deg)', background: '#E6DFCE', clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }, roofG);
  roofFaces.push(gable(hx), gable(hx + hw));
  // porch along the front: wooden posts and a light shed roof; chimney on the back slope
  const porchG = group();
  const pX = hx + 26, pW = 28;                                    // porch only around the door, so the windows stay visible
  box(porchG, pX, hy + hd, 2, pW, 10, 1.2, { ...WOOD, top: '#B98A62' });
  [0, 1].forEach(k => box(porchG, pX + 1 + k * (pW - 3.4), hy + hd + 8, 3.2, 1.4, 1.4, 11, WOOD));
  box(porchG, pX - 2, hy + hd - 1, 14.2, pW + 4, 11, 1.2, { top: TILE_A, front: '#A9532F', back: '#A9532F', left: '#A9532F', right: '#8F4527', noLine: true });
  const chimG = group(); box(chimG, hx + hw - 18, hy + 7, 2 + WALL_H, 6, 6, ROOF_H + 4, { top: '#7A3F24', front: '#B45A34', back: '#B45A34', left: '#B45A34', right: '#96492A', noLine: true });
  const CHIM_TOP = 2 + WALL_H + ROOF_H + 4, chimX = hx + hw - 15, chimY = hy + 10;
  const smoke = [0, 1, 2].map(() => { const b = div('bb', { left: chimX + 'px', top: chimY + 'px' }); b.innerHTML = '<i class="puff"></i>'; return b; });
  // carport on the right side: driveway to the front edge, wooden pergola; the car arrives when the family moves in
  const cpX = hx + hw + 7, cpY = hy + 2, cpW = SW - (cpX - sx) - 6, cpD = 46;
  const carportG = group();
  div('plan drive', { left: cpX + 'px', top: cpY + 'px', width: cpW + 'px', height: (sy + SD - cpY) + 'px' }, carportG);
  [[0, 0], [cpW - 1.4, 0], [0, cpD - 1.4], [cpW - 1.4, cpD - 1.4]].forEach(([dx, dy]) => box(carportG, cpX + dx, cpY + dy, 0, 1.4, 1.4, 13, WOOD));
  box(carportG, cpX - 1, cpY - 1, 13, cpW + 2, cpD + 2, 1.2, { top: 'repeating-linear-gradient(0deg, #B98A62 0 1.6px, transparent 1.6px 4.5px)', front: '#8A5A3B', back: '#8A5A3B', left: '#8A5A3B', right: '#734A30', noLine: true });   // open pergola: the car shows through
  const carG = group();
  const CAR = { top: '#3F6FA6', front: '#2F5A8C', back: '#2F5A8C', left: '#2F5A8C', right: '#244A75', noLine: true };
  const GLASS = { top: '#A9C4DE', front: '#7E9DBE', back: '#7E9DBE', left: '#7E9DBE', right: '#6C8BAB', noLine: true };
  const carX = cpX + (cpW - 15) / 2, carY = cpY + 10;
  box(carG, carX, carY, 1.5, 15, 28, 5, CAR); box(carG, carX + 1.5, carY + 9, 6.5, 12, 12, 4, GLASS);
  // garden: a stone path from the door, shrubs, and the lawn tint on the lot
  const gardenG = group();
  [0, 1, 2, 3].forEach(k => div('plan stone', { left: (hx + 37 - k * 1.2) + 'px', top: (hy + hd + 15 + k * 7) + 'px', width: '6px', height: '4px' }, gardenG));
  [0, 1, 2].forEach(k => div('plan bed', { left: (hx + 4 + k * 12) + 'px', top: (sy + 8) + 'px', width: '8px', height: '14px' }, gardenG));   // vegetable beds behind the house
  [[hx + 6, hy + hd + 22], [hx + 64, hy + hd + 24], [hx + 50, sy + 9], [hx + 66, sy + 9]].forEach(([x, y]) => box(gardenG, x, y, 0, 6, 6, 5, { ...LEAF, top: '#7FBF9D' }));
  // pets arrive one by one (camera-facing flat drawings)
  const PETS = {
    dog: '<svg viewBox="0 0 30 22"><path d="M4 18v-7c0-2 1.5-3.5 3.5-3.5H18l2-4.5 3 1.5 2.5-1v4.5l-2 2.5V18h-3v-5h-9v5H8v-5l-2 1v4z" fill="#8A5A3B"/><circle cx="23.3" cy="6.4" r=".9" fill="#0B1B33"/><path d="M4 11 1.5 7" stroke="#8A5A3B" stroke-width="1.8" stroke-linecap="round"/></svg>',
    cat: '<svg viewBox="0 0 22 22"><path d="M5 20c-1-3-.5-7 2.5-9l-.5-5 3 2.5h3L16 6l-.5 5c3 2 3.5 6 2.5 9z" fill="#0B1B33"/><path d="M18 19c3 0 3.5-3 2-5" stroke="#0B1B33" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="10" cy="11.5" r=".7" fill="#E3B23C"/><circle cx="13" cy="11.5" r=".7" fill="#E3B23C"/></svg>',
    pup: '<svg viewBox="0 0 30 22"><path d="M6 18v-5c0-2 1.5-3 3-3h8l2-3.5 2.5 1 2-.5v3.5l-2 2V18h-2.5v-4h-6.5v4H9v-4l-1.5 1v3z" fill="#D9B48A"/><circle cx="22.2" cy="8.7" r=".8" fill="#0B1B33"/></svg>' };
  const pet = (kind, x, y, w) => { const b = div('bb', { left: x + 'px', top: y + 'px' }); b.innerHTML = `<div class="pet" style="width:${w}px">${PETS[kind]}</div>`; return { b, el: b.firstChild }; };
  const pets = [pet('dog', hx + 20, hy + hd + 22, 21), pet('cat', hx + 62, hy + hd + 8, 15), pet('pup', hx + 50, hy + hd + 30, 17)];
  const TOP = 2 + WALL_H + ROOF_H;
  const STAGES = [slabG, wallG, roofG, porchG, chimG, gardenG, carportG];   // stage k starts when instalment k+1 is paid
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

  const T0 = 1200, STEP = 2300, DUR = 1100, BUILD_DELAY = 900;
  const LOTS = PAY_ORDER.map((key, i) => { const done = T0 + (PAY_STEP[i] - 1) * STEP + STEP * .6;
    return { key, el: lotEl[key], pin: pins[i], fill: addFill(lotEl[key]), done, start: Math.max(T0 + 300 + i * 120, done - 2.8 * STEP), st: -1 }; });
  LOTS.push({ key: 'site', el: site, pin: sitePin, fill: addFill(site), start: 250, done: T0, st: -1 });
  let recaudo = 0, lastPct = '';
  const CYCLE = T0 + BUILD_DELAY + (NS - 1) * STEP + STEP * .45 + DUR + 6800;   // build, then ~5 s of the house being lived in
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
    const endT = T0 + BUILD_DELAY + (NS - 1) * STEP + STEP * .45 + DUR;
    // the house goes up one stage per paid instalment: slab, walls, roof, porch, chimney, garden
    const stageE = STAGES.map((g, k) => easeOut(clamp((t - (T0 + BUILD_DELAY + Math.min(k, NS - 1) * STEP + (k >= NS ? STEP * .45 : 0))) / DUR)));
    STAGES.forEach((g, k) => { const e = stageE[k]; put(g, 'visibility', e > .002 ? 'visible' : 'hidden');
      if (g === roofG) put(g, 'transform', `translateZ(${2 + WALL_H}px) scale3d(1,1,${Math.max(e, .002).toFixed(3)})`);
      else if (g === gardenG || g === slabG) put(g, 'transform', `scale3d(1,1,${Math.max(e, .002).toFixed(3)})`);
      else put(g, 'transform', `scale3d(1,1,${Math.max(e, .002).toFixed(3)})`); });
    built = stageE.reduce((a, b) => a + b, 0) * N / STAGES.length;
    // the car drives in from the front edge and parks under the carport
    const ce = easeIO(clamp((t - endT - 300) / 1400));
    put(carG, 'visibility', ce > 0 ? 'visible' : 'hidden'); put(carG, 'transform', `translate3d(0, ${(70 * (1 - ce)).toFixed(1)}px, 0)`);
    top = 2 * stageE[0] + WALL_H * stageE[1] + ROOF_H * stageE[2];
    for (let j = 0; j < NS; j++) if (t >= T0 + j * STEP) paid = j + 1;
    // lived in: lights come on window by window, smoke from the chimney, then the pets arrive
    wins.forEach((w, k) => cls(w, 'lit', t > endT + 200 + k * 260));
    cls(door, 'open', t > endT + 900);
    smoke.forEach((b, k) => { const ph = ((t - endT - 600 - k * 700) % 2100 + 2100) % 2100 / 2100, on = t > endT + 600 + k * 700;
      put(b, 'transform', `translateZ(${(CHIM_TOP + 2 + ph * 16).toFixed(1)}px) rotateZ(${(CAM_Z - rz).toFixed(2)}deg) rotateX(${(-(56 + ryv)).toFixed(2)}deg)`);
      put(b.firstChild, 'opacity', on ? (Math.sin(ph * Math.PI) * .75).toFixed(2) : '0'); put(b.firstChild, 'transform', `scale(${(.6 + ph * .9).toFixed(2)})`); });
    pets.forEach((p, k) => { const e = clamp((t - endT - 1400 - k * 1000) / 450), sc = e < 1 ? 1.15 * easeOut(e) : 1;
      put(p.b, 'transform', `translateZ(0px) rotateZ(${(CAM_Z - rz).toFixed(2)}deg) rotateX(${(-(56 + ryv)).toFixed(2)}deg)`);
      put(p.el, 'opacity', e > 0 ? '1' : '0'); put(p.el, 'transform', `scale(${sc.toFixed(3)})`); });
    cls(site, 'lawn', t > endT - 400);
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
      put(pins[i], 'transform', `translateZ(${(hz + 1).toFixed(1)}px) rotateZ(${(CAM_Z - rz).toFixed(2)}deg) rotateX(${(-(56 + ryv)).toFixed(2)}deg)`); });
    put(sitePin, 'transform', `translateZ(${(top + 2.5).toFixed(1)}px) rotateZ(${(CAM_Z - rz).toFixed(2)}deg) rotateX(${(-(56 + ryv)).toFixed(2)}deg)`);
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
    pickEdge(-CAM_Z + rz, CAM_X + ryv);                   // real scene rotation and camera tilt
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
