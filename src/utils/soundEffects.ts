// Web Audio API Sound Engine
let audioCtx: AudioContext | null = null;
let soundMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundMuted(muted: boolean) {
  soundMuted = muted;
}

export function isSoundMuted(): boolean {
  return soundMuted;
}

// Studio jingle: warm chime arpeggio (Cainta Photography Theme)
export function playStudioJingle() {
  if (soundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.65);
    });
  } catch (err) {
    console.warn('Web Audio error:', err);
  }
}

// Camera shutter click effect
export function playCameraShutter() {
  if (soundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Fast white noise burst + low mechanical click
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start();
  } catch (err) {
    console.warn('Shutter sound error:', err);
  }
}

// Payment success positive chime
export function playPaymentSuccessSound() {
  if (soundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + idx * 0.09 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.09 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.09);
      osc.stop(ctx.currentTime + idx * 0.09 + 0.55);
    });
  } catch (err) {
    console.warn('Chime sound error:', err);
  }
}

// Crisp Success Bell
export function playSuccessSound() {
  if (soundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const freqs = [587.33, 880.0]; // D5, A5
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
    });
  } catch (err) {
    console.warn('Success sound error:', err);
  }
}

// Gentle Error Thud / Double-Low Note
export function playErrorSound() {
  if (soundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const freqs = [220.0, 164.81]; // A3, E3
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.1 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
    });
  } catch (err) {
    console.warn('Error sound error:', err);
  }
}

// Warning / Notice Pop
export function playWarningSound() {
  if (soundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.22);
  } catch (err) {
    console.warn('Warning sound error:', err);
  }
}

// Subtle click / info pop
export function playInfoSound() {
  if (soundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.16);
  } catch (err) {
    console.warn('Info sound error:', err);
  }
}
