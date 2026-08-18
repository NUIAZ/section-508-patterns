import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import axe from 'axe-core';
import type { AxeResults, RuleObject } from 'axe-core';
import { PATTERNS } from '../patterns';
import { skipLinkPattern } from '../patterns/skipLink';
import { accessibleNamePattern } from '../patterns/accessibleName';
import { focusTrapPattern } from '../patterns/focusTrap';

/**
 * Automated checks with axe-core.
 *
 * Two honest caveats, stated here rather than buried:
 *
 *  1. **Rules disabled in this environment.** `color-contrast` cannot run in jsdom at all,
 *     because jsdom has no layout or paint and therefore no computed background to
 *     measure. It is covered instead by the unit tests in `contrast.test.ts`, which pin
 *     the maths against known values, and by the ratio comments beside every token in
 *     `global.css`. `heading-order`, `page-has-heading-one`, `region` and
 *     `landmark-one-main` are page-level rules; the demos here are rendered as isolated
 *     fragments, so those rules would report failures that do not exist on the real page.
 *     The harness test below re-enables them.
 *
 *  2. **axe finds roughly a third of real issues.** Everything else in this suite (focus
 *     cycling, focus restoration, keyboard operation of custom widgets, live-region
 *     politeness) exists because axe cannot see any of it. A green run here is a floor,
 *     not a ceiling, and the last two tests in this file demonstrate exactly where the
 *     floor is.
 */

/** Page-level rules that only make sense against a whole document. */
const FRAGMENT_RULES: RuleObject = {
  'color-contrast': { enabled: false },
  'heading-order': { enabled: false },
  'page-has-heading-one': { enabled: false },
  region: { enabled: false },
  'landmark-one-main': { enabled: false },
};

/** Everything on except the one rule jsdom physically cannot evaluate. */
const FULL_PAGE_RULES: RuleObject = {
  'color-contrast': { enabled: false },
};

function describeViolations(results: AxeResults): string {
  if (results.violations.length === 0) return 'no violations';
  return results.violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact ?? 'unknown impact'}): ${violation.help}\n    ` +
        violation.nodes.map((node) => node.html).join('\n    '),
    )
    .join('\n');
}

async function runAxe(container: HTMLElement, rules: RuleObject): Promise<AxeResults> {
  return axe.run(container, { rules, resultTypes: ['violations'] });
}

describe('axe-core: every working demo', () => {
  // One test per pattern, so a failure names the pattern that broke rather than the loop.
  for (const pattern of PATTERNS) {
    it(
      `reports no violations for “${pattern.title}”`,
      async () => {
        const { container } = render(
          <pattern.Demo broken={false} idPrefix={`axe-${pattern.id}`} />,
        );
        const results = await runAxe(container, FRAGMENT_RULES);
        expect(results.violations, describeViolations(results)).toHaveLength(0);
      },
      30_000,
    );
  }
});

/**
 * Two demos inside a realistic landmark and heading context.
 *
 * The h1 → h2 → h3 → h4 ladder mirrors the real page exactly: the site title is the h1,
 * the page title is the h2, each pattern title is an h3, each card section is an h4, and
 * headings inside a demo start at h5. Reproducing that here is what lets `heading-order`
 * run meaningfully instead of flagging the fragment's own missing context.
 */
function Harness(): ReactNode {
  return (
    <main>
      <h1>Test harness</h1>
      <h2>Patterns</h2>
      <h3>Skip link</h3>
      <h4>Live demo</h4>
      <skipLinkPattern.Demo broken={false} idPrefix="harness-skip" />
      <h3>Accessible name</h3>
      <h4>Live demo</h4>
      <accessibleNamePattern.Demo broken={false} idPrefix="harness-name" />
    </main>
  );
}

describe('axe-core: demos in a full page context, with page-level rules enabled', () => {
  it('reports no violations', async () => {
    const { container } = render(<Harness />);
    const results = await runAxe(container, FULL_PAGE_RULES);
    expect(results.violations, describeViolations(results)).toHaveLength(0);
  }, 30_000);
});

describe('the boundary of automated testing', () => {
  /**
   * axe DOES detect a button with no accessible name, so the broken accessible-name demo
   * fails the scan: this is the third or so of issues automation is good at.
   */
  it('flags the unnamed icon buttons in the broken accessible-name demo', async () => {
    const { container } = render(
      <accessibleNamePattern.Demo broken idPrefix="axe-broken-name" />,
    );
    const results = await runAxe(container, FRAGMENT_RULES);
    expect(results.violations.map((violation) => violation.id)).toContain('button-name');
  }, 30_000);

  /**
   * And this is the other two thirds. The broken modal has no role, no aria-modal, no
   * focus management and no Escape handling, a serious, user-blocking failure, and a
   * static scan of the closed page has nothing to report. The keyboard tests in
   * focusTrap.test.tsx catch it in milliseconds.
   */
  it('says nothing about the broken focus trap, which is why the keyboard tests exist', async () => {
    const { container } = render(<focusTrapPattern.Demo broken idPrefix="axe-broken-trap" />);
    const results = await runAxe(container, FRAGMENT_RULES);
    expect(results.violations, describeViolations(results)).toHaveLength(0);
  }, 30_000);
});
