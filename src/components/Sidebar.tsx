/**
 * The site sidebar: page navigation plus the pattern filter.
 *
 * Worth reading as a pattern in its own right even though it has no card on the patterns
 * page: it is the only place on the site where a *second* navigation landmark and a
 * live-filtered list appear together, and both are things that are routinely got wrong in
 * application chrome. The per-decision reasoning is on the component below.
 *
 * The filtering itself is deliberately not implemented here. `App` owns the query string
 * and passes down the already-matched list, so the sidebar count and the rendered cards
 * can never disagree: a count that says "3 of 16 match" beside a list showing something
 * else is worse than no count, because the `role="status"` region would be announcing a
 * number that is not true.
 */

import { useId, type ReactNode } from 'react';
import type { PatternMeta } from '../lib/types';
import { routeHref, type RouteName } from '../lib/router';

interface SidebarProps {
  readonly route: RouteName;
  readonly query: string;
  readonly onQueryChange: (next: string) => void;
  readonly matches: readonly PatternMeta[];
  readonly total: number;
}

const PAGES: ReadonlyArray<{ name: RouteName; label: string }> = [
  { name: 'patterns', label: 'Patterns' },
  { name: 'checklist', label: 'Pre-launch checklist' },
  { name: 'testing', label: 'How to test' },
];

/**
 * Sticky index of everything on the site.
 *
 * Accessibility decisions:
 *  - It is a `<nav>` with an `aria-label`. A page with more than one navigation landmark
 *    must label each one, or a screen-reader user hears "navigation, navigation,
 *    navigation" in the landmark list and has to guess. (SC 1.3.1 Info and
 *    Relationships, A; the labelling itself is an ARIA practice rather than a criterion.)
 *  - The current page link carries `aria-current="page"`, the programmatic equivalent of
 *    the bold styling. Without it, "which page am I on" is conveyed by weight and colour
 *    alone.
 *  - The search input is `type="search"` with a real `<label>`, not a placeholder. A
 *    placeholder disappears the moment you type, is often too low-contrast to read, and
 *    is not reliably announced as a name. (SC 3.3.2 Labels or Instructions, A.)
 *  - The result count is a `role="status"` region so filtering announces itself. Typing in
 *    a search box and having the list silently shrink is invisible to a screen-reader
 *    user. (SC 4.1.3 Status Messages, AA.)
 */
export function Sidebar({
  route,
  query,
  onQueryChange,
  matches,
  total,
}: SidebarProps): ReactNode {
  const searchId = useId();
  const hintId = `${searchId}-hint`;

  return (
    <nav className="site-sidebar" aria-label="Site and pattern index" data-testid="sidebar">
      <h2 className="sidebar-heading" id="sidebar-pages-heading">
        Pages
      </h2>
      <ul className="nav-list" aria-labelledby="sidebar-pages-heading">
        {PAGES.map((page) => (
          <li key={page.name}>
            <a
              className="nav-link"
              href={routeHref(page.name)}
              aria-current={route === page.name ? 'page' : undefined}
            >
              {page.label}
            </a>
          </li>
        ))}
      </ul>

      <h2 className="sidebar-heading" id="sidebar-search-heading">
        Search patterns
      </h2>
      <div className="search-field">
        <label htmlFor={searchId}>Filter by name, problem, or criterion</label>
        <span className="hint" id={hintId}>
          Try &ldquo;focus&rdquo;, &ldquo;2.4.7&rdquo;, or &ldquo;live region&rdquo;.
        </span>
        <input
          id={searchId}
          type="search"
          value={query}
          aria-describedby={hintId}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>
      <p className="search-status" role="status">
        {query.trim() === ''
          ? `${total} patterns`
          : `${matches.length} of ${total} patterns match “${query.trim()}”`}
      </p>

      <h2 className="sidebar-heading" id="sidebar-patterns-heading">
        Patterns
      </h2>
      {matches.length === 0 ? (
        <p className="search-status">
          No patterns match. Clear the filter to see all {total}.
        </p>
      ) : (
        <ul className="nav-list" aria-labelledby="sidebar-patterns-heading">
          {matches.map((pattern) => (
            <li key={pattern.id}>
              <a className="nav-link" href={routeHref('patterns', pattern.id)}>
                {pattern.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
