// Tiny synthesized sound effects + a little lullaby. No audio files needed.
let ac = null, master = null, musicBus = null, sfxBus = null, noise = null;
let muted = localStorage.getItem('bradly-muted') === '1';
let mood = 'night', step = 0, nextT = 0;

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const _ = null;

const SONGS = {
  night: {
    bpm: 84,
    mel: [76, _, 79, _, 84, _, 81, 79, 76, _, 74, _, 72, _, _, _, 77, _, 81, _, 84, _, 81, _, 79, _, 76, _, 74, _, _, _],
    chords: [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]],
  },
  day: {
    bpm: 118,
    mel: [72, 76, 79, 76, 81, 79, 76, 79, 74, 77, 81, 77, 79, _, _, _, 76, 79, 84, 79, 86, 84, 81, 79, 77, 76, 74, 76, 72, _, _, _],
    chords: [[48, 55, 64], [50, 57, 65], [48, 55, 64], [43, 50, 59]],
  },
};

export function unlock() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ac.destination);
    musicBus = ac.createGain();
    musicBus.gain.value = 0.55;
    musicBus.connect(master);
    sfxBus = ac.createGain();
    sfxBus.gain.value = 0.8;
    sfxBus.connect(master);
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    nextT = ac.currentTime + 0.1;
    setInterval(schedule, 50);
  }
  if (ac.state === 'suspended') ac.resume();
}

export const isMuted = () => muted;
export function toggleMute() {
  muted = !muted;
  localStorage.setItem('bradly-muted', muted ? '1' : '0');
  if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ac.currentTime, 0.05);
}
export function setMood(m) {
  mood = m;
}

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}
function tone(f, t, d, o = {}) {
  const { type = 'sine', vol = 0.2, bus = sfxBus, a = 0.008, slide = 0 } = o;
  const osc = ac.createOscillator(), g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + a + d);
  env(g, t, a, vol, d);
  osc.connect(g).connect(bus);
  osc.start(t);
  osc.stop(t + a + d + 0.05);
}
function noiseHit(t, d, o = {}) {
  const { freq = 1000, q = 1, type = 'bandpass', vol = 0.3, slide = 0 } = o;
  const s = ac.createBufferSource();
  s.buffer = noise;
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (slide) f.frequency.exponentialRampToValueAtTime(slide, t + d);
  f.Q.value = q;
  const g = ac.createGain();
  env(g, t, 0.01, vol, d);
  s.connect(f).connect(g).connect(sfxBus);
  s.start(t);
  s.stop(t + d + 0.05);
}

function schedule() {
  if (!ac || ac.state !== 'running') return;
  const song = SONGS[mood] || SONGS.night;
  const spb = 60 / song.bpm / 2;
  if (nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
  while (nextT < ac.currentTime + 0.25) {
    const s = step % 32;
    const n = song.mel[s];
    if (n != null) tone(midi(n), nextT, spb * 1.6, { type: 'triangle', vol: 0.2, bus: musicBus, a: 0.02 });
    if (s % 8 === 0) {
      song.chords[(s / 8) | 0].forEach((c, i) => tone(midi(c), nextT, spb * 7.2, { type: 'sine', vol: i === 0 ? 0.2 : 0.07, bus: musicBus, a: 0.08 }));
    }
    nextT += spb;
    step++;
  }
}

const now = () => ac.currentTime;
export function flap() {
  if (!ac) return;
  noiseHit(now(), 0.11, { freq: 700, slide: 1500, q: 0.9, vol: 0.2 });
}
export function chime(i = 0) {
  if (!ac) return;
  const sc = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
  const n = 79 + sc[Math.min(i, sc.length - 1)];
  tone(midi(n), now(), 0.4, { vol: 0.16 });
  tone(midi(n + 12), now() + 0.03, 0.25, { type: 'triangle', vol: 0.05 });
}
export function boing() {
  if (!ac) return;
  tone(600, now(), 0.35, { type: 'triangle', vol: 0.25, slide: 150 });
}
export function thunder() {
  if (!ac) return;
  noiseHit(now(), 0.9, { type: 'lowpass', freq: 500, slide: 120, q: 0.5, vol: 0.5 });
}
export function pop() {
  if (!ac) return;
  tone(500, now(), 0.07, { vol: 0.1, slide: 900 });
}
export function blip(who) {
  if (!ac) return;
  const f = who === 'henry' ? 990 : who === 'meanbat' ? 160 : 420;
  tone(f * (0.94 + Math.random() * 0.12), now(), 0.035, { type: who === 'meanbat' ? 'square' : 'triangle', vol: who === 'meanbat' ? 0.03 : 0.06 });
}
export function win() {
  if (!ac) return;
  [72, 76, 79, 84, 88].forEach((n, i) => tone(midi(n), now() + i * 0.09, 0.35, { type: 'triangle', vol: 0.18 }));
}
export function cool() {
  if (!ac) return;
  tone(midi(84), now(), 0.15, { vol: 0.12 });
  tone(midi(91), now() + 0.08, 0.4, { vol: 0.12 });
  noiseHit(now(), 0.3, { freq: 6000, q: 2, vol: 0.08 });
}
export function puff() {
  if (!ac) return;
  noiseHit(now(), 0.2, { freq: 500, q: 0.6, vol: 0.16 });
}
export function splash() {
  if (!ac) return;
  noiseHit(now(), 0.3, { freq: 1200, slide: 400, q: 0.7, vol: 0.22 });
}
