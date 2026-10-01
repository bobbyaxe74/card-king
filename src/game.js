// One timed round: shuffles a deck, handles picks, scoring and the clock.

import { FACES, CARD_BACK, preloadImages } from './assets.js';
import { playSound, startMusic, stopMusic } from './audio.js';
import { load, save } from './storage.js';

export const LEVELS = {
  easy: { name: 'Easy', pairs: 4 },
  medium: { name: 'Medium', pairs: 8 },
  hard: { name: 'Hard', pairs: 12 },
};

const MATCH_DELAY = 600; // ms a matching pair stays visible before leaving
const MISMATCH_DELAY = 1000; // ms a wrong pair stays visible before flipping back
const LOW_TIME = 5; // seconds left when the clock turns red
const STREAK_BONUS = 5; // points per consecutive match, from the second one on

export function timeLimit(pairs) {
  return pairs * 3 + 5; // seconds
}

export function bestScore(levelKey) {
  return load('best:' + levelKey, 0);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
  return array;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

export class Game {
  constructor(board, hud, onEnd) {
    this.board = board;
    this.hud = hud; // { level, time, score } elements
    this.onEnd = onEnd;
    this.running = false;
    this.ticker = null;
    this.pending = null;
    this.round = 0;

    // Pause the clock while the tab is hidden, so players aren't punished
    // for switching away and background tabs don't keep ticking.
    document.addEventListener('visibilitychange', () => {
      if (!this.running) return;
      if (document.hidden) {
        this.remainingMs = this.deadline - Date.now();
        this.stopTicker();
      } else {
        this.deadline = Date.now() + this.remainingMs;
        this.startTicker();
      }
    });
  }

  start(levelKey) {
    this.stop();
    const round = ++this.round;
    const level = LEVELS[levelKey];
    this.levelKey = levelKey;
    this.level = level;

    // Fresh random selection of faces from the whole set each round.
    const faces = shuffle(FACES.slice()).slice(0, level.pairs);
    this.values = shuffle(faces.concat(faces));
    this.cardState = this.values.map(() => ({ flipped: false, matched: false }));
    this.open = [];
    this.matched = 0;
    this.score = 0;
    this.streak = 0;
    this.shownSeconds = -1;

    this.hud.level.textContent = level.name;
    this.hud.score.textContent = '0';
    this.hud.time.textContent = formatTime(timeLimit(level.pairs));
    this.hud.time.classList.remove('is-low');

    this.board.onPick = null;
    this.board.render(this.values);

    return preloadImages([CARD_BACK].concat(faces)).then(() => {
      if (round !== this.round) return; // stopped or restarted while loading
      this.running = true;
      this.deadline = Date.now() + timeLimit(level.pairs) * 1000;
      this.board.onPick = (index) => this.pick(index);
      this.startTicker();
      startMusic();
    });
  }

  stop() {
    this.round++;
    this.running = false;
    this.board.onPick = null;
    this.stopTicker();
    clearTimeout(this.pending);
    this.pending = null;
    stopMusic();
  }

  pick(index) {
    const card = this.cardState[index];
    if (!this.running || !card || card.matched || this.open.indexOf(index) !== -1) return;

    // Fast players don't have to wait: a third pick settles the pending pair right away.
    if (this.open.length === 2) {
      clearTimeout(this.pending);
      this.settle();
      if (!this.running || card.matched) return;
    }

    card.flipped = true;
    this.board.flip(index);
    playSound('flip');
    this.open.push(index);

    if (this.open.length === 2) {
      const isMatch = this.values[this.open[0]] === this.values[this.open[1]];
      this.pending = setTimeout(() => this.settle(), isMatch ? MATCH_DELAY : MISMATCH_DELAY);
    }
  }

  settle() {
    this.pending = null;
    const a = this.open[0];
    const b = this.open[1];
    this.open = [];

    if (this.values[a] === this.values[b]) {
      this.streak++;
      this.score += this.secondsLeft() + (this.streak > 1 ? this.streak * STREAK_BONUS : 0);
      this.hud.score.textContent = String(this.score);
      this.cardState[a].matched = this.cardState[b].matched = true;
      this.board.match(a);
      this.board.match(b);
      this.matched += 2;
      if (this.matched === this.values.length) this.finish(true);
      else playSound('match');
    } else {
      this.streak = 0;
      this.cardState[a].flipped = this.cardState[b].flipped = false;
      this.board.unflip(a);
      this.board.unflip(b);
    }
  }

  secondsLeft() {
    return Math.max(0, Math.ceil((this.deadline - Date.now()) / 1000));
  }

  startTicker() {
    this.stopTicker();
    this.tick();
    // Checked a few times a second but the DOM is only touched when the shown second changes.
    this.ticker = setInterval(() => this.tick(), 250);
  }

  stopTicker() {
    clearInterval(this.ticker);
    this.ticker = null;
  }

  tick() {
    const seconds = this.secondsLeft();
    if (seconds !== this.shownSeconds) {
      this.shownSeconds = seconds;
      this.hud.time.textContent = formatTime(seconds);
      this.hud.time.classList.toggle('is-low', seconds <= LOW_TIME);
    }
    if (seconds === 0) this.finish(false);
  }

  finish(won) {
    const levelKey = this.levelKey;
    const score = this.score;
    this.stop();
    playSound(won ? 'win' : 'lose');

    const previousBest = bestScore(levelKey);
    const isNewBest = score > previousBest;
    if (isNewBest) save('best:' + levelKey, score);

    this.onEnd({ won, score, isNewBest, best: Math.max(score, previousBest) });
  }
}
