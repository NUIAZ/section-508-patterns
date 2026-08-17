import { useEffect, useState } from 'react';

/**
 * A ~40-line hash router.
 *
 * WHY hand-rolled instead of a routing library:
 *  1. GitHub Pages serves static files only. A history-API router 404s on a hard refresh
 *    of /checklist unless you add a 404.html redirect workaround. Hash routes just work.
 *  2. This repo is meant to be *readable*. A visitor auditing how the focus-on-navigate
 *    behaviour works should not have to learn a router's internals to find it.
 *
 * Accessibility note that a library would not have given us for free: a client-side route
 * change does not reload the document, so a screen reader is never told anything happened.
 * The fix lives in `App.tsx` — on every route change we move focus to the new page's <h1>
 * and announce the page name in a live region. That is not one specific success criterion
 * so much as the combination of 2.4.3 Focus Order (A) and 4.1.3 Status Messages (AA).
 */

export type RouteName = 'patterns' | 'checklist' | 'testing';

/**
 * A parsed location: which page, plus an optional in-page target.
 *
 * The two parts are split rather than kept as one opaque string because the shell treats
 * them differently — a change of `name` moves focus to the page heading, while an `anchor`
 * scrolls a specific pattern card into view and focuses *its* heading instead. Collapsing
 * them would lose the distinction between "you have arrived on the checklist" and "you
 * have arrived at the focus-trap card", which is exactly what gets announced.
 */
export interface Route {
  readonly name: RouteName;
  /** The `#pattern-id` part after the route, if any — used for deep links from the checklist. */
  readonly anchor: string | null;
}

const DEFAULT_ROUTE: Route = { name: 'patterns', anchor: null };

/**
 * Parse `#/checklist`, `#/patterns#focus-trap`, `#/` and friends.
 *
 * Unknown routes fall back to the patterns page rather than rendering an empty shell,
 * because a broken deep link should still land somewhere usable.
 */
export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '');
  if (raw === '' || raw === '/') return DEFAULT_ROUTE;

  // Split on the *second* '#', which is how we encode "route + in-page anchor".
  const [pathPart, anchorPart] = raw.split('#');
  const path = pathPart.replace(/^\//, '').replace(/\/$/, '');
  const anchor = anchorPart !== undefined && anchorPart !== '' ? anchorPart : null;

  if (path === 'checklist') return { name: 'checklist', anchor };
  if (path === 'testing') return { name: 'testing', anchor };
  if (path === 'patterns' || path === '') return { name: 'patterns', anchor };
  return DEFAULT_ROUTE;
}

/** Build a hash URL. Centralised so links and programmatic navigation cannot drift apart. */
export function routeHref(name: RouteName, anchor?: string): string {
  return anchor !== undefined && anchor !== '' ? `#/${name}#${anchor}` : `#/${name}`;
}

/**
 * Subscribe to the current route, re-rendering on every `hashchange`.
 *
 * Deliberately returns the route and nothing else — no `navigate()` function. Navigation
 * on this site happens through real `<a href>` elements built by {@link routeHref}, never
 * through a click handler on a `<div>`. That is not stylistic: a genuine link is focusable,
 * announced as "link", works with Enter, and offers open-in-new-tab, all for free. Handing
 * out an imperative navigate() is how sites end up with clickable divs that fail SC 2.1.1
 * Keyboard (Level A) and SC 4.1.2 Name, Role, Value (Level A) at the same time.
 *
 * Safe to call during SSR or a non-DOM test environment: the initial state falls back to
 * the default route when `window` is undefined.
 */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === 'undefined' ? DEFAULT_ROUTE : parseHash(window.location.hash),
  );

  useEffect(() => {
    const onHashChange = (): void => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    // Re-read once on mount: the hash may have changed between the initial useState call
    // and the listener being attached (rare, but free to guard against).
    onHashChange();
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}
