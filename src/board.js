// The card table: builds card elements, sizes the grid to fit the screen and
// reports which card was picked. One instance lives for the whole session and
// its listeners are attached exactly once, so nothing piles up between rounds.

const GAP_RATIO = 0.1; // gap between cards, relative to card size
const MAX_CARD_SIZE = 200; // px; the artwork is 320px, so this stays sharp on 2x screens

export class Board {
  constructor(el, container) {
    this.el = el;
    this.container = container;
    this.cards = [];
    this.onPick = null;
    this.layoutQueued = false;

    el.addEventListener('click', (event) => {
      const card = event.target.closest('.card');
      if (card && this.onPick) this.onPick(Number(card.getAttribute('data-index')));
    });

    window.addEventListener('resize', () => {
      if (this.layoutQueued) return;
      this.layoutQueued = true;
      window.requestAnimationFrame(() => {
        this.layoutQueued = false;
        this.layout();
      });
    });
  }

  // faces: one image URL per card, in board order.
  render(faces) {
    const fragment = document.createDocumentFragment();
    this.cards = faces.map((face, index) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'card';
      el.setAttribute('data-index', index);
      el.innerHTML =
        '<span class="card-inner">' +
        '<span class="card-face card-back"></span>' +
        '<span class="card-face card-front"></span>' +
        '</span>';
      el.lastChild.lastChild.style.backgroundImage = 'url("' + face + '")';
      fragment.appendChild(el);
      const card = { el, index };
      this.setLabel(card, 'face down');
      return card;
    });
    this.el.textContent = '';
    this.el.appendChild(fragment);
    this.layout();
  }

  clear() {
    this.cards = [];
    this.el.textContent = '';
  }

  // Picks the column count that gives the largest cards for the available space.
  layout() {
    const count = this.cards.length;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!count || !width || !height) return;

    let best = { size: 0, cols: count };
    for (let cols = 1; cols <= count; cols++) {
      const rows = Math.ceil(count / cols);
      let size = Math.min(
        width / (cols + (cols - 1) * GAP_RATIO),
        height / (rows + (rows - 1) * GAP_RATIO)
      );
      // Slight preference for grids without a ragged last row.
      if (count % cols !== 0) size *= 0.97;
      if (size > best.size) best = { size, cols };
    }

    const size = Math.floor(Math.min(best.size, MAX_CARD_SIZE));
    const gap = Math.floor(size * GAP_RATIO);
    const style = this.el.style;
    style.gridTemplateColumns = 'repeat(' + best.cols + ', ' + size + 'px)';
    style.gridAutoRows = size + 'px';
    style.gridGap = gap + 'px';
    style.gap = gap + 'px';
  }

  flip(index) {
    const card = this.cards[index];
    card.el.classList.add('is-flipped');
    this.setLabel(card, 'face up');
  }

  unflip(index) {
    const card = this.cards[index];
    card.el.classList.remove('is-flipped');
    this.setLabel(card, 'face down');
  }

  match(index) {
    const card = this.cards[index];
    card.el.classList.add('is-matched');
    card.el.disabled = true;
    this.setLabel(card, 'matched');
  }

  highlight(index) {
    this.cards.forEach((card) => {
      card.el.classList.toggle('is-hinted', card.index === index);
    });
  }

  setLabel(card, state) {
    card.el.setAttribute('aria-label', 'Card ' + (card.index + 1) + ', ' + state);
  }
}
