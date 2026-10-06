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
  // gable roof over a w x d footprint, ridge along x: two tiled slopes and the two end triangles
  // gable roof over a w x d footprint, ridge along x. Barrel tiles: rounded channels across the slope (light crest,
  // dark trough) and horizontal courses every few px; a darker eave edge and a rounded ridge cap on top.
  const TILE = (base, light, dark) => `repeating-linear-gradient(180deg, transparent 0 3.1px, rgba(60,20,8,.30) 3.1px 3.8px, rgba(255,255,255,.10) 3.8px 4.2px), repeating-linear-gradient(90deg, ${dark} 0 .5px, ${base} .5px 1.4px, ${light} 1.4px 2.3px, ${base} 2.3px 3.3px, ${dark} 3.3px 3.8px)`;
  const ROOF_A = TILE('#C9693D', '#E08A5C', '#93441F'), ROOF_B = TILE('#B0582F', '#C9714A', '#7D3818');
  const gableRoof = (parent, x, y, z, w, d, h, ov) => {
    const g = div('g', { transform: `translateZ(${z}px)` }, parent), half = d / 2 + ov, L = Math.hypot(half, h), a = Math.atan2(h, half) * 180 / Math.PI;
    const slope = (bg, deg) => div('f roof', { left: (x - ov) + 'px', top: (y + d / 2) + 'px', width: (w + 2 * ov) + 'px', height: L + 'px', transformOrigin: '50% 0', transform: `translateZ(${h}px) rotateX(${deg}deg)`, background: bg }, g);
    const end = ex => div('f', { left: ex + 'px', top: y + 'px', width: h + 'px', height: d + 'px', transformOrigin: '0 50%', transform: 'rotateY(-90deg)', background: 'linear-gradient(90deg, #E9DFCB, #DCCDB2)', clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }, g);
    end(x); end(x + w); slope(ROOF_B, -(180 - a)); slope(ROOF_A, -a);
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
  const HOUSE_LOTS = { '3,3': 0 };                 // lot key -> house group
  Object.keys(HOUSE_LOTS).forEach(k => { const [c, r] = k.split(',').map(Number), [x, y] = lotXY(c, r);
    // small country house, same language as the main one: stone plinth, white walls with windows (glass reflection),
    // a door with a step, chimney and a barrel-tile roof; a tree beside it
    const g = group(); g.classList.add('round');
    const X = x + 12, Y = y + 14, W = 40, D = 26;
    box(g, X - 2, Y - 2, 0, W + 4, D + 4, 1.4, { ...STONE, top: '#D9D3C6' });
    const hb = box(g, X, Y, 1.4, W, D, 9.6, WALL);
    const wn = (face, l, t, w, h) => { const el = document.createElement('i'); el.className = 'win lit'; Object.assign(el.style, { left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px' }); face.appendChild(el); };
    [4, 11, 27, 34].forEach(l => wn(hb._front, l - 1, 2.4, 4.6, 4.4)); [6, 15].forEach(tp => { wn(hb._faces[2], 2.2, tp, 4.6, 5); wn(hb._faces[3], 2.2, tp, 4.6, 5); });
    const dr = document.createElement('i'); dr.className = 'hdoor'; Object.assign(dr.style, { left: '18px', top: '1.6px', width: '5.4px', height: '7.6px' }); hb._front.appendChild(dr);
    box(g, X + 16.4, Y + D, 0, 8.6, 3.2, 1.4, { ...WOOD, top: '#B98A62' });
    box(g, X + W - 10, Y + 5, 11, 4, 4, 10, { top: '#7A3F24', front: '#B45A34', back: '#B45A34', left: '#B45A34', right: '#96492A', noLine: true });
    gableRoof(g, X, Y, 11, W, D, 9, 2.6);
    box(g, x + 5, y + LD - 9, 0, 1.2, 1.2, 6, { top: '#7A6A57', front: '#6B5C4A', back: '#6B5C4A', left: '#6B5C4A', right: '#5A4D3E', noLine: true });
    g.style.visibility = 'hidden'; HOUSE_LOTS[k] = g; });
  const HOUSE_H = 20, HOUSE_DELAY = 500, HOUSE_DUR = 520;
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
        + `<rect x="8.3" y="7.3" width="2.4" height="2.6" rx="1.1" fill="${skin}"/>`
        + `<ellipse cx="9.7" cy="4.9" rx="3.3" ry="3.6" fill="${skin}"/><path d="M12.8 4.6l.9 1.2-.8.4" fill="${skin}"/><ellipse cx="8.4" cy="5.2" rx=".75" ry=".95" fill="#D49E7A"/>`
        + `<circle cx="11.6" cy="4.3" r=".42" fill="#2A2420"/><path d="M11.1 3.4h1" stroke="${hair}" stroke-width=".4" stroke-linecap="round"/><path d="M11.4 6.6q.6.25 1-.1" stroke="#9A5B45" stroke-width=".4" fill="none" stroke-linecap="round"/>`
        + `<path d="${o.long ? 'M6.1 5.6C5.5 1.9 7.6.9 9.6 1c2.3.1 3.6 1.3 3.5 2.9-1.3-.5-2.7-.7-4-.5-.6 1.6-.6 4.1-.1 7.4-.9 0-1.6-.3-2.2-1.1-.7-1-.8-2.5-.7-4.1z' : 'M6.2 5.5C6 2.3 7.8 1.2 9.7 1.3c2.2.1 3.4 1.2 3.3 2.7-1.2-.4-2.6-.6-3.9-.4-.5.6-.8 1.4-.9 2.4-.6-.4-1.3-.4-1.9-.5z'}" fill="${hair}"/>`
        + `${leg('f', pants)}${arm('f', shirt, skin)}</g></svg>`; },
    dog: (c, d = 'rgba(0,0,0,.22)') => { const leg = (k, x, back) => `<g class="paw ${k}" style="transform-origin:${x}px 13.5px"><path d="M${x} 13.5v7" stroke="${c}" stroke-width="2.7" stroke-linecap="round"${back ? ' opacity=".72"' : ''}/><ellipse cx="${x + .6}" cy="21.2" rx="1.7" ry=".9" fill="${c}"${back ? ' opacity=".72"' : ''}/></g>`;
      return `<svg viewBox="0 0 34 24" class="fig"><ellipse cx="17" cy="22.6" rx="11" ry="1.1" fill="rgba(11,27,51,.18)"/><g class="body">`
        + leg('b0', 9, 1) + leg('b1', 23, 1)
        + `<path class="tail" style="transform-origin:6.5px 10.5px" d="M6.5 10.5C3.5 9.5 2.6 7 3.4 4.6" stroke="${c}" stroke-width="2.3" fill="none" stroke-linecap="round"/>`
        + `<path d="M6 11.2C6 8.6 8 7.6 10.6 7.6h10.6c2.5 0 4 1.3 4.2 3.4l.2 2.2c.1 1.6-1 2.6-2.6 2.6H9.6C7.4 15.8 6 14 6 11.2z" fill="${c}"/>`
        + `<path d="M9 14.6h12.4" stroke="${d}" stroke-width="1.2" stroke-linecap="round"/>`
        + `<path d="M22.4 9.6c.2-2.4 1.2-4 3.1-4.4 1.6-.3 3 .3 3.8 1.5l2.6.6c.9.2 1.3.9 1.1 1.7-.2.8-.9 1.2-1.8 1.2h-3.4c-.9 1.2-2.3 1.8-3.9 1.6z" fill="${c}"/>`
        + `<path d="M25.1 5.9c-1.1.4-1.6 1.7-1.3 3.4.8.4 1.6.3 2.1-.3.3-1.3.1-2.4-.8-3.1z" fill="${d}"/>`
        + `<circle cx="27.6" cy="7.4" r=".75" fill="#1F1712"/><ellipse cx="32.7" cy="8.6" rx=".85" ry=".7" fill="#1F1712"/>`
        + leg('f0', 11, 0) + leg('f1', 21, 0) + `</g></svg>`; },
    cat: `<svg viewBox="0 0 24 24"><path d="M17 20q5 0 4.5-6" stroke="#33415A" stroke-width="2.2" fill="none" stroke-linecap="round"/><ellipse cx="11" cy="17" rx="6.5" ry="5.6" fill="#33415A"/><circle cx="11" cy="9" r="4.7" fill="#33415A"/><path d="M7.1 6.7 6.9 2.4l3.2 2.4zM14.9 6.7l.2-4.3-3.2 2.4z" fill="#33415A"/><circle cx="9.3" cy="9" r=".95" fill="#E3B23C"/><circle cx="12.7" cy="9" r=".95" fill="#E3B23C"/></svg>`,
    bush: d => `<i class="bush" style="width:${d}px;height:${d}px"></i>`,
    canopy: d => `<i class="bush tree-c" style="width:${d}px;height:${d}px"></i>` };
  const actor = (x, y, svg, w) => bill(x, y, 0, `<div class="pet" style="width:${w}px">${svg}</div>`);
  const fence = (parent, x, y, w, d, gaps) => {                       // picket fence on the lot edge; gaps = [[x1, x2], ...] on the front side
    div('fence-sh', { left: x + 'px', top: y + 'px', width: w + 'px', height: d + 'px' }, parent);   // soft shadow on the ground
    const H = 6, fx = (x1, x2, yy) => { if (x2 - x1 > 1) box(parent, x1, yy, 0, x2 - x1, .6, H, { top: '#FDFBF6', front: PICKX, back: PICKX, left: '#FDFBF6', right: '#FDFBF6', noLine: true }); };
    const fy = (y1, y2, xx) => box(parent, xx, y1, 0, .6, y2 - y1, H, { top: '#FDFBF6', front: '#FDFBF6', back: '#FDFBF6', left: PICKY, right: PICKY, noLine: true });
    fx(x, x + w, y); fy(y, y + d, x); fy(y, y + d, x + w - .6);
    let cx0 = x; gaps.forEach(([g1, g2]) => { fx(cx0, g1, y + d - .6); cx0 = g2; }); fx(cx0, x + w, y + d - .6); };
  function countryHouse(ox, oy, o) {
    const hx = ox + 10, hy = oy + 10, hw = o.hw, hd = 44, WALL_H = 15, ROOF_H = 16, wins = [], st = [];
    const stage = (z = 0) => { const g = group(); g.classList.add('round'); st.push({ g, z }); return g; };
    const g0 = stage(); box(g0, hx - 4, hy - 4, 0, hw + 8, hd + 8, 1.6, { ...STONE, top: '#D9D3C6' }); box(g0, hx - .6, hy - .6, 1.6, hw + 1.2, hd + 1.2, 2.6, STONE);
    const g1 = stage(4.2); const walls = box(g1, hx, hy, 0, hw, hd, WALL_H - 2.2, WALL);
    const win = (face, l, t, w, h) => { const el = document.createElement('i'); el.className = 'win'; Object.assign(el.style, { left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px' }); face.appendChild(el); wins.push(el); };
    const fw = hw / 2; [fw - 32, fw - 21, fw + 14, fw + 25].forEach(l => win(walls._front, l, 3, 7, 6.5));
    const door = document.createElement('i'); door.className = 'hdoor'; Object.assign(door.style, { left: (fw - 4) + 'px', top: '1.5px', width: '8px', height: (WALL_H - 3.8) + 'px' }); walls._front.appendChild(door);
    [8, 28].forEach(tp => { win(walls._faces[2], 3, tp, 6.5, 8); win(walls._faces[3], 3, tp, 6.5, 8); });   // side windows (x runs up the wall)
    gableRoof(g1, hx, hy, WALL_H - 2.2, hw, hd, ROOF_H, 4);   // the roof rises with the walls, in one go
    const g3 = stage(); box(g3, hx + hw - 18, hy + 7, 2 + WALL_H, 6, 6, ROOF_H + 4, { top: '#7A3F24', front: '#B45A34', back: '#B45A34', left: '#B45A34', right: '#96492A', noLine: true });
    box(g3, hx + fw - 9, hy + hd, 0, 18, 6, 2.4, WOOD); box(g3, hx + fw - 6, hy + hd + 6, 0, 12, 3, 1.2, WOOD);   // entrance deck and step, no roof
    const g4 = stage(); const gate = hx + fw - 3;
    // entrance: a flagstone path from the gate to the door step, framed by two stone pillars with lanterns and an open wooden gate
    const pathTop = hy + hd + 8.5, pathBot = oy + SD - 2;
    div('plan path', { left: (gate - 2) + 'px', top: pathTop + 'px', width: '12px', height: (pathBot - pathTop) + 'px' }, g4);
    const PIL = { top: '#E4DCCB', front: 'repeating-linear-gradient(180deg, #CFC4AE 0 2.6px, #B9AD95 2.6px 3px)', back: '#C9BEA8', left: '#C2B69F', right: '#ADA08A', noLine: true };
    const CAP = { top: '#F1ECE1', front: '#D9D1C0', back: '#D9D1C0', left: '#D9D1C0', right: '#C4BBA8', noLine: true };
    const LAN = { top: '#2E3440', front: 'linear-gradient(180deg, #2E3440 0 20%, #FFE7A6 20% 80%, #2E3440 80%)', back: '#FFE7A6', left: '#FFE7A6', right: '#F3D58A', noLine: true };
    const gy = oy + SD - 4.2;
    [gate - 5.2, gate + 10.2].forEach(px => { box(g4, px, gy, 0, 3.4, 3.4, 9, PIL); box(g4, px - .5, gy - .5, 9, 4.4, 4.4, 1, CAP); box(g4, px + .7, gy + .7, 10, 2, 2, 2.6, LAN); });
    const GATE = { top: '#9C6B45', front: 'repeating-linear-gradient(90deg, #8A5A3B 0 1px, #A8774F 1px 1.9px)', back: 'repeating-linear-gradient(90deg, #8A5A3B 0 1px, #A8774F 1px 1.9px)', left: '#734A30', right: '#734A30', noLine: true };
    [[gate - 1.8, 1], [gate + 10.2, -1]].forEach(([hx0, sgn]) => { const leaf = div('g', { transform: `translate3d(${hx0}px, ${gy + 1.5}px, 0) rotateZ(${sgn * -68}deg)`, transformOrigin: '0 0' }, g4);
      box(leaf, sgn > 0 ? 0 : -6.2, -.3, .6, 6.2, .6, 6.2, GATE); });                     // gate leaves, swung open inward
    box(g4, gate + 15.5, gy + .6, 0, .8, .8, 6.5, { top: '#3A4556', front: '#2A3442', back: '#2A3442', left: '#2A3442', right: '#1E2733', noLine: true });   // mailbox post
    box(g4, gate + 14.4, gy - .4, 6.5, 3, 2.8, 2.4, { top: '#4C7DB5', front: '#3A679C', back: '#3A679C', left: '#3A679C', right: '#2D5482', noLine: true });
    fence(g4, ox + 2, oy + 2, SW - 4, SD - 4, [[gate - 5.2, gate + 13.6], ...(o.carport ? [[o.cpX, o.cpX + o.cpW]] : [])]);
    const greens = [[hx + hw - 4, hy + hd + 16, 9]].map(([x, y, d]) => bill(x, y, 0, SVG.bush(d)));
    const trees = [[ox + 12, oy + SD - 16]].map(([x, y]) => { box(g4, x - .8, y - .8, 0, 1.6, 1.6, 9, { top: '#7A6A57', front: '#6B5C4A', back: '#6B5C4A', left: '#6B5C4A', right: '#5A4D3E', noLine: true }); return bill(x, y, 8, SVG.canopy(15)); });
    const H = { st, wins, door, greens: [...greens, ...trees], top: 2 + WALL_H + ROOF_H, chim: [hx + hw - 15, hy + 10, 2 + WALL_H + ROOF_H + 4], hx, hy, hw, hd, gate };
    if (o.carport) {                                                  // carport: driveway, open pergola, a rounded car that drives in later
      const cg = stage(); div('plan drive', { left: o.cpX + 'px', top: (hy + 4) + 'px', width: o.cpW + 'px', height: (oy + SD - hy - 4) + 'px' }, cg);
      [[0, 0], [o.cpW - 1.4, 0], [0, 42.6], [o.cpW - 1.4, 42.6]].forEach(([dx, dy]) => box(cg, o.cpX + dx, hy + 4 + dy, 0, 1.4, 1.4, 13, { top: '#C9CFD6', front: '#AEB6C0', back: '#AEB6C0', left: '#AEB6C0', right: '#97A0AB', noLine: true }));
      const ALU = { top: '#C9CFD6', front: '#AEB6C0', back: '#AEB6C0', left: '#AEB6C0', right: '#97A0AB', noLine: true };
      box(cg, o.cpX - 1, hy + 3, 13, o.cpW + 2, 46, 1, ALU);                            // aluminium frame
      const sheet = box(cg, o.cpX - .4, hy + 3.6, 14, o.cpW + .8, 44.8, .4, { top: 'repeating-linear-gradient(180deg, rgba(255,255,255,.55) 0 .5px, rgba(190,214,228,.0) .5px 3.6px), linear-gradient(135deg, rgba(214,232,242,.82), rgba(176,204,222,.72) 60%, rgba(232,244,250,.85))', front: '#B4C8D6', back: '#B4C8D6', left: '#B4C8D6', right: '#9FB4C4', noLine: true });   // translucent polycarbonate roof, corrugated
      const car = group(cg); car.classList.add('round');
      const CAR = { top: '#4C7DB5', front: '#3A679C', back: '#3A679C', left: '#3A679C', right: '#2D5482', noLine: true };
      const GL = { top: 'linear-gradient(135deg, #CFE0F0, #8FB0D2 55%, #E8F1FA 57%, #8FB0D2 62%)', front: 'linear-gradient(120deg, #9DBAD8, #6E90B5 50%, #D8E6F3 53%, #6E90B5 58%)', back: '#6E90B5', left: '#7E9EC0', right: '#6584A6', noLine: true };
      const WH = { top: '#1F2937', front: '#111827', back: '#111827', left: '#111827', right: '#0B1220', noLine: true };
      const cx = o.cpX + (o.cpW - 14) / 2, cy = hy + 12;
      [[-.6, 4], [12.2, 4], [-.6, 19], [12.2, 19]].forEach(([dx, dy]) => box(car, cx + dx, cy + dy, .4, 2.4, 5, 3.4, WH));
      const body = box(car, cx, cy, 1.8, 14, 27, 4.6, CAR); box(car, cx + 1.2, cy + 8, 6.4, 11.6, 12, 4, GL); box(car, cx + 1.6, cy + 8.5, 10.4, 10.8, 11, .8, CAR);
      [[1.5], [10]].forEach(([l]) => { const hl = document.createElement('i'); hl.className = 'hlamp'; hl.style.left = l + 'px'; body._front.appendChild(hl); });
      H.car = car;
    }
    return H;
  }
  const cpX = sx + 10 + 82 + 7, cpW = SW - 99 - 7;
  const HM = countryHouse(sx, sy, { hw: 82, carport: true, cpX, cpW });
  // the family and pets walk along routes on the front yard (ground coordinates); they appear during the build
  const yard = { gx: HM.gate + 3.5, door: HM.hy + HM.hd + 9, front: sy + SD - 9, l: HM.hx + 6, r: HM.hx + HM.hw - 6 };
  // Script (what each one does; they walk only to get somewhere, then stay):
  //  1. The buyer arrives at the gate as the house pops up, walks halfway up the path and stops to look at his house.
  //  2. The dog shows up behind him and trots to his side, then sits wagging its tail.
  //  3. His wife and son come in through the gate and walk to meet him; the three stand together in front of the house.
  //  4. When the lights come on, the father walks to the door; the boy runs a few steps on the lawn with the puppy and they stop.
  //  5. The cat waits by the door.
  // Steps: ['at', x, y] place, ['walk', x, y] walk there, ['wait', ms] stand still, ['face', 1 | -1] turn (screen right / left).
  const actorOf = (svg, w, steps, speed, at) => { const el = actor(steps[0][1], steps[0][2], svg, w); return { el, b: el.parentElement, fig: el.querySelector('svg'), steps, speed, at }; };
  const P = (dx, dy) => [yard.gx + dx, yard.door + dy];
  const actors = [
    actorOf(SVG.person('#3F6FA6', { pants: '#2F3B4E', pantsB: '#243045', shirtB: '#335C8C' }), 10.5,
      [['at', ...P(0, 34)], ['walk', ...P(0, 18)], ['face', -1], ['wait', 99999]], 20, 'buyer'),
    actorOf(SVG.dog('#8A5A3B'), 13, [['at', ...P(-2, 38)], ['walk', ...P(-9, 20)], ['face', 1], ['wait', 99999]], 30, 'dog'),
    actorOf(SVG.person('#C8693F', { long: true, hair: '#6B3E26', pants: '#4A5568', pantsB: '#3A4456', skin: '#EAC2A0', shirtB: '#A9532F', belt: '#3A2A20' }), 10,
      [['at', ...P(3, 36)], ['walk', ...P(9, 21)], ['face', -1], ['wait', 99999]], 18, 'family'),
    actorOf(SVG.person('#E3B23C', { hair: '#8A5A3B', pants: '#5B8DB8', pantsB: '#4A79A2', skin: '#EFC7A4', shirtB: '#C99A2E' }), 7,
      [['at', ...P(5, 38)], ['walk', ...P(15, 24)], ['face', -1], ['wait', 99999]], 22, 'family'),
    actorOf(SVG.dog('#D9B48A'), 9.5, [['at', ...P(22, 30)], ['wait', 99999]], 30, 'puppy') ];
  // act 4: once the house is lived in, the father goes to the door and the boy plays a little with the puppy
  const ACT4 = { father: [['walk', ...P(0, 4)], ['face', -1], ['wait', 99999]], boy: [['walk', ...P(26, 30)], ['wait', 600], ['walk', ...P(19, 26)], ['face', -1], ['wait', 99999]] };
  /** Position, walking flag and facing of an actor at local time lt (ms since it appeared). */
  const pose = (A, lt, steps) => { let x = steps[0][1], y = steps[0][2], face = 1, tt = lt;
    for (const st of steps.slice(1)) {
      if (st[0] === 'face') { face = st[1]; continue; }
      if (st[0] === 'wait') { if (tt < st[1]) return { x, y, walk: false, face }; tt -= st[1]; continue; }
      if (st[0] === 'walk') { const dx = st[1] - x, dy = st[2] - y, d = Math.hypot(dx, dy), dur = d / A.speed * 1000;
        const sx2 = dx * cosZ0 - dy * sinZ0; face = sx2 < 0 ? -1 : 1;
        if (tt < dur) { const f = tt / dur; return { x: x + dx * f, y: y + dy * f, walk: true, face }; }
        tt -= dur; x = st[1]; y = st[2]; } }
    return { x, y, walk: false, face }; };
  const sinZ0 = Math.sin(-CAM_Z * Math.PI / 180), cosZ0 = Math.cos(-CAM_Z * Math.PI / 180);
  const cat = { el: actor(HM.hx + HM.hw - 12, HM.hy + HM.hd + 6, SVG.cat, 8), at: 'end' };
  const smoke = [0, 1, 2].map(() => bill(HM.chim[0], HM.chim[1], HM.chim[2], '<i class="puff"></i>'));
  const N = 6;
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

  const T0 = 900, STEP = 1800, DUR = 900, BUILD_DELAY = 500;
  const LOTS = PAY_ORDER.map((key, i) => { const done = T0 + (PAY_STEP[i] - 1) * STEP + STEP * .6;
    return { key, el: lotEl[key], pin: pins[i], fill: addFill(lotEl[key]), done, start: Math.max(T0 + 300 + i * 120, done - 2.8 * STEP), st: -1 }; });
  LOTS.push({ key: 'site', el: site, pin: sitePin, fill: addFill(site), start: 250, done: T0, st: -1 });
  const SITE2_DONE = T0 + 3.4 * STEP;                                 // the second large lot finishes paying, then its house goes up
  LOTS.push({ key: 'site2', el: site2, pin: site2Pin, fill: addFill(site2), start: T0 + .6 * STEP, done: SITE2_DONE, st: -1 });
  let recaudo = 0, lastPct = '';
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
    // main house pops up in one go with a little hop (slab, house + roof, chimney, yard + fence, carport, quickly staggered)
    const B = T0 + BUILD_DELAY;
    const pop = (g, z, t0) => { const u = clamp((t - t0) / 520), e = backOut(u), hop = u > 0 && u < 1 ? 7 * Math.sin(Math.PI * u) : 0;
      put(g, 'visibility', u > 0 ? 'visible' : 'hidden'); put(g, 'transform', `translateZ(${(z + hop).toFixed(2)}px) scale3d(1,1,${Math.max(e, .002).toFixed(3)})`); return clamp(u * 1.4); };
    const POP_AT = [0, 0, 0, 0, 0];                                 // the whole place pops up at once: house, yard, fence, carport
    const eM = HM.st.map((S, k) => pop(S.g, S.z, B + POP_AT[k]));
    top = 2 * eM[0] + 31 * eM[1];
    for (let j = 0; j < NS; j++) if (t >= T0 + j * STEP) paid = j + 1;
    // greenery grows with the garden stage
    const gE = backOut(clamp((t - B) / 520));
    HM.greens.forEach(el => { put(el, 'transform', `scale(${gE.toFixed(3)})`); });
    // lived in: lights on window by window, door open, chimney smoke, car drives in
    HM.wins.forEach((w, k) => cls(w, 'lit', t > endT + 200 + k * 220));
    cls(HM.door, 'open', t > endT + 900);
    smoke.forEach((el, k) => { const ph = ((t - endT - 600 - k * 700) % 2100 + 2100) % 2100 / 2100, on = t > endT + 600 + k * 700;
      put(el, 'opacity', on ? (Math.sin(ph * Math.PI) * .75).toFixed(2) : '0'); put(el, 'transform', `translateY(${(-ph * 22).toFixed(1)}px) scale(${(.6 + ph * .9).toFixed(2)})`); });
    const AT = { buyer: B + 700, dog: B + STEP * 1.4, family: B + STEP * 2.4, puppy: endT + 1800, end: endT + 1200 };
    const ACT4_T = endT + 400;
    actors.forEach((A, k) => {
      const u0 = clamp((t - AT[A.at]) / 420); put(A.el, 'opacity', u0 > 0 ? '1' : '0'); put(A.el, 'transform', `scale(${(u0 < 1 ? backOut(u0) : 1).toFixed(3)})`);
      let ps = pose(A, reduce ? 99999 : Math.max(0, t - AT[A.at]), A.steps);
      const extra = k === 0 ? ACT4.father : k === 3 ? ACT4.boy : null;            // act 4 continues from where they stood
      if (extra && t > ACT4_T) ps = pose(A, reduce ? 99999 : t - ACT4_T, [['at', ps.x, ps.y], ['face', ps.face], ...extra]);
      put(A.b, 'left', ps.x.toFixed(2) + 'px'); put(A.b, 'top', ps.y.toFixed(2) + 'px');
      cls(A.el, 'walk', ps.walk && u0 >= 1); put(A.fig, 'transform', ps.face < 0 ? 'scaleX(-1)' : 'none'); });
    { const u = clamp((t - AT.end) / 420); put(cat.el, 'opacity', u > 0 ? '1' : '0'); put(cat.el, 'transform', `scale(${(u < 1 ? backOut(u) : 1).toFixed(3)})`); }
    cls(site, 'lawn', t > B + STEP * 3.3);
    const BILL = `rotateZ(${(CAM_Z - rz).toFixed(2)}deg) rotateX(${(-(CAM_X + ryv)).toFixed(2)}deg)`;
    bills.forEach(({ b, z }) => put(b, 'transform', `translateZ(${z}px) ${BILL}`));
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
        put(hg, 'visibility', u > 0 ? 'visible' : 'hidden'); put(hg, 'transform', `translateZ(${hop.toFixed(2)}px) scale3d(1,1,${Math.max(e, .002).toFixed(3)})`); }
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
