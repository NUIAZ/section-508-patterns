import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { DemoProps, PatternMeta } from '../lib/types';

const MENU_ITEMS = ['Duplicate', 'Move to archive', 'Export as CSV', 'Delete'] as const;

/**
 * Two custom controls built out of `<div>`s: a switch and a menu.
 *
 * Building either of these from divs is a bad idea; a `<button>` or `<input
 * type="checkbox" role="switch">` gives you the keyboard model, the focusability, the role
 * and the forced-colors handling for free. They are here because real codebases are full
 * of div-based controls, and the point is to show precisely how much work it takes to get
 * back what you threw away.
 *
 * The switch needs, at minimum:
 *   role="switch"      so it is announced as a switch, not read as text
 *   tabindex="0"       so it is reachable at all
 *   aria-checked       so its state is exposed and updates
 *   Space AND Enter    the button keyboard contract; Space must not scroll the page
 *
 * The menu needs role="menu"/"menuitem", `aria-haspopup` and `aria-expanded` on the
 * trigger, arrow-key navigation with roving focus, Home/End, Escape to close, and focus
 * returned to the trigger.
 */
function Demo({ broken, idPrefix }: DemoProps): ReactNode {
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Move DOM focus to the active menu item whenever the menu is open. Focus, not just a
  // highlight: aria-activedescendant is the alternative, but real focus is easier to get
  // right and works with more assistive technology.
  useEffect(() => {
    if (!open || broken) return;
    itemRefs.current[activeIndex]?.focus();
  }, [open, activeIndex, broken]);

  const switchLabelId = `${idPrefix}-switch-label`;

  const onSwitchKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    // Space and Enter both activate a button-like control. Space must be prevented from
    // its default action or it scrolls the page underneath the user.
    if (event.key === ' ' || event.key === 'Enter' || event.key === 'Spacebar') {
      event.preventDefault();
      setChecked((prev) => !prev);
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % MENU_ITEMS.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((i) => (i - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(MENU_ITEMS.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case 'Tab':
        // Tab out of a menu closes it; the WAI-ARIA Authoring Practices menu-button
        // behaviour. Note we do NOT preventDefault: the user asked to leave.
        setOpen(false);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        setChosen(MENU_ITEMS[activeIndex]);
        setOpen(false);
        triggerRef.current?.focus();
        break;
      default:
        break;
    }
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <section aria-labelledby={`${idPrefix}-switch-heading`}>
        <h5 id={`${idPrefix}-switch-heading`} style={{ marginTop: 0 }}>
          A toggle switch
        </h5>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span id={switchLabelId}>Email notifications</span>

          {broken ? (
            // BROKEN: a styled div with an onClick. Not focusable, no role, no state.
            // A mouse user cannot tell it apart from the accessible one. Nobody else can
            // use it at all.
            <div
              data-testid={`${idPrefix}-switch`}
              onClick={() => setChecked((prev) => !prev)}
              style={{
                cursor: 'pointer',
                width: '3.25rem',
                height: '1.75rem',
                borderRadius: '999px',
                background: checked ? 'var(--accent)' : 'var(--border)',
                position: 'relative',
                transition: 'background var(--duration)',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '0.2rem',
                  insetInlineStart: checked ? '1.7rem' : '0.2rem',
                  width: '1.35rem',
                  height: '1.35rem',
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'inset-inline-start var(--duration)',
                }}
              />
            </div>
          ) : (
            <div
              data-testid={`${idPrefix}-switch`}
              role="switch"
              tabIndex={0}
              aria-checked={checked}
              aria-labelledby={switchLabelId}
              onClick={() => setChecked((prev) => !prev)}
              onKeyDown={onSwitchKeyDown}
              style={{
                cursor: 'pointer',
                width: '3.25rem',
                height: '1.75rem',
                borderRadius: '999px',
                border: '1px solid var(--border-strong)',
                background: checked ? 'var(--accent)' : 'var(--surface-2)',
                position: 'relative',
                transition: 'background var(--duration)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '0.15rem',
                  insetInlineStart: checked ? '1.65rem' : '0.15rem',
                  width: '1.35rem',
                  height: '1.35rem',
                  borderRadius: '50%',
                  background: 'var(--bg)',
                  border: '1px solid var(--border-strong)',
                  transition: 'inset-inline-start var(--duration)',
                }}
              />
            </div>
          )}

          {/* Visible text state, so the switch is not communicated by position and colour
              alone: helps colour-blind and low-vision users, and everyone on a small
              screen. */}
          <span style={{ fontWeight: 600 }}>{checked ? 'On' : 'Off'}</span>
        </div>
      </section>

      <section aria-labelledby={`${idPrefix}-menu-heading`}>
        <h5 id={`${idPrefix}-menu-heading`}>An actions menu</h5>

        <button
          type="button"
          className="btn"
          ref={triggerRef}
          // aria-haspopup tells the user what kind of thing will open; aria-expanded
          // reports whether it is open right now. Both are omitted in the broken version.
          aria-haspopup={broken ? undefined : 'menu'}
          aria-expanded={broken ? undefined : open}
          onClick={() => {
            setActiveIndex(0);
            setOpen((prev) => !prev);
          }}
          onKeyDown={(event) => {
            if (broken) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex(0);
              setOpen(true);
            }
          }}
        >
          Actions <span aria-hidden="true">▾</span>
        </button>

        {open ? (
          broken ? (
            // BROKEN: divs with click handlers, no roles, no tabindex, no key handling.
            // Completely unreachable by keyboard; announced as a run of plain text.
            <div
              data-testid={`${idPrefix}-menu`}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                marginBlockStart: '0.35rem',
                width: 'max-content',
                background: 'var(--surface)',
              }}
            >
              {MENU_ITEMS.map((item) => (
                <div
                  key={item}
                  onClick={() => {
                    setChosen(item);
                    setOpen(false);
                  }}
                  style={{ padding: '0.4rem 0.9rem', cursor: 'pointer' }}
                >
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <div
              data-testid={`${idPrefix}-menu`}
              role="menu"
              aria-label="Project actions"
              onKeyDown={onMenuKeyDown}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                marginBlockStart: '0.35rem',
                width: 'max-content',
                background: 'var(--surface)',
                boxShadow: 'var(--shadow)',
              }}
            >
              {MENU_ITEMS.map((item, index) => (
                <div
                  key={item}
                  role="menuitem"
                  // Roving tabindex inside the menu: exactly one item is tabbable, the
                  // rest are reachable only by arrow key. See the roving-tabindex pattern.
                  tabIndex={index === activeIndex ? 0 : -1}
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  onClick={() => {
                    setChosen(item);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  style={{
                    padding: '0.4rem 0.9rem',
                    cursor: 'pointer',
                    background: index === activeIndex ? 'var(--surface-2)' : undefined,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          )
        ) : null}

        <p role="status" style={{ minHeight: '1.5em', marginBlockEnd: 0 }}>
          {chosen === '' ? ' ' : `Chose: ${chosen}`}
        </p>
      </section>
    </div>
  );
}

const SOURCE = `{/* ── FIRST, THE HONEST ANSWER ───────────────────────────────
    Do not build these from divs. A native control already has the
    role, the focusability, the keyboard model, and correct
    behaviour in Windows High Contrast Mode:

      <button type="button" aria-pressed={on}>Notifications</button>
      <input type="checkbox" role="switch" checked={on} … />

    Everything below is what you must re-implement by hand if you
    ignore that advice. ──────────────────────────────────────── */}

{/* Switch from a div */}
<div role="switch"
     tabindex="0"
     aria-checked={checked}
     aria-labelledby="notif-label"
     onClick={toggle}
     onKeyDown={(e) => {
       // Space AND Enter. Space must preventDefault or the page
       // scrolls under the user.
       if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
     }} />

{/* Menu button + menu (WAI-ARIA Authoring Practices) */}
<button aria-haspopup="menu" aria-expanded={open} onClick={toggleMenu}>
  Actions
</button>

<div role="menu" aria-label="Project actions" onKeyDown={onMenuKeyDown}>
  {items.map((item, i) => (
    <div role="menuitem"
         tabindex={i === activeIndex ? 0 : -1}
         ref={el => itemRefs.current[i] = el}>
      {item}
    </div>
  ))}
</div>

function onMenuKeyDown(e) {
  switch (e.key) {
    case 'ArrowDown': e.preventDefault(); next();  break;
    case 'ArrowUp':   e.preventDefault(); prev();  break;
    case 'Home':      e.preventDefault(); first(); break;
    case 'End':       e.preventDefault(); last();  break;
    case 'Escape':    e.preventDefault(); close(); trigger.focus(); break;
    case 'Tab':       close(); break;   // no preventDefault: let them leave
    case 'Enter':
    case ' ':         e.preventDefault(); activate(); close(); trigger.focus(); break;
  }
}`;

/**
 * Registry entry for the custom-controls pattern, a switch and a menu button rebuilt from
 * non-semantic elements, with role, tabindex, state and key handling supplied by hand.
 *
 * The line worth keeping in view is in `brokenBehaviour`: stripped of all of that, the
 * controls still work perfectly with a mouse. That is why this failure ships. Nothing in a
 * click-through review surfaces it, and the fix is not one attribute but the whole set,
 * role, tab stop, state, and keyboard contract together.
 *
 * Claims SC 2.1.1 Keyboard (A), SC 4.1.2 Name, Role, Value (A), SC 2.4.3 Focus Order (A)
 * and SC 2.4.7 Focus Visible (AA).
 */
export const customControlsPattern: PatternMeta = {
  id: 'custom-controls',
  title: 'Keyboard-operable custom controls',
  problem:
    'A div with an onClick handler looks and behaves like a button for exactly one kind of user: someone with a working mouse and working eyes. It is not focusable, has no role, exposes no state, and does not respond to Space or Enter. This is the single most common way an otherwise well-built interface becomes unusable.',
  keywords: [
    'role switch',
    'role menu',
    'menuitem',
    'aria-checked',
    'aria-expanded',
    'aria-haspopup',
    'div onclick',
    'tabindex',
  ],
  criteria: [
    {
      number: '2.1.1',
      name: 'Keyboard',
      level: 'A',
      since: '2.0',
      why: 'All functionality must be operable through a keyboard interface. A div with no tabindex cannot receive focus, so its functionality is unreachable.',
    },
    {
      number: '4.1.2',
      name: 'Name, Role, Value',
      level: 'A',
      since: '2.0',
      why: 'role="switch" supplies the role, aria-labelledby the name, aria-checked the value, and the value must update as the state changes. A styled div supplies none of the three.',
    },
    {
      number: '2.4.3',
      name: 'Focus Order',
      level: 'A',
      since: '2.0',
      why: 'Opening a menu should move focus into it, and Escape should return focus to the trigger, so the sequence stays meaningful.',
    },
    {
      number: '2.4.7',
      name: 'Focus Visible',
      level: 'AA',
      since: '2.0',
      why: 'A custom control that takes focus must show it. Custom widgets are where designers most often forget, because the default ring rarely suits a bespoke shape.',
    },
  ],
  section508:
    'All four are WCAG 2.0 criteria and are incorporated by E205.4 for web content and by 502.3 (Accessibility Services) and 503 for software user interfaces. 502.3.1 through 502.3.14 spell out, in software terms, essentially what 4.1.2 requires: object role, state, name, and value must be programmatically determinable and, where the user can set them, settable. Functional Performance Criteria 302.7 (With Limited Manipulation) and 302.8 (With Limited Reach and Strength) apply directly; these are the users for whom the keyboard, a switch device, or voice is the only input method.',
  howToTest: {
    keyboard: [
      'Tab to the switch. In the accessible version it takes focus and shows a ring; in the broken version Tab skips it entirely.',
      'Press Space, then Enter. Both should toggle it, and the visible "On/Off" text should change.',
      'Tab to the "Actions" button and press Enter or Down Arrow to open the menu.',
      'Press Down and Up to move between items, Home and End to jump to the ends.',
      'Press Escape: the menu closes and focus returns to the Actions button.',
      'In the broken version, open the menu with the mouse and then press Tab: focus skips straight past all four items.',
    ],
    screenReader: [
      'Accessible switch: "Email notifications, switch, off", then "on" when toggled.',
      'Accessible menu trigger: "Actions, menu pop-up button, collapsed", becoming "expanded".',
      'Menu items: "Duplicate, menu item, 1 of 4".',
      'Broken switch: read as a stray piece of text with no role and no state, if it is announced at all.',
      'Broken menu: four unrelated lines of text with no indication they are options.',
    ],
  },
  source: SOURCE,
  brokenBehaviour:
    'The switch loses role, tabindex, and aria-checked; it becomes a decorated div with a click handler. The menu items lose role and tabindex, and the trigger loses aria-haspopup and aria-expanded. Everything still works perfectly with a mouse.',
  Demo,
};
