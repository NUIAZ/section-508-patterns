import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Global test setup.
 *
 * Two things happen here, both of which exist because jsdom is not a browser:
 *
 * 1. `window.matchMedia` is not implemented in jsdom. Several patterns on this site read
 *    media queries at runtime — `prefers-color-scheme` for the theme and
 *    `prefers-reduced-motion` for the animation pattern. Without a stub those components
 *    throw on mount and every test that renders the app fails for an uninteresting
 *    reason. The stub reports "query does not match", which is the correct default for
 *    both of those queries (light theme, motion allowed).
 *
 * 2. React Testing Library's auto-cleanup only registers itself when a global `afterEach`
 *    exists, and we deliberately run vitest without `globals: true` (explicit imports are
 *    easier to trace in a reference repo), so we wire cleanup up by hand.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => {
    const list: MediaQueryList = {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    };
    return list;
  };
}

// jsdom does not lay anything out, so `scrollIntoView` is missing. Components that move
// focus sometimes call it; make it a no-op rather than making every caller defensive.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView(): void {
    /* no layout in jsdom, nothing to scroll */
  };
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.localStorage.clear();
});
