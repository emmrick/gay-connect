// ── Shared audio utilities for mission system ──

let missionAudioCtx: AudioContext | null = null;
let audioUnlocked = false;

/** Unlock AudioContext on first user interaction (mobile fix) */
export const unlockMissionAudio = () => {
  if (audioUnlocked) return;
  try {
    if (!missionAudioCtx || missionAudioCtx.state === 'closed') {
      missionAudioCtx = new AudioContext();
    }
    if (missionAudioCtx.state === 'suspended') {
      missionAudioCtx.resume();
    }
    const buffer = missionAudioCtx.createBuffer(1, 1, 22050);
    const source = missionAudioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(missionAudioCtx.destination);
    source.start();
    audioUnlocked = true;
  } catch {}
};

// Register unlock on first user gesture
if (typeof window !== 'undefined') {
  const events = ['touchstart', 'touchend', 'click', 'keydown'];
  const handler = () => {
    unlockMissionAudio();
    events.forEach(e => document.removeEventListener(e, handler, true));
  };
  events.forEach(e =>
    document.addEventListener(e, handler, { capture: true, once: false, passive: true })
  );
}

const getCtx = (): AudioContext => {
  if (!missionAudioCtx || missionAudioCtx.state === 'closed') {
    missionAudioCtx = new AudioContext();
  }
  if (missionAudioCtx.state === 'suspended') missionAudioCtx.resume();
  return missionAudioCtx;
};

/** Rising chime — new mission arriving */
export const playMissionSound = () => {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, start: 0, dur: 0.25 },
      { freq: 659.25, start: 0.15, dur: 0.25 },
      { freq: 783.99, start: 0.30, dur: 0.4 },
    ];
    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now + start);
      gain2.gain.setValueAtTime(0.15, now + start);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(now + start);
      osc2.stop(now + start + dur);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.35, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur);
    });
  } catch {}
};

/** Short rising ding — mission accepted */
export const playAcceptSound = () => {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const notes = [
      { freq: 783.99, start: 0, dur: 0.15 },
      { freq: 1046.50, start: 0.12, dur: 0.35 },
    ];
    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.4, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur);
    });
  } catch {}
};
