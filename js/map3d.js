/* 3D club map (three.js r149).
   Dark stylised Paris (river, canal, boulevards, city blocks) with diorama-style club buildings
   in the Shotgun brochure colours. Drag to pan, pinch / wheel to zoom, tap a building to select it. */
(function () {
  const LAT0 = 48.877, LON0 = 2.360, K = 1.6; // world units per km
  const P = (lat, lon) => [(lon - LON0) * 73.0 * K, -(lat - LAT0) * 111.2 * K];
  const BRAND = { lime: 0x7CFF4F, yellow: 0xFBED0F, orange: 0xF98436, pink: 0xFE6E96, magenta: 0xE325E3 };
  const rnd = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // Seine and Canal Saint-Martin / Bassin de la Villette / Canal de l'Ourcq (approximate)
  const SEINE = [[48.846, 2.255], [48.853, 2.272], [48.858, 2.285], [48.862, 2.300], [48.864, 2.318], [48.861, 2.330], [48.857, 2.343], [48.853, 2.351], [48.849, 2.362], [48.844, 2.369], [48.837, 2.378], [48.830, 2.390], [48.822, 2.405]].map(([a, b]) => P(a, b));
  const CANAL = [[48.853, 2.369], [48.861, 2.367], [48.867, 2.3655], [48.872, 2.3655], [48.877, 2.367], [48.881, 2.369], [48.8845, 2.3715], [48.8885, 2.3775], [48.891, 2.383], [48.8935, 2.392], [48.896, 2.400]].map(([a, b]) => P(a, b));
  const BOULEVARDS = [
    [[48.8700, 2.3245], [48.8712, 2.3330], [48.8707, 2.3475], [48.8695, 2.3560], [48.8675, 2.3635], [48.8600, 2.3680], [48.8530, 2.3690]], // Grands Boulevards
    [[48.8840, 2.3220], [48.8825, 2.3370], [48.8835, 2.3500], [48.8840, 2.3600], [48.8775, 2.3700], [48.8720, 2.3770], [48.8640, 2.3790]], // Bd de Clichy / La Chapelle / Belleville
    [[48.8675, 2.3635], [48.8740, 2.3600], [48.8820, 2.3580], [48.8900, 2.3590]], // Bd de Magenta / rue La Fayette
    [[48.8560, 2.3480], [48.8630, 2.3500], [48.8700, 2.3510], [48.8790, 2.3570]], // Bd de Sébastopol / Strasbourg
  ].map((line) => line.map(([a, b]) => P(a, b)));
  const DISTRICTS = [['Pigalle', 48.8820, 2.3375], ['Opéra', 48.8715, 2.3320], ['Le Marais', 48.8590, 2.3620], ['République', 48.8670, 2.3640], ['Belleville', 48.8720, 2.3830], ['La Villette', 48.8905, 2.3890], ['Châtelet', 48.8590, 2.3470], ['Bastille', 48.8530, 2.3700], ['Gare du Nord', 48.8810, 2.3550]];

  const distToPolyline = (x, z, pts) => { let best = 1e9; for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1]; const dx = bx - ax, dz = bz - az; const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); const d = Math.hypot(x - ax - t * dx, z - az - t * dz); if (d < best) best = d; } return best; };

  function ribbon(pts, width, y, color, opacity = 1) {
    const pos = [], idx = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const nx = -dz * width / 2, nz = dx * width / 2;
      pos.push(pts[i][0] + nx, y, pts[i][1] + nz, pts[i][0] - nx, y, pts[i][1] - nz);
      if (i < pts.length - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.95, transparent: opacity < 1, opacity, side: THREE.DoubleSide }));
    m.receiveShadow = true; return m;
  }

  /* ---------- club building (diorama style, after Andres's reference) ---------- */
  function makeClub(brandHex, seed) {
    const g = new THREE.Group(); const u = 0.1;
    const brand = new THREE.Color(brandHex); const wall = new THREE.Color(0xe9dcc6).lerp(brand, 0.42); const wall2 = wall.clone().multiplyScalar(0.9);
    const M = (color, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.92, metalness: 0 }, extra));
    const box = (w, h, d, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
    const stone = M(0x5b5046), wood = M(0x6b4a32), dark = M(0x3a2a20), slate = M(0x3b4250), terra = M(0xb5603c), leaf = M(0x5f8f43), leaf2 = M(0x7aa64f);
    const win = M(0xffd28a, { emissive: 0xffc46b, emissiveIntensity: 0.85 });
    const neonMat = M(brandHex, { emissive: brandHex, emissiveIntensity: 1.4, roughness: 0.4 });
    // plinth + walls around a courtyard (like the reference)
    box(6.2 * u, 0.6 * u, 5.4 * u, stone, 0, 0.3 * u, 0);
    box(6.0 * u, 1.3 * u, 0.25 * u, M(wall2), 0, 1.25 * u, 2.55 * u);
    box(0.25 * u, 1.3 * u, 2.4 * u, M(wall2), 2.88 * u, 1.25 * u, 1.3 * u);
    box(1.6 * u, 1.0 * u, 0.12 * u, wood, -1.2 * u, 1.1 * u, 2.7 * u); // gate
    // main body
    const body = M(wall);
    box(4.6 * u, 2.6 * u, 3.0 * u, body, -0.5 * u, 1.9 * u, -0.9 * u);
    box(2.8 * u, 2.2 * u, 2.4 * u, body, -1.2 * u, 4.3 * u, -1.2 * u); // upper volume
    box(4.8 * u, 0.14 * u, 3.2 * u, M(0xd9cdb8), -0.5 * u, 3.26 * u, -0.9 * u); // first-floor roof / terrace
    box(3.0 * u, 0.14 * u, 2.6 * u, M(0xd9cdb8), -1.2 * u, 5.47 * u, -1.2 * u); // roof
    // railing on the terrace
    for (let i = 0; i <= 6; i++) box(0.06 * u, 0.55 * u, 0.06 * u, wood, (0.4 + i * 0.32) * u, 3.6 * u, 0.62 * u);
    box(2.0 * u, 0.06 * u, 0.06 * u, wood, 1.36 * u, 3.86 * u, 0.62 * u);
    // door, awnings, windows
    box(0.8 * u, 1.3 * u, 0.08 * u, dark, -0.2 * u, 1.25 * u, 0.62 * u);
    const aw = box(1.4 * u, 0.1 * u, 0.7 * u, slate, -0.2 * u, 2.15 * u, 0.85 * u); aw.rotation.x = 0.35;
    [[-1.7, 2.0], [1.0, 2.0]].forEach(([x, y]) => box(0.6 * u, 0.7 * u, 0.06 * u, win, x * u, y * u, 0.62 * u));
    [[-1.8, 4.4], [-0.7, 4.4]].forEach(([x, y]) => box(0.55 * u, 0.7 * u, 0.06 * u, win, x * u, y * u, 0.02 * u));
    box(0.06 * u, 0.7 * u, 0.55 * u, win, 1.82 * u, 2.0 * u, -1.0 * u);
    const aw2 = box(0.9 * u, 0.08 * u, 0.5 * u, slate, -0.7 * u, 4.95 * u, 0.2 * u); aw2.rotation.x = 0.4;
    // rooftop pergola frame
    [[-2.3, -2.1], [-0.3, -2.1], [-2.3, -0.4], [-0.3, -0.4]].forEach(([x, z]) => box(0.07 * u, 0.9 * u, 0.07 * u, M(0xefe6d6), x * u, 5.95 * u, z * u));
    box(2.1 * u, 0.07 * u, 0.07 * u, M(0xefe6d6), -1.3 * u, 6.4 * u, -2.1 * u); box(2.1 * u, 0.07 * u, 0.07 * u, M(0xefe6d6), -1.3 * u, 6.4 * u, -0.4 * u);
    // neon sign (brand colour) on the upper volume
    const neon = box(2.2 * u, 0.42 * u, 0.08 * u, neonMat, -1.2 * u, 5.0 * u, 0.0 * u); neon.castShadow = false;
    // plants
    const plant = (x, y, z, s = 1) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * u * s, 0.12 * u * s, 0.26 * u * s, 8), terra); p.position.set(x * u, y * u + 0.13 * u * s, z * u); p.castShadow = true; g.add(p); const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 * u * s, 0), rnd(x + z + seed) > 0.5 ? leaf : leaf2); f.position.set(x * u, y * u + 0.45 * u * s, z * u); f.castShadow = true; g.add(f); };
    plant(2.2, 0.6, 1.9, 1.2); plant(1.6, 0.6, 2.1); plant(-2.6, 0.6, 1.9, 1.1); plant(2.1, 3.33, 0.0); plant(0.6, 3.33, -1.9, 1.2); plant(-2.4, 5.54, -1.8, 0.9);
    // tree in the courtyard
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * u, 0.07 * u, 1.6 * u, 6), wood); trunk.position.set(1.3 * u, 1.4 * u, 1.5 * u); trunk.castShadow = true; g.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 * u, 0), leaf2); crown.position.set(1.3 * u, 2.4 * u, 1.5 * u); crown.castShadow = true; g.add(crown);
    g.userData.neon = neonMat; g.userData.height = 6.5 * u;
    return g;
  }

  class CityMap {
    constructor(canvas, overlay, opts) {
      this.cv = canvas; this.ov = overlay; this.opts = opts; this.ok = !!window.THREE;
      this.venues = opts.venues; this.selected = null; this.playing = null; this.visible = new Set(this.venues.map((v) => v.id));
      if (!this.ok) return;
      try { this.r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { this.ok = false; return; }
      this.r.shadowMap.enabled = true; this.r.shadowMap.type = THREE.PCFSoftShadowMap; this.r.setClearColor(0x111111, 1);
      const s = this.scene = new THREE.Scene(); s.fog = new THREE.Fog(0x111111, 20, 42);
      this.cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      this.target = new THREE.Vector3(0.1, 0, 0.6); this.dist = 30; this.az = -Math.PI * 0.25; this.el = 0.92;
      this.goal = { target: new THREE.Vector3(0.1, 0, 0.6), dist: 27 };
      // light
      s.add(new THREE.HemisphereLight(0xc7d4ff, 0x15120f, 0.45));
      const sun = new THREE.DirectionalLight(0xfff0dc, 1.15); sun.position.set(6, 12, 7); sun.castShadow = true;
      sun.shadow.mapSize.set(1536, 1536); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); sun.shadow.bias = -0.0008; sun.shadow.radius = 3;
      s.add(sun); s.add(sun.target); this.sun = sun;
      // ground + Paris land
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; s.add(ground);
      const [cx, cz] = P(48.8585, 2.3475); const rx = 0.112 * 73 * K, rz = 0.044 * 111.2 * K;
      const land = new THREE.Mesh(new THREE.CircleGeometry(1, 96), new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 1 })); land.rotation.x = -Math.PI / 2; land.scale.set(rx, rz, 1); land.position.set(cx, 0.002, cz); land.receiveShadow = true; s.add(land);
      const ring = []; for (let i = 0; i <= 96; i++) { const a = (i / 96) * Math.PI * 2; ring.push([cx + Math.cos(a) * rx, cz + Math.sin(a) * rz]); }
      s.add(ribbon(ring, 0.09, 0.006, 0x222222));
      s.add(ribbon(SEINE, 0.26, 0.008, 0x152338)); s.add(ribbon(CANAL, 0.09, 0.009, 0x183050));
      BOULEVARDS.forEach((b) => s.add(ribbon(b, 0.06, 0.007, 0x232323)));
      // city blocks (instanced)
      const blocks = []; const step = 0.3;
      const vpos = this.venues.map((v) => P(v.lat, v.lon));
      for (let x = -12; x < 12; x += step) for (let z = -9; z < 8; z += step) {
        const jx = x + (rnd(x * 3.1 + z) - 0.5) * 0.05, jz = z + (rnd(z * 2.7 + x) - 0.5) * 0.05;
        const ex = (jx - cx) / rx, ez = (jz - cz) / rz; if (ex * ex + ez * ez > 0.97) continue;
        if (distToPolyline(jx, jz, SEINE) < 0.24 || distToPolyline(jx, jz, CANAL) < 0.14 || distToPolyline(jx, jz, ring) < 0.12) continue;
        if (BOULEVARDS.some((b) => distToPolyline(jx, jz, b) < 0.1)) continue;
        if (vpos.some(([vx, vz]) => Math.hypot(jx - vx, jz - vz) < 0.55)) continue;
        blocks.push([jx, jz, 0.025 + rnd(jx * 7 + jz * 3) * 0.09]);
      }
      const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }), blocks.length);
      const mtx = new THREE.Matrix4(), col = new THREE.Color();
      blocks.forEach(([x, z, h], i) => { const w = 0.22 + rnd(x + z * 9) * 0.04; mtx.compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (rnd(x * z) - 0.5) * 0.12), new THREE.Vector3(w, h, w * (0.85 + rnd(z) * 0.3))); inst.setMatrixAt(i, mtx); const v = 0.085 + rnd(x * 1.7 + z) * 0.035; inst.setColorAt(i, col.setRGB(v, v, v * 1.04)); });
      inst.receiveShadow = true; s.add(inst);
      // clubs
      this.clubs = {}; this.pickables = [];
      this.venues.forEach((v, i) => {
        const [x, z] = P(v.lat, v.lon); const club = makeClub(BRAND[v.color], i + 1);
        club.position.set(x, 0, z); club.rotation.y = -Math.PI * 0.28 + (rnd(i) - 0.5) * 0.3; club.scale.setScalar(1.25);
        club.traverse((m) => { if (m.isMesh) { m.userData.venue = v.id; this.pickables.push(m); } });
        const glow = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.58, 48), new THREE.MeshBasicMaterial({ color: BRAND[v.color], transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        glow.rotation.x = -Math.PI / 2; glow.position.set(x, 0.02, z); s.add(glow);
        s.add(club); this.clubs[v.id] = { group: club, glow, x, z, lift: 0, liftV: 0, waves: [], brand: BRAND[v.color] };
      });
      // labels
      this.ov.innerHTML = this.venues.map((v) => `<button class="map-pin" data-venue="${v.id}" style="--pin:${'#' + BRAND[v.color].toString(16).padStart(6, '0')}"><i></i><span>${v.name}</span><b class="eq"><i></i><i></i><i></i></b></button>`).join('') + DISTRICTS.map(([n]) => `<span class="map-district">${n}</span>`).join('');
      this.labelEls = [...this.ov.querySelectorAll('.map-pin')]; this.districtEls = [...this.ov.querySelectorAll('.map-district')];
      this.ov.addEventListener('click', (e) => { const b = e.target.closest('[data-venue]'); if (b) { e.stopPropagation(); this.select(b.dataset.venue, true); } });
      this.bindInput(); this.resize();
      this._ro = new ResizeObserver(() => this.resize()); this._ro.observe(canvas);
    }
    resize() { const r = this.cv.getBoundingClientRect(); this.W = Math.max(1, r.width); this.H = Math.max(1, r.height); this.r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); this.r.setSize(this.W, this.H, false); this.cam.aspect = this.W / this.H; this.cam.updateProjectionMatrix(); }
    bindInput() {
      const pts = new Map(); let moved = 0, pinch0 = 0, dist0 = 0;
      const onDown = (e) => { this.cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); dist0 = this.goal.dist; } this.userMoved = true; };
      const onMove = (e) => {
        if (!pts.has(e.pointerId)) return; const prev = pts.get(e.pointerId); const dx = e.clientX - prev.x, dy = e.clientY - prev.y; pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved += Math.abs(dx) + Math.abs(dy);
        if (pts.size === 1) { const k = this.dist * 0.0021; const ca = Math.cos(this.az), sa = Math.sin(this.az); this.goal.target.x -= (dx * ca + dy * sa / Math.sin(this.el)) * k; this.goal.target.z -= (-dx * sa + dy * ca / Math.sin(this.el)) * k; this.clampTarget(); }
        else if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); this.goal.dist = Math.max(5, Math.min(32, dist0 * pinch0 / Math.max(10, d))); }
      };
      const onUp = (e) => { const p = pts.get(e.pointerId); pts.delete(e.pointerId); if (moved < 7 && p && pts.size === 0) this.pick(e.clientX, e.clientY); };
      this.cv.addEventListener('pointerdown', onDown); this.cv.addEventListener('pointermove', onMove); this.cv.addEventListener('pointerup', onUp); this.cv.addEventListener('pointercancel', onUp);
      this.cv.addEventListener('wheel', (e) => { e.preventDefault(); this.goal.dist = Math.max(5, Math.min(32, this.goal.dist * (1 + Math.sign(e.deltaY) * 0.12))); }, { passive: false });
    }
    clampTarget() { const t = this.goal.target; t.x = Math.max(-9, Math.min(9, t.x)); t.z = Math.max(-8, Math.min(9, t.z)); }
    pick(cx, cy) {
      const r = this.cv.getBoundingClientRect(); const ndc = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, this.cam);
      const hit = ray.intersectObjects(this.pickables.filter((m) => this.visible.has(m.userData.venue)), false)[0];
      if (hit) this.select(hit.object.userData.venue, true); else this.select(null);
    }
    select(id, fly) {
      if (id && !this.visible.has(id)) return;
      this.selected = id; if (id) { const c = this.clubs[id]; c.liftV = 0.06; if (fly) { this.goal.target.set(c.x + Math.sin(this.az) * 0.9, 0, c.z + Math.cos(this.az) * 0.9); this.goal.dist = Math.min(this.goal.dist, 8.5); } }
      this.labelEls.forEach((el) => el.classList.toggle('on', el.dataset.venue === id));
      if (this.opts.onSelect) this.opts.onSelect(id);
    }
    setVisible(ids, hide = false) {
      this.visible = new Set(ids);
      this.venues.forEach((v) => { const c = this.clubs[v.id]; const on = this.visible.has(v.id); c.group.visible = on || !hide; c.glow.visible = on || !hide; c.group.traverse((m) => { if (m.isMesh) { m.material.transparent = !on; m.material.opacity = on ? 1 : 0.18; } }); });
      this.labelEls.forEach((el) => el.classList.toggle('off', !this.visible.has(el.dataset.venue)));
      if (this.selected && !this.visible.has(this.selected)) this.select(null);
    }
    setPlaying(id) { this.playing = id; this.labelEls.forEach((el) => el.classList.toggle('playing', el.dataset.venue === id)); }
    recenter() { this.goal.target.set(0.1, 0, 0.6); this.goal.dist = 27; }
    start() { if (!this.ok || this.running) return; this.running = true; this.t = 0; let last = performance.now(); const loop = (now) => { if (!this.running) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; this.step(dt); this.r.render(this.scene, this.cam); this.raf = requestAnimationFrame(loop); }; this.raf = requestAnimationFrame(loop); }
    stop() { this.running = false; cancelAnimationFrame(this.raf); }
    destroy() { this.stop(); try { this._ro.disconnect(); } catch (e) {} if (this.ok) { this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); this.r.dispose(); } }
    step(dt) {
      this.t += dt; const k = Math.min(1, dt * 3.2);
      this.target.lerp(this.goal.target, k); this.dist += (this.goal.dist - this.dist) * k;
      const ce = Math.cos(this.el);
      this.cam.updateProjectionMatrix(); this.cam.position.set(this.target.x + Math.sin(this.az) * ce * this.dist, Math.sin(this.el) * this.dist, this.target.z + Math.cos(this.az) * ce * this.dist);
      this.cam.lookAt(this.target);
      this.sun.position.set(this.target.x - 4, 12, this.target.z + 8); this.sun.target.position.copy(this.target);
      const a = this.playing ? window.PLAYER.read() : { level: 0, beat: false };
      for (const id in this.clubs) {
        const c = this.clubs[id]; const sel = id === this.selected; const play = id === this.playing;
        const goal = sel ? 0.12 : 0; c.liftV += (goal - c.lift) * 0.12; c.liftV *= 0.78; c.lift += c.liftV;
        c.group.position.y = c.lift + (play ? a.level * 0.04 : 0);
        const sc = 1.25 * (1 + (sel ? 0.06 : 0) + (play ? a.level * 0.05 : 0)); c.group.scale.setScalar(sc);
        c.group.userData.neon.emissiveIntensity = 1.1 + Math.sin(this.t * 3 + c.x) * 0.15 + (play ? a.level * 2.5 : 0);
        c.glow.material.opacity += ((sel || play ? 0.75 : 0) - c.glow.material.opacity) * 0.1;
        c.glow.scale.setScalar(1 + (play ? a.level * 0.6 : Math.sin(this.t * 2.5) * 0.05));
        if (play && a.beat && c.waves.length < 4) {
          const w = new THREE.Mesh(new THREE.RingGeometry(0.56, 0.59, 48), new THREE.MeshBasicMaterial({ color: c.brand, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
          w.rotation.x = -Math.PI / 2; w.position.set(c.x, 0.03, c.z); this.scene.add(w); c.waves.push({ m: w, t: 0 });
        }
        c.waves = c.waves.filter((w) => { w.t += dt; const s2 = 1 + w.t * 1.7; w.m.scale.setScalar(s2); w.m.material.opacity = Math.max(0, 0.5 - w.t * 0.45); if (w.t > 1.1) { this.scene.remove(w.m); w.m.geometry.dispose(); w.m.material.dispose(); return false; } return true; });
      }
      // labels
      const v3 = new THREE.Vector3();
      this.venues.forEach((v, i) => { const c = this.clubs[v.id]; v3.set(c.x, c.group.position.y + 0.95, c.z).project(this.cam); const el = this.labelEls[i]; const x = (v3.x * 0.5 + 0.5) * this.W, y = (-v3.y * 0.5 + 0.5) * this.H; el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`; el.style.display = v3.z < 1 ? '' : 'none'; });
      DISTRICTS.forEach(([n, la, lo], i) => { const [x, z] = P(la, lo); v3.set(x, 0, z).project(this.cam); const el = this.districtEls[i]; el.style.transform = `translate(${(v3.x * 0.5 + 0.5) * this.W}px, ${(-v3.y * 0.5 + 0.5) * this.H}px) translate(-50%,-50%)`; el.style.opacity = this.dist < 16 ? 0.55 : 0.3; });
    }
  }
  window.CityMap = CityMap;
})();
