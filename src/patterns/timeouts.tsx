import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { DemoProps, PatternMeta } from '../lib/types';
import { useFocusTrap } from '../lib/focus';

const SESSION_SECONDS = 30;
const WARN_AT_SECONDS = 12;

/**
 * Session timeout with a warning and an extension.
 *
 * A short demo timer stands in for a twenty-minute session. The mechanics are identical:
 *
 *   Accessible: warn well before the deadline, in a dialog that takes focus and announces
 *   itself, offer at least a 20× extension with a simple action, and never destroy the
 *   user's work without asking.
 *
 *   Broken: expire silently and wipe the form, which is what happens on a great many
 *   government and banking sites today.
 *
 * A note on criterion numbering, because the brief that prompted this site cited "1.4.13":
 * SC 1.4.13 is **Content on Hover or Focus** and is about tooltips and popovers, nothing
 * to do with session limits. The criterion for timeouts is **SC 2.2.1 Timing Adjustable
 * (Level A)**, with SC 2.2.6 Timeouts (Level AAA) covering the specific case of warning
 * about data loss. Getting this right matters more than being agreeable about it.
 */
function Demo({ broken, idPrefix }: DemoProps): ReactNode {
  const [remaining, setRemaining] = useState(SESSION_SECONDS);
  const [running, setRunning] = useState(false);
  const [expired, setExpired] = useState(false);
  const [draft, setDraft] = useState('Half-written answer the user has not submitted yet.');
  const [extensions, setExtensions] = useState(0);
  const startButtonRef = useRef<HTMLButtonElement | null>(null);

  const warning = running && !expired && remaining <= WARN_AT_SECONDS;

  const extend = useCallback((): void => {
    setRemaining(SESSION_SECONDS);
    setExtensions((n) => n + 1);
  }, []);

  // The warning dialog is a real modal in the accessible variant: trapped, labelled, and
  // dismissible with Escape (which here means "keep working", i.e. extend).
  const dialogRef = useFocusTrap({
    active: warning && !broken,
    onEscape: extend,
    returnFocusTo: startButtonRef,
  });

  useEffect(() => {
    if (!running || expired) return;
    const id = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setExpired(true);
          setRunning(false);
          // The broken variant's real damage: the user's unsaved work is gone, with no
          // warning and no way back.
          if (broken) setDraft('');
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, expired, broken]);

  const reset = (): void => {
    setRemaining(SESSION_SECONDS);
    setRunning(false);
    setExpired(false);
    setExtensions(0);
    setDraft('Half-written answer the user has not submitted yet.');
  };

  const titleId = `${idPrefix}-timeout-title`;
  const descId = `${idPrefix}-timeout-desc`;

  return (
    <div>
      <p style={{ marginTop: 0 }}>
        A 30-second stand-in for a 20-minute session. Start it, then leave the tab alone
        and watch what happens to the draft below.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-primary"
          ref={startButtonRef}
          onClick={() => setRunning(true)}
          disabled={running || expired}
        >
          Start the session timer
        </button>
        <button type="button" className="btn" onClick={reset}>
          Reset
        </button>
      </div>

      {/* The countdown itself must NOT be a live region; announcing every second would
          make the page unusable. role="timer" exists and is deliberately silent by
          default. We announce only at the thresholds that matter. */}
      <p role="timer" aria-live="off" style={{ fontWeight: 700, marginBlockStart: '0.75rem' }}>
        {expired
          ? 'Session expired.'
          : running
            ? `Session ends in ${remaining} second${remaining === 1 ? '' : 's'}.`
            : 'Session not started.'}
        {extensions > 0 ? ` (Extended ${extensions}×.)` : ''}
      </p>

      <div className="field">
        <label htmlFor={`${idPrefix}-draft`}>Your unsaved draft</label>
        <textarea
          id={`${idPrefix}-draft`}
          rows={3}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </div>

      {expired ? (
        <p role="alert" style={{ color: 'var(--danger)', fontWeight: 700 }}>
          {broken
            ? '✕ Session expired. Your draft was discarded without warning.'
            : '✕ Session expired. Your draft is still here, nothing was destroyed.'}
        </p>
      ) : null}

      {warning ? (
        broken ? (
          // BROKEN: no warning at all. Rendering nothing here is the point.
          null
        ) : (
          <div
            ref={dialogRef}
            data-testid={`${idPrefix}-timeout-dialog`}
            // role="alertdialog" is role="dialog" plus assertive announcement of its
            // description. It is the correct role for exactly this: an interruption that
            // requires a decision.
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            tabIndex={-1}
            style={{
              border: '2px solid var(--warning)',
              borderRadius: 'var(--radius)',
              padding: '1rem',
              marginBlockStart: '0.75rem',
              background: 'var(--surface-2)',
            }}
          >
            <h5 id={titleId} style={{ marginTop: 0 }}>
              Your session is about to end
            </h5>
            <p id={descId}>
              You will be signed out in {remaining} seconds and your draft will be lost.
              Choose &ldquo;Keep working&rdquo; to continue, or press{' '}
              <kbd>Esc</kbd>.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" onClick={extend}>
                Keep working (adds 30 seconds)
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setRunning(false);
                  setExpired(true);
                }}
              >
                Sign out now
              </button>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}

const SOURCE = `/* SC 2.2.1 Timing Adjustable (Level A) is satisfied if ANY ONE of
   these is true:
     • TURN OFF: the user can switch the limit off before meeting it
     • ADJUST: the user can extend it to at least 10× the default
     • EXTEND: the user is warned before it expires, told simply
                    how to extend (e.g. "press the space bar"), and
                    can extend at least 10 times
     • REAL-TIME: the limit is essential to a real-time event
                    (an auction, a live exam)
     • ESSENTIAL: extending would invalidate the activity
     • 20 HOURS: the limit is longer than 20 hours

   Session security limits are NOT automatically "essential". The
   standard accessible answer is the warn-and-extend pattern below. */

const WARN_BEFORE_MS = 2 * 60 * 1000;   // warn 2 minutes out

useEffect(() => {
  const warn = setTimeout(() => setShowWarning(true),
                          SESSION_MS - WARN_BEFORE_MS);
  const end  = setTimeout(signOut, SESSION_MS);
  return () => { clearTimeout(warn); clearTimeout(end); };
}, [sessionStartedAt]);

{showWarning && (
  <div role="alertdialog"           /* dialog + assertive announcement */
       aria-modal="true"
       aria-labelledby="to-title"
       aria-describedby="to-desc"
       ref={trapRef}                /* focus trap; Esc = keep working */
       tabindex="-1">
    <h2 id="to-title">Your session is about to end</h2>
    <p id="to-desc">
      You will be signed out in 2 minutes and your draft will be lost.
    </p>
    <button onClick={extendSession}>Keep working</button>
    <button onClick={signOut}>Sign out now</button>
  </div>
)}

{/* The countdown itself must NOT be a live region. Announcing every
    second makes the page unusable with a screen reader. role="timer"
    is silent by default: announce only at the thresholds. */}
<p role="timer" aria-live="off">Session ends in {mm}:{ss}</p>

/* Two more rules that cost nothing:
     • PRESERVE THE DATA. Draft to localStorage or the server. SC 2.2.5
       Re-authenticating (AAA) asks for exactly this, and it is the
       difference between an annoyance and a lost afternoon.
     • WARN EARLY ENOUGH to be actionable. A screen-reader user needs
       to hear the announcement, find the dialog, and read the options;
       20 seconds is not enough.

/* Criterion numbering, stated correctly:
     SC 2.2.1 Timing Adjustable        A    ← the timeout criterion
     SC 2.2.3 No Timing                AAA  no time limits at all
     SC 2.2.5 Re-authenticating        AAA  resume without data loss
     SC 2.2.6 Timeouts                 AAA  warn about data-loss limits
     SC 1.4.13 Content on Hover/Focus  AA   tooltips and popovers,
                                            NOT about session limits,
                                            despite being frequently
                                            cited that way. */`;

/**
 * Registry entry for the session-timeout pattern. The demo runs on a compressed clock so
 * the expiry is observable in a browser rather than described; the broken variant simply
 * clears the textarea with no warning, no dialog and nothing announced.
 *
 * Claims SC 2.2.1 Timing Adjustable (A), the warning and the means to extend. SC 4.1.3
 * Status Messages (AA, WCAG 2.1) for announcing the warning without stealing focus, and
 * SC 2.2.6 Timeouts (AAA, WCAG 2.1) for telling the user the limit up front.
 *
 * The `source` block includes a note on SC 1.4.13 Content on Hover or Focus (AA), which is
 * *not* claimed here: it governs tooltips and popovers, and is routinely miscited against
 * session limits. Do not add it to `criteria`.
 */
export const timeoutsPattern: PatternMeta = {
  id: 'timeouts',
  title: 'Session timeouts that warn and extend',
  problem:
    'A silent session timeout punishes exactly the people who take longest: someone using a screen reader, a switch device, or voice input, someone re-reading a complicated question, someone who had to step away. They come back to an empty form and no explanation.',
  keywords: ['session timeout', '2.2.1', 'timing adjustable', 'alertdialog', 'countdown', 'role timer', 'data loss'],
  criteria: [
    {
      number: '2.2.1',
      name: 'Timing Adjustable',
      level: 'A',
      since: '2.0',
      why: 'The criterion that actually governs timeouts. A time limit must be able to be turned off, adjusted to 10× the default, or extended after a warning, with at least ten extensions available.',
    },
    {
      number: '4.1.3',
      name: 'Status Messages',
      level: 'AA',
      since: '2.1',
      why: 'The warning has to reach a screen-reader user. role="alertdialog" both announces the message and takes focus, which is stronger than a plain live region for something requiring a decision.',
    },
    {
      number: '2.2.6',
      name: 'Timeouts',
      level: 'AAA',
      since: '2.1',
      why: 'Users must be warned about the duration of any inactivity that could cause data loss, unless the data is preserved for more than 20 hours. Level AAA, so preserving the draft is best practice, not a conformance requirement.',
    },
  ],
  section508:
    'SC 2.2.1 Timing Adjustable is WCAG 2.0 Level A and is incorporated by E205.4, so a warn-and-extend flow is a genuine Section 508 requirement, one of the more commonly missed ones in agency applications. SC 4.1.3 and SC 2.2.6 are both WCAG 2.1 additions (and 2.2.6 is AAA on top of that), so neither is a 508 requirement. Functional Performance Criteria 302.7 With Limited Manipulation and 302.9 With Limited Language, Cognitive, and Learning Abilities are the ones that explain why the extra time matters: they describe the users for whom every interaction simply takes longer.',
  howToTest: {
    keyboard: [
      'Press Enter on "Start the session timer" and wait about 18 seconds without touching anything.',
      'In the accessible version a warning dialog appears and focus moves into it automatically.',
      'Press Escape: that counts as "keep working" and resets the clock.',
      'Start it again and let it run out. In the accessible version your draft survives; in the broken version the textarea is emptied without warning.',
      'Check that "Keep working" is reachable and operable without a mouse; a warning you cannot dismiss from the keyboard is no warning at all.',
    ],
    screenReader: [
      'Accessible: "Your session is about to end, alert dialog. You will be signed out in 12 seconds and your draft will be lost."',
      'The countdown itself must stay quiet. If your screen reader is reading every second, the timer has been wrongly marked aria-live="polite" or "assertive".',
      'Broken: silence, then an empty textarea. There is no announcement because there is nothing to announce.',
    ],
  },
  source: SOURCE,
  brokenBehaviour:
    'No warning is shown at all. The session simply expires and the textarea is cleared, destroying unsaved work with no announcement, no dialog, and no way to extend.',
  Demo,
};
