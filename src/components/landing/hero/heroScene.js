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
  // lots
  const sold = ['0,0', '3,0', '4,0', '0,3', '2,3', '3,3'], lotQueue = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
    if ((c >= 1 && c <= 4) && (r === 1 || r === 2) && c !== 0) continue;   // two large lots: the centre one and the right one
    const [x, y] = lotXY(c, r), isSold = sold.includes(c + ',' + r);
    lotQueue.push([x, y, isSold, c + ',' + r]);
  }
  const [sx, sy] = lotXY(1, 1), SW = LW * 2 + GAP, SD = LD * 2 + GAP;
  const site = div('site', { left: sx + 'px', top: sy + 'px', width: SW + 'px', height: SD + 'px' });
  const [s2x, s2y] = lotXY(3, 1);
  const site2 = div('site', { left: s2x + 'px', top: s2y + 'px', width: SW + 'px', height: SD + 'px' });
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
  // the board is a chunk of land: a thin, faint grass margin and a layer of earth underneath with a ragged, torn-off bottom.
  // Kept translucent and low in contrast so the eye stays on the lots and the house.
  const GM = 6, SOIL = 13;
  const SPECK = 'radial-gradient(circle at 30% 40%, rgba(70,45,25,.22) 0 .6px, transparent .8px) 0 0/5px 4px, radial-gradient(circle at 70% 70%, rgba(255,240,215,.25) 0 .5px, transparent .7px) 0 0/6px 5px, radial-gradient(circle, rgba(60,40,22,.18) 0 1.1px, transparent 1.3px) 2px 3px/11px 9px';
  const EARTH = dir => `${SPECK}, linear-gradient(${dir}, rgba(150,138,122,.5) 0 25%, rgba(165,130,96,.62) 25% 55%, rgba(150,112,78,.72) 55% calc(100% - 1.6px), rgba(126,160,110,.8) calc(100% - 1.6px))`;
  const soil = box(pl, -GM, -GM, -SOIL - 1.6,   // 1.6 px below the plan: no depth fighting (flicker) with the lots and roads
    PW + 2 * GM, PH + 2 * GM, SOIL, { top: 'rgba(170,198,152,.55)', front: EARTH('0deg'), back: EARTH('0deg'), left: EARTH('270deg'), right: EARTH('270deg'), noLine: true });
  // ragged bottom: the earth fades and breaks off irregularly (front/back run top -> bottom, sides run top -> right)
  const RAG_Y = 'polygon(0 15%, 9% 3%, 17% 17%, 26% 7%, 35% 20%, 44% 5%, 52% 14%, 61% 0, 70% 16%, 79% 4%, 87% 19%, 94% 8%, 100% 22%, 100% 100%, 0 100%)';   // element top = bottom of the block
  const RAG_X = 'polygon(22% 0, 100% 0, 100% 100%, 15% 100%, 3% 91%, 17% 83%, 7% 74%, 20% 65%, 5% 56%, 14% 48%, 0 39%, 16% 30%, 4% 21%, 19% 13%, 8% 6%)';   // element left = bottom of the block
  soil._faces.forEach((f, i) => { if (i === 1 || i === 4) f.style.clipPath = RAG_Y; else if (i === 2 || i === 3) f.style.clipPath = RAG_X; });
  // gable roof over a w x d footprint, ridge along x: two tiled slopes and the two end triangles
  // gable roof over a w x d footprint, ridge along x. Barrel tiles: rounded channels across the slope (light crest,
  // dark trough) and horizontal courses every few px; a darker eave edge and a rounded ridge cap on top.
  const TILE = (base, light, dark) => `repeating-linear-gradient(180deg, transparent 0 6.6px, rgba(60,20,8,.34) 6.6px 8px, rgba(255,255,255,.14) 8px 8.6px), repeating-linear-gradient(90deg, ${dark} 0 1.1px, ${base} 1.1px 3px, ${light} 3px 5.2px, ${base} 5.2px 7.6px, ${dark} 7.6px 9px)`;   // large barrel tiles: 9 px channels, 8.6 px courses
  const ROOF_A = 'repeating-linear-gradient(180deg, transparent 0 5.5px, rgba(60,20,8,.35) 5.5px 6.2px), repeating-linear-gradient(90deg, #7D3818 0 .4px, #B5552C .4px 1.1px, #CF6E42 1.1px 1.8px, #B5552C 1.8px 2.5px, #7D3818 2.5px 3.4px)', ROOF_B = ROOF_A;   // canal tiles under the covers
  const gableRoof = (parent, x, y, z, w, d, h, ov) => {
    const g = div('g', { transform: `translateZ(${z}px)` }, parent), half = d / 2 + ov, L = Math.hypot(half, h), a = Math.atan2(h, half) * 180 / Math.PI;
    // each slope is a slab TK thick: the tiled face, an underside, and edge faces folded toward the underside
    // (eave along the bottom, barge edges at both ends). sgn: which side of the rotated plane is "under" (+1 front, -1 back)
    const TK = 4, EDGE = 'repeating-linear-gradient(90deg, #7A3518 0 .9px, #A64B26 .9px 3.4px, #C2633A 3.4px 5.6px, #A64B26 5.6px 8px, #7A3518 8px 9px)';
    const slope = (bg, deg, sgn) => { const W = w + 2 * ov, Ls = L, el = div('f roof', { left: (x - ov) + 'px', top: (y + d / 2) + 'px', width: W + 'px', height: L + 'px', transformOrigin: '50% 0', transform: `translateZ(${h}px) rotateX(${deg}deg)`, background: bg, transformStyle: 'preserve-3d' }, g);
      const under = sgn > 0 ? -TK : TK;
      div('f', { left: '0px', top: '0px', width: W + 'px', height: L + 'px', transform: `translateZ(${under}px)`, background: '#8E4A2A' }, el);                          // underside
      div('f', { left: '0px', top: L + 'px', width: W + 'px', height: TK + 'px', transformOrigin: '50% 0', transform: `rotateX(${sgn > 0 ? -90 : 90}deg)`, background: EDGE }, el);   // eave edge
      [0, W].forEach(ex => div('f', { left: ex + 'px', top: '0px', width: TK + 'px', height: L + 'px', transformOrigin: '0 50%', transform: `rotateY(${sgn > 0 ? 90 : -90}deg)`, background: '#9A4A27' }, el));   // barge edges
      // Spanish (barrel) tiles, built one by one with real proportions (45 x 20 x 8 cm -> L : W : H ~ 5.6 : 2.5 : 1):
      // concave "canal" tiles lie in rows on the slab (the base stripes), convex "cover" tiles sit over the joints, each
      // course overlapping the one below. Tiles grow outward from the slab: +z on the front slope, -z on the back one.
      const tg = div('g', { transform: sgn > 0 ? 'none' : 'scale3d(1,1,-1)' }, el);
      const TW = 3.4, TL = 7.4, TH = 1.4, STEP_L = 6.2, cols = Math.floor(W / TW), rows = Math.ceil(Ls / STEP_L);
      const COVER = { top: 'linear-gradient(90deg, #8F4320 0%, #C9693D 22%, #F0A57A 48%, #D97B4C 70%, #8F4320 100%)', front: 'radial-gradient(ellipse at 50% 100%, #5E2A12 0 45%, #9A4A27 46%)', back: '#7A3518', left: '#93441F', right: '#7A3518', noLine: true };
      if (sgn > 0) for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {   // light tiles: crest + lower end only (2 nodes each)
        const y0 = r * STEP_L, d0 = Math.min(TL, Ls - y0); if (d0 < 2) continue;
        const z0 = .1 + (rows - r) * .05, x0 = c * TW + TW - .9;
        div('f', { left: x0 + 'px', top: y0 + 'px', width: '1.8px', height: d0 + 'px', transform: `translateZ(${(z0 + TH).toFixed(2)}px)`, background: COVER.top, borderRadius: '.9px' }, tg);
        div('f', { left: x0 + 'px', top: (y0 + d0) + 'px', width: '1.8px', height: TH + 'px', transformOrigin: '50% 0', transform: `translateZ(${z0.toFixed(2)}px) rotateX(90deg)`, background: COVER.front, borderRadius: '.9px .9px 0 0' }, tg); }
      return el; };
    const end = ex => div('f', { left: ex + 'px', top: y + 'px', width: h + 'px', height: d + 'px', transformOrigin: '0 50%', transform: 'rotateY(-90deg)', background: 'linear-gradient(90deg, #E9DFCB, #DCCDB2)', clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }, g);   // gable wall: exactly under the roof line
    end(x); end(x + w); slope(ROOF_B, -(180 - a), -1); slope(ROOF_A, -a, 1);
    const cap = div('g', { transform: `translateZ(${h + .2}px)` }, g);           // ridge cap: half-round tiles along the ridge
    div('f ridge', { left: (x - ov) + 'px', top: (y + d / 2 - 1.6) + 'px', width: (w + 2 * ov) + 'px', height: '3.2px' }, cap);
    return g; };
  const CURB = { front: '#C7C1B3', back: '#D3CDC0', left: '#D3CDC0', right: '#B9B2A3', noLine: true };
  const lotEl = {};
  lotQueue.forEach(([x, y, s, key]) => { lotEl[key] = div('plan ' + (s ? 'sold' : 'free'), { left: x + 'px', top: y + 'px', width: LW + 'px', height: LD + 'px' }); });
  // each sold lot turns green when its buyer is up to date: one lot per step, the last step closes two
  const PAY_ORDER = ['0,0', '3,0', '4,0', '0,3', '2,3', '3,3'], PAY_STEP = [2, 3, 3, 5, 6, 6];
  const PIN = '<div class="pin p1"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#E3B23C" stroke="#fff" stroke-width="1.6"/><text x="10" y="14.3" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" font-family="Inter, system-ui, sans-serif">&#36;</text></svg><i></i></div>'
    + '<div class="pin p2"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#0FA37F" stroke="#fff" stroke-width="1.6"/><path d="M5.9 10.3l2.7 2.7 5.5-5.9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><i></i></div>';
  const pins = PAY_ORDER.map(key => { const [c, r] = key.split(',').map(Number), [x, y] = lotXY(c, r);
    const g = div('bb', { left: (x + LW / 2) + 'px', top: (y + LD / 2) + 'px' }); g.innerHTML = PIN; return g; });
  const sitePin = div('bb', { left: (sx + SW / 2) + 'px', top: (sy + SD / 2) + 'px' }); sitePin.innerHTML = PIN;   // rides on the growing roof
  const site2Pin = div('bb', { left: (s2x + SW / 2) + 'px', top: (s2y + SD / 2) + 'px' }); site2Pin.innerHTML = PIN;
  const addFill = el => { const f = document.createElement('i'); f.className = 'lfill'; el.appendChild(f); return f; };
  const QUOTAS = 6;                                                    // instalments drawn per lot
  // sidewalk around the tower site (plan outline)
  const PAVE = { ...CURB, top: 'repeating-linear-gradient(90deg, rgba(11,27,51,.07) 0 .5px, transparent .5px 5px), repeating-linear-gradient(0deg, rgba(11,27,51,.07) 0 .5px, transparent .5px 5px), #ECE9E2' }, RW = 11;
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
  const WALL = { top: '#FBF8F1', front: '#FFFAF0', back: '#E8DFCC', left: '#DCCDB2', right: '#CBBB9C' };
  const STONE = { top: '#B7AA92', front: '#A99C85', back: '#A99C85', left: '#9C8F78', right: '#8E826C', noLine: true };
  const WOOD = { top: '#B98A62', front: '#8A5A3B', back: '#8A5A3B', left: '#8A5A3B', right: '#734A30', noLine: true };
  // Scale: 1 m ≈ 4.4 px (a 2.1 m door is 9.3 px). Doors, windows, walls, car and figures all follow it, in both houses.
  const M = 4.4;
  const WIN_W = 2.1 * M, WIN_H = 1.6 * M, SILL = .7 * M;              // one window size for every house: 2.1 x 1.6 m, sill at 0.7 m
  const HOUSE_LOTS = { '3,3': 0 };                 // lot key -> house group
  Object.keys(HOUSE_LOTS).forEach(k => { const [c, r] = k.split(',').map(Number), [x, y] = lotXY(c, r);
    // small country house, same language as the main one: stone plinth, white walls with windows (glass reflection),
    // a door with a step, chimney and a barrel-tile roof; a tree beside it
    const g = group(); g.classList.add('round');
    const X = x + 12, Y = y + 14, W = 40, D = 26;
    box(g, X - 2, Y - 2, 0, W + 4, D + 4, 2.2, { ...STONE, top: '#D9D3C6' });
    const hb = box(g, X, Y, 2.2, W, D, 12.8, WALL);
    const wn = (face, l, t, w, h) => { const el = document.createElement('i'); el.className = 'win lit'; Object.assign(el.style, { left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px' }); face.appendChild(el); };
    [3.5, W - 3.5 - WIN_W].forEach(l => wn(hb._front, l, SILL, WIN_W, WIN_H)); [D / 2 - WIN_W / 2].forEach(tp => { wn(hb._faces[2], SILL, tp, WIN_H, WIN_W); wn(hb._faces[3], SILL, tp, WIN_H, WIN_W); });
    const dr = document.createElement('i'); dr.className = 'hdoor'; Object.assign(dr.style, { left: (W / 2 - 1.15 * M / 2) + 'px', top: '0px', width: (1.15 * M) + 'px', height: (2.1 * M) + 'px' }); hb._front.appendChild(dr);
    box(g, X + W / 2 - 4, Y + D, 0, 8, 3.4, 2.2, { ...WOOD, top: '#B98A62' }); box(g, X + W / 2 - 3, Y + D + 3.4, 0, 6, 2, 1.1, { ...WOOD, top: '#B98A62' });
    box(g, X + W - 10, Y + 5, 15, 4, 4, 10, { top: '#7A3F24', front: '#B45A34', back: '#B45A34', left: '#B45A34', right: '#96492A', noLine: true });
    gableRoof(g, X, Y, 15, W, D, 9, 2.6);
    g.style.visibility = 'hidden'; HOUSE_LOTS[k] = g; });
  const HOUSE_H = 24, HOUSE_DELAY = 500, HOUSE_DUR = 520;
  // trees as plan symbols
  const tree = (x, y, s = 1) => { const g = group(); div('plan tree', { left: x + 'px', top: y + 'px', width: (9 * s) + 'px', height: (9 * s) + 'px' }, g); return g; };   // plan symbol
  const trees = [];                                             // the big lot keeps a clean plan (no inner outlines)

  // country houses (casa campestre): built in stages with no scaffolding, then lived in little by little.
  // Everything is soft and rounded: round bushes and tree canopies, rounded car, pets and people as flat drawings.
  const PICKX = 'linear-gradient(#FFFFFF 0 .5px, #BDB3A1 .5px 1px, transparent 1.1px calc(100% - 1.6px), #BDB3A1 calc(100% - 1.5px) calc(100% - 1px), #FFFFFF calc(100% - 1px)), repeating-linear-gradient(90deg, #C2B9A8 0 .35px, #FFFFFF .35px 1.7px, #C2B9A8 1.7px 2.05px, transparent 2.05px 3.6px)';
  const PICKY = 'linear-gradient(90deg, #FFFFFF 0 .5px, #BDB3A1 .5px 1px, transparent 1.1px calc(100% - 1.6px), #BDB3A1 calc(100% - 1.5px) calc(100% - 1px), #FFFFFF calc(100% - 1px)), repeating-linear-gradient(180deg, #C2B9A8 0 .35px, #FFFFFF .35px 1.7px, #C2B9A8 1.7px 2.05px, transparent 2.05px 3.6px)';
  const bills = [];                                                // camera-facing items: { b, z }
  const bill = (x, y, z, html) => { const b = div('bb', { left: x + 'px', top: y + 'px' }); b.innerHTML = html; bills.push({ b, z }); return b.firstChild; };
  const SVG = {
    // side-view figure with joints: hip -> knee -> foot and shoulder -> elbow; each limb is a group rotated around its joint
    // side-view figure, ~7.5 heads tall: shoulders, chest and hips; thigh -> shin -> shoe and upper arm -> forearm -> hand,
    // each limb a group rotated around its joint (hip 9,20 · knee 9,27 · shoulder 9,11.6 · elbow 9,16.8)
    person: (shirt, o = {}) => { const skin = o.skin || '#E2B48F', pants = o.pants || '#33415A', hair = o.hair || '#3B2A20';
      const leg = (k, c) => `<g class="thigh ${k}" style="transform-origin:9px 20px"><path d="M9 20v7" stroke="${c}" stroke-width="3.9" stroke-linecap="round"/>`
        + `<g class="shin" style="transform-origin:9px 27px"><path d="M9 27v5.4" stroke="${c}" stroke-width="3.3" stroke-linecap="round"/>`
        + `<path d="M7.6 33.1h4.6a1.2 1.2 0 0 0 0-2.2H9.4" fill="#2A2420"/><path d="M7.4 33.6h5.2" stroke="#F1ECE4" stroke-width=".5" stroke-linecap="round"/></g></g>`;
      const arm = (k, c, sk) => `<g class="uarm ${k}" style="transform-origin:9px 11.6px"><path d="M9 11.6v5.2" stroke="${c}" stroke-width="2.9" stroke-linecap="round"/>`
        + `<g class="farm" style="transform-origin:9px 16.8px"><path d="M9 16.8v4" stroke="${sk}" stroke-width="2.3" stroke-linecap="round"/><ellipse cx="9.3" cy="21.5" rx="1.25" ry="1.45" fill="${sk}"/></g></g>`;
      return `<svg viewBox="0 0 18 36" class="fig"><ellipse cx="9.6" cy="34.4" rx="5.4" ry="1.1" fill="rgba(11,27,51,.2)"/>`
        + `<g class="body">${leg('b', o.pantsB || '#26324A')}${arm('b', o.shirtB || shirt, skin)}`
        + `<path d="M6.4 11.2C6.6 9.9 7.7 9.3 9 9.3h.9c1.6 0 2.7.9 2.9 2.4l.4 6.4c.1 1.3-.3 2.1-1.3 2.4H6.9c-.9-.3-1.2-1-1.1-2z" fill="${shirt}"/>`
        + `<path d="M6.2 19.6h6.7v1.2H6.2z" fill="${o.belt || '#5E3B24'}"/><path d="M11.6 10.2c.6 2 .7 4.6.4 7.6" stroke="rgba(0,0,0,.12)" stroke-width="1" fill="none"/>`
        + `<rect x="8.3" y="7.3" width="2.4" height="2.6" rx="1.1" fill="${skin}"/><g class="head" style="transform-origin:9.5px 8.6px">`
        + `<ellipse cx="9.7" cy="4.9" rx="3.3" ry="3.6" fill="${skin}"/><path d="M12.8 4.6l.9 1.2-.8.4" fill="${skin}"/><ellipse cx="8.4" cy="5.2" rx=".75" ry=".95" fill="#D49E7A"/>`
        + `<circle cx="11.6" cy="4.3" r=".42" fill="#2A2420"/><path d="M11.1 3.4h1" stroke="${hair}" stroke-width=".4" stroke-linecap="round"/><path d="M11.4 6.6q.6.25 1-.1" stroke="#9A5B45" stroke-width=".4" fill="none" stroke-linecap="round"/>`
        + `<path d="${o.long ? 'M6.1 5.6C5.5 1.9 7.6.9 9.6 1c2.3.1 3.6 1.3 3.5 2.9-1.3-.5-2.7-.7-4-.5-.6 1.6-.6 4.1-.1 7.4-.9 0-1.6-.3-2.2-1.1-.7-1-.8-2.5-.7-4.1z' : 'M6.2 5.5C6 2.3 7.8 1.2 9.7 1.3c2.2.1 3.4 1.2 3.3 2.7-1.2-.4-2.6-.6-3.9-.4-.5.6-.8 1.4-.9 2.4-.6-.4-1.3-.4-1.9-.5z'}" fill="${hair}"/>`
        + `</g>${leg('f', pants)}${arm('f', shirt, skin)}</g></svg>`; },
    dog: (c, d = 'rgba(0,0,0,.22)') => { const op = back => back ? ' opacity=".72"' : '';
      // leg skeleton: hip (x, 13) -> knee (x, 17.2) -> paw; the lower leg is a child group that bends at the knee
      const leg = (k, x, back) => `<g class="paw ${k}" style="transform-origin:${x}px 13px"><path d="M${x} 13v4.2" stroke="${c}" stroke-width="3" stroke-linecap="round"${op(back)}/>`
        + `<g class="lpaw" style="transform-origin:${x}px 17.2px"><path d="M${x} 17.2v3.6" stroke="${c}" stroke-width="2.5" stroke-linecap="round"${op(back)}/><ellipse cx="${x + .7}" cy="21.1" rx="1.8" ry=".95" fill="${c}"${op(back)}/></g></g>`;
      return `<svg viewBox="0 0 34 24" class="fig"><ellipse cx="17" cy="22.6" rx="11" ry="1.1" fill="rgba(11,27,51,.18)"/><g class="body">`
        + leg('b0', 9, 1) + leg('b1', 23, 1)
        + `<path class="tail" style="transform-origin:6.5px 10.5px" d="M6.5 10.5C3.5 9.5 2.6 7 3.4 4.6" stroke="${c}" stroke-width="2.3" fill="none" stroke-linecap="round"/>`
        + `<path d="M6 11.2C6 8.6 8 7.6 10.6 7.6h10.6c2.5 0 4 1.3 4.2 3.4l.2 2.2c.1 1.6-1 2.6-2.6 2.6H9.6C7.4 15.8 6 14 6 11.2z" fill="${c}"/>`
        + `<path d="M9 14.6h12.4" stroke="${d}" stroke-width="1.2" stroke-linecap="round"/>`
        + `<g class="dhead" style="transform-origin:23px 10px"><path d="M22.4 9.6c.2-2.4 1.2-4 3.1-4.4 1.6-.3 3 .3 3.8 1.5l2.6.6c.9.2 1.3.9 1.1 1.7-.2.8-.9 1.2-1.8 1.2h-3.4c-.9 1.2-2.3 1.8-3.9 1.6z" fill="${c}"/>`
        + `<path class="ear" style="transform-origin:25px 6px" d="M25.1 5.9c-1.1.4-1.6 1.7-1.3 3.4.8.4 1.6.3 2.1-.3.3-1.3.1-2.4-.8-3.1z" fill="${d}"/>`
        + `<circle cx="27.6" cy="7.4" r=".75" fill="#1F1712"/><ellipse cx="32.7" cy="8.6" rx=".85" ry=".7" fill="#1F1712"/><path d="M31 10.6q1 .9 2 .3" stroke="#C0504D" stroke-width=".7" fill="none" stroke-linecap="round" class="tongue"/></g>`
        + leg('f0', 11, 0) + leg('f1', 21, 0) + `</g></svg>`; },
    cat: `<svg viewBox="0 0 24 24"><path d="M17 20q5 0 4.5-6" stroke="#33415A" stroke-width="2.2" fill="none" stroke-linecap="round"/><ellipse cx="11" cy="17" rx="6.5" ry="5.6" fill="#33415A"/><circle cx="11" cy="9" r="4.7" fill="#33415A"/><path d="M7.1 6.7 6.9 2.4l3.2 2.4zM14.9 6.7l.2-4.3-3.2 2.4z" fill="#33415A"/><circle cx="9.3" cy="9" r=".95" fill="#E3B23C"/><circle cx="12.7" cy="9" r=".95" fill="#E3B23C"/></svg>`,
    bush: d => `<i class="bush" style="width:${d}px;height:${d}px"></i>`,
    flower: c => `<svg class="flw" viewBox="0 0 12 12" style="width:3.2px"><path d="M6 12V6.5M6 9.4 3.6 7.6M6 8.8l2.4-1.6" stroke="#4E8A4A" stroke-width=".9" stroke-linecap="round"/><ellipse cx="3.4" cy="7.6" rx="1.6" ry=".9" fill="#5E9B57"/><ellipse cx="8.6" cy="7" rx="1.6" ry=".9" fill="#6FAF5A"/>`
      + [[6, 4.2], [3.6, 5.2], [8.4, 4.8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="${c}"/><circle cx="${x}" cy="${y}" r=".55" fill="#F7D24A"/>`).join('') + '</svg>',
    // hammock on a wooden A-frame stand: about 2.2 m long, so it reads next to a 1.75 m person
    // hammock on a wooden stand (side view): two splayed A-legs on a base beam, curved arms up to the hooks,
    // ropes fanning to spreader bars, a striped fabric bed that sags in a catenary, and a small pillow
    hammock: w => `<svg class="flw" viewBox="0 0 40 16" style="width:${w}px"><ellipse cx="20" cy="15.3" rx="16" ry=".8" fill="rgba(11,27,51,.16)"/>`
      + `<path d="M5 15h30" stroke="#7A4F33" stroke-width="1.3" stroke-linecap="round"/>`
      + `<path d="M7 15C5.5 10.5 3.8 6 2.6 2.4M33 15c1.5-4.5 3.2-9 4.4-12.6" stroke="#8A5A3B" stroke-width="1.3" fill="none" stroke-linecap="round"/>`
      + `<path d="M7 15 9.2 12M33 15l-2.2-3" stroke="#734A30" stroke-width="1" stroke-linecap="round"/>`
      + `<circle cx="2.6" cy="2.4" r=".55" fill="#C9CFD6"/><circle cx="37.4" cy="2.4" r=".55" fill="#C9CFD6"/>`
      + `<path d="M2.8 2.6 8 6.3M2.8 2.6 8 8.4M37.2 2.6 32 6.3M37.2 2.6 32 8.4" stroke="#CDBA94" stroke-width=".35"/>`
      + `<path d="M8 5.8v3M32 5.8v3" stroke="#8A5A3B" stroke-width=".8" stroke-linecap="round"/>`
      + `<path d="M8 6.2Q20 15.5 32 6.2V8.6Q20 17.4 8 8.6z" fill="#E8DCC0"/>`
      + `<path d="M8 6.9Q20 16.2 32 6.9" stroke="#5E97BD" stroke-width=".8" fill="none"/><path d="M8 7.8Q20 17 32 7.8" stroke="#E3B23C" stroke-width=".6" fill="none"/>`
      + `<path d="M8 6.2Q20 15.5 32 6.2" stroke="rgba(120,90,55,.45)" stroke-width=".35" fill="none"/>`
      + `<ellipse cx="11.6" cy="9.2" rx="2.2" ry="1" fill="#FFFFFF" transform="rotate(26 11.6 9.2)"/></svg>`,
    mailbox: w => `<svg class="flw" viewBox="0 0 10 14" style="width:${w}px"><ellipse cx="5" cy="13.5" rx="3" ry=".5" fill="rgba(11,27,51,.16)"/><path d="M5 13.4V7" stroke="#8A5A3B" stroke-width="1.2" stroke-linecap="round"/><path d="M1 7V4.4a3 3 0 0 1 6 0V7z" fill="#5B6B7E"/><path d="M1.6 6.4V4.6a2.4 2.4 0 0 1 4.8 0v1.8" stroke="#7E8EA2" stroke-width=".5" fill="none"/><path d="M7.4 6.6V1.4l2.2.9-2.2.9" fill="#D94A3A" stroke="#B53A2C" stroke-width=".3"/></svg>`,
    tree: d => `<svg class="flw" viewBox="0 0 20 26" style="width:${d}px"><ellipse cx="10" cy="25.2" rx="6" ry="1" fill="rgba(11,27,51,.18)"/><path d="M9 25V15h2v10z" fill="#7A6A57"/><circle cx="10" cy="10" r="8.6" fill="#6FAF8E"/><circle cx="7.4" cy="7.2" r="4.2" fill="#9ED3B4" opacity=".55"/><path d="M3 12a8.6 8.6 0 0 0 14 4" stroke="#4E8A6D" stroke-width="2.4" fill="none" opacity=".45"/></svg>`,
    canopy: d => `<i class="bush tree-c" style="width:${d}px;height:${d}px"></i>` };
  const actor = (x, y, svg, w) => bill(x, y, 0, `<div class="pet" style="width:${w}px">${svg}</div>`);
  const fence = (parent, x, y, w, d, gaps) => {                       // white picket fence on the lot edge; gaps = [[x1, x2], ...] on the front side
    const H = 5, fx = (x1, x2, yy) => { if (x2 - x1 > 1) box(parent, x1, yy, 0, x2 - x1, .6, H, { top: '#FDFBF6', front: PICKX, back: PICKX, left: '#FDFBF6', right: '#FDFBF6', noLine: true }); };
    const fy = (y1, y2, xx) => box(parent, xx, y1, 0, .6, y2 - y1, H, { top: '#FDFBF6', front: '#FDFBF6', back: '#FDFBF6', left: PICKY, right: PICKY, noLine: true });
    fx(x, x + w, y); fy(y, y + d, x); fy(y, y + d, x + w - .6);
    let cx0 = x; gaps.forEach(([g1, g2]) => { fx(cx0, g1, y + d - .6); cx0 = g2; }); fx(cx0, x + w, y + d - .6); };
  function countryHouse(ox, oy, o) {
    // storeys of 2.9 m (12.8 px) on a 0.5 m stone base; the main house has two floors, which is why it stands taller
    const FLOOR = 12.8, BASE = 2.2, floors = o.floors || 1, WH = FLOOR * floors;
    const FI = 6;                                                     // fence inset: a strip of lawn stays outside the fence
    const hx = ox + 14, hy = oy + 15, hw = o.hw, hd = 44, WALL_H = BASE + WH, ROOF_H = 16, wins = [], st = [];
    const stage = (z = 0) => { const g = group(); g.classList.add('round'); st.push({ g, z }); return g; };
    const g0 = stage(); box(g0, hx - 3, hy - 3, 0, hw + 6, hd + 6, .8, { ...STONE, top: '#D9D3C6' }); box(g0, hx - .6, hy - .6, .8, hw + 1.2, hd + 1.2, BASE - .8, STONE);
    const g1 = stage(BASE); const walls = box(g1, hx, hy, 0, hw, hd, WH, WALL);
    const win = (face, l, t, w, h) => { const el = document.createElement('i'); el.className = 'win'; Object.assign(el.style, { left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px' }); face.appendChild(el); wins.push(el); };
    // on a wall face, `top` is the height above the floor: sills at 0.9 m, door on the floor
    const fw = hw / 2;
    for (let f = 0; f < floors; f++) {
      const z0 = f * FLOOR + SILL;
      [fw - 27, fw + 17].forEach(l => win(walls._front, l, z0, WIN_W, WIN_H));                // two large windows, one each side of the door
      [hd / 2 - WIN_W / 2].forEach(tp => { win(walls._faces[2], z0, tp, WIN_H, WIN_W); win(walls._faces[3], z0, tp, WIN_H, WIN_W); });   // one per side (x runs up the wall)
    }
    if (floors > 1) div('f band', { left: '0px', top: (FLOOR - .5) + 'px', width: hw + 'px', height: '1px' }, walls._front);   // floor line between storeys
    const door = document.createElement('i'); door.className = 'hdoor'; Object.assign(door.style, { left: (fw - 1.15 * M / 2) + 'px', top: '0px', width: (1.15 * M) + 'px', height: (2.1 * M) + 'px' }); walls._front.appendChild(door);
    // 3D door leaf hinged on the left jamb: closed it covers the opening (warm interior behind), it swings out when they arrive
    door.classList.add('opening');
    const DW = 1.15 * M, DH = 2.1 * M, leaf = div('g', { transform: `translate3d(${hx + fw - DW / 2}px, ${hy + hd + .15}px, 0px)`, transformOrigin: '0 0' }, g1);
    const lb = box(leaf, 0, 0, 0, DW, .55, DH, { top: '#8A5A3B', front: 'linear-gradient(180deg, #9C6B45, #7E5134)', back: '#6E4529', left: '#734A30', right: '#734A30', noLine: true });
    const knob = document.createElement('i'); knob.className = 'knob'; knob.style.left = (DW - 1.4) + 'px'; knob.style.top = (DH * .45) + 'px'; lb._front.appendChild(knob);
    gableRoof(g1, hx, hy, WH, hw, hd, ROOF_H, 4);   // the roof rises with the walls, in one go
    const g3 = stage(); box(g3, hx + hw - 18, hy + 7, WALL_H, 6, 6, ROOF_H + 4, { top: '#7A3F24', front: '#B45A34', back: '#B45A34', left: '#B45A34', right: '#96492A', noLine: true });
    box(g3, hx + fw - 7, hy + hd, 0, 14, 5, BASE, WOOD); box(g3, hx + fw - 5, hy + hd + 5, 0, 10, 2.6, BASE / 2, WOOD);   // entrance landing at floor level and one step, no roof
    const g4 = stage(); const gate = hx + fw - 3;
    // entrance: a flagstone path from the gate to the door step, framed by two stone pillars with lanterns and an open wooden gate
    // walkway (andén) 1.6 m wide all around the house, the front path joins it; flower beds 0.6 m deep along the facade
    // and both edges of the path (flowers ~0.3-0.5 m tall: dots of about 1 px, well below a person's knee)
    const WK = 7, pathTop = hy + hd + WK, pathBot = oy + SD - 2, PWD = 13;
    div('plan path walkway', { left: (hx - WK) + 'px', top: (hy - WK) + 'px', width: (hw + 2 * WK) + 'px', height: (hd + 2 * WK) + 'px' }, g4);
    div('plan path entry', { left: (gate - 2.5) + 'px', top: (hy + hd) + 'px', width: PWD + 'px', height: (oy + SD - hy - hd) + 'px' }, g4);   // from the house to the street
    // flower beds only along the facade, either side of the entrance: a low planter (0.3 m) with standing flowering
    // shrubs (0.4-0.6 m, camera-facing), well below a person's knee
    const flowers = [];
    const planter = (x0, x1) => { const y0 = hy + hd + .2, w0 = x1 - x0;
      box(g4, x0, y0, 0, w0, 3, 1.3, { top: 'radial-gradient(rgba(60,40,25,.35) .4px, transparent .6px) 0 0/1.6px 1.4px, #6B4A33', front: '#C9BEA8', back: '#BFB39C', left: '#B3A790', right: '#A69A83', noLine: true });
      for (let fx = x0 + 2; fx < x1 - 1.5; fx += 3.3) flowers.push(bill(fx, y0 + 1.6, 1.3, SVG.flower(['#F25C78', '#FFD25A', '#FFFFFF', '#9B7BEA', '#FF8A4C'][Math.round(fx) % 5]))); };
    planter(hx + 1, gate - 4.5); planter(gate - 2.5 + PWD + 2, hx + hw - 1);
    const PIL = { top: '#E4DCCB', front: 'repeating-linear-gradient(180deg, #CFC4AE 0 2.6px, #B9AD95 2.6px 3px)', back: '#C9BEA8', left: '#C2B69F', right: '#ADA08A', noLine: true };
    const CAP = { top: '#F1ECE1', front: '#D9D1C0', back: '#D9D1C0', left: '#D9D1C0', right: '#C4BBA8', noLine: true };
    const LAN = { top: '#2E3440', front: 'linear-gradient(180deg, #2E3440 0 20%, #FFE7A6 20% 80%, #2E3440 80%)', back: '#FFE7A6', left: '#FFE7A6', right: '#F3D58A', noLine: true };
    const gy = oy + SD - FI - 2.2;
    [gate - 5.2, gate + 10.2].forEach(px => { box(g4, px, gy, 0, 3.4, 3.4, 9, PIL); box(g4, px - .5, gy - .5, 9, 4.4, 4.4, 1, CAP); box(g4, px + .7, gy + .7, 10, 2, 2, 2.6, LAN); });
    const GATE = { top: '#9C6B45', front: 'repeating-linear-gradient(90deg, #8A5A3B 0 1px, #A8774F 1px 1.9px)', back: 'repeating-linear-gradient(90deg, #8A5A3B 0 1px, #A8774F 1px 1.9px)', left: '#734A30', right: '#734A30', noLine: true };
    [[gate - 1.8, 1], [gate + 10.2, -1]].forEach(([hx0, sgn]) => { const leaf = div('g', { transform: `translate3d(${hx0}px, ${gy + 1.5}px, 0) rotateZ(${sgn * -68}deg)`, transformOrigin: '0 0' }, g4);
      box(leaf, sgn > 0 ? 0 : -6.2, -.3, .6, 6.2, .6, 6.2, GATE); });                     // gate leaves, swung open inward
    // rural mailbox outside the fence, beside the gate: a wooden post with a rounded box and a red flag (1.1 m tall)
    bill(gate + 16.5, gy + 5.5, 0, SVG.mailbox(4.4));
    fence(g4, ox + FI, oy + FI, SW - 2 * FI, SD - 2 * FI, [[gate - 5.2, gate + 13.6], ...(o.carport ? [[o.cpX, o.cpX + o.cpW]] : [])]);
    const hammockEl = bill(hx + hw - 18, hy + hd + 17, 0, SVG.hammock(14));   // next to the bush, same scale as the people
    const greens = [[hx + hw - 4, hy + hd + 16, 9]].map(([x, y, d]) => bill(x, y, 0, SVG.bush(d)));
    const trees = [[ox + 12, oy + SD - 16]].map(([x, y]) => bill(x, y, 0, SVG.tree(17)));   // trunk + canopy in one drawing
    const H = { st, wins, door, leaf, greens: [...greens, ...trees, ...flowers, hammockEl], top: WALL_H + ROOF_H, chim: [hx + hw - 15, hy + 10, WALL_H + ROOF_H + 4], hx, hy, hw, hd, gate };
    if (o.carport) {                                                  // driveway with the car near the gate, and a pool behind it
      const cg = stage(); const DY = hy + 2, PD = 44, DECK = 4;                          // a long lap pool (about 10 m)
      const CAR_Y = DY + PD + 14;                                                    // the car parks right after the pool deck
      div('plan gravel', { left: (o.cpX - DECK) + 'px', top: (DY - 1) + 'px', width: (o.cpW + DECK) + 'px', height: (CAR_Y - DY - 2) + 'px' }, cg);   // pool deck / leisure area
      // rural driveway: two worn wheel tracks (0.4 m wide, 1.5 m apart) from the parking spot out to the street
      { const tw = 2.8, gauge = 1.5 * M, tx = o.cpX + o.cpW / 2 - gauge / 2 - tw / 2;
        [tx, tx + gauge].forEach(x0 => div('plan track', { left: x0 + 'px', top: CAR_Y + 'px', width: tw + 'px', height: (oy + SD - CAR_Y) + 'px' }, cg)); }
      // two sun loungers (0.7 x 1.9 m): a white frame with legs, a blue cushion, and a raised backrest facing the pool
      const LF = { top: '#FFFFFF', front: '#E4E1D9', back: '#E4E1D9', left: '#DCD8CE', right: '#C9C4B8', noLine: true };
      const CUSH = { top: '#7FB6D9', front: '#5E97BD', back: '#5E97BD', left: '#6AA3C9', right: '#4F86AB', noLine: true };
      [o.cpX + 3, o.cpX + 12].forEach(lx => { const ly = DY + PD + 3;
        [[0, 0], [2.6, 0], [0, 7.6], [2.6, 7.6]].forEach(([dx, dy]) => box(cg, lx + dx, ly + dy, 0, .5, .5, 1.2, LF));
        box(cg, lx, ly + 2.6, 1.2, 3.1, 5.6, .5, LF); box(cg, lx + .2, ly + 2.8, 1.7, 2.7, 5.2, .5, CUSH);
        const back = div('g', { transform: `translate3d(${lx}px, ${ly + 2.6}px, 1.7px) rotateX(-58deg)`, transformOrigin: '0 0' }, cg);
        box(back, 0, -2.8, 0, 3.1, 2.8, .5, CUSH); });
      // pool 6 x 7.5 m: stone coping, recessed water with a light ripple, a small ladder
      const COP = { top: '#EFEBE2', front: '#D8D1C2', back: '#D8D1C2', left: '#D8D1C2', right: '#C7BFAE', noLine: true };
      box(cg, o.cpX + 1, DY + 1, 0, o.cpW - 2, PD, 1, COP);
      div('f water', { left: (o.cpX + 2.6) + 'px', top: (DY + 2.6) + 'px', width: (o.cpW - 5.2) + 'px', height: (PD - 3.2) + 'px', transform: 'translateZ(1.05px)' }, cg);
      box(cg, o.cpX + o.cpW - 6, DY + 2.2, 1.2, .5, .5, 3, { top: '#C9CFD6', front: '#AEB6C0', back: '#AEB6C0', left: '#AEB6C0', right: '#97A0AB', noLine: true });
      box(cg, o.cpX + o.cpW - 4, DY + 2.2, 1.2, .5, .5, 3, { top: '#C9CFD6', front: '#AEB6C0', back: '#AEB6C0', left: '#AEB6C0', right: '#97A0AB', noLine: true });
      const car = group(cg); car.classList.add('round');
      const CAR = { top: '#4C7DB5', front: '#3A679C', back: '#3A679C', left: '#3A679C', right: '#2D5482', noLine: true };
      const GL = { top: 'linear-gradient(135deg, #CFE0F0, #8FB0D2 55%, #E8F1FA 57%, #8FB0D2 62%)', front: 'linear-gradient(120deg, #9DBAD8, #6E90B5 50%, #D8E6F3 53%, #6E90B5 58%)', back: '#6E90B5', left: '#7E9EC0', right: '#6584A6', noLine: true };
      const WH = { top: '#1F2937', front: '#111827', back: '#111827', left: '#111827', right: '#0B1220', noLine: true };
      const CW = 1.8 * M, CL = 4.5 * M, cx = o.cpX + (o.cpW - CW) / 2, cy = CAR_Y + 3;          // car to scale: 1.8 x 4.5 x 1.5 m
      [[-.3, 3], [CW - .9, 3], [-.3, CL - 6.2], [CW - .9, CL - 6.2]].forEach(([dx, dy]) => box(car, cx + dx, cy + dy, .2, 1.2, 3.2, 2.4, WH));
      const body = box(car, cx, cy, 1, CW, CL, 3, CAR); box(car, cx + .6, cy + 5, 4, CW - 1.2, 9, 2.4, GL); box(car, cx + .8, cy + 5.3, 6.4, CW - 1.6, 8.4, .4, CAR);
      [1, CW - 2.6].forEach(l => { const hl = document.createElement('i'); hl.className = 'hlamp'; hl.style.left = l + 'px'; body._front.appendChild(hl); });
      H.car = car;
    }
    return H;
  }
  const cpX = sx + 14 + 76 + 10, cpW = SW - 100 - 8;
  const HM = countryHouse(sx, sy, { hw: 76, carport: true, cpX, cpW });
  // the family and pets walk along routes on the front yard (ground coordinates); they appear during the build
  const yard = { gx: HM.gate + 3.5, door: HM.hy + HM.hd + 9, front: sy + SD - 9, l: HM.hx + 6, r: HM.hx + HM.hw - 6 };
  // Script (what each one does; they walk only to get somewhere, then stay):
  //  1. The buyer arrives at the gate as the house pops up, walks halfway up the path and stops to look at his house.
  //  2. The dog shows up behind him and trots to his side, then sits wagging its tail.
  //  3. His wife and son come in through the gate and walk to meet him; the three stand together in front of the house.
  //  4. When the lights come on, the father walks to the door; the boy runs a few steps on the lawn with the puppy and they stop.
  //  5. The cat waits by the door.
  // Steps: ['at', x, y] place, ['walk', x, y] walk there, ['wait', ms] stand still, ['face', 1 | -1] turn (screen right / left).
  const actorOf = (svg, w, steps, speed, at) => { const el = actor(steps[0][1], steps[0][2], svg, w); return { el, b: el.parentElement, fig: el.querySelector('svg'), steps, speed, at, x0: steps[0][1], y0: steps[0][2] }; };
  const P = (dx, dy) => [yard.gx + dx, yard.door + dy];
  const actors = [
    actorOf(SVG.person('#3F6FA6', { pants: '#2F3B4E', pantsB: '#243045', shirtB: '#335C8C' }), 3.49,
      [['at', ...P(0, 34)], ['walk', ...P(0, 18)], ['face', -1], ['wait', 99999]], 7, 'buyer'),
    actorOf(SVG.dog('#8A5A3B'), 4.28, [['at', ...P(-2, 38)], ['walk', ...P(-9, 20)], ['face', 1], ['wait', 99999]], 11, 'dog'),
    actorOf(SVG.person('#C8693F', { long: true, hair: '#6B3E26', pants: '#4A5568', pantsB: '#3A4456', skin: '#EAC2A0', shirtB: '#A9532F', belt: '#3A2A20' }), 3.29,
      [['at', ...P(3, 36)], ['walk', ...P(9, 21)], ['face', -1], ['wait', 99999]], 6.5, 'family'),
    actorOf(SVG.person('#E3B23C', { hair: '#8A5A3B', pants: '#5B8DB8', pantsB: '#4A79A2', skin: '#EFC7A4', shirtB: '#C99A2E' }), 2.29,
      [['at', ...P(5, 38)], ['walk', ...P(15, 24)], ['face', -1], ['wait', 99999]], 7, 'family'),
    actorOf(SVG.dog('#D9B48A'), 2.78, [['at', ...P(22, 30)], ['wait', 99999]], 30, 'puppy') ];
  // act 4: once the house is lived in, the father goes to the door and the boy plays a little with the puppy
  const ACT4 = { father: [['walk', ...P(0, 4)], ['face', -1], ['wait', 99999]], boy: [['walk', ...P(26, 30)], ['wait', 600], ['walk', ...P(19, 26)], ['face', -1], ['wait', 99999]] };
  /** Position, walking flag and facing of an actor at local time lt (ms since it appeared). */
  const pose = (A, lt, steps) => { let x = steps[0][1], y = steps[0][2], face = 1, tt = lt, clock = 0, arrived = -1;
    const out = walk => ({ x, y, walk, face, since: arrived < 0 ? -1 : lt - arrived });
    for (const st of steps.slice(1)) {
      if (st[0] === 'face') { face = st[1]; continue; }
      if (st[0] === 'wait') { if (tt < st[1]) return out(false); tt -= st[1]; clock += st[1]; continue; }
      if (st[0] === 'walk') { const dx = st[1] - x, dy = st[2] - y, d = Math.hypot(dx, dy), dur = d / A.speed * 1000;
        face = dx * cosZ0 - dy * sinZ0 < 0 ? -1 : 1;
        if (tt < dur) { const q = tt / dur, f = q * q * (3 - 2 * q) * .35 + q * .65, r = { x: x + dx * f, y: y + dy * f, walk: true, face, since: -1 }; return r; }
        tt -= dur; clock += dur; x = st[1]; y = st[2]; arrived = clock; } }
    return out(false); };
  const sinZ0 = Math.sin(-CAM_Z * Math.PI / 180), cosZ0 = Math.cos(-CAM_Z * Math.PI / 180);
  const cat = { el: actor(HM.hx + HM.hw - 12, HM.hy + HM.hd + 6, SVG.cat, 2.58), at: 'end' };
  const smoke = [0, 1, 2].map(() => bill(HM.chim[0], HM.chim[1], HM.chim[2], '<i class="puff"></i>'));
  const N = 6;
  // single 3D progress bar on the ground, parallel to the plane's front edge
  const hud = group(); hud.classList.add('hud');
  const BY = GM + 14, BL = PW - 28;                           // on the ground, a little in front of the block                                // full length on the long edges
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
    { tr: `translate3d(0px, ${PH}px, ${-SOIL}px) rotateZ(0deg)`, len: PW, down: a => Math.cos(a) },     // front
    { tr: `translate3d(${PW}px, ${PH}px, ${-SOIL}px) rotateZ(-90deg)`, len: PH, down: a => Math.sin(a) }, // right
    { tr: `translate3d(${PW}px, 0px, ${-SOIL}px) rotateZ(180deg)`, len: PW, down: a => -Math.cos(a) },   // back
    { tr: `translate3d(0px, 0px, ${-SOIL}px) rotateZ(90deg)`, len: PH, down: a => -Math.sin(a) }];      // left
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

  const T0 = 900, STEP = 1800, DUR = 900, BUILD_DELAY = 500;
  const LOTS = PAY_ORDER.map((key, i) => { const done = T0 + (PAY_STEP[i] - 1) * STEP + STEP * .6;
    return { key, el: lotEl[key], pin: pins[i], fill: addFill(lotEl[key]), done, start: Math.max(T0 + 300 + i * 120, done - 2.8 * STEP), st: -1 }; });
  LOTS.push({ key: 'site', el: site, pin: sitePin, fill: addFill(site), start: 250, done: T0, st: -1 });
  const SITE2_DONE = T0 + 3.4 * STEP;                                 // the second large lot finishes paying, then its house goes up
  LOTS.push({ key: 'site2', el: site2, pin: site2Pin, fill: addFill(site2), start: T0 + .6 * STEP, done: SITE2_DONE, st: -1 });
  let recaudo = 0, lastPct = '', soldN = 0;                          // soldN: lots that have turned green in this cycle
  const CYCLE = T0 + BUILD_DELAY + (NS - 1) * STEP + STEP * .45 + DUR + 6800;   // build, then ~5 s of the house being lived in
  const easeOut = t => 1 - Math.pow(1 - t, 3), clamp = v => Math.min(Math.max(v, 0), 1);
  const backOut = t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const stage = $('ox');
  const listen = (type, fn) => stage.addEventListener(type, fn, { signal: ac.signal });   // removed by ac.abort() in the cleanup
  const wrap = $('oxw');
  const fitStage = () => { const w = stage.clientWidth || 800, mobile = window.innerWidth < 760 || w < 420;   // layout follows the viewport
    wrap.classList.toggle('mobile', mobile);
    pl.style.setProperty('--s', Math.min(1.4, w / 560).toFixed(3));
    pl.style.top = mobile ? '28%' : '';
    if (mobile) { pool2.forEach(el => { if (el._slot <= 1) fit2(el); }); layout2(); }                                   // lift the model to leave room for the 2D HUD
    stage.style.height = Math.round(mobile ? 20 + w * .62 + 150 : Math.min(620, 300 + w * .42)) + 'px'; };
  fitStage(); if (window.ResizeObserver) { const ro = new ResizeObserver(fitStage); ro.observe(stage); observers.push(ro); }
  let onScreen = true; if (window.IntersectionObserver) { const io = new IntersectionObserver(es => { const was = onScreen; onScreen = es[0].isIntersecting; if (onScreen && !was && alive) requestAnimationFrame(frame); }); /* the loop stops off screen and restarts on return */ io.observe(stage); observers.push(io); }
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
    if (!onScreen) return;                                        // stopped while off screen (restarted by the observer)
    const t = reduce ? CYCLE - 2100 : (now - start) % CYCLE;   // reduced motion: the finished scene (crane gone, 100 %)
    let built = 0, paid = 0, top = 0;
    const endT = T0 + BUILD_DELAY + (NS - 1) * STEP + STEP * .45 + DUR;
    // main house pops up in one go with a little hop (slab, house + roof, chimney, yard + fence, carport, quickly staggered)
    const B = T0 + BUILD_DELAY;
    const pop = (g, z, t0) => { const u = clamp((t - t0) / 520), e = backOut(u), hop = u > 0 && u < 1 ? 7 * Math.sin(Math.PI * u) : 0;
      put(g, 'visibility', u > 0 ? 'visible' : 'hidden'); put(g, 'transform', `translateZ(${(z + hop).toFixed(2)}px) scale3d(1,1,${Math.max(e, .002).toFixed(3)})`); return clamp(u * 1.4); };
    const POP_AT = [0, 0, 0, 0, 0];                                 // the whole place pops up at once: house, yard, fence, carport
    const eM = HM.st.map((S, k) => pop(S.g, S.z, B + POP_AT[k]));
    top = HM.top * eM[1];
    for (let j = 0; j < NS; j++) if (t >= T0 + j * STEP) paid = j + 1;
    // greenery grows with the garden stage
    const gE = backOut(clamp((t - B) / 520));
    HM.greens.forEach(el => { put(el, 'transform', `scale(${gE.toFixed(3)})`); });
    // lived in: lights on window by window, door open, chimney smoke, car drives in
    HM.wins.forEach((w, k) => cls(w, 'lit', t > endT + 200 + k * 220));
    { const o = easeIO(clamp((t - endT - 900) / 700)); put(HM.leaf, 'transform', `${HM.leaf._base || (HM.leaf._base = HM.leaf.style.transform)} rotateZ(${(78 * o).toFixed(1)}deg)`); }   // the door swings open
    smoke.forEach((el, k) => { const ph = ((t - endT - 600 - k * 700) % 2100 + 2100) % 2100 / 2100, on = t > endT + 600 + k * 700;
      put(el, 'opacity', on ? (Math.sin(ph * Math.PI) * .75).toFixed(2) : '0'); put(el, 'transform', `translateY(${(-ph * 22).toFixed(1)}px) scale(${(.6 + ph * .9).toFixed(2)})`); });
    const AT = { buyer: B + 700, dog: B + STEP * 1.4, family: B + STEP * 2.4, puppy: endT + 1800, end: endT + 1200 };
    const ACT4_T = endT + 400;
    actors.forEach((A, k) => {
      const u0 = clamp((t - AT[A.at]) / 420); put(A.el, 'opacity', u0 > 0 ? '1' : '0'); put(A.el, 'transform', `scale(${(u0 < 1 ? backOut(u0) : 1).toFixed(3)})`);
      let ps = pose(A, reduce ? 99999 : Math.max(0, t - AT[A.at]), A.steps);
      const extra = k === 0 ? ACT4.father : k === 3 ? ACT4.boy : null;            // act 4 continues from where they stood
      if (extra && t > ACT4_T) ps = pose(A, reduce ? 99999 : t - ACT4_T, [['at', ps.x, ps.y], ['face', ps.face], ...extra]);
      A.b._dx = ps.x - A.x0; A.b._dy = ps.y - A.y0;                    // moved with a transform (sub-pixel, no layout)
      cls(A.el, 'walk', ps.walk && u0 >= 1); put(A.fig, 'transform', ps.face < 0 ? 'scaleX(-1)' : 'none');
      cls(A.el, 'cheer', !reduce && ps.since >= 0 && ps.since < 1300); });   // a happy jump when they get where they were going
    { const u = clamp((t - AT.end) / 420); put(cat.el, 'opacity', u > 0 ? '1' : '0'); put(cat.el, 'transform', `scale(${(u < 1 ? backOut(u) : 1).toFixed(3)})`); }
    cls(site, 'lawn', t > B);                                         // the green outline goes as soon as the house is up
    const BILL = `rotateZ(${(CAM_Z - rz).toFixed(2)}deg) rotateX(${(-(CAM_X + ryv)).toFixed(2)}deg)`;
    bills.forEach(({ b, z }) => put(b, 'transform', `translate3d(${(b._dx || 0).toFixed(3)}px, ${(b._dy || 0).toFixed(3)}px, ${z}px) ${BILL}`));
    put(site2Pin, 'transform', `translateZ(2.5px) ${BILL}`);
    // trees and context
    trees.forEach((g, k) => { const e = easeOut(clamp((t - 250 - k * 80) / 650)); put(g, 'transform', `scale3d(1,1,${Math.max(e, .002).toFixed(3)})`); put(g, 'visibility', e > .002 ? 'visible' : 'hidden'); });
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
      if (hg) { const tp = LOTS[i].done, u = clamp((t - tp - HOUSE_DELAY) / HOUSE_DUR), e = backOut(u), hop = u > 0 && u < 1 ? 6 * Math.sin(Math.PI * u) : 0; hz = HOUSE_H * clamp(u * 1.4) + hop;
        cls(LOTS[i].el, 'built', u > .5); put(hg, 'visibility', u > 0 ? 'visible' : 'hidden'); put(hg, 'transform', `translateZ(${hop.toFixed(2)}px) scale3d(1,1,${Math.max(e, .002).toFixed(3)})`); }
      put(pins[i], 'transform', `translateZ(${(hz + 1).toFixed(1)}px) rotateZ(${(CAM_Z - rz).toFixed(2)}deg) rotateX(${(-(56 + ryv)).toFixed(2)}deg)`); });
    put(sitePin, 'transform', `translateZ(${(top + 2.5).toFixed(1)}px) rotateZ(${(CAM_Z - rz).toFixed(2)}deg) rotateX(${(-(56 + ryv)).toFixed(2)}deg)`);
    // bar = average collection across all lots; turns green when the whole portfolio is collected
    paidS += (recaudo - paidS) * .12;
    soldN = LOTS.filter(L => L.st === 2).length;                   // lots that are green right now
    const pct = `RECAUDO ${Math.round(recaudo * 100)} %` + (soldN ? `|Lote ${soldN} vendido` : '');
    if (pct !== lastPct) { lastPct = pct; const [a, b] = pct.split('|');
      [lblN, n2].forEach(el => { el.textContent = a; if (b) { const sp = document.createElement('span'); sp.className = 'sold'; sp.textContent = b; el.appendChild(sp); } }); }
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
    { const tz = mx * 8 * hover + dz, tx = -my * 4 * hover + dx;   // ease toward the target, then settle exactly (no endless sub-pixel shimmer)
      rz = Math.abs(tz - rz) < .02 ? tz : rz + (tz - rz) * .12; ryv = Math.abs(tx - ryv) < .02 ? tx : ryv + (tx - ryv) * .12;
      rz = Math.round(rz * 20) / 20; ryv = Math.round(ryv * 20) / 20; }
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
