import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // Transpile down so older browsers (Chrome 61+, Safari 11+, Firefox 60+) can run it.
    target: 'es2015',
    cssTarget: ['chrome61', 'safari11', 'firefox60', 'edge79'],
  },
});
