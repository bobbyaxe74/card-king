// Entry point: screen switching and button wiring.

import { Board } from './board.js';
import { Game, LEVELS, bestScore } from './game.js';
import { Tutorial } from './tutorial.js';
import { FACES, CARD_BACK, preloadImages } from './assets.js';
import { unlockAudio, toggleMute, onMuteChange } from './audio.js';

const $ = (id) => document.getElementById(id);

const screens = { menu: $('menu'), play: $('play') };
const stats = $('stats');
const tutorialMessage = $('tutorial-message');
const result = $('result');

const board = new Board($('board'), $('board-wrap'));
const game = new Game(
  board,
  { level: $('stat-level'), time: $('stat-time'), score: $('stat-score') },
  showResult
);
const tutorial = new Tutorial(board, tutorialMessage, showMenu);

let lastLevel = 'easy';

function showScreen(name) {
  Object.keys(screens).forEach((key) => {
    screens[key].hidden = key !== name;
  });
  result.hidden = true;
}

function showMenu() {
  game.stop();
  tutorial.stop();
  board.clear();
  Object.keys(LEVELS).forEach((key) => {
    const best = bestScore(key);
    document.querySelector('[data-best="' + key + '"]').textContent = best ? 'Best ' + best : '';
  });
  showScreen('menu');
}

function startGame(levelKey) {
  tutorial.stop();
  lastLevel = levelKey;
  stats.hidden = false;
  tutorialMessage.hidden = true;
  showScreen('play');
  game.start(levelKey);
}

function startTutorial() {
  game.stop();
  stats.hidden = true;
  tutorialMessage.hidden = false;
  showScreen('play');
  tutorial.start();
}

function showResult({ won, score, isNewBest, best }) {
  $('result-title').textContent = won ? 'You win!' : 'Time’s up!';
  $('result-text').textContent =
    'Score: ' + score + (isNewBest && score > 0 ? ' — new best!' : '  ·  Best: ' + best);
  result.hidden = false;
  result.querySelector('[data-action="again"]').focus();
}

// All buttons go through one delegated listener.
document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const level = button.getAttribute('data-level');
  const action = button.getAttribute('data-action');
  if (level || action) unlockAudio(); // first gesture: allowed to start audio now

  if (level) startGame(level);
  else if (action === 'tutorial') startTutorial();
  else if (action === 'again') startGame(lastLevel);
  else if (action === 'menu') showMenu();
  else if (action === 'mute') toggleMute();
});

document.addEventListener('keydown', (event) => {
  if ((event.key === 'Escape' || event.key === 'Esc') && screens.menu.hidden) showMenu();
});

const SOUND_ON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none"/></svg>';
const SOUND_OFF =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l6 6M22 9l-6 6" fill="none"/></svg>';

onMuteChange((muted) => {
  const buttons = document.querySelectorAll('[data-action="mute"]');
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].innerHTML = muted ? SOUND_OFF : SOUND_ON;
    buttons[i].setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off');
  }
});

showMenu();

// Warm the image cache once the menu is up, without competing with first paint.
const warmCache = () => preloadImages([CARD_BACK].concat(FACES), 15000);
if (window.requestIdleCallback) window.requestIdleCallback(warmCache);
else setTimeout(warmCache, 200);
