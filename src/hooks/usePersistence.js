import { useCallback, useRef } from 'react';
import { encodeColorState, decodeColorState } from '../utils/urlCodec.js';

const LS_KEY = 'color-token-generator';

function loadFromLS() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveToLS(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch { /* quota exceeded — ignore */ }
}

export function usePersistence(defaults) {
  // Compute initial state once (URL params > localStorage > defaults)
  const initialRef = useRef(null);
  if (initialRef.current === null) {
    const fromUrl = decodeColorState(window.location.search);
    const fromLS = loadFromLS();
    initialRef.current = { ...defaults, ...fromLS, ...fromUrl };
  }

  const persist = useCallback((state) => {
    saveToLS(state);
  }, []);

  const getShareUrl = useCallback((state) => {
    const qs = encodeColorState(state);
    const url = `${window.location.origin}${window.location.pathname}?${qs}`;
    window.history.replaceState(null, '', url);
    return url;
  }, []);

  return { initial: initialRef.current, persist, getShareUrl };
}
