# Card King

A memory card game: flip cards, find the pairs, beat the clock.

## Scripts

```sh
npm install
npm run dev      # dev server
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Structure

```
src/
├── index.html      # markup for the menu, game screen and result dialog
├── style.css       # layout, card flip (CSS 3D transforms)
├── main.js         # entry point: screen switching and button wiring
├── game.js         # a timed round: deck, picks, scoring, clock
├── tutorial.js     # guided four-card walkthrough
├── board.js        # card elements, responsive grid sizing, input
├── assets.js       # card image URLs and preloader
├── audio.js        # Web Audio sound effects and music
├── storage.js      # guarded localStorage (mute setting, best scores)
└── assets/
    ├── card-back.jpg
    ├── cards/      # 01.jpg … 23.jpg, 320×320 card faces
    └── audio/      # short WAV effects + MP3 music loop
```

To add a card face, drop a square JPEG into `src/assets/cards/`. It's picked up automatically.

## Rules

| Level  | Pairs | Time |
| ------ | ----- | ---- |
| Easy   | 4     | 17 s |
| Medium | 8     | 29 s |
| Hard   | 12    | 41 s |

Each match scores the seconds left on the clock. From the second match in a row on, a streak bonus of 5 × streak is added.

## Performance

The game targets old PCs and browsers (Chrome 61+, Safari 11+, Firefox 60+, Edge 79+):

- No WebGL or animation libraries: the cards are plain HTML buttons flipped with CSS transforms, which the browser handles on the GPU.
- Nothing runs while the game is idle: there's no render loop, and the clock only updates the page once per second.
- Assets are about 0.9 MB in total. Each file is loaded and decoded once per session.
- Listeners are attached once at startup, never per round.
- The clock and audio pause while the tab is hidden.
- The flip doesn't depend on `backface-visibility`, which some software-rendered setups ignore: card faces also swap visibility halfway through the turn.
