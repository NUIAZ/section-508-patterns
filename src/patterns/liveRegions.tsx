import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { DemoProps, PatternMeta } from '../lib/types';

type Phase = 'idle' | 'loading' | 'done' | 'failed';

/**
 * Live regions.
 *
 * The demo runs a fake async save so the announcement is genuinely asynchronous, which is
 * the only case live regions exist for. If the update happens as a direct result of the
 * user's own keypress on the control they are focused on, focus management is usually the
 * better answer.
 *
 * Two politeness levels are demonstrated side by side:
 *   role="status"  → implicit aria-live="polite"  → queued, spoken at the next pause.
 *   role="alert"   → implicit aria-live="assertive" → interrupts whatever is being said.
 *
 * The most important implementation detail is invisible in the markup: **the region must
 * already be in the DOM before its content changes.** Assistive technology subscribes to
 * mutations of existing live regions. Mount the region and its text in the same tick and
 * many screen readers announce nothing at all. That is why the containers below are
 * always rendered and only their text changes, and why the broken variant mounts them on
 * demand, which is the second-most-common way this goes wrong.
 */
function Demo({ broken, idPrefix }: DemoProps): ReactNode {
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorPhase, setErrorPhase] = useState<Phase>('idle');
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const runSave = (): void => {
    setPhase('loading');
    timers.current.push(
      window.setTimeout(() => setPhase('done'), 1200),
    );
  };

  const runError = (): void => {
    setErrorPhase('loading');
    timers.current.push(
      window.setTimeout(() => setErrorPhase('failed'), 900),
    );
  };

  const statusText =
    phase === 'loading'
      ? 'Saving…'
      : phase === 'done'
        ? 'Saved. 3 records updated.'
        : '';

  const alertText =
    errorPhase === 'failed' ? 'Upload failed: the file is larger than 25 MB.' : '';

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" onClick={runSave}>
          Save (polite status)
        </button>
        <button type="button" className="btn" onClick={runError}>
          Upload a too-large file (assertive alert)
        </button>
      </div>

      <div style={{ marginBlockStart: '1rem', display: 'grid', gap: '0.75rem' }}>
        <div>
          <strong>Polite status region</strong>
          {broken ? (
            // BROKEN #1: no role, no aria-live. The text appears on screen and is
            // announced to precisely nobody. Sighted users see it; everyone else does not
            // know the save finished.
            // BROKEN #2: the element is only mounted when there is something to say, so
            // even adding aria-live later would not reliably help.
            statusText === '' ? null : (
              <div data-testid={`${idPrefix}-status`} style={{ padding: '0.4rem 0' }}>
                {statusText}
              </div>
            )
          ) : (
            <div
              data-testid={`${idPrefix}-status`}
              // role="status" already implies aria-live="polite" and aria-atomic="true".
              // Both are written out here because explicit beats clever when the next
              // developer is deciding whether it is safe to change.
              role="status"
              aria-live="polite"
              aria-atomic="true"
              style={{ padding: '0.4rem 0', minHeight: '1.6em' }}
            >
              {statusText}
            </div>
          )}
          <p className="hint" style={{ margin: 0 }}>
            Polite: waits for a pause. Correct for progress, confirmations, filter counts,
            autosave.
          </p>
        </div>

        <div>
          <strong>Assertive alert region</strong>
          {broken ? (
            alertText === '' ? null : (
              <div
                data-testid={`${idPrefix}-alert`}
                style={{ padding: '0.4rem 0', color: 'var(--danger)', fontWeight: 700 }}
              >
                {alertText}
              </div>
            )
          ) : (
            <div
              data-testid={`${idPrefix}-alert`}
              // role="alert" implies aria-live="assertive". Reserve it for things the user
              // must know immediately: errors, session expiry, data loss. Overusing
              // assertive makes a screen reader unusable; every announcement stomps the
              // last one.
              role="alert"
              aria-live="assertive"
              style={{
                padding: '0.4rem 0',
                minHeight: '1.6em',
                color: alertText === '' ? undefined : 'var(--danger)',
                fontWeight: alertText === '' ? undefined : 700,
              }}
            >
              {/* The text carries "failed" in words, so the message is not conveyed by the
                  red colour alone (SC 1.4.1 Use of Color). */}
              {alertText}
            </div>
          )}
          <p className="hint" style={{ margin: 0 }}>
            Assertive: interrupts. Correct for errors and time-critical warnings, wrong for
            everything else.
          </p>
        </div>
      </div>
    </div>
  );
}

const SOURCE = `{/* Render the region on FIRST paint and keep it mounted.
    Assistive tech watches existing live regions for mutations; a
    region that appears at the same instant as its text is routinely
    missed. This is the number-one live-region bug. */}
<div role="status" aria-live="polite" aria-atomic="true">
  {statusText}
</div>

<div role="alert" aria-live="assertive">
  {errorText}
</div>

/* Which to use
   ─────────────────────────────────────────────────────────────
   role="status"  ≡ aria-live="polite"     queued, non-interrupting
   role="alert"   ≡ aria-live="assertive"  interrupts immediately
   role="log"     ≡ polite + relevant="additions"  chat, console
   role="timer"   ≡ off by default; announce explicitly instead

   aria-atomic="true"  read the WHOLE region on any change
   aria-atomic="false" read only what changed (default)
   aria-relevant       which mutations count (additions text, default)
   aria-busy="true"    suppress announcements while a batch renders
*/

// If the update is a direct response to the user's own action on
// the control they are focused on, prefer MOVING FOCUS to the new
// content over announcing it. Live regions are for things that
// happen without the user asking right now.

// React StrictMode / fast re-render caveat: setting the same string
// twice does not re-announce. If a repeat announcement matters
// (e.g. "still saving…"), vary the text or clear then set on a tick.`;

export const liveRegionsPattern: PatternMeta = {
  id: 'live-regions',
  title: 'Live regions for async status',
  problem:
    'Something finished, failed, or changed count, and the only evidence is a piece of text that appeared somewhere the user is not looking. Sighted users catch it peripherally. A screen-reader user, whose attention is wherever their cursor is, is told nothing at all.',
  keywords: [
    'aria-live',
    'polite',
    'assertive',
    'role status',
    'role alert',
    'announcement',
    'toast',
  ],
  criteria: [
    {
      number: '4.1.3',
      name: 'Status Messages',
      level: 'AA',
      since: '2.1',
      why: 'Status messages that do not receive focus must be programmatically determinable through role or properties, so assistive technology can present them. This is exactly what role="status" and role="alert" do.',
    },
    {
      number: '3.3.1',
      name: 'Error Identification',
      level: 'A',
      since: '2.0',
      why: 'When the failure above is an input error, it must additionally be identified and described in text, which the assertive region does.',
    },
    {
      number: '1.4.1',
      name: 'Use of Color',
      level: 'A',
      since: '2.0',
      why: 'The failure message says the word "failed". Turning the text red and stopping there conveys the state by colour alone.',
    },
  ],
  section508:
    'This is the clearest example on the site of a version boundary that matters. SC 4.1.3 Status Messages is NEW in WCAG 2.1, so it is not incorporated by the 2017 Revised Section 508 Standards, which reference WCAG 2.0 Level A and AA via E205.4. Claiming "508 requires aria-live" would be wrong. What is true: 4.1.3 is required by WCAG 2.1 AA, by EN 301 549, and by the U.S. DOJ ADA Title II rule (2024) for state and local government. Under 508 alone, the closest binding hooks are Chapter 3 Functional Performance Criteria 302.1 Without Vision and 302.2 With Limited Vision; an unannounced status message means the information simply is not available to those users.',
  howToTest: {
    keyboard: [
      'Activate "Save (polite status)" with Enter and leave focus on the button.',
      'The text below changes to "Saving…" and then "Saved. 3 records updated.", with no focus movement at all. That is the point: focus stays put.',
      'Activate the upload button and note the alert appears the same way.',
    ],
    screenReader: [
      'Accessible version: after pressing Save you hear "Saving…", then, about a second later, "Saved. 3 records updated." without touching anything.',
      'The assertive alert should cut in over whatever is being spoken.',
      'Broken version: total silence. The text is on the screen and is not in any live region, so nothing is ever announced.',
      'NVDA tip: use the speech viewer (NVDA menu → Tools → Speech Viewer) to see announcements as text, much faster than listening while you iterate.',
    ],
  },
  source: SOURCE,
  brokenBehaviour:
    'Both regions lose their role and aria-live attributes, and they are only mounted once there is a message, so even a screen reader that polls would have nothing to subscribe to. The text is visible and completely silent.',
  Demo,
};
