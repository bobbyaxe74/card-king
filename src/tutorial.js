// Guided walkthrough on a four-card board. Each step only accepts a click on
// the highlighted card, so the player can't get lost.

import { FACES } from './assets.js';
import { playSound } from './audio.js';

const MATCH_DELAY = 700;

// `pick` is the card the step waits for; `button` is shown when there's nothing to pick.
const STEPS = [
  { text: 'Every card on the table has a twin. Find all the pairs to win.', button: 'Next' },
  { text: 'Click the glowing card to flip it over.', pick: 0 },
  { text: 'Now flip the other glowing card. Do they match?', pick: 1 },
  { text: 'A match! Matched pairs leave the table. Flip the next glowing card.', pick: 2 },
  { text: 'And find its twin…', pick: 3 },
  {
    text: 'Well done! In a real game you race the clock: faster matches score more, and back-to-back matches earn a streak bonus.',
    button: 'Finish',
  },
];

export class Tutorial {
  constructor(board, messageEl, onFinish) {
    this.board = board;
    this.messageEl = messageEl;
    this.onFinish = onFinish;
    this.pending = null;

    messageEl.addEventListener('click', (event) => {
      if (!event.target.closest('button')) return;
      if (this.step === STEPS.length - 1) this.onFinish();
      else this.show(this.step + 1);
    });
  }

  start() {
    this.stop();
    const a = FACES[0];
    const b = FACES[1];
    this.board.render([a, a, b, b]);
    this.board.onPick = (index) => this.pick(index);
    this.show(0);
  }

  stop() {
    clearTimeout(this.pending);
    this.pending = null;
    this.board.onPick = null;
  }

  show(step) {
    this.step = step;
    const current = STEPS[step];
    this.messageEl.textContent = current.text;
    if (current.button) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-small';
      button.textContent = current.button;
      this.messageEl.appendChild(button);
    }
    this.board.highlight(current.pick === undefined ? -1 : current.pick);
  }

  pick(index) {
    if (this.pending || STEPS[this.step].pick !== index) return;
    this.board.flip(index);
    playSound('flip');

    // Odd card indices complete a pair (0+1, 2+3).
    if (index % 2 === 0) {
      this.show(this.step + 1);
      return;
    }
    this.board.highlight(-1);
    this.pending = setTimeout(() => {
      this.pending = null;
      this.board.match(index - 1);
      this.board.match(index);
      playSound('match');
      this.show(this.step + 1);
    }, MATCH_DELAY);
  }
}
