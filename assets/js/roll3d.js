/* Paper Converting Professional — the toilet paper roll in the hero, in 3D (three.js).
   Drag the sheet down to unroll it; let go and it tears at the nearest perforation.
   Loaded by home.js only when the browser can draw WebGL; otherwise the flat drawing stays. */
import * as THREE from '../vendor/three.module.min.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const R = 5.5, CORE = 2, W = 10, SHEET = 11;   // cm: roll radius, core radius, roll width, length of one sheet
const REST = 13, MIN = 8, MAXL = 27;            // hanging length at rest, shortest and longest
const WALL = -(R + 2.4);                        // the wall behind the roll
const CURL = 2.6, CURL_R = 3.4;                 // the end of the sheet curls towards you

/* the motif embossed on the company's paper: a flower, a vine with a leaf, small curls */
const MOTIF = [
  'M12 18.5 C13 27 19 31 25 33 C31 35 33 41 29 44 C26 46 23 43 25.5 41 C27 40 28.5 41.5 27.6 42.8',
  'M17 28 C13 25 13 20 17 18.5 C19.5 22 19.5 25.5 17 28 Z M17 28 C17.5 24.5 17.8 21.5 17 18.5',
  'M31 13 C31 9.5 35.5 9 36.5 12 C37.5 15 34 16.5 32.5 14.7',
  'M6 48 C4 43 7 39 11 39 C11 43 9.5 46.5 6 48 Z M6 48 C7.5 45 9 42 11 39',
];
function drawMotif(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineWidth = 1.25;
  ctx.lineCap = ctx.lineJoin = 'round';
  for (let k = 0; k < 5; k++) {
    ctx.save();
    ctx.translate(12, 13); ctx.rotate(k * Math.PI * 2 / 5); ctx.translate(-12, -13);
    ctx.beginPath(); ctx.ellipse(12, 7.8, 2.6, 5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(12, 13, 1.6, 0, Math.PI * 2); ctx.stroke();
  MOTIF.forEach(d => ctx.stroke(new Path2D(d)));
  ctx.restore();
}

/* one sheet of paper, 10 × 11 cm: colour map and relief map that repeat along the roll */
function paperTextures() {
  const w = 512, h = Math.round(w * SHEET / W);
  const make = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const colorCv = make(), bumpCv = make();
  const c = colorCv.getContext('2d'), b = bumpCv.getContext('2d');
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  b.fillStyle = '#7f7f7f'; b.fillRect(0, 0, w, h);
  // fine dots pressed all over the paper
  b.fillStyle = '#9c9c9c';
  for (let row = 0, y = 4; y < h; y += 8.8, row++) {
    for (let x = row % 2 ? 4.4 : 0; x < w; x += 8.8) { b.beginPath(); b.arc(x, y, 1.9, 0, Math.PI * 2); b.fill(); }
  }
  // flowers on a staggered grid, drawn across the edges so the pattern repeats without seams
  const COLS = 4, ROWS = 4, s = 2.35;
  const place = (fn) => {
    for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++) {
      const x = k * w / COLS + (r % 2 ? w / COLS / 2 : 0) + 6, y = r * h / ROWS + 8;
      for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) fn(x + dx, y + dy);
    }
  };
  b.strokeStyle = '#d2d2d2';
  place((x, y) => drawMotif(b, x, y, s));
  c.strokeStyle = 'rgba(150, 128, 96, .16)';
  place((x, y) => drawMotif(c, x, y, s));
  // perforation along the top edge of every sheet
  c.fillStyle = 'rgba(125, 105, 75, .45)';
  b.fillStyle = '#2a2a2a';
  for (let x = 1; x < w; x += 9) { c.fillRect(x, 0, 5, 2); b.fillRect(x, 0, 5, 3); }
  const color = new THREE.CanvasTexture(colorCv), bump = new THREE.CanvasTexture(bumpCv);
  color.colorSpace = THREE.SRGBColorSpace;
  // canvas top = top of the sheet; v grows down the sheet
  [color, bump].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.flipY = false; });
  return { color, bump };
}

/* the end of the roll: the layers of paper wound round the core */
function ringTexture() {
  const n = 512, cv = document.createElement('canvas');
  cv.width = cv.height = n;
  const c = cv.getContext('2d'), mid = n / 2, k = mid / R;
  c.fillStyle = '#fbf9f5'; c.fillRect(0, 0, n, n);
  for (let r = CORE * k + 2; r < R * k - 1; r += 2.2) {
    c.strokeStyle = `rgba(120, 100, 70, ${(0.03 + Math.random() * 0.07).toFixed(3)})`;
    c.lineWidth = 1;
    c.beginPath(); c.arc(mid, mid, r, 0, Math.PI * 2); c.stroke();
  }
  const g = c.createRadialGradient(mid, mid, R * k * .82, mid, mid, R * k);
  g.addColorStop(0, 'rgba(120, 100, 70, 0)'); g.addColorStop(1, 'rgba(120, 100, 70, .16)');
  c.fillStyle = g; c.fillRect(0, 0, n, n);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* the outside of the roll; v counts paper from where the sheet leaves the roll, so roll and sheet line up */
function rollGeometry() {
  const seg = 160, pos = [], nor = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const th = i / seg * Math.PI * 2;   // 0 at the front, then up over the top
    const y = R * Math.sin(th), z = R * Math.cos(th);
    for (const [u, x] of [[0, -W / 2], [1, W / 2]]) {
      pos.push(x, y, z); nor.push(0, Math.sin(th), Math.cos(th)); uv.push(u, -R * th / SHEET);
    }
  }
  for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/* a point of the hanging paper: s cm below the roll, u from 0 (left) to 1 (right) */
function paperPoint(s, u, L, out) {
  const bulge = .16 * (1 - (2 * u - 1) ** 2) * Math.min(1, s / 5);   // paper sags a little towards you
  out.x = (u - .5) * W;
  if (s <= L - CURL) { out.y = -s; out.z = R + .01 + bulge; }
  else {
    const a = (s - (L - CURL)) / CURL_R;
    out.y = -(L - CURL) - CURL_R * Math.sin(a);
    out.z = R + .01 + bulge + CURL_R * (1 - Math.cos(a));
  }
  return out;
}

const ROWS = 72, COLS = 14;
function sheetGeometry() {
  const g = new THREE.BufferGeometry(), n = (ROWS + 1) * (COLS + 1), idx = [];
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const a = r * (COLS + 1) + c, b = a + COLS + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  g.setIndex(idx);
  return g;
}
/* fill a sheet geometry for the stretch of paper from s0 to s1; vOffset bakes in the texture position */
const tmp = new THREE.Vector3();
function shapeSheet(g, s0, s1, L, vOffset = 0, origin = null) {
  const pos = g.attributes.position.array, uv = g.attributes.uv.array;
  let p = 0, q = 0;
  for (let r = 0; r <= ROWS; r++) {
    const s = s0 + (s1 - s0) * r / ROWS;
    for (let c = 0; c <= COLS; c++) {
      const u = c / COLS;
      paperPoint(s, u, L, tmp);
      if (origin) tmp.sub(origin);
      pos[p++] = tmp.x; pos[p++] = tmp.y; pos[p++] = tmp.z;
      uv[q++] = u; uv[q++] = s / SHEET + vOffset;
    }
  }
  g.attributes.position.needsUpdate = true;
  g.attributes.uv.needsUpdate = true;
  g.computeVertexNormals();
  g.computeBoundingSphere();
}

export function createRoll(host, { reduce = false, hold = () => {}, preserve = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: preserve });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  const canvas = renderer.domElement;
  canvas.className = 'roll3d';
  canvas.setAttribute('role', 'button');
  canvas.setAttribute('aria-label', 'Ролка тоалетна хартия. Дръпнете листа надолу, за да го откъснете.');
  canvas.tabIndex = 0;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;

  const camera = new THREE.PerspectiveCamera(24, 1, 1, 300);
  const key = new THREE.DirectionalLight(0xfff3e2, 2.3);
  key.position.set(-6, 13, 22);
  key.target.position.set(0, -6, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);   // small and blurred: soft shadows that cost little on phones
  Object.assign(key.shadow.camera, { left: -20, right: 20, top: 18, bottom: -30, near: 4, far: 70 });
  key.shadow.radius = 7;
  key.shadow.blurSamples = 8;
  key.shadow.bias = -.0005;
  const fill = new THREE.DirectionalLight(0xffffff, .9);
  fill.position.set(14, 3, 12);
  scene.add(key, key.target, fill);

  // paper
  const tex = paperTextures();
  const paper = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex.color, bumpMap: tex.bump, bumpScale: 3.2, roughness: .93, metalness: 0, envMapIntensity: .75 });
  const sheetMat = paper.clone();
  sheetMat.side = THREE.DoubleSide;
  const roll = new THREE.Mesh(rollGeometry(), paper);
  roll.castShadow = true;
  const ends = new THREE.MeshStandardMaterial({ map: ringTexture(), roughness: 1, envMapIntensity: .9, emissive: 0x2a2620 });
  const ringGeo = new THREE.RingGeometry(CORE, R, 128, 1);
  const endR = new THREE.Mesh(ringGeo, ends); endR.rotation.y = Math.PI / 2; endR.position.x = W / 2;
  const endL = new THREE.Mesh(ringGeo, ends); endL.rotation.y = -Math.PI / 2; endL.position.x = -W / 2;

  // cardboard core
  const card = new THREE.MeshStandardMaterial({ color: 0xc09060, roughness: .85, envMapIntensity: .6 });
  const cardIn = new THREE.MeshStandardMaterial({ color: 0x7d5c36, roughness: .9, side: THREE.BackSide });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(CORE - .16, CORE - .16, W, 64, 1, true), cardIn);
  tube.rotation.z = Math.PI / 2;
  const rimGeo = new THREE.RingGeometry(CORE - .16, CORE + .01, 64, 1);
  const rimR = new THREE.Mesh(rimGeo, card); rimR.rotation.y = Math.PI / 2; rimR.position.x = W / 2 + .005;
  const rimL = new THREE.Mesh(rimGeo, card); rimL.rotation.y = -Math.PI / 2; rimL.position.x = -W / 2 - .005;

  // gold holder: a post from the wall on the right and an arm through the core
  const gold = new THREE.MeshStandardMaterial({ color: 0xd4ae6a, metalness: 1, roughness: .3, envMapIntensity: 1.1 });
  const HX = W / 2 + 1.8, ARM = .52;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(ARM, ARM, HX - (-W / 2 + 1.5), 40), gold);
  arm.rotation.z = Math.PI / 2; arm.position.x = (HX + (-W / 2 + 1.5)) / 2;
  const elbow = new THREE.Mesh(new THREE.SphereGeometry(ARM, 40, 20), gold); elbow.position.x = HX;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(ARM, ARM, -WALL, 40), gold);
  post.rotation.x = Math.PI / 2; post.position.set(HX, 0, WALL / 2);
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.6, .55, 64), gold);
  rose.rotation.x = Math.PI / 2; rose.position.set(HX, 0, WALL + .28);
  [arm, elbow, post, rose].forEach(m => { m.castShadow = true; });

  // the hanging sheet
  const sheetGeo = sheetGeometry();
  const sheet = new THREE.Mesh(sheetGeo, sheetMat);
  sheet.castShadow = true;

  // the wall only shows the shadows; the page colour shows through
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.ShadowMaterial({ opacity: .13 }));
  wall.position.z = WALL; wall.receiveShadow = true;

  scene.add(roll, endR, endL, tube, rimR, rimL, arm, elbow, post, rose, sheet, wall);

  const pieceMat = sheetMat.clone();
  pieceMat.map = tex.color.clone(); pieceMat.bumpMap = tex.bump.clone();
  pieceMat.map.offset.set(0, 0); pieceMat.bumpMap.offset.set(0, 0);
  pieceMat.map.needsUpdate = pieceMat.bumpMap.needsUpdate = true;
  pieceMat.transparent = true;
  const warm = new THREE.Mesh(sheetGeometry(), pieceMat);
  warm.castShadow = true;
  scene.add(warm);
  renderer.compile(scene, camera);
  scene.remove(warm);
  warm.geometry.dispose();

  const hint = document.createElement('span');
  hint.className = 'roll3d__hint';
  hint.innerHTML = '<span>Дръпнете ↓</span>';
  host.append(canvas, hint);

  /* state: L = hanging length, U = paper unrolled so far */
  let L = REST, U = 0, dirty = true, demoed = false, auto = null, dragging = null, hintT;
  const pieces = [];
  function setL(v) {
    v = Math.max(MIN * .6, Math.min(MAXL, v));
    U += v - L;
    L = v;
    dirty = true;
  }
  function update() {
    const off = -U / SHEET;
    tex.color.offset.y = tex.bump.offset.y = off;   // the paper moves round the roll and down the sheet
    shapeSheet(sheetGeo, 0, L, L);
  }

  /* camera: the whole roll and sheet in view, seen from a little above and to the right */
  const target = new THREE.Vector3(1.6, -8.6, 0), dir = new THREE.Vector3(.3, .2, 1).normalize();
  function fit() {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const needH = Math.max(37, 25 / camera.aspect);
    const dist = needH / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.copy(target).addScaledVector(dir, dist);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    dirty = true;
  }
  new ResizeObserver(fit).observe(host);
  fit();

  const pv = new THREE.Vector3();
  function placeHint() {
    pv.set(0, -L - 1.6, R + 1).project(camera);
    const x = (pv.x + 1) / 2 * host.clientWidth, y = (1 - pv.y) / 2 * host.clientHeight;
    hint.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, 0)`;
  }

  /* tearing: the sheet tears at the perforation that leaves it closest to its usual length */
  function tear() {
    const first = ((U % SHEET) + SHEET) % SHEET;
    const cuts = [];
    for (let s = first; s < L - 1.5; s += SHEET) if (s >= 3.5) cuts.push(s);
    if (!cuts.length) return false;
    // prefer tearing off a proper piece (5 cm or more) and leaving the sheet near its usual length
    const pool = cuts.filter(s => L - s >= 5).length ? cuts.filter(s => L - s >= 5) : cuts;
    const cut = pool.reduce((a, b) => (Math.abs(b - REST) < Math.abs(a - REST) ? b : a));
    if (!reduce) {
      const g = sheetGeometry();
      const pivot = paperPoint(cut, .5, L, new THREE.Vector3());
      shapeSheet(g, cut, L, L, -U / SHEET, pivot);
      const piece = new THREE.Mesh(g, pieceMat.clone());   // same settings, so no new shader to build
      piece.position.copy(pivot);
      piece.castShadow = true;
      scene.add(piece);
      pieces.push({ piece, t0: null, dir: Math.random() > .5 ? 1 : -1, from: pivot.clone() });
    }
    L = cut;
    dirty = true;
    hint.classList.add('is-hidden');
    clearTimeout(hintT);
    hintT = setTimeout(() => hint.classList.remove('is-hidden'), 3200);
    return true;
  }
  function autoPull(by = SHEET) {
    if (auto || dragging) return;
    hint.classList.add('is-hidden');
    auto = { from: L, to: Math.min(MAXL, L + by), t0: null, dur: reduce ? 1 : 950 };   // t0 is set by the next frame
  }

  /* pulling with a finger or the mouse */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function onPaper(x, y) {
    const r = canvas.getBoundingClientRect();
    ndc.set((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects([sheet, roll], false).length > 0;
  }
  function cmPerPx() {
    const a = new THREE.Vector3(0, -L, R).project(camera), b = new THREE.Vector3(0, -L - 1, R).project(camera);
    return 1 / Math.max(.01, Math.abs(a.y - b.y) / 2 * host.clientHeight);
  }
  canvas.addEventListener('pointerdown', e => {
    if (auto || !onPaper(e.clientX, e.clientY)) return;
    dragging = { y0: e.clientY, l0: L, k: cmPerPx(), moved: 0 };
    hold();
    hint.classList.add('is-hidden');
    canvas.classList.add('is-dragging');
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) { canvas.style.cursor = onPaper(e.clientX, e.clientY) ? 'grab' : ''; return; }
    const dy = (e.clientY - dragging.y0) * dragging.k;
    dragging.moved = Math.max(dragging.moved, Math.abs(e.clientY - dragging.y0));
    setL(dragging.l0 + dy);
  });
  const up = () => {
    if (!dragging) return;
    const d = dragging;
    dragging = null;
    canvas.classList.remove('is-dragging');
    if (d.moved < 6) autoPull();               // a tap pulls a sheet
    else if (L - d.l0 > 2.5) tear();           // a real pull tears it off
    else hint.classList.remove('is-hidden');
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('touchstart', e => {   // only a touch on the paper stops the page from scrolling
    const t = e.touches[0];
    if (t && onPaper(t.clientX, t.clientY)) e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hold(); autoPull(); } });

  function frame(t = performance.now()) {
    if (auto) {
      if (auto.t0 === null) auto.t0 = t;
      const k = Math.min(1, Math.max(0, (t - auto.t0) / auto.dur)), e = 1 - Math.pow(1 - k, 3);
      setL(auto.from + (auto.to - auto.from) * e);
      if (k >= 1) { auto = null; if (!tear()) hint.classList.remove('is-hidden'); }
    }
    if (!dragging && !auto && L < MIN - .01) setL(L + (MIN - L) * .14);   // a very short sheet unrolls a little
    for (let i = pieces.length - 1; i >= 0; i--) {   // torn pieces flutter down and fade
      const p = pieces[i];
      if (p.t0 === null) p.t0 = t;
      const k = Math.max(0, (t - p.t0) / 1500);
      if (k >= 1) { scene.remove(p.piece); p.piece.geometry.dispose(); pieces.splice(i, 1); dirty = true; continue; }
      p.piece.position.set(p.from.x + p.dir * (2.6 * k + Math.sin(k * 7) * .7), p.from.y - 24 * k * k - 2 * k, p.from.z + 3 * k);
      p.piece.rotation.set(.9 * k + .15 * Math.sin(k * 9), 0, p.dir * (.5 * k + .22 * Math.sin(k * 6)));
      p.piece.material.opacity = 1 - k * k;
      dirty = true;
    }
    if (!dirty) return;
    update();
    renderer.render(scene, camera);
    placeHint();
    dirty = false;
  }
  frame();
  requestAnimationFrame(() => canvas.classList.add('is-ready'));

  return {
    frame,
    onShow() {
      // show once what the sheet does, then leave it to the visitor
      if (demoed || reduce) return;
      demoed = true;
      setTimeout(() => autoPull(), 1500);
    },
  };
}
