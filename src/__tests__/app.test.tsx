import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { ThemeProvider } from '../lib/theme';
import { PATTERNS } from '../patterns';
import { searchPatterns } from '../lib/search';
import { parseHash, routeHref } from '../lib/router';

function renderApp(): void {
  window.location.hash = '';
  render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

describe('the site shell', () => {
  it('puts the skip link first in the document and moves focus to <main>', async () => {
    const user = userEvent.setup();
    renderApp();

    // There are two on the page: the site's own, and the one inside the skip-link
    // pattern's demo. The site's is the first in document order, which is the requirement.
    const skipLinks = screen.getAllByRole('link', { name: /skip to main content/i });
    const skipLink = skipLinks[0];

    // "First focusable element" is the whole requirement; a skip link three stops in is
    // not a skip link.
    const firstAnchor = document.querySelector('a');
    expect(firstAnchor).toBe(skipLink);
    expect(skipLink).toHaveAttribute('href', '#main');

    const main = screen.getByRole('main');
    // The landing target must be programmatically focusable or focus never actually moves.
    expect(main).toHaveAttribute('tabindex', '-1');

    await user.click(skipLink);
    expect(main).toHaveFocus();
  });

  it('exposes exactly one h1, one main, and named navigation landmarks', () => {
    renderApp();

    expect(document.querySelectorAll('h1')).toHaveLength(1);
    expect(document.querySelectorAll('main')).toHaveLength(1);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Site and pattern index' })).toBeInTheDocument();
  });

  it('renders every pattern as its own labelled article', () => {
    renderApp();
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(PATTERNS.length);
    for (const pattern of PATTERNS) {
      expect(screen.getByRole('heading', { name: pattern.title, level: 3 })).toBeInTheDocument();
    }
  });

  it('marks the current page with aria-current, not just with styling', () => {
    renderApp();
    const nav = screen.getByRole('navigation', { name: 'Site and pattern index' });
    const patternsLink = within(nav).getByRole('link', { name: 'Patterns' });
    expect(patternsLink).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'How to test' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('filters the patterns from the search box and announces the count', async () => {
    const user = userEvent.setup();
    renderApp();

    const search = screen.getByLabelText(/filter by name, problem, or criterion/i);
    await user.type(search, '2.4.7');

    await waitFor(() => {
      expect(screen.getByText(/of 16 patterns match/i)).toBeInTheDocument();
    });

    // 2.4.7 Focus Visible is cited by several patterns; the focus-visible card must be
    // among them and an unrelated one must not.
    expect(screen.getByRole('heading', { name: 'Visible focus indicator', level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Data tables with real headers', level: 3 })).not.toBeInTheDocument();
  });

  it('shows a recoverable empty state when nothing matches', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(
      screen.getByLabelText(/filter by name, problem, or criterion/i),
      'zzzznotathing',
    );

    // Both the sidebar index and the content column report the empty state.
    expect(screen.getAllByText(/no patterns match/i).length).toBeGreaterThanOrEqual(2);
    await user.click(screen.getByRole('button', { name: /clear the filter/i }));
    expect(screen.getAllByRole('article')).toHaveLength(PATTERNS.length);
  });

  it('moves focus and announces the page on a client-side route change', async () => {
    renderApp();

    window.location.hash = routeHref('testing');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /how to actually test this/i })).toBeInTheDocument();
    });
    // A hash route change does not reload the document, so focus has to be moved by hand.
    await waitFor(() => {
      expect(screen.getByText('How to test page')).toBeInTheDocument();
    });
    expect(document.title).toContain('How to test');
  });

  it('renders the checklist page with grouped, criterion-labelled fieldsets', async () => {
    renderApp();
    window.location.hash = routeHref('checklist');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /pre-launch accessibility checklist/i }),
      ).toBeInTheDocument();
    });

    const group = screen.getByRole('group', { name: /2\.4\.7 Focus Visible/ });
    expect(within(group).getAllByRole('checkbox').length).toBeGreaterThan(0);
    // The honest scope note has to be on the page, not only in the README.
    expect(screen.getByText(/not a conformance audit and not legal advice/i)).toBeInTheDocument();
  });
});

describe('search', () => {
  it('matches on title, on problem text, and on criterion number', () => {
    expect(searchPatterns(PATTERNS, 'skip link').map((p) => p.id)).toContain('skip-link');
    expect(searchPatterns(PATTERNS, '4.1.3').map((p) => p.id)).toContain('live-regions');
    expect(searchPatterns(PATTERNS, 'Bypass Blocks').map((p) => p.id)).toContain('skip-link');
  });

  it('ANDs multiple terms rather than ORing them', () => {
    const both = searchPatterns(PATTERNS, 'modal escape');
    expect(both.map((p) => p.id)).toContain('focus-trap');
    expect(both.length).toBeLessThan(PATTERNS.length);
  });

  it('returns everything for an empty or whitespace query', () => {
    expect(searchPatterns(PATTERNS, '')).toHaveLength(PATTERNS.length);
    expect(searchPatterns(PATTERNS, '   ')).toHaveLength(PATTERNS.length);
  });
});

describe('hash router', () => {
  it('parses routes, deep-link anchors, and unknown paths', () => {
    expect(parseHash('')).toEqual({ name: 'patterns', anchor: null });
    expect(parseHash('#/')).toEqual({ name: 'patterns', anchor: null });
    expect(parseHash('#/checklist')).toEqual({ name: 'checklist', anchor: null });
    expect(parseHash('#/patterns#focus-trap')).toEqual({ name: 'patterns', anchor: 'focus-trap' });
    // An unknown route lands somewhere usable rather than on a blank shell.
    expect(parseHash('#/nonsense')).toEqual({ name: 'patterns', anchor: null });
  });

  it('builds hrefs that round-trip through parseHash', () => {
    expect(parseHash(routeHref('patterns', 'forms'))).toEqual({
      name: 'patterns',
      anchor: 'forms',
    });
    expect(parseHash(routeHref('testing'))).toEqual({ name: 'testing', anchor: null });
  });
});
