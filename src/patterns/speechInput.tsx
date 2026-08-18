import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { DemoProps, PatternMeta } from '../lib/types';
import { computeAccessibleName } from '../lib/focus';

/** Placeholder for the sibling repository referenced in the README. */
export const VOICE_DEMO_REPO_URL = 'https://github.com/NUIAZ/voice-command-demo';

interface NameCheck {
  readonly visible: string;
  readonly accessible: string;
  readonly passes: boolean;
}

/**
 * Speech input as assistive technology.
 *
 * Voice control (Dragon, Windows Voice Access, macOS/iOS Voice Control, Android Voice
 * Access) works by matching what the user SAYS against the control's ACCESSIBLE NAME. So
 * a button that reads "Save" on screen but carries `aria-label="Submit form"` cannot be
 * activated by saying "click Save", the visible label and the name have diverged.
 *
 * That is SC 2.5.3 Label in Name, and it is the criterion most often broken by someone
 * *trying* to improve accessibility: they add an aria-label to make the announcement more
 * descriptive and silently break voice control in the process.
 *
 * The demo runs the actual check. For each button it reads the visible text and the
 * computed accessible name and reports whether the name contains the visible text.
 */
function Demo({ broken }: DemoProps): ReactNode {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [checks, setChecks] = useState<readonly NameCheck[]>([]);

  useEffect(() => {
    const stage = stageRef.current;
    if (stage === null) return;
    const buttons = Array.from(stage.querySelectorAll<HTMLButtonElement>('button'));
    setChecks(
      buttons.map((button) => {
        const visible = (button.textContent ?? '').trim();
        const accessible = computeAccessibleName(button);
        // The criterion says the accessible name must CONTAIN the visible label text.
        // Case and punctuation differences are tolerated by the criterion; word order is
        // not, and neither is omission.
        const passes =
          visible !== '' &&
          accessible.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').includes(
            visible.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, ''),
          );
        return { visible, accessible, passes };
      }),
    );
  }, [broken]);

  return (
    <div>
      <p style={{ marginTop: 0 }}>
        Imagine saying &ldquo;click Save&rdquo; out loud. Voice control matches your words
        against each control&rsquo;s accessible name, not against what is drawn on screen.
      </p>

      <div ref={stageRef} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {broken ? (
          <>
            {/* BROKEN: a well-intentioned aria-label that REPLACES the visible text.
                The screen-reader announcement got more descriptive and the button
                became unreachable by voice. */}
            <button type="button" className="btn btn-primary" aria-label="Submit the application form">
              Save
            </button>
            <button type="button" className="btn" aria-label="Discard all unsaved changes and return">
              Cancel
            </button>
            {/* BROKEN: visible text nowhere in the name, from an icon-plus-text button
                where only the icon was labelled. */}
            <button type="button" className="btn" aria-label="Navigate backwards">
              <span aria-hidden="true">←</span> Previous step
            </button>
          </>
        ) : (
          <>
            {/* The accessible name STARTS WITH the visible text, then adds detail. This
                satisfies 2.5.3 and still gives screen-reader users the extra context. */}
            <button type="button" className="btn btn-primary" aria-label="Save the application form">
              Save
            </button>
            <button type="button" className="btn" aria-label="Cancel and discard unsaved changes">
              Cancel
            </button>
            {/* Simplest and safest: no aria-label at all. The visible text IS the name,
                so they cannot possibly diverge. */}
            <button type="button" className="btn">
              <span aria-hidden="true">←</span> Previous step
            </button>
          </>
        )}
      </div>

      <div className="note" style={{ marginBlockStart: '1rem' }}>
        <h5 style={{ marginTop: 0 }}>Label in Name check</h5>
        <div className="table-scroll">
          <table className="data-table">
            <caption>Does each accessible name contain its visible label?</caption>
            <thead>
              <tr>
                <th scope="col">Visible label</th>
                <th scope="col">Accessible name</th>
                <th scope="col">SC 2.5.3</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((check, index) => (
                <tr key={index}>
                  <th scope="row">{check.visible}</th>
                  <td>{check.accessible}</td>
                  <td
                    style={{
                      color: check.passes ? 'var(--success)' : 'var(--danger)',
                      fontWeight: 700,
                    }}
                  >
                    <span aria-hidden="true">{check.passes ? '✓ ' : '✕ '}</span>
                    {check.passes ? 'Pass' : 'Fail: cannot be activated by voice'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="note" style={{ marginBlockStart: '0.75rem' }}>
        A companion repository demonstrating voice-driven navigation lives at{' '}
        <a href={VOICE_DEMO_REPO_URL}>
          <code>{VOICE_DEMO_REPO_URL}</code>
        </a>
        .
      </p>
    </div>
  );
}

const SOURCE = `{/* ✅ Best: no aria-label. The visible text IS the accessible
    name, so they cannot diverge. */}
<button>Previous step</button>

{/* ✅ Fine: the name STARTS WITH the visible text and adds context
    for screen-reader users. "click Save" still works. */}
<button aria-label="Save the application form">Save</button>

{/* ❌ Broken: the name REPLACES the visible text. A voice-control
    user saying "click Save" gets nothing; the word "Save" does not
    appear in the accessible name at all. */}
<button aria-label="Submit the application form">Save</button>

{/* ❌ Also broken, and very common: an icon-and-text button where
    someone labelled it for the icon. */}
<button aria-label="Navigate backwards">← Previous step</button>

{/* The same trap in forms: the placeholder is visible, the
    aria-label is the name, and they disagree: */}
<input aria-label="Electronic mail address" placeholder="Email" />
{/* ✅ instead: a real <label> whose text is the name */}
<label for="email">Email</label><input id="email">

/* SC 2.5.3 Label in Name (Level A, WCAG 2.1)
   "For user interface components with labels that include text or
    images of text, the name contains the text that is presented
    visually."

   Practical reading:
     • CONTAINS, not equals; you may add to it.
     • Word order matters. Extra words at the FRONT are the usual
       failure ("Search products" as the name for a button reading
       "Search" is fine; "Product search" is not, because the
       visible string "Search" is present but the leading words
       break the match for most voice engines).
     • Punctuation and case differences are tolerated.
     • It applies to anything with a visible text label: buttons,
       links, form fields, tabs, menu items.

   Who this affects: voice-control users (Dragon, Windows Voice
   Access, macOS and iOS Voice Control, Android Voice Access), and
   also screen-reader users who can see the screen, hearing a name
   that does not match what they are looking at is disorienting. */`;

/**
 * Registry entry for the speech-input pattern, the counterintuitive one, and the reason it
 * earns a card of its own rather than a footnote on `accessibleName`.
 *
 * Its broken variant is not neglect but a well-meant fix: an `aria-label` written to improve
 * the screen-reader announcement, which *replaces* the visible text instead of extending it.
 * The result is a button a voice-control user cannot activate, because saying the words
 * printed on it matches nothing in the accessible name. Two accessibility improvements in
 * direct conflict, and the rule that resolves them is SC 2.5.3: the visible label must be
 * contained in the accessible name.
 *
 * Claims SC 2.5.3 Label in Name (A, WCAG 2.1), SC 4.1.2 Name, Role, Value (A) and SC 2.1.1
 * Keyboard (A).
 */
export const speechInputPattern: PatternMeta = {
  id: 'speech-input',
  title: 'Speech input and Label in Name',
  problem:
    'Voice control activates a control by matching what you say against its accessible name. When a developer adds a "more descriptive" aria-label that replaces the visible text, the screen-reader announcement improves and the button becomes impossible to click by voice: an accessibility fix that breaks accessibility.',
  keywords: ['voice control', 'dragon', 'voice access', 'label in name', '2.5.3', 'speech recognition', 'aria-label'],
  criteria: [
    {
      number: '2.5.3',
      name: 'Label in Name',
      level: 'A',
      since: '2.1',
      why: 'For components whose label includes visible text, the accessible name must contain that text. This is the criterion, and it exists specifically for speech input.',
    },
    {
      number: '4.1.2',
      name: 'Name, Role, Value',
      level: 'A',
      since: '2.0',
      why: 'Voice control needs the name to exist at all before it can match against it; an unnamed icon button is unreachable by voice for the same reason it is unreachable by screen reader.',
    },
    {
      number: '2.1.1',
      name: 'Keyboard',
      level: 'A',
      since: '2.0',
      why: 'Most speech-input software drives the page through simulated keyboard and pointer events, so anything that is not keyboard-operable is generally not voice-operable either.',
    },
  ],
  section508:
    'Be careful here. SC 2.5.3 Label in Name is a WCAG 2.1 addition and is therefore NOT incorporated by the 2017 Revised Section 508 Standards, which reference WCAG 2.0. What Section 508 does provide is Chapter 3 Functional Performance Criteria: 302.7 With Limited Manipulation and 302.8 With Limited Reach and Strength describe the users who rely on speech input, and 302.6 Without Speech covers the mirror case: an interface must not REQUIRE speech. So under 508 alone the argument is a functional-performance one; under WCAG 2.1 AA, EN 301 549, and the DOJ ADA Title II rule (2024), 2.5.3 applies directly.',
  howToTest: {
    keyboard: [
      'Read the "Visible label" and "Accessible name" columns side by side. Where the visible string does not appear inside the name, voice control cannot reach that control.',
      'If you have Windows Voice Access or macOS Voice Control, turn it on and try saying "click Save" against each variant. This is the only way to really feel it.',
      'Free proxy without any voice software: in browser devtools, open the Accessibility pane, select a button, and compare the Name field to the text you can see.',
    ],
    screenReader: [
      'Broken: "Submit the application form, button", while the screen shows "Save". A screen-reader user with partial vision hears one thing and reads another.',
      'Accessible: "Save the application form, button": the announcement is still richer than the visible text, and the visible text is still in there.',
      'The failure mode is silent in both directions: automated tools can flag it (axe has a "label-in-name" style rule), but only a human notices the mismatch is confusing.',
    ],
  },
  source: SOURCE,
  brokenBehaviour:
    'Each button carries an aria-label that replaces rather than extends its visible text, so the visible string does not appear in the accessible name at all. The check table below computes and reports the mismatch.',
  Demo,
};
