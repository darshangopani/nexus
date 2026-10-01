// =============================================================================
// GARGANTUA PROCEDURAL COSMIC SOUNDSCAPE (WEB AUDIO API)
// -----------------------------------------------------------------------------
// Generates an atmospheric, Hans Zimmer / Interstellar inspired cosmic drone:
// 1. Sub-bass binaural gravitational hum (44Hz - 55Hz)
// 2. Ethereal resonant modal chord pads (D minor celestial harmonics)
// 3. Solar wind shimmer & cosmic radiation pink noise
// Zero external audio files, 100% procedurally synthesized in browser.
// =============================================================================

export class CosmicAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private oscs: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private filters: BiquadFilterNode[] = [];
  private noiseNode: AudioBufferSourceNode | null = null;
  private lfo: OscillatorNode | null = null;

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  public start(volume = 0.45) {
    this.init();
    if (!this.ctx || !this.masterGain || this.isPlaying) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    this.isPlaying = true;

    // 1. Deep Sub-Bass Gravitational Drone (D1 = 36.7Hz, D2 = 73.4Hz)
    const subFreqs = [36.71, 73.42, 110.0];
    subFreqs.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 0.4, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140.0, t);

      gain.gain.setValueAtTime(i === 0 ? 0.35 : 0.18, t);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      this.oscs.push(osc);
      this.gains.push(gain);
      this.filters.push(filter);
    });

    // 2. Resonant Ethereal Chord Pad (D minor / F maj / A minor modal frequencies)
    // 146.83 (D3), 220.0 (A3), 261.63 (C4), 349.23 (F4), 440.0 (A4), 523.25 (C5)
    const padFreqs = [146.83, 220.0, 261.63, 349.23, 440.0, 523.25];
    padFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 0.6, t);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 1.05, t);
      filter.Q.setValueAtTime(4.5 + idx * 0.8, t);

      gain.gain.setValueAtTime(0.045 / (1.0 + idx * 0.3), t);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      this.oscs.push(osc);
      this.gains.push(gain);
      this.filters.push(filter);
    });

    // 3. Ethereal LFO breathing modulation
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, t); // Slow 12.5-second breathing cycle
    lfoGain.gain.setValueAtTime(40.0, t);

    lfo.connect(lfoGain);
    if (this.filters.length > 0) {
      lfoGain.connect(this.filters[0].frequency);
    }
    lfo.start(t);
    this.lfo = lfo;

    // 4. Subtle Cosmic Dust Pink Noise Shimmer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(480.0, t);
    noiseFilter.Q.setValueAtTime(2.2, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.028, t);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start(t);
    this.noiseNode = noiseSource;

    // Smooth fade-in over 2.5 seconds
    this.masterGain.gain.linearRampToValueAtTime(volume, t + 2.5);
  }

  public playSonarPing(freq = 880) {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.18);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Authentic LIGO Gravitational Wave Chirp (GW150914 inspired):
  // Frequency sweeps upwards from ~35Hz to 280Hz with accelerating amplitude, then ringdown!
  public chirpGravitationalWave() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const duration = 0.55;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    // Frequency sweeps from 38Hz up to 260Hz in a non-linear chirp
    osc.frequency.setValueAtTime(38.0, t);
    osc.frequency.exponentialRampToValueAtTime(260.0, t + duration * 0.85);
    osc.frequency.linearRampToValueAtTime(120.0, t + duration); // Ringdown drop

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, t);

    // Amplitude starts quiet, increases toward merger, then sharp ringdown cutoff
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.exponentialRampToValueAtTime(0.38, t + duration * 0.82);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  public setVolume(vol: number) {
    if (!this.ctx || !this.masterGain) return;
    this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.2);
  }

  public stop() {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;
    const t = this.ctx.currentTime;
    // Smooth fade-out over 1.2s before disconnecting
    this.masterGain.gain.linearRampToValueAtTime(0.0001, t + 1.2);
    setTimeout(() => {
      this.oscs.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch {}
      });
      this.oscs = [];
      this.gains.forEach(g => {
        try { g.disconnect(); } catch {}
      });
      this.gains = [];
      this.filters.forEach(f => {
        try { f.disconnect(); } catch {}
      });
      this.filters = [];
      if (this.noiseNode) {
        try { this.noiseNode.stop(); this.noiseNode.disconnect(); } catch {}
        this.noiseNode = null;
      }
      if (this.lfo) {
        try { this.lfo.stop(); this.lfo.disconnect(); } catch {}
        this.lfo = null;
      }
      this.isPlaying = false;
    }, 1300);
  }

  public toggle(volume = 0.45): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start(volume);
      return true;
    }
  }

  public get active(): boolean {
    return this.isPlaying;
  }
}

export const cosmicAudio = new CosmicAudioEngine();
