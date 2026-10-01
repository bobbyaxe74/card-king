// Tiny localStorage wrapper. Storage can be missing or throw (private mode,
// blocked cookies), so every access is guarded and falls back to defaults.

const PREFIX = 'card-king:';

export function load(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

export function save(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    // Not fatal: the value just won't persist.
  }
}
