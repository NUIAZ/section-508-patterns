import { useCallback, useRef, useState, type ReactNode } from 'react';
import type { DemoProps, PatternMeta } from '../lib/types';
import { useFocusTrap } from '../lib/focus';

/**
 * Modal dialog with a focus trap.
 *
 * The accessible version relies on `useFocusTrap` (see src/lib/focus.ts), which handles
 * the four requirements: move focus in, cycle Tab and Shift+Tab, close on Escape, and
 * restore focus to the trigger on close.
 *
 * The broken version renders visually identical markup with none of that behaviour, which
 * is what makes it worth experiencing rather than reading about: Tab past the Cancel
 * button and you are typing into a form you cannot see, behind a scrim.
 */
function Demo({ broken, idPrefix }: DemoProps): ReactNode {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState('');
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback((): void => setOpen(false), []);

  // The hook is always called (rules of hooks) but is inert when `active` is false, which
  // is how the broken variant gets none of the behaviour without a conditional hook.
  const dialogRef = useFocusTrap({
    active: open && !broken,
    onEscape: close,
    returnFocusTo: triggerRef,
  });

  const titleId = `${idPrefix}-dialog-title`;
  const descId = `${idPrefix}-dialog-desc`;

  return (
    <div>
      <p style={{ marginTop: 0 }}>
        Behind the dialog there is a form. In the broken version you can Tab straight into
        it while the dialog is still open.
      </p>

      <button
        type="button"
        className="btn btn-primary"
        ref={triggerRef}
        onClick={() => {
          setResult('');
          setOpen(true);
        }}
      >
        Delete this project…
      </button>

      <p role="status" style={{ minHeight: '1.5em', fontWeight: 600 }}>
        {result}
      </p>

      {/* The "page behind the dialog". Real applications should also set `inert` on this
          container while a modal is open, which removes it from the tab order and the
          accessibility tree in one attribute and is now supported everywhere. The
          accessible demo below relies on the JS trap so you can see the mechanics; in
          production, use BOTH. */}
      <fieldset style={{ marginBlockStart: '1rem' }}>
        <legend>Background form (should be unreachable while the dialog is open)</legend>
        <label htmlFor={`${idPrefix}-bg-name`}>Project name</label>
        <input id={`${idPrefix}-bg-name`} type="text" defaultValue="Quarterly rollout" />
        <p style={{ marginBlockEnd: 0 }}>
          <button type="button" className="btn btn-small">
            Background button
          </button>
        </p>
      </fieldset>

      {open ? (
        <div
          // The scrim. Clicking it closes the dialog in the accessible version — a
          // convenience, not a substitute for Escape, because a keyboard user cannot
          // click a backdrop.
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgb(0 0 0 / 0.5)',
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
            zIndex: 50,
          }}
          onClick={broken ? undefined : close}
        >
          {broken ? (
            // BROKEN: a plain <div>. No role, so it is announced as a group of text with
            // no indication that a dialog opened. No aria-modal, so the screen reader's
            // virtual cursor wanders into the page behind it. No focus moved into it, so
            // the keyboard user's focus is still on the trigger *behind the scrim*. No
            // Escape handling. No focus restoration.
            <div
              data-testid={`${idPrefix}-dialog`}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius)',
                padding: '1.25rem',
                maxWidth: '30rem',
                width: '100%',
              }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Delete project?</div>
              <p>This cannot be undone. All 42 tasks will be removed.</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setResult('Deleted. (Focus was dropped to the body.)');
                    setOpen(false);
                  }}
                >
                  Delete
                </button>
                <button type="button" className="btn" onClick={() => setOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              ref={dialogRef}
              data-testid={`${idPrefix}-dialog`}
              // role="dialog" + aria-modal="true" is the pair that tells assistive
              // technology "this is a modal layer; ignore everything else". aria-modal
              // replaced the old aria-hidden-everything-else dance.
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descId}
              // The container itself is focusable as a last resort, for the edge case of a
              // dialog with no focusable children at all.
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1.25rem',
                maxWidth: '30rem',
                width: '100%',
                boxShadow: 'var(--shadow)',
              }}
            >
              {/* A real heading, referenced by aria-labelledby, so the dialog is announced
                  as "Delete project?, dialog" rather than just "dialog". */}
              <h5 id={titleId} style={{ marginTop: 0 }}>
                Delete project?
              </h5>
              <p id={descId}>This cannot be undone. All 42 tasks will be removed.</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setResult('Deleted. Focus returned to the trigger button.');
                    setOpen(false);
                  }}
                >
                  Delete
                </button>
                <button type="button" className="btn" onClick={close}>
                  Cancel
                </button>
              </div>
              <p className="hint" style={{ marginBlockEnd: 0 }}>
                Press <kbd>Esc</kbd> to close. <kbd>Tab</kbd> cycles between these two
                buttons and never leaves.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

const SOURCE = `function useFocusTrap({ active, onEscape, returnFocusTo }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // 1. Remember where focus came from, so it can go back.
    const previouslyFocused =
      returnFocusTo?.current ?? document.activeElement;

    // 2. Move focus in.
    (getFocusable(container)[0] ?? container).focus();

    const onKeyDown = (e) => {
      // 3. Escape is the required keyboard exit. Without it this
      //    WOULD violate SC 2.1.2 No Keyboard Trap.
      if (e.key === 'Escape') { e.stopPropagation(); onEscape(); return; }
      if (e.key !== 'Tab') return;

      // 4. Cycle. Recompute each time: dialog contents change.
      const items = getFocusable(container);
      if (items.length === 0) { e.preventDefault(); container.focus(); return; }
      const first = items[0];
      const last  = items[items.length - 1];
      const inside = container.contains(document.activeElement);

      if (e.shiftKey ? (!inside || document.activeElement === first)
                     : (!inside || document.activeElement === last)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };

    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      // 5. Restore. isConnected guards against the trigger having
      //    been removed by the action the dialog performed.
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [active, returnFocusTo]);

  return containerRef;
}

// Markup
<div ref={dialogRef}
     role="dialog"
     aria-modal="true"
     aria-labelledby="dlg-title"
     aria-describedby="dlg-desc"
     tabindex="-1">
  <h2 id="dlg-title">Delete project?</h2>
  <p id="dlg-desc">This cannot be undone.</p>
  <button>Delete</button>
  <button onClick={close}>Cancel</button>
</div>

// In production also mark the rest of the page inert, which removes
// it from the tab order AND the accessibility tree:
//   <div id="app-root" inert={isModalOpen}>`;

export const focusTrapPattern: PatternMeta = {
  id: 'focus-trap',
  title: 'Focus trap in a modal dialog',
  problem:
    'A modal that does not manage focus is a lie: it looks blocking but is not. Keyboard and screen-reader users Tab straight past it into the page underneath, filling in a form they cannot see, and when the dialog closes their focus is dumped at the top of the document with no memory of where they were.',
  keywords: ['dialog', 'aria-modal', 'escape key', 'focus restore', 'inert', 'overlay'],
  criteria: [
    {
      number: '2.1.2',
      name: 'No Keyboard Trap',
      level: 'A',
      since: '2.0',
      why: 'Often quoted as a reason NOT to trap focus, which misreads it. 2.1.2 forbids a component focus cannot leave using standard keys. A dialog that closes on Escape provides that exit and conforms; one without an exit is the violation.',
    },
    {
      number: '2.4.3',
      name: 'Focus Order',
      level: 'A',
      since: '2.0',
      why: 'Focus must move into the dialog when it opens and back to the trigger when it closes, so the sequence preserves meaning and operability.',
    },
    {
      number: '4.1.2',
      name: 'Name, Role, Value',
      level: 'A',
      since: '2.0',
      why: 'role="dialog" plus aria-modal="true" plus aria-labelledby gives the layer a role and a name. A bare div has neither, so nothing announces that a dialog opened.',
    },
    {
      number: '2.1.1',
      name: 'Keyboard',
      level: 'A',
      since: '2.0',
      why: 'Every dialog control, including the close affordance, must be reachable and operable from the keyboard. A close "X" that is a div with an onClick is not.',
    },
  ],
  section508:
    'E205.4 incorporates WCAG 2.0 A and AA, covering all four criteria above. Chapter 3 Functional Performance Criteria 302.1 (Without Vision) is the one this pattern speaks to most directly: without the role, the name, and the focus move, a blind user has no way to know a modal opened at all. Note that the Revised Standards also apply to software user interfaces via 502 and 503 — the same dialog rules apply in a desktop or mobile app, not just on the web.',
  howToTest: {
    keyboard: [
      'Tab to "Delete this project…" and press Enter.',
      'Focus should already be inside the dialog, on the Delete button.',
      'Press Tab three or four times. Focus must cycle Delete → Cancel → Delete and never reach "Background button".',
      'Press Shift+Tab from Delete. It should wrap backwards to Cancel.',
      'Press Escape. The dialog closes and focus returns to "Delete this project…", not to the top of the page.',
      'Now switch to Broken and repeat: after two Tab presses you are in the background form, invisibly.',
    ],
    screenReader: [
      '"Delete project?, dialog" — the name and the role, together, on open.',
      'Then the description, then "Delete, button".',
      'Browsing with the virtual cursor should stay inside the dialog; aria-modal="true" is what confines it.',
      'In the broken version you hear the previous button still focused, and nothing announces that anything opened.',
    ],
  },
  source: SOURCE,
  brokenBehaviour:
    'The dialog is a plain div: no role, no aria-modal, no label, focus never moves into it, Escape does nothing, Tab walks into the background form, and closing drops focus onto the body.',
  Demo,
};
