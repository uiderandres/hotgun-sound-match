/* Audio: microphone analysis (Web Audio) and a small synthesised preview player.
   Nothing is recorded or sent anywhere: the mic stream is only analysed in the browser. */
(function () {
  let ctx = null;
  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  /* ---------------- Input analysis (mic or simulated) ---------------- */
  const input = { mode: null, stream: null, analyser: null, src: null, freq: null, time: null, avgLow: 0.05, lastBeat: 0, simBpm: 120, simStart: 0, levelSmooth: 0 };

  async function startMic() {
    stopInput();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return { ok: false, reason: 'unsupported' };
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } });
      const c = getCtx();
      const src = c.createMediaStreamSource(stream);
      const analyser = c.createAnalyser();
      analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.6;
      src.connect(analyser);
      Object.assign(input, { mode: 'mic', stream, src, analyser, freq: new Uint8Array(analyser.frequencyBinCount), time: new Uint8Array(analyser.fftSize), avgLow: 0.05, lastBeat: 0 });
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: e && e.name === 'NotAllowedError' ? 'denied' : 'error' };
    }
  }
  function startSim(bpm = 120) { stopInput(); Object.assign(input, { mode: 'sim', simBpm: bpm, simStart: performance.now(), lastBeat: 0 }); }
  function stopInput() {
    if (input.stream) input.stream.getTracks().forEach((t) => t.stop());
    if (input.src) try { input.src.disconnect(); } catch (e) {}
    Object.assign(input, { mode: null, stream: null, src: null, analyser: null });
  }

  /* Returns { level 0..1, low 0..1, high 0..1, beat:boolean, bands:number[8] } */
  function read() {
    const now = performance.now();
    if (input.mode === 'mic' && input.analyser) {
      const a = input.analyser;
      a.getByteFrequencyData(input.freq); a.getByteTimeDomainData(input.time);
      let sum = 0; for (let i = 0; i < input.time.length; i++) { const v = (input.time[i] - 128) / 128; sum += v * v; }
      const rms = Math.sqrt(sum / input.time.length);
      const level = Math.min(1, rms * 4.5);
      const band = (lo, hi) => { let s = 0; for (let i = lo; i < hi; i++) s += input.freq[i]; return s / ((hi - lo) * 255); };
      const low = band(1, 8), high = band(60, 200);
      const bands = []; const edges = [1, 3, 6, 12, 24, 48, 96, 160, 256];
      for (let i = 0; i < 8; i++) bands.push(band(edges[i], edges[i + 1]));
      input.avgLow = input.avgLow * 0.94 + low * 0.06;
      let beat = false;
      if (low > input.avgLow * 1.3 && low > 0.12 && now - input.lastBeat > 260) { beat = true; input.lastBeat = now; }
      input.levelSmooth = input.levelSmooth * 0.7 + level * 0.3;
      return { level: input.levelSmooth, low, high, beat, bands };
    }
    if (input.mode === 'sim') {
      const t = (now - input.simStart) / 1000; const spb = 60 / input.simBpm;
      const phase = (t % spb) / spb; const env = Math.exp(-phase * 6);
      let beat = false; if (now - input.lastBeat > spb * 1000 - 8 && phase < 0.2) { beat = true; input.lastBeat = now; }
      const level = 0.25 + 0.35 * env + 0.08 * Math.sin(t * 1.7);
      const bands = Array.from({ length: 8 }, (_, i) => Math.max(0, 0.3 + 0.3 * Math.sin(t * (2 + i) + i) * (i < 3 ? env + 0.3 : 0.7)));
      return { level, low: 0.3 + 0.6 * env, high: 0.3 + 0.2 * Math.sin(t * 7), beat, bands };
    }
    return { level: 0, low: 0, high: 0, beat: false, bands: [0, 0, 0, 0, 0, 0, 0, 0] };
  }

  let master = null;
  const getMaster = () => { if (!master) { master = getCtx().createGain(); master.connect(getCtx().destination); } return master; };

  /* ---------------- Synth preview ("What to expect?" and lineup previews) ---------------- */
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  let noiseBuf = null;
  const noise = (c) => { if (noiseBuf) return noiseBuf; noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return noiseBuf; };

  class Preview {
    constructor({ bpm = 120, root = 45, length = 30, mood = 'warm' } = {}) {
      Object.assign(this, { bpm, root, length, mood, playing: false, offset: 0, startAt: 0, timer: null, nextStep: 0, out: null, onEnd: null, onTick: null });
    }
    position() { if (!this.playing) return this.offset; return Math.min(this.length, this.offset + (getCtx().currentTime - this.startAt)); }
    play() {
      if (this.playing) return; const c = getCtx();
      this.out = c.createGain(); this.out.gain.value = 0.0001;
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
      this.out.connect(comp).connect(getMaster());
      this.out.gain.setTargetAtTime(0.55, c.currentTime, 0.05);
      this.playing = true; this.startAt = c.currentTime + 0.05;
      const spStep = 60 / this.bpm / 4; this.stepDur = spStep;
      this.nextStep = Math.ceil(this.offset / spStep);
      const schedule = () => {
        const now = c.currentTime;
        while (true) {
          const t = this.startAt + this.nextStep * spStep - this.offset;
          if (t > now + 0.12) break;
          if (this.nextStep * spStep >= this.length) { this.finish(); return; }
          if (t >= now - 0.01) this.step(this.nextStep, t);
          this.nextStep++;
        }
        if (this.onTick) this.onTick(this.position() / this.length);
      };
      this.timer = setInterval(schedule, 25); schedule();
    }
    pause() {
      if (!this.playing) return; this.offset = this.position(); this.stopNodes(); this.playing = false;
    }
    seek(sec) { const was = this.playing; if (was) this.pause(); this.offset = Math.max(0, Math.min(this.length - 0.1, sec)); if (was) this.play(); else if (this.onTick) this.onTick(this.offset / this.length); }
    finish() { this.stopNodes(); this.playing = false; this.offset = 0; if (this.onTick) this.onTick(0); if (this.onEnd) this.onEnd(); }
    stopNodes() {
      clearInterval(this.timer); this.timer = null;
      if (this.out) { const o = this.out; const c = getCtx(); o.gain.setTargetAtTime(0.0001, c.currentTime, 0.04); setTimeout(() => { try { o.disconnect(); } catch (e) {} }, 300); this.out = null; }
    }
    /* one 16th-note step */
    step(n, t) {
      const c = getCtx(); const out = this.out; if (!out) return;
      const bar = Math.floor(n / 16), s = n % 16;
      const prog = [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]]; // i – VI – III – VII
      const chordRoot = [0, -4, 3, -2][bar % 4];
      const chord = prog[bar % 4];
      const intro = bar < 2;
      // kick on quarters
      if (!intro && s % 4 === 0) {
        const o = c.createOscillator(), g = c.createGain();
        o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
        g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        o.connect(g).connect(out); o.start(t); o.stop(t + 0.4);
      }
      // hats on offbeats
      if (!intro && s % 4 === 2) {
        const src = c.createBufferSource(); src.buffer = noise(c);
        const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7500;
        const g = c.createGain(); g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        src.connect(hp).connect(g).connect(out); src.start(t); src.stop(t + 0.08);
      }
      // bass: offbeat 8ths
      if (bar >= 1 && (s % 4 === 2 || s === 15)) {
        const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
        o.type = 'sawtooth'; o.frequency.value = mtof(this.root - 12 + chordRoot);
        f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(180, t + 0.18);
        g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.connect(f).connect(g).connect(out); o.start(t); o.stop(t + 0.25);
      }
      // pad every bar
      if (s === 0) {
        const dur = this.stepDur * 16;
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = this.mood === 'warm' ? 1300 : 2200; f.Q.value = 0.7;
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + dur * 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur);
        f.connect(g).connect(out);
        chord.forEach((iv) => [-7, 7].forEach((det) => {
          const o = c.createOscillator(); o.type = 'sawtooth'; o.detune.value = det;
          o.frequency.value = mtof(this.root + 12 + iv); o.connect(f); o.start(t); o.stop(t + dur + 0.05);
        }));
      }
      // arp from bar 4, 16ths on alternate bars
      if (bar >= 4 && bar % 2 === 0) {
        const notes = chord.concat(chord.map((x) => x + 12));
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'triangle'; o.frequency.value = mtof(this.root + 24 + notes[s % notes.length]);
        g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        o.connect(g).connect(out); o.start(t); o.stop(t + 0.14);
      }
    }
  }

  /* ---------------- Track player (NCS previews, one at a time) ---------------- */
  const SYNTH = (window.CONFIG || {}).music === 'synth';
  const BPM = { 'Trance': 138, 'Techno': 130, 'Electro': 128, 'Garage': 132, 'Tech House': 124, 'Progressive House': 124, 'House': 122, 'Deep House': 120 };
  class SynthEl { // mimics the bits of HTMLAudioElement the app uses
    constructor() { this.p = null; }
    get paused() { return !this.p || !this.p.playing; }
    get currentTime() { return this.p ? this.p.position() : 0; }
    set currentTime(v) { if (this.p) this.p.seek(v); }
    get duration() { return this.p ? this.p.length : 0; }
    set muted(m) { /* handled by the master gain */ }
    addEventListener() {}
    play() { if (this.p) this.p.play(); return Promise.resolve(); }
    pause() { if (this.p) this.p.pause(); }
  }
  const PLAYER = {
    synth: SYNTH,
    el: SYNTH ? new SynthEl() : new Audio(), current: null, subs: new Set(), analyser: null, data: null, wired: false,
    canAnalyse: /^https?:$/.test(location.protocol), // file:// blocks analysis of media files (CORS)
    track() { return this.current ? window.DATA.trackById(this.current) : null; },
    isPlaying(id) { return this.current === id && !this.el.paused; },
    muted: false,
    wire() {
      if (this.wired || !this.canAnalyse) return; this.wired = true;
      try { const c = getCtx(); const src = c.createMediaElementSource(this.el); this.analyser = c.createAnalyser(); this.analyser.fftSize = 1024; this.analyser.smoothingTimeConstant = 0.65; this.gain = c.createGain(); this.gain.gain.value = this.muted ? 0 : 1; src.connect(this.analyser); this.analyser.connect(this.gain); this.gain.connect(c.destination); this.data = new Uint8Array(this.analyser.frequencyBinCount); this.tdata = new Uint8Array(this.analyser.fftSize); } catch (e) { this.analyser = null; }
    },
    setMuted(m) { if (master) master.gain.value = m ? 0 : 1; this.muted = !!m; if (this.synth) { this.emit(); return; } if (this.gain) { this.gain.gain.setTargetAtTime(this.muted ? 0 : 1, getCtx().currentTime, 0.03); this.el.muted = false; } else this.el.muted = this.muted; this.emit(); },
    load(src) { return new Promise((res) => { const ok = () => { clean(); res(true); }, bad = () => { clean(); res(false); }; const clean = () => { this.el.removeEventListener('canplay', ok); this.el.removeEventListener('error', bad); }; this.el.addEventListener('canplay', ok); this.el.addEventListener('error', bad); this.el.preload = 'auto'; this.el.src = src; this.el.load(); }); },
    async play(id, from = 0) {
      const t = window.DATA.playableById(id); if (!t) return false;
      if (this.synth) {
        if (this.current !== id) {
          if (this.el.p) this.el.p.pause();
          let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 997;
          const p = new Preview({ bpm: BPM[t.genre] || 124, root: 40 + (h % 9), length: 30, mood: h % 2 ? 'warm' : 'bright' });
          p.onTick = () => this.emit(); p.onEnd = () => this.emit();
          this.el.p = p; this.current = id;
        }
        getMaster().gain.value = this.muted ? 0 : 1; this.el.play(); this.emit(); return true;
      }
      this.wire(); getCtx(); this.setMuted(this.muted);
      if (this.current !== id) {
        this.current = id; this.emit();
        const list = t.srcs || [t.src]; let ok = false;
        // start playback inside the user gesture for the first candidate; fall back on error
        for (const src of list) { const p2 = this.load(src); if (src === list[0]) this.el.play().catch(() => {}); ok = await p2; if (ok) break; }
        if (!ok) { this.current = null; this.emit(); window.dispatchEvent(new CustomEvent('player-missing', { detail: { id, tried: list } })); return false; }
        if (this.current !== id) return false;
        if (from) this.el.currentTime = from;
      }
      try { await this.el.play(); } catch (e) { /* autoplay refused */ }
      this.emit(); return true;
    },
    pause() { this.el.pause(); this.emit(); },
    stop() { this.el.pause(); this.current = null; this.emit(); },
    toggle(id) { if (this.isPlaying(id)) this.pause(); else this.play(id); },
    seek(frac) { if (this.el.duration) { this.el.currentTime = Math.max(0, Math.min(0.999, frac)) * this.el.duration; this.emit(); } },
    progress() { return this.el.duration ? this.el.currentTime / this.el.duration : 0; },
    on(fn) { this.subs.add(fn); return () => this.subs.delete(fn); },
    emit() { this.subs.forEach((fn) => { try { fn(this); } catch (e) {} }); },
    /* audio reading for visuals */
    read() {
      const now = performance.now();
      if (this.analyser && !this.el.paused) {
        this.analyser.getByteFrequencyData(this.data); this.analyser.getByteTimeDomainData(this.tdata);
        let sum = 0; for (let i = 0; i < this.tdata.length; i++) { const v = (this.tdata[i] - 128) / 128; sum += v * v; }
        const level = Math.min(1, Math.sqrt(sum / this.tdata.length) * 3.2);
        const band = (lo, hi) => { let s2 = 0; for (let i = lo; i < hi; i++) s2 += this.data[i]; return s2 / ((hi - lo) * 255); };
        const low = band(1, 8); const bands = []; const edges = [1, 3, 6, 12, 24, 48, 96, 160, 256];
        for (let i = 0; i < 8; i++) bands.push(band(edges[i], edges[i + 1]));
        this.avgLow = (this.avgLow || 0.1) * 0.93 + low * 0.07;
        let beat = false; if (low > this.avgLow * 1.18 && low > 0.25 && now - (this.lastBeat || 0) > 300) { beat = true; this.lastBeat = now; }
        if (level > 0.001) return { level, low, high: band(60, 200), beat, bands };
      }
      if (!this.el.paused) { // no analyser (file://): approximate from tempo
        const t = this.el.currentTime, spb = 60 / 124, ph = (t % spb) / spb, env = Math.exp(-ph * 6);
        let beat = false; if (ph < 0.12 && now - (this.lastBeat || 0) > spb * 900) { beat = true; this.lastBeat = now; }
        return { level: 0.3 + 0.35 * env, low: 0.3 + 0.6 * env, high: 0.4, beat, bands: Array.from({ length: 8 }, (_, i) => 0.3 + 0.4 * env * (i < 3 ? 1 : 0.5)) };
      }
      return { level: 0, low: 0, high: 0, beat: false, bands: [0, 0, 0, 0, 0, 0, 0, 0] };
    },
  };
  ['timeupdate', 'play', 'pause', 'ended'].forEach((ev) => PLAYER.el.addEventListener(ev, () => PLAYER.emit()));
  if (!SYNTH) PLAYER.el.preload = 'none';

  window.AUDIO = { getCtx, startMic, startSim, stopInput, read: (...a) => (input.mode === 'track' ? PLAYER.read() : read(...a)), useTrack() { stopInput(); input.mode = 'track'; }, Preview, PLAYER, get mode() { return input.mode; } };
  window.PLAYER = PLAYER;
})();
