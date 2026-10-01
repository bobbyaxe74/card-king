// Sound effects and music through a single, lazily created Web Audio context.
//
// The old version created a new AudioContext (and re-decoded ~4 MB of WAV)
// on every round, which is what eventually broke audio and stalled older
// machines. Here the context is created once, inside the first user gesture,
// and every file is fetched and decoded exactly once. Nothing waits on audio:
// if a sound isn't ready yet it is simply skipped.

import flipUrl from './assets/audio/flip.wav';
import matchUrl from './assets/audio/match.wav';
import winUrl from './assets/audio/win.wav';
import loseUrl from './assets/audio/lose.wav';
import musicUrl from './assets/audio/music.mp3';
import { load, save } from './storage.js';

const SOUNDS = {
  flip: { url: flipUrl, volume: 0.5 },
  match: { url: matchUrl, volume: 0.7 },
  win: { url: winUrl, volume: 0.8 },
  lose: { url: loseUrl, volume: 0.8 },
  music: { url: musicUrl, volume: 0.3 },
};

// The MP3 encoder pads the start and end of the track; skip that padding so the loop has no gap.
const MUSIC_LOOP_START = 0.035;
const MUSIC_LOOP_END_TRIM = 0.03;

const AudioCtx = window.AudioContext || window.webkitAudioContext;

let ctx = null;
let master = null;
const buffers = {};
let musicSource = null;
let musicWanted = false;
let muted = load('muted', false);
const muteListeners = [];

// Must be called from inside a user gesture (click/tap) so browsers allow audio.
export function unlockAudio() {
  if (!AudioCtx) return;
  if (!ctx) {
    try {
      ctx = new AudioCtx();
    } catch (e) {
      return;
    }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
    // Effects first: they're small and needed sooner than the music.
    Object.keys(SOUNDS).forEach(loadSound);
  }
  if (ctx.state === 'suspended' && !document.hidden && ctx.resume) ctx.resume();
}

function loadSound(name) {
  fetch(SOUNDS[name].url)
    .then((res) => res.arrayBuffer())
    .then(decode)
    .then((buffer) => {
      buffers[name] = buffer;
      if (name === 'music' && musicWanted) startMusic();
    })
    .catch(() => {
      // Missing sound is not fatal; the game is fully playable without it.
    });
}

// Older Safari only supports the callback form of decodeAudioData.
function decode(data) {
  return new Promise((resolve, reject) => {
    const promise = ctx.decodeAudioData(data, resolve, reject);
    if (promise && promise.catch) promise.catch(reject);
  });
}

function connect(name) {
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffers[name];
  gain.gain.value = SOUNDS[name].volume;
  source.connect(gain);
  gain.connect(master);
  return source;
}

export function playSound(name) {
  if (!ctx || muted || !buffers[name]) return;
  connect(name).start(0);
}

export function startMusic() {
  musicWanted = true;
  if (!ctx || musicSource || !buffers.music) return;
  musicSource = connect('music');
  musicSource.loop = true;
  musicSource.loopStart = MUSIC_LOOP_START;
  musicSource.loopEnd = buffers.music.duration - MUSIC_LOOP_END_TRIM;
  musicSource.start(0, MUSIC_LOOP_START);
}

export function stopMusic() {
  musicWanted = false;
  if (!musicSource) return;
  try {
    musicSource.stop(0);
  } catch (e) {
    // Already stopped.
  }
  musicSource.disconnect();
  musicSource = null;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  save('muted', muted);
  if (master) master.gain.value = muted ? 0 : 1;
  muteListeners.forEach((fn) => fn(muted));
}

export function onMuteChange(fn) {
  muteListeners.push(fn);
  fn(muted);
}

// Stop burning CPU on audio while the tab is in the background.
document.addEventListener('visibilitychange', () => {
  if (!ctx || !ctx.suspend) return;
  if (document.hidden) ctx.suspend();
  else ctx.resume();
});
