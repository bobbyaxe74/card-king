// Card artwork URLs and a once-only image preloader.

import backUrl from './assets/card-back.jpg';

const faceModules = import.meta.glob('./assets/cards/*.jpg', { eager: true, import: 'default' });

export const CARD_BACK = backUrl;
export const FACES = Object.keys(faceModules).sort().map((key) => faceModules[key]);

const cache = {};

function loadImage(url) {
  if (!cache[url]) {
    cache[url] = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Decode up front where supported so the first flip doesn't stutter.
        if (img.decode) img.decode().then(resolve, resolve);
        else resolve();
      };
      img.onerror = () => resolve();
      img.src = url;
    });
  }
  return cache[url];
}

// Resolves once every image is ready, or after `timeout` ms. A slow network
// should never block the game from starting.
export function preloadImages(urls, timeout = 3000) {
  return Promise.race([
    Promise.all(urls.map(loadImage)),
    new Promise((resolve) => setTimeout(resolve, timeout)),
  ]);
}
