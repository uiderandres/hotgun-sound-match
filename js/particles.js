/* Sound Match particle scene — three.js (r149, UMD build in js/vendor).
   ~9 000 GPU particles move between targets:
   ambient/wave mesh -> listenerA (bust with headphones) -> listenerB (profile) -> crowd -> result (calm wave).
   Base colour blue-white; pulse rings fired on audio beats carry the Shotgun brochure gradient
   (lime, yellow, orange, pink, magenta). Silhouettes are drawn on a 2D canvas, sampled, and given
   depth from a blurred copy of the mask so they read as 3D relief when the camera drifts. */
(function () {
  const rnd = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const WAVE_MODES = { wave: 1, ambient: 1, result: 1 };
  const COLS = 120, ROWS = 75, N = COLS * ROWS;
  const MAXP = 6;

  const waveY = (x, z, t, lvl) => { const a = 1 + lvl * 1.8; return -1.15 + a * (0.22 * Math.sin(x * 1.1 + t * 0.8 + z * 0.6) + 0.14 * Math.sin(z * 1.3 - t * 1.1) + 0.06 * Math.sin((x - z) * 2.4 + t * 1.9)); };

  const VERT = `
    attribute vec3 aFrom; attribute vec3 aTo; attribute float aBFrom; attribute float aBTo; attribute float aSeed;
    uniform float uMorph, uTime, uLevel, uFromWave, uToWave, uDim, uSize, uPR, uMono;
    uniform vec4 uPulse[${MAXP}]; uniform float uPulseHue[${MAXP}]; uniform float uPulseAmp[${MAXP}]; uniform int uPulseN;
    varying vec3 vColor; varying float vAlpha;
    float waveY(vec2 xz, float t, float lvl){ float a = 1.0 + lvl*1.8; return -1.15 + a*(0.22*sin(xz.x*1.1 + t*0.8 + xz.y*0.6) + 0.14*sin(xz.y*1.3 - t*1.1) + 0.06*sin((xz.x - xz.y)*2.4 + t*1.9)); }
    vec3 grad(float u){
      u = fract(u) * 5.0;
      vec3 c0 = vec3(0.486,1.0,0.310), c1 = vec3(0.984,0.929,0.059), c2 = vec3(0.976,0.518,0.212), c3 = vec3(0.996,0.431,0.588), c4 = vec3(0.890,0.145,0.890);
      if (u < 1.0) return mix(c0,c1,u); if (u < 2.0) return mix(c1,c2,u-1.0); if (u < 3.0) return mix(c2,c3,u-2.0); if (u < 4.0) return mix(c3,c4,u-3.0); return mix(c4,c0,u-4.0);
    }
    void main(){
      vec3 a = aFrom; if (uFromWave > 0.5) a.y = waveY(a.xz, uTime, uLevel);
      vec3 b = aTo;   if (uToWave > 0.5)   b.y = waveY(b.xz, uTime, uLevel);
      float mm = clamp(uMorph*1.4 - aSeed*0.4, 0.0, 1.0); mm = mm*mm*(3.0-2.0*mm);
      vec3 p = mix(a, b, mm);
      float sw = sin(mm*3.14159);
      p += sw * vec3(sin(aSeed*91.0+uTime), cos(aSeed*53.0+uTime*0.7), sin(aSeed*17.0+uTime*0.5)) * 0.6;
      float w = (0.012 + uLevel*0.05) * (0.5 + aSeed);
      p += vec3(sin(uTime*1.4+aSeed*40.0), cos(uTime*1.1+aSeed*33.0), sin(uTime*0.9+aSeed*21.0)) * w;
      float br = mix(aBFrom, aBTo, mm);
      float pm = 0.0; float hue = 0.0;
      for (int i = 0; i < ${MAXP}; i++) {
        if (i >= uPulseN) break;
        vec3 o = uPulse[i].xyz; float age = uTime - uPulse[i].w; float R = age*2.3;
        vec3 d = p - o; float dist = length(d);
        float band = exp(-((dist-R)*(dist-R))/0.035) * exp(-age*0.85) * uPulseAmp[i];
        if (band > pm) { pm = band; hue = uPulseHue[i] + atan(d.y, d.x)/6.2831; }
        p += (d/(dist+0.0001)) * band * 0.05;
      }
      p.y += pm * 0.16 * uToWave;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * (0.55 + br*1.1) * (1.0 + pm*1.5) * uPR * (6.0 / -mv.z);
      vec3 base = uMono > 0.5 ? vec3(0.86,0.88,0.91) : vec3(0.64,0.77,1.0);
      vColor = mix(base, grad(hue), clamp(pm*1.35, 0.0, 1.0));
      vAlpha = (0.22 + br*0.78) * uDim * (1.0 + pm*0.7) * clamp(1.0 - (-mv.z - 6.0)/13.0, 0.12, 1.0);
    }`;
  const FRAG = `
    varying vec3 vColor; varying float vAlpha;
    void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard; float a = pow(smoothstep(0.5, 0.0, d), 1.6); gl_FragColor = vec4(vColor, vAlpha * a); }`;
  const BOKEH_VERT = `
    attribute float aSeed; uniform float uTime, uPR, uLevel, uDim; varying float vA;
    void main(){ vec3 p = position; p.x = mod(p.x + uTime*0.06*(0.3+aSeed) + 4.0, 8.0) - 4.0; p.y += sin(uTime*0.4 + aSeed*20.0)*0.15;
      vec4 mv = modelViewMatrix * vec4(p,1.0); gl_Position = projectionMatrix * mv;
      gl_PointSize = (18.0 + aSeed*46.0) * (1.0 + uLevel*0.8) * uPR * (6.0 / -mv.z); vA = (0.05 + aSeed*0.12) * uDim; }`;
  const BOKEH_FRAG = `varying float vA; void main(){ vec2 c = gl_PointCoord-0.5; float d = length(c); if (d>0.5) discard; gl_FragColor = vec4(0.78,0.85,1.0, vA * smoothstep(0.5,0.1,d)); }`;

  class ParticleScene {
    constructor(canvas, opts = {}) {
      this.cv = canvas; this.ok = !!window.THREE;
      this.tone = opts.tone || 'blue';
      this.mode = opts.mode || 'wave'; this.t = 0; this.morph = 1; this.audio = { level: 0, low: 0, beat: false };
      this.pulses = []; this.targets = {}; this.bright = {}; this.running = false; this.dim = 1; this.dimTarget = 1;
      if (!this.ok) return;
      try {
        this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
      } catch (e) { this.ok = false; return; }
      this.renderer.setClearColor(0x000000, 0);
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 60);
      this.camera.position.set(0, 0.35, 6); this.camera.lookAt(0, 0, 0);

      const geo = new THREE.BufferGeometry();
      this.aFrom = new Float32Array(N * 3); this.aTo = new Float32Array(N * 3); this.aBFrom = new Float32Array(N); this.aBTo = new Float32Array(N);
      const seed = new Float32Array(N); for (let i = 0; i < N; i++) seed[i] = rnd(i + 1);
      this.seed = seed;
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      geo.setAttribute('aFrom', new THREE.BufferAttribute(this.aFrom, 3));
      geo.setAttribute('aTo', new THREE.BufferAttribute(this.aTo, 3));
      geo.setAttribute('aBFrom', new THREE.BufferAttribute(this.aBFrom, 1));
      geo.setAttribute('aBTo', new THREE.BufferAttribute(this.aBTo, 1));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 100);
      this.geo = geo;
      this.u = {
        uMorph: { value: 1 }, uTime: { value: 0 }, uLevel: { value: 0 }, uFromWave: { value: 1 }, uToWave: { value: 1 },
        uDim: { value: 1 }, uSize: { value: 2.3 }, uPR: { value: 1 }, uMono: { value: this.tone === 'mono' ? 1 : 0 },
        uPulse: { value: Array.from({ length: MAXP }, () => new THREE.Vector4(0, 0, 0, -99)) },
        uPulseHue: { value: new Array(MAXP).fill(0) }, uPulseAmp: { value: new Array(MAXP).fill(0) }, uPulseN: { value: 0 },
      };
      const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: this.u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      this.points = new THREE.Points(geo, mat); this.scene.add(this.points);

      // bokeh
      const bg = new THREE.BufferGeometry(); const BN = 44; const bp = new Float32Array(BN * 3), bs = new Float32Array(BN);
      for (let i = 0; i < BN; i++) { bp[i * 3] = rnd(i * 7.1) * 8 - 4; bp[i * 3 + 1] = rnd(i * 3.7) * 6 - 3; bp[i * 3 + 2] = rnd(i * 2.3) * 4 - 2.5; bs[i] = rnd(i * 9.2); }
      bg.setAttribute('position', new THREE.BufferAttribute(bp, 3)); bg.setAttribute('aSeed', new THREE.BufferAttribute(bs, 1));
      bg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 100);
      this.ub = { uTime: this.u.uTime, uPR: this.u.uPR, uLevel: this.u.uLevel, uDim: this.u.uDim };
      this.bokeh = new THREE.Points(bg, new THREE.ShaderMaterial({ vertexShader: BOKEH_VERT, fragmentShader: BOKEH_FRAG, uniforms: this.ub, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      this.scene.add(this.bokeh);

      this.resize();
      this.buildWave();
      const w = this.targets.wave; this.aFrom.set(w); this.aTo.set(w); this.aBFrom.set(this.bright.wave); this.aBTo.set(this.bright.wave);
      this.markDirty();
      this.setMode(this.mode, true);
      this._ro = new ResizeObserver(() => { const before = this.W; this.resize(); if (Math.abs(before - this.W) > 2) { this.targets = { wave: this.targets.wave }; } });
      this._ro.observe(canvas);
    }
    markDirty() { const g = this.geo; ['aFrom', 'aTo', 'aBFrom', 'aBTo'].forEach((k) => { g.attributes[k].needsUpdate = true; }); }
    resize() {
      const r = this.cv.getBoundingClientRect(); this.W = Math.max(1, r.width); this.H = Math.max(1, r.height);
      const pr = Math.min(2, window.devicePixelRatio || 1); this.u.uPR.value = pr;
      this.renderer.setPixelRatio(pr); this.renderer.setSize(this.W, this.H, false);
      this.camera.aspect = this.W / this.H; this.camera.updateProjectionMatrix();
    }

    /* ---------- targets ---------- */
    buildWave() {
      const p = new Float32Array(N * 3), b = new Float32Array(N);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c; const z = -9 + 11.5 * (r / (ROWS - 1)); const spread = 0.75 + (2.5 - z) * 0.18;
        p[i * 3] = (-3.2 + 6.4 * (c / (COLS - 1))) * spread; p[i * 3 + 1] = -1.15; p[i * 3 + 2] = z;
        b[i] = 0.18 + 0.82 * ((z + 9) / 11.5) * (0.6 + 0.4 * rnd(i * 1.3));
      }
      this.targets.wave = p; this.bright.wave = b; this.targets.ambient = p; this.bright.ambient = b; this.targets.result = p; this.bright.result = b;
    }
    /* screen px -> world at depth z (camera looks at origin from z=6) */
    toWorld(px, py, z) {
      const dist = 6 - z; const halfH = dist * Math.tan((50 / 2) * Math.PI / 180); const halfW = halfH * (this.W / this.H);
      return [(px / this.W - 0.5) * 2 * halfW, -(py / this.H - 0.5) * 2 * halfH + 0.35 * (z / 6), z];
    }
    buildShape(kind) {
      const W = Math.round(this.W), H = Math.round(this.H);
      const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
      g.lineJoin = 'round'; g.lineCap = 'round';
      if (kind === 'listenerA') drawListenerA(g, W, H);
      if (kind === 'listenerB') drawListenerB(g, W, H);
      if (kind === 'crowd') drawCrowd(g, W, H);
      g.globalCompositeOperation = 'destination-in';
      const fade = g.createLinearGradient(0, H * 0.55, 0, H); fade.addColorStop(0, 'rgba(0,0,0,1)'); fade.addColorStop(1, 'rgba(0,0,0,0.2)');
      g.fillStyle = fade; g.fillRect(0, 0, W, H);
      // blurred mask -> relief depth
      const c2 = document.createElement('canvas'); c2.width = W; c2.height = H; const g2 = c2.getContext('2d');
      g2.filter = 'blur(16px)'; g2.drawImage(c, 0, 0);
      const d = g.getImageData(0, 0, W, H).data, d2 = g2.getImageData(0, 0, W, H).data;
      const cand = []; for (let i = 0; i < W * H; i++) if (d[i * 4 + 3] > 10) cand.push(i);
      const p = new Float32Array(N * 3), b = new Float32Array(N);
      let k = 0, guard = 0;
      while (k < N && guard < N * 80 && cand.length) {
        guard++; const idx = cand[(Math.random() * cand.length) | 0]; const a = d[idx * 4 + 3];
        if (Math.random() * 255 > a + 25) continue;
        const px = (idx % W) + Math.random() - 0.5, py = ((idx / W) | 0) + Math.random() - 0.5;
        let z = (d2[idx * 4 + 3] / 255) * 0.9 + (Math.random() - 0.5) * 0.08;
        if (kind === 'crowd') z = -3.2 + (d[idx * 4] / 255) * 3.6 + z * 0.4; // red channel encodes row depth
        const w = this.toWorld(px, py, z); p[k * 3] = w[0]; p[k * 3 + 1] = w[1]; p[k * 3 + 2] = w[2];
        b[k] = Math.min(1, a / 255 + 0.12); k++;
      }
      for (; k < N; k++) { const w = this.toWorld(Math.random() * W, Math.random() * H, -3 - Math.random() * 3); p[k * 3] = w[0]; p[k * 3 + 1] = w[1]; p[k * 3 + 2] = w[2]; b[k] = 0.06; }
      // shuffle so particles travel to random spots (nicer morph)
      for (let i = N - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; for (let q = 0; q < 3; q++) { const t = p[i * 3 + q]; p[i * 3 + q] = p[j * 3 + q]; p[j * 3 + q] = t; } const tb = b[i]; b[i] = b[j]; b[j] = tb; }
      this.targets[kind] = p; this.bright[kind] = b;
    }

    /* ---------- control ---------- */
    setMode(m, instant) {
      if (!this.ok) { this.mode = m; return; }
      if (!this.targets[m]) this.buildShape(m);
      // snapshot current positions into aFrom
      const u = this.u; const t = this.t, lvl = this.audio.level || 0;
      for (let i = 0; i < N; i++) {
        let mm = Math.min(1, Math.max(0, u.uMorph.value * 1.4 - this.seed[i] * 0.4)); mm = mm * mm * (3 - 2 * mm);
        for (let q = 0; q < 3; q++) {
          let a = this.aFrom[i * 3 + q], b = this.aTo[i * 3 + q];
          if (q === 1) { if (u.uFromWave.value > 0.5) a = waveY(this.aFrom[i * 3], this.aFrom[i * 3 + 2], t, lvl); if (u.uToWave.value > 0.5) b = waveY(this.aTo[i * 3], this.aTo[i * 3 + 2], t, lvl); }
          this.aFrom[i * 3 + q] = a + (b - a) * mm;
        }
        this.aBFrom[i] = this.aBFrom[i] + (this.aBTo[i] - this.aBFrom[i]) * mm;
      }
      u.uFromWave.value = 0;
      this.aTo.set(this.targets[m]); this.aBTo.set(this.bright[m]);
      u.uToWave.value = WAVE_MODES[m] ? 1 : 0;
      u.uMono.value = m === 'ambient' ? 1 : (this.tone === 'mono' ? 1 : 0);
      this.mode = m; this.morph = instant ? 1 : 0; u.uMorph.value = this.morph;
      this.dimTarget = m === 'result' ? 0.5 : m === 'ambient' ? 0.85 : 1;
      this.markDirty();
      if (!instant && !WAVE_MODES[m]) this.emitPulse();
    }
    feed(a) { this.audio = a; if (a.beat) this.emitPulse(); }
    emitter() {
      if (this.mode === 'listenerA') return this.toWorld(this.W * 0.5, this.H * 0.37, 0.5);
      if (this.mode === 'listenerB') return this.toWorld(this.W * 0.47, this.H * 0.39, 0.5);
      if (this.mode === 'crowd') return this.toWorld(this.W * 0.5, this.H * 0.5, -1);
      return [0, -1.15, -1.2];
    }
    emitPulse() {
      if (!this.ok) return; const e = this.emitter();
      this.pulses.push({ x: e[0], y: e[1], z: e[2], born: this.t, hue: (this.t * 0.37) % 1, amp: 0.7 + Math.min(0.5, (this.audio.level || 0) * 1.2) });
      if (this.pulses.length > MAXP) this.pulses.shift();
    }

    /* ---------- loop ---------- */
    start() { if (!this.ok || this.running) return; this.running = true; this.last = performance.now(); const loop = (now) => { if (!this.running) return; const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.step(dt); this.renderer.render(this.scene, this.camera); this.raf = requestAnimationFrame(loop); }; this.raf = requestAnimationFrame(loop); }
    stop() { this.running = false; cancelAnimationFrame(this.raf); }
    destroy() { this.stop(); try { this._ro.disconnect(); } catch (e) {} if (this.ok) { this.geo.dispose(); this.points.material.dispose(); this.bokeh.geometry.dispose(); this.bokeh.material.dispose(); this.renderer.dispose(); } }

    step(dt) {
      this.t += dt; const u = this.u; const lvl = this.audio.level || 0;
      u.uTime.value = this.t; u.uLevel.value += (lvl - u.uLevel.value) * Math.min(1, dt * 10);
      this.morph = Math.min(1, this.morph + dt / 1.7); u.uMorph.value = this.morph;
      this.dim += (this.dimTarget - this.dim) * Math.min(1, dt * 2); u.uDim.value = this.dim;
      this.pulses = this.pulses.filter((p) => this.t - p.born < 3.4);
      u.uPulseN.value = this.pulses.length;
      this.pulses.forEach((p, i) => { u.uPulse.value[i].set(p.x, p.y, p.z, p.born); u.uPulseHue.value[i] = p.hue; u.uPulseAmp.value[i] = p.amp; });
      // camera drift: gentle orbit around the subject, a slow dolly over the wave
      const cam = this.camera; const shape = !WAVE_MODES[this.mode];
      const tx = shape ? Math.sin(this.t * 0.22) * 0.9 : Math.sin(this.t * 0.12) * 0.4;
      const ty = shape ? 0.35 + Math.sin(this.t * 0.17) * 0.12 : (this.mode === 'result' ? 0.9 : 0.55);
      cam.position.x += (tx - cam.position.x) * dt * 1.2; cam.position.y += (ty - cam.position.y) * dt * 1.2;
      cam.position.z = Math.sqrt(Math.max(1, 36 - cam.position.x * cam.position.x));
      cam.lookAt(0, shape ? 0 : -0.4, 0);
    }
  }

  /* ---------- silhouettes (2D, sampled into 3D) ---------- */
  function fillStroke(g, fillA, strokeA, lw, rgb = '255,255,255') { g.fillStyle = `rgba(${rgb},${fillA})`; g.fill(); g.strokeStyle = `rgba(${rgb},${strokeA})`; g.lineWidth = lw; g.stroke(); }
  function drawListenerA(g, W, H) {
    const cx = W * 0.5, hy = H * 0.34, s = W / 390;
    g.beginPath(); g.moveTo(cx - 192 * s, H); g.lineTo(cx - 182 * s, H * 0.72);
    g.quadraticCurveTo(cx - 166 * s, H * 0.56, cx - 76 * s, H * 0.532); g.quadraticCurveTo(cx - 42 * s, H * 0.512, cx - 38 * s, H * 0.415);
    g.lineTo(cx + 42 * s, H * 0.415); g.quadraticCurveTo(cx + 44 * s, H * 0.512, cx + 82 * s, H * 0.535);
    g.quadraticCurveTo(cx + 170 * s, H * 0.565, cx + 186 * s, H * 0.74); g.lineTo(cx + 194 * s, H); g.closePath();
    fillStroke(g, 0.26, 0.95, 2.4 * s);
    g.beginPath(); g.moveTo(cx - 44 * s, H * 0.5); g.quadraticCurveTo(cx, H * 0.545, cx + 48 * s, H * 0.5); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2 * s; g.stroke();
    g.beginPath(); g.moveTo(cx - 120 * s, H * 0.6); g.quadraticCurveTo(cx - 100 * s, H * 0.75, cx - 110 * s, H * 0.9); g.strokeStyle = 'rgba(255,255,255,.35)'; g.stroke();
    g.beginPath(); g.moveTo(cx + 124 * s, H * 0.6); g.quadraticCurveTo(cx + 104 * s, H * 0.75, cx + 114 * s, H * 0.9); g.stroke();
    g.beginPath(); g.ellipse(cx + 4 * s, hy, 64 * s, 80 * s, -0.05, 0, Math.PI * 2); fillStroke(g, 0.3, 1, 2.6 * s);
    g.beginPath(); g.moveTo(cx + 48 * s, hy - 6 * s); g.lineTo(cx + 70 * s, hy + 18 * s); g.lineTo(cx + 50 * s, hy + 25 * s); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2 * s; g.stroke();
    g.beginPath(); g.moveTo(cx + 22 * s, hy + 46 * s); g.quadraticCurveTo(cx + 38 * s, hy + 50 * s, cx + 50 * s, hy + 44 * s); g.strokeStyle = 'rgba(255,255,255,.6)'; g.stroke();
    g.beginPath(); g.moveTo(cx + 20 * s, hy - 8 * s); g.quadraticCurveTo(cx + 32 * s, hy - 2 * s, cx + 42 * s, hy - 8 * s); g.stroke();
    g.beginPath(); g.moveTo(cx - 42 * s, hy + 44 * s); g.quadraticCurveTo(cx + 10 * s, hy + 92 * s, cx + 54 * s, hy + 42 * s); g.strokeStyle = 'rgba(255,255,255,.5)'; g.stroke();
    g.beginPath(); g.arc(cx + 2 * s, hy + 6 * s, 78 * s, Math.PI * 1.04, Math.PI * 1.96); g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 10 * s; g.stroke();
    g.beginPath(); g.ellipse(cx - 66 * s, hy + 14 * s, 26 * s, 36 * s, 0.05, 0, Math.PI * 2); fillStroke(g, 0.75, 1, 3 * s);
    g.beginPath(); g.ellipse(cx - 66 * s, hy + 14 * s, 13 * s, 20 * s, 0.05, 0, Math.PI * 2); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2 * s; g.stroke();
    g.beginPath(); g.ellipse(cx + 70 * s, hy + 12 * s, 9 * s, 30 * s, 0, 0, Math.PI * 2); fillStroke(g, 0.55, 0.9, 2 * s);
  }
  function drawListenerB(g, W, H) {
    const cx = W * 0.48, s = W / 390, y = (f) => H * f;
    g.beginPath(); g.moveTo(cx - 188 * s, H); g.lineTo(cx - 178 * s, y(0.68)); g.quadraticCurveTo(cx - 152 * s, y(0.55), cx - 62 * s, y(0.53));
    g.lineTo(cx + 46 * s, y(0.525)); g.quadraticCurveTo(cx + 142 * s, y(0.548), cx + 172 * s, y(0.7)); g.lineTo(cx + 186 * s, H); g.closePath();
    fillStroke(g, 0.26, 0.9, 2.4 * s);
    g.beginPath(); g.moveTo(cx - 64 * s, y(0.535)); g.quadraticCurveTo(cx - 10 * s, y(0.6), cx + 52 * s, y(0.535)); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3 * s; g.stroke();
    g.beginPath(); g.moveTo(cx - 40 * s, y(0.6)); g.quadraticCurveTo(cx + 10 * s, y(0.66), cx + 60 * s, y(0.6)); g.strokeStyle = 'rgba(255,255,255,.45)'; g.stroke();
    g.beginPath(); g.moveTo(cx - 38 * s, y(0.535));
    g.bezierCurveTo(cx - 70 * s, y(0.47), cx - 80 * s, y(0.34), cx - 30 * s, y(0.285));
    g.bezierCurveTo(cx + 10 * s, y(0.25), cx + 62 * s, y(0.27), cx + 70 * s, y(0.33));
    g.lineTo(cx + 74 * s, y(0.355)); g.lineTo(cx + 92 * s, y(0.392)); g.lineTo(cx + 76 * s, y(0.402));
    g.quadraticCurveTo(cx + 82 * s, y(0.418), cx + 76 * s, y(0.428)); g.quadraticCurveTo(cx + 74 * s, y(0.452), cx + 60 * s, y(0.462));
    g.quadraticCurveTo(cx + 34 * s, y(0.47), cx + 26 * s, y(0.5)); g.lineTo(cx + 30 * s, y(0.535)); g.closePath();
    fillStroke(g, 0.3, 1, 2.6 * s);
    g.beginPath(); g.moveTo(cx + 46 * s, y(0.36)); g.quadraticCurveTo(cx + 54 * s, y(0.368), cx + 60 * s, y(0.358)); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2 * s; g.stroke();
    for (let i = 0; i < 9; i++) { g.beginPath(); const a = -2.6 + i * 0.25; g.arc(cx - 10 * s, y(0.35), (54 + (i % 3) * 6) * s, a, a + 0.5); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5 * s; g.stroke(); }
    g.beginPath(); g.arc(cx - 6 * s, y(0.385), 70 * s, Math.PI * 1.12, Math.PI * 1.86); g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 9 * s; g.stroke();
    g.beginPath(); g.ellipse(cx - 14 * s, y(0.395), 34 * s, 40 * s, 0, 0, Math.PI * 2); fillStroke(g, 0.7, 1, 3 * s);
    g.beginPath(); g.ellipse(cx - 14 * s, y(0.395), 20 * s, 25 * s, 0, 0, Math.PI * 2); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2.5 * s; g.stroke();
  }
  function drawCrowd(g, W, H) {
    const s = W / 390;
    const fig = (x, hy, sc, a, depth) => {
      const r = 26 * sc * s; const rgb = `${depth},255,255`;
      g.save(); g.globalAlpha = a;
      g.beginPath(); g.moveTo(x - 4.2 * r, hy + 9 * r); g.quadraticCurveTo(x - 3.6 * r, hy + 2.6 * r, x - 1.4 * r, hy + 2.3 * r);
      g.lineTo(x + 1.4 * r, hy + 2.3 * r); g.quadraticCurveTo(x + 3.6 * r, hy + 2.6 * r, x + 4.2 * r, hy + 9 * r); g.closePath();
      fillStroke(g, 0.22, 0.85, 1.6 * s, rgb);
      g.beginPath(); g.ellipse(x, hy, r * 0.95, r * 1.2, 0, 0, Math.PI * 2); fillStroke(g, 0.32, 1, 1.8 * s, rgb);
      g.beginPath(); g.arc(x, hy + r * 0.1, r * 1.2, Math.PI * 1.05, Math.PI * 1.95); g.strokeStyle = `rgba(${rgb},.9)`; g.lineWidth = Math.max(1.5, r * 0.18); g.stroke();
      g.beginPath(); g.ellipse(x - r * 0.98, hy + r * 0.25, r * 0.38, r * 0.52, 0, 0, Math.PI * 2); fillStroke(g, 0.7, 1, 1.4 * s, rgb);
      g.beginPath(); g.ellipse(x + r * 0.98, hy + r * 0.25, r * 0.3, r * 0.48, 0, 0, Math.PI * 2); fillStroke(g, 0.5, 0.9, 1.2 * s, rgb);
      g.restore();
    };
    const rows = [
      { y: 0.27, sc: 0.36, n: 8, a: 0.5, off: 0, depth: 0 }, { y: 0.34, sc: 0.48, n: 6, a: 0.65, off: 0.5, depth: 85 },
      { y: 0.45, sc: 0.68, n: 4, a: 0.85, off: 0.15, depth: 170 }, { y: 0.6, sc: 1.0, n: 3, a: 1, off: 0.55, depth: 255 },
    ];
    rows.forEach((r) => { for (let i = 0; i < r.n; i++) { const fx = ((i + r.off) / (r.n - 0.4)) * W + (rnd(i + r.y) - 0.5) * 18 * s; fig(fx, H * r.y + (rnd(i * 3 + r.y) - 0.5) * 12 * s, r.sc, r.a, r.depth); } });
  }

  window.ParticleScene = ParticleScene;
})();
