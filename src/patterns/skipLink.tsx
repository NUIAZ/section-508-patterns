import { useRef, type MouseEvent, type ReactNode } from 'react';
import type { DemoProps, PatternMeta } from '../lib/types';

/**
 * Skip link demo.
 *
 * The working version is a link that sits first in the DOM, is clipped out of sight until
 * it receives focus, and moves focus (not just the scroll position) to the main content.
 *
 * The detail people miss: `<a href="#main">` scrolls to the target in every browser but
 * historically did *not* move keyboard focus there in all of them. The reliable recipe is
 * a target with `tabindex="-1"` plus an explicit `.focus()` call, which is what the
 * onClick handler below does. `tabindex="-1"` makes the element programmatically
 * focusable without adding it to the tab order.
 */
function Demo({ broken, idPrefix }: DemoProps): ReactNode {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const mainId = `${idPrefix}-main`;

  const handleSkip = (event: MouseEvent<HTMLAnchorElement>): void => {
    // Prevent the default hash navigation so the demo does not alter the page URL; this
    // demo lives inside a hash-routed site and rewriting the fragment would navigate away.
    event.preventDefault();
    targetRef.current?.focus();
  };

  return (
    <div className="mini-page">
      {broken ? (
        // BROKEN: the link exists in the markup, so an automated scanner that only checks
        // "is there a skip link" is satisfied. But `display: none` removes it from the
        // accessibility tree *and* from the tab order, so no keyboard user can ever reach
        // it. This is the most common way a skip link is broken in the wild.
        <a href={`#${mainId}`} style={{ display: 'none' }}>
          Skip to main content
        </a>
      ) : (
        <a className="skip-link sr-only-focusable" href={`#${mainId}`} onClick={handleSkip}>
          Skip to main content
        </a>
      )}

      <nav aria-label="Demo site sections" style={{ marginBlockEnd: '0.75rem' }}>
        <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', listStyle: 'none', padding: 0, margin: 0 }}>
          {['Overview', 'Pricing', 'Docs', 'Support', 'Careers', 'Status'].map((item) => (
            <li key={item}>
              <a href={`#${idPrefix}-nav-${item.toLowerCase()}`} onClick={(e) => e.preventDefault()}>
                {item}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div
        id={mainId}
        ref={targetRef}
        // tabindex="-1" on the landing target: focusable by script, skipped by Tab.
        tabIndex={-1}
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '0.75rem',
        }}
      >
        <h5 style={{ marginTop: 0 }}>Main content</h5>
        <p style={{ margin: 0 }}>
          Focus should land here, on this box, after activating the skip link. If it did,
          the next <kbd>Tab</kbd> press goes to the link below and not back into the six
          navigation links above.
        </p>
        <p style={{ marginBottom: 0 }}>
          <a href={`#${idPrefix}-after`} onClick={(e) => e.preventDefault()}>
            First link inside main
          </a>
        </p>
      </div>
    </div>
  );
}

const SOURCE = `// The link is the FIRST focusable thing in the document.
<a class="skip-link sr-only-focusable" href="#main">Skip to main content</a>

<nav aria-label="Primary">…30 links…</nav>

// The target is programmatically focusable but not a tab stop.
<main id="main" tabindex="-1">…</main>

/* Clipped, not display:none; display:none is unfocusable and
   invisible to assistive technology. It becomes visible the
   instant it receives focus. */
.sr-only-focusable:not(:focus):not(:focus-within) {
  position: absolute !important;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.skip-link {
  position: absolute; top: .5rem; left: .5rem; z-index: 100;
  background: var(--accent); color: var(--accent-contrast);
  padding: .6rem 1rem; border-radius: .5rem;
}

// Some browsers historically moved the scroll position but not
// focus. Belt and braces:
document.querySelector('.skip-link')
  .addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('main').focus();
  });`;

/**
 * Registry entry for the skip-link pattern. First in `PATTERNS` because it is the first
 * thing a keyboard user meets on any page, and because the failure it demonstrates,
 * a skip link present in the HTML but `display:none`, so an automated "is there a skip
 * link?" check passes while no human can ever reach it, is the clearest example on the
 * site of why a scanner result is not an answer.
 *
 * Claims SC 2.4.1 Bypass Blocks (A), SC 2.4.3 Focus Order (A) and SC 2.4.7 Focus
 * Visible (AA).
 */
export const skipLinkPattern: PatternMeta = {
  id: 'skip-link',
  title: 'Skip link',
  problem:
    'A keyboard-only visitor lands on every page at the top and has to Tab through the whole masthead and navigation, often thirty or more stops, before reaching the content. On a ten-page journey that is three hundred keystrokes of pure overhead.',
  keywords: ['bypass blocks', 'skip navigation', 'skip to content', 'tabindex -1', 'sr-only'],
  criteria: [
    {
      number: '2.4.1',
      name: 'Bypass Blocks',
      level: 'A',
      since: '2.0',
      why: 'A skip link is the canonical mechanism for bypassing blocks of content repeated on multiple pages. Correctly marked-up landmarks and headings are the other two accepted mechanisms.',
    },
    {
      number: '2.4.3',
      name: 'Focus Order',
      level: 'A',
      since: '2.0',
      why: 'Activating the link must actually move focus to the target. If only the scroll position moves, the next Tab press continues from the link and dumps the user back in the navigation.',
    },
    {
      number: '2.4.7',
      name: 'Focus Visible',
      level: 'AA',
      since: '2.0',
      why: 'The link is invisible until focused and fully visible once focused, so the keyboard user can see where they are. A skip link that stays hidden when focused fails this.',
    },
  ],
  section508:
    'Revised Section 508 (2017, compliance date 18 January 2018) does not define its own "skip navigation" provision. E205.4 requires electronic content to conform to WCAG 2.0 Level A and AA, which pulls in SC 2.4.1 Bypass Blocks directly. It also supports the Chapter 3 Functional Performance Criteria 302.1 (Without Vision) and 302.7 (With Limited Manipulation), since both groups pay the highest price for a long repeated tab sequence.',
  howToTest: {
    keyboard: [
      'Click once on the "Overview" link above, then press Shift+Tab until you are before it, or just reload and press Tab once.',
      'The first Tab press should reveal a "Skip to main content" link that was not visible a moment ago.',
      'Press Enter. Focus should jump to the "Main content" box.',
      'Press Tab once more. You should land on "First link inside main", not back in the navigation.',
    ],
    screenReader: [
      '"Skip to main content, link" as the very first announcement on the page.',
      'After activating it, the main region and its heading, not the navigation list again.',
      'In the broken version you will hear nothing at all: the link is not in the accessibility tree.',
    ],
  },
  source: SOURCE,
  brokenBehaviour:
    'The skip link is still in the HTML but hidden with display:none, so it is neither focusable nor exposed to assistive technology. Tab from the top and you go straight into the six navigation links.',
  Demo,
};
