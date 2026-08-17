import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Theme handling.
 *
 * The rule this implements: **the operating system decides by default, the visitor can
 * override, and the override is remembered.** Sites that force one theme ignore visitors
 * who chose a light or dark OS setting for a reason (low vision, photophobia, migraine),
 * and sites that offer a toggle but forget it make that person re-do the work on every
 * page load.
 *
 * There is no WCAG success criterion that says "offer a dark mode" — claiming otherwise
 * would be inventing a requirement. What the criteria do require is that whatever theme is
 * showing meets 1.4.3 Contrast (Minimum) (AA), which is why both palettes in `theme.css`
 * are checked against 4.5:1 for body text.
 */

/** What the visitor asked for, including the "don't decide for me" option. Persisted. */
export type ThemeChoice = 'system' | 'light' | 'dark';

/**
 * What is actually painted — `ThemeChoice` with `'system'` already resolved against
 * `prefers-color-scheme`. Kept as a separate type so the compiler stops anyone stamping a
 * literal `"system"` onto `<html data-theme>`, which would match no palette in the CSS and
 * silently render unstyled colours.
 */
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'section-508-patterns:theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

interface ThemeContextValue {
  /** What the visitor picked, including the "follow the system" option. */
  readonly choice: ThemeChoice;
  /** What is actually on screen right now. */
  readonly resolved: ResolvedTheme;
  readonly setChoice: (next: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredChoice(): ThemeChoice {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    // Private browsing modes can throw on localStorage access. A theme preference is not
    // worth breaking the page over, so fall through to the system default.
  }
  return 'system';
}

/** Read the OS preference. Guarded because jsdom (and very old browsers) lack matchMedia. */
function readSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

/**
 * Resolves the theme and stamps it on `<html>`. Mount once, above everything.
 *
 * It renders no markup of its own: the entire visible effect is one `data-theme` attribute
 * plus the matching `color-scheme`, which lets the palette live in CSS custom properties
 * and keeps the page readable even if this script never runs.
 *
 * Note that it re-renders on OS theme changes, so anything expensive under it should be
 * memoised — the context value already is.
 */
export function ThemeProvider({ children }: { children: ReactNode }): ReactNode {
  const [choice, setChoiceState] = useState<ThemeChoice>(readStoredChoice);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(readSystemTheme);

  // Follow the OS setting *live*. Someone using a scheduled dark mode should not have to
  // reload the page at sunset.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent): void => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };
    // addEventListener is the modern API; the older addListener form is not needed for
    // any browser that can run a React 19 bundle.
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const resolved: ResolvedTheme = choice === 'system' ? systemTheme : choice;

  // The palette lives in CSS custom properties keyed off `data-theme` on <html>, so the
  // only thing React does here is stamp one attribute. That keeps theming out of the
  // component tree entirely and means the CSS still works if the script fails to load.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolved);
    // `color-scheme` tells the browser to render native widgets (scrollbars, form
    // controls, the focus ring default) in the matching scheme. Forgetting it is why
    // dark sites often have blindingly white scrollbars and unreadable date pickers.
    root.style.colorScheme = resolved;
  }, [resolved]);

  const setChoice = useCallback((next: ThemeChoice): void => {
    setChoiceState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Same reasoning as readStoredChoice: persistence is a nicety, not a requirement.
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ choice, resolved, setChoice }),
    [choice, resolved, setChoice],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Read and change the theme from inside the tree.
 *
 * Throws — rather than returning a plausible default — when there is no provider above it.
 * A silent fallback would let a component render against one palette while the document
 * carries another, and the failure mode of that is unreadable text, which is precisely the
 * outcome the contrast work elsewhere in this repo exists to prevent. Fail at mount, loudly.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error('useTheme must be used inside <ThemeProvider>.');
  }
  return ctx;
}

/**
 * Read `prefers-reduced-motion` reactively.
 *
 * Exported from here rather than from the reduced-motion pattern file because the site
 * shell uses it too — the route-change focus scroll is instant for these visitors.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent): void => setReduced(event.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
