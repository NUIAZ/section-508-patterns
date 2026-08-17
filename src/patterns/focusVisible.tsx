import type { ReactNode } from 'react';
import type { DemoProps, PatternMeta } from '../lib/types';

/**
 * Focus visibility demo.
 *
 * The broken variant applies `outline: none` to everything inside the stage — the single
 * most common accessibility regression in front-end code, usually introduced by a
 * designer asking to "get rid of that blue box" and nobody adding a replacement.
 *
 * The styles are inline `<style>` blocks scoped by an id rather than classes in the global
 * sheet, because the whole point is to show the exact CSS that causes and cures the
 * problem, right next to the thing it affects.
 */
function Demo({ broken, idPrefix }: DemoProps): ReactNode {
  const scope = `${idPrefix}-scope`;

  const goodCss = `
    #${scope} .demo-btn:focus-visible {
      outline: 3px solid var(--focus);
      outline-offset: 2px;
    }
    /* Suppress the legacy ring for mouse users only, never for keyboard users. */
    #${scope} .demo-btn:focus:not(:focus-visible) { outline: none; }
  `;

  const badCss = `
    /* Every focusable thing in here has had its focus indicator deleted. */
    #${scope} .demo-btn:focus { outline: none; }
    #${scope} .demo-btn:focus-visible { outline: none; }
    #${scope} a:focus { outline: none; }
  `;

  return (
    <div id={scope}>
      <style>{broken ? badCss : goodCss}</style>

      <p style={{ marginTop: 0 }}>
        Press <kbd>Tab</kbd> repeatedly through these five controls and watch for the ring.
        Then click one with the mouse — in the accessible version, clicking should
        <em> not</em> paint a ring, because <code>:focus-visible</code> distinguishes
        keyboard focus from pointer focus.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <button type="button" className="btn btn-small demo-btn">
          Save draft
        </button>
        <button type="button" className="btn btn-small demo-btn">
          Publish
        </button>
        <a href={`#${idPrefix}-noop`} onClick={(e) => e.preventDefault()}>
          A link
        </a>
        <input
          type="text"
          className="demo-btn"
          aria-label="Sample text field"
          style={{ width: '10rem' }}
        />
        <button type="button" className="btn btn-small demo-btn">
          Discard
        </button>
      </div>

      {broken ? (
        <p className="note note-warning" style={{ marginBlockStart: '0.75rem' }}>
          You are still moving through the controls — the browser knows exactly where focus
          is. You just cannot see it. That is what using a site with{' '}
          <code>outline: none</code> feels like all day.
        </p>
      ) : null}
    </div>
  );
}

const SOURCE = `/* The good version: one global rule, not per-component. */
:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 2px;   /* keeps the ring off the control's own border */
  border-radius: 2px;
}

/* The ONLY safe way to write "remove the outline": remove it for
   pointer focus, where :focus-visible has already decided the user
   does not need it. Never a blanket \`outline: none\`. */
:focus:not(:focus-visible) {
  outline: none;
}

/* If the design truly cannot accept an outline, replace it with an
   indicator of equivalent visibility — a box-shadow ring, a border
   swap, an inverted background. What is NOT acceptable is nothing.
   The replacement needs 3:1 contrast against the adjacent colour
   (SC 1.4.11 Non-text Contrast, AA). */
.card:focus-visible {
  outline: none;                         /* replaced, not removed */
  box-shadow: 0 0 0 3px var(--focus);
}

/* Windows High Contrast Mode strips box-shadow. Keep a transparent
   outline so forced-colors mode paints a real one. */
@media (forced-colors: active) {
  :focus-visible { outline: 3px solid CanvasText; }
}`;

/**
 * Registry entry for the focus-indicator pattern. The `source` block ends with a
 * `forced-colors` rule, which is the part most implementations omit: Windows High Contrast
 * Mode discards `box-shadow`, so a focus ring built only from a shadow disappears for
 * exactly the users who most depend on it. Keep a transparent `outline` so forced-colors
 * mode has something real to paint.
 *
 * Claims SC 2.4.7 Focus Visible (AA), SC 1.4.11 Non-text Contrast (AA, WCAG 2.1) — the ring
 * itself is a non-text indicator and needs 3:1 against what surrounds it — and SC 1.4.1 Use
 * of Color (A), since a ring distinguished from the unfocused state by hue alone is no
 * indicator at all.
 */
export const focusVisiblePattern: PatternMeta = {
  id: 'focus-visible',
  title: 'Visible focus indicator',
  problem:
    'Someone navigating with a keyboard has exactly one piece of information about where they are on the page: the focus ring. Deleting it without a replacement does not make the site cleaner — it makes it unusable, in the same way that hiding the mouse cursor would.',
  keywords: ['outline none', 'focus ring', 'focus-visible', 'keyboard', 'high contrast mode'],
  criteria: [
    {
      number: '2.4.7',
      name: 'Focus Visible',
      level: 'AA',
      since: '2.0',
      why: 'Any keyboard-operable interface must have a mode of operation where the keyboard focus indicator is visible. A blanket outline:none with no replacement is a direct failure.',
    },
    {
      number: '1.4.11',
      name: 'Non-text Contrast',
      level: 'AA',
      since: '2.1',
      why: 'When you do replace the default ring, the replacement must reach 3:1 contrast against its adjacent colours. A pale grey custom ring on a white card technically exists and still fails.',
    },
    {
      number: '1.4.1',
      name: 'Use of Color',
      level: 'A',
      since: '2.0',
      why: 'A focus indicator that only shifts the hue of a button — with no change in border, weight, or shape — is not perceivable to a visitor with a colour vision deficiency.',
    },
  ],
  section508:
    'E205.4 incorporates WCAG 2.0 Level A and AA, which includes SC 2.4.7 Focus Visible. Note the version boundary honestly: SC 1.4.11 Non-text Contrast is a WCAG 2.1 addition and is therefore NOT incorporated by the 2017 Revised 508 Standards, though it is required by WCAG 2.1 AA and by the U.S. Department of Justice ADA Title II rule (2024), which adopts WCAG 2.1 AA for state and local government web content. WCAG 2.2 adds 2.4.11 Focus Not Obscured (Minimum) at AA and 2.4.13 Focus Appearance at AAA; neither is a 508 requirement.',
  howToTest: {
    keyboard: [
      'Click just above the demo, then press Tab five times to walk through the controls.',
      'In the accessible version every stop shows a thick ring offset from the control.',
      'Now click a button with the mouse — no ring appears, because :focus-visible knows the difference.',
      'In the broken version, press Tab five times and then press Enter. Something happened; you had no way to predict what.',
    ],
    screenReader: [
      'Nothing changes for a screen reader — this criterion is about visible focus, and screen-reader users get focus information spoken instead.',
      'The people this pattern protects are sighted keyboard users: RSI, tremor, temporary injury, power users, and anyone using switch or voice control.',
    ],
  },
  source: SOURCE,
  brokenBehaviour:
    'A scoped stylesheet sets outline: none on :focus and :focus-visible for everything in the demo. Focus still moves — you simply cannot see where it is.',
  Demo,
};
