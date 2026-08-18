/**
 * Application shell and composition root.
 *
 * This is where the site's own accessibility lives, as opposed to the accessibility each
 * pattern demonstrates. A visitor auditing this repo will Tab through *this* page before
 * they read a word of it, so the shell has to survive the same scrutiny the patterns
 * invite: the skip link, the focus-on-navigate behaviour, and the route announcement are
 * all implemented here rather than delegated, and they are documented on `App` below.
 *
 * It also owns the search query, so that the sidebar's match count and the rendered pattern
 * list are computed once from a single source and cannot drift apart.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PATTERNS } from './patterns';
import { searchPatterns } from './lib/search';
import { useHashRoute, type RouteName } from './lib/router';
import { Sidebar } from './components/Sidebar';
import { ThemeToggle } from './components/ThemeToggle';
import { PatternsPage } from './pages/PatternsPage';
import { ChecklistPage } from './pages/ChecklistPage';
import { TestingPage } from './pages/TestingPage';

const PAGE_TITLES: Record<RouteName, string> = {
  patterns: 'Patterns',
  checklist: 'Pre-launch checklist',
  testing: 'How to test',
};

/**
 * The application shell.
 *
 * Three accessibility behaviours live here that no single pattern card owns, because they
 * are properties of the whole site:
 *
 *  1. **The skip link**, first in the DOM, moving focus to `<main tabindex="-1">`.
 *     SC 2.4.1 Bypass Blocks (A).
 *  2. **Route-change focus and announcement.** A hash route change does not reload the
 *     document, so nothing tells assistive technology that the page changed. On every
 *     navigation we move focus to the new page's heading and update both the document
 *     title and a live region. Skipped on first render; stealing focus on load is its own
 *     bug. SC 2.4.3 Focus Order (A) and SC 4.1.3 Status Messages (AA).
 *  3. **Deep-link handling.** `#/patterns#focus-trap` scrolls the card into view and
 *     focuses its heading, so a link from the checklist lands somewhere usable rather than
 *     merely scrolled.
 */
export function App(): ReactNode {
  const route = useHashRoute();
  const [query, setQuery] = useState('');

  const mainRef = useRef<HTMLElement | null>(null);
  // Wraps whichever page is rendered, so "focus the new page" is one ref rather than one
  // per page component.
  const pageRef = useRef<HTMLDivElement | null>(null);
  const isFirstRender = useRef(true);
  const [routeAnnouncement, setRouteAnnouncement] = useState('');

  const matches = useMemo(() => searchPatterns(PATTERNS, query), [query]);

  // Keep the document title in step with the route. SC 2.4.2 Page Titled (A) applies to
  // client-side routes as much as to server-rendered pages; for many screen-reader users
  // the title is the first thing they hear after a navigation.
  useEffect(() => {
    document.title = `${PAGE_TITLES[route.name]} | Section 508 Patterns`;
  }, [route.name]);

  // Move focus on navigation, and announce where we landed.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Still honour a deep link on a cold load, but do not steal focus for it.
      if (route.anchor !== null) {
        document.getElementById(route.anchor)?.scrollIntoView();
      }
      return;
    }

    if (route.anchor !== null) {
      const target = document.getElementById(route.anchor);
      if (target !== null) {
        target.scrollIntoView();
        // The card is `aria-labelledby` its own heading; focusing the heading puts the
        // screen reader's cursor exactly where the reader wants to start.
        const heading = target.querySelector<HTMLElement>('h3');
        const focusTarget = heading ?? target;
        focusTarget.setAttribute('tabindex', '-1');
        focusTarget.focus();
        setRouteAnnouncement(`${focusTarget.textContent ?? 'Section'} | ${PAGE_TITLES[route.name]}`);
        return;
      }
    }

    pageRef.current?.focus();
    setRouteAnnouncement(`${PAGE_TITLES[route.name]} page`);
  }, [route]);

  return (
    <>
      {/* First focusable element in the document. */}
      <a
        className="skip-link sr-only-focusable"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Skip to main content
      </a>

      <div className="app-shell">
        <header className="site-header">
          <div>
            {/* Exactly one h1 on the page. Each page's own title is an h2 below it. */}
            <h1>Section 508 Patterns</h1>
            <p className="site-tagline">
              A live reference of accessibility patterns for web applications, mapped to
              WCAG 2.1 AA and Section 508. Every pattern has a working demo and a broken
              one.
            </p>
          </div>
          <div className="header-tools">
            <ThemeToggle />
          </div>
        </header>

        <Sidebar
          route={route.name}
          query={query}
          onQueryChange={setQuery}
          matches={matches}
          total={PATTERNS.length}
        />

        <main id="main" ref={mainRef} tabIndex={-1}>
          {/* The route announcement region. Always mounted, so a screen reader has
              something to subscribe to before the first navigation happens. */}
          <p className="sr-only" role="status" aria-live="polite">
            {routeAnnouncement}
          </p>

          {/* A single element carries the ref for focus-on-navigate. Each page renders its
              own <h2> as its first child, so we wrap with a focus target rather than
              threading a ref through three page components. */}
          <div ref={pageRef} tabIndex={-1} style={{ outline: 'none' }}>
            {route.name === 'patterns' ? (
              <PatternsPage
                patterns={matches}
                total={PATTERNS.length}
                query={query}
                onClearQuery={() => setQuery('')}
              />
            ) : null}
            {route.name === 'checklist' ? <ChecklistPage /> : null}
            {route.name === 'testing' ? <TestingPage /> : null}
          </div>
        </main>

        <footer className="site-footer">
          <p style={{ maxWidth: 'none', margin: 0 }}>
            Built as a working reference, not as legal advice. Section 508 (Revised, 2017)
            incorporates WCAG 2.0 Level A and AA by reference; criteria added in WCAG 2.1
            are labelled as such throughout. MIT licensed.
          </p>
          <p style={{ maxWidth: 'none', margin: '0.5rem 0 0' }}>
            {/* The text version is generated from the same registry at build time (see
                src/lib/textVersion.ts). Linking it here, not only from <noscript>, keeps it
                discoverable for people who can run script but prefer to read or print. */}
            <a href="./text.html">Text version</a> of every pattern and the checklist, no
            script required.
          </p>
        </footer>
      </div>
    </>
  );
}
