/**
 * Pattern: roving tabindex for composite widgets.
 *
 * The pattern is making a toolbar, listbox, tablist, tree, menu or grid behave as a *single*
 * tab stop: exactly one child holds `tabindex="0"` while the rest hold `tabindex="-1"`,
 * arrow keys move the zero between them, and focus is moved programmatically to follow.
 *
 * What breaks without it, in two different directions. Leave every child a tab stop and a
 * thirty-button toolbar costs thirty presses to walk past, which is not a conformance
 * failure but is the kind of friction that makes keyboard operation genuinely unpleasant.
 * Take the tab stops away *without* implementing arrow-key handling (the broken variant
 * here, and the more common bug), and the widget still announces itself as a toolbar of
 * buttons while nothing inside it can be reached at all. The announced role and the actual
 * behaviour contradict each other, and the user is told there is something there that they
 * cannot get to.
 *
 * Criteria demonstrated: SC 2.1.1 Keyboard (Level A), every control operable from the
 * keyboard; SC 2.4.3 Focus Order (Level A), movement follows the visual order and does not
 * jump; SC 4.1.2 Name, Role, Value (Level A), the exposed role has to match what the widget
 * actually does.
 *
 * Roving tabindex is itself a WAI-ARIA Authoring Practices technique, not a success
 * criterion. It is the mechanism by which the criteria above are met comfortably; do not
 * cite it as a requirement in its own right.
 */

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { DemoProps, PatternMeta } from '../lib/types';

interface Tool {
  readonly key: string;
  readonly label: string;
  readonly glyph: string;
}

const TOOLS: readonly Tool[] = [
  { key: 'align-left', label: 'Align left', glyph: '⬅' },
  { key: 'align-center', label: 'Align centre', glyph: '↔' },
  { key: 'align-right', label: 'Align right', glyph: '➡' },
  { key: 'list', label: 'Bulleted list', glyph: '•' },
  { key: 'quote', label: 'Block quote', glyph: '❝' },
  { key: 'code', label: 'Code block', glyph: '{ }' },
];

/**
 * Roving tabindex.
 *
 * The rule: a composite widget (toolbar, listbox, tablist, tree, grid, menu) is ONE tab
 * stop. Tab moves you to the widget; arrow keys move you within it; Tab moves you out.
 *
 * Mechanically that means exactly one child has `tabindex="0"` at any moment and every
 * other child has `tabindex="-1"`. When the arrow keys change the active child, the
 * attributes swap and focus is moved programmatically.
 *
 * Why bother: a formatting toolbar with thirty buttons that are each a tab stop makes Tab
 * useless for getting past it. Roving tabindex is not a WCAG criterion in itself; it is
 * the WAI-ARIA Authoring Practices technique that makes 2.1.1 and 2.4.3 pleasant rather
 * than merely satisfied.
 */
function Demo({ broken, idPrefix }: DemoProps): ReactNode {
  const [activeIndex, setActiveIndex] = useState(0);
  const [pressedKeys, setPressedKeys] = useState<readonly string[]>([]);
  // `shouldFocus` prevents the toolbar stealing focus on first mount. Focus should only
  // move as a consequence of the user pressing a key, never because a component rendered.
  const shouldFocus = useRef(false);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!shouldFocus.current) return;
    buttonRefs.current[activeIndex]?.focus();
  }, [activeIndex]);

  const move = (next: number): void => {
    shouldFocus.current = true;
    setActiveIndex(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const last = TOOLS.length - 1;
    switch (event.key) {
      // A horizontal toolbar responds to Left/Right. A vertical listbox responds to
      // Up/Down. A grid responds to all four. Match the visual orientation, and set
      // aria-orientation when it is not the role's default.
      case 'ArrowRight':
        event.preventDefault();
        move(activeIndex === last ? 0 : activeIndex + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        move(activeIndex === 0 ? last : activeIndex - 1);
        break;
      case 'Home':
        event.preventDefault();
        move(0);
        break;
      case 'End':
        event.preventDefault();
        move(last);
        break;
      default:
        break;
    }
  };

  const toggle = (key: string): void => {
    setPressedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  return (
    <div>
      <p style={{ marginTop: 0 }}>
        A six-button formatting toolbar. Tab into it, then use{' '}
        <kbd>←</kbd> <kbd>→</kbd> <kbd>Home</kbd> <kbd>End</kbd>.
      </p>

      {/* Something before and after the toolbar, so you can feel how many Tab presses it
          costs to get past. */}
      <p>
        <a href={`#${idPrefix}-before`} onClick={(e) => e.preventDefault()}>
          Link before the toolbar
        </a>
      </p>

      <div
        data-testid={`${idPrefix}-toolbar`}
        role="toolbar"
        aria-label="Text formatting"
        aria-orientation="horizontal"
        onKeyDown={broken ? undefined : onKeyDown}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.3rem',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '0.35rem',
          width: 'max-content',
          maxWidth: '100%',
        }}
      >
        {TOOLS.map((tool, index) =>
          broken ? (
            // BROKEN: the container still claims role="toolbar", so assistive technology
            // promises the user an arrow-key composite widget. The items are divs with no
            // tabindex, so there is nothing to arrow to and nothing to Tab to either. The
            // promise and the behaviour disagree, which is worse than never claiming the
            // role at all.
            <div
              key={tool.key}
              role="button"
              className="btn btn-small btn-icon"
              onClick={() => toggle(tool.key)}
              aria-label={tool.label}
              aria-pressed={pressedKeys.includes(tool.key)}
            >
              <span aria-hidden="true">{tool.glyph}</span>
            </div>
          ) : (
            <button
              key={tool.key}
              type="button"
              className="btn btn-small btn-icon"
              ref={(node) => {
                buttonRefs.current[index] = node;
              }}
              // THE roving tabindex line. Exactly one 0, the rest -1.
              tabIndex={index === activeIndex ? 0 : -1}
              aria-label={tool.label}
              aria-pressed={pressedKeys.includes(tool.key)}
              onClick={() => {
                shouldFocus.current = true;
                setActiveIndex(index);
                toggle(tool.key);
              }}
              // A mouse click focuses the button; keep the roving index in sync so the
              // next arrow press continues from where the user actually is.
              onFocus={() => setActiveIndex(index)}
              style={{
                background: pressedKeys.includes(tool.key) ? 'var(--accent)' : undefined,
                color: pressedKeys.includes(tool.key) ? 'var(--accent-contrast)' : undefined,
                borderColor: pressedKeys.includes(tool.key) ? 'var(--accent)' : undefined,
              }}
            >
              <span aria-hidden="true">{tool.glyph}</span>
            </button>
          ),
        )}
      </div>

      <p>
        <a href={`#${idPrefix}-after`} onClick={(e) => e.preventDefault()}>
          Link after the toolbar
        </a>
      </p>

      <p className="hint" style={{ marginBlockEnd: 0 }}>
        Active button: <strong>{TOOLS[activeIndex].label}</strong> · Pressed:{' '}
        {pressedKeys.length === 0 ? 'none' : pressedKeys.join(', ')}
      </p>
    </div>
  );
}

const SOURCE = `const [activeIndex, setActiveIndex] = useState(0);
const refs = useRef([]);

// Move focus only in response to a key press, never on mount.
const shouldFocus = useRef(false);
useEffect(() => {
  if (shouldFocus.current) refs.current[activeIndex]?.focus();
}, [activeIndex]);

function onKeyDown(e) {
  const last = items.length - 1;
  const go = (i) => { shouldFocus.current = true; setActiveIndex(i); };
  switch (e.key) {
    // Wrapping is optional but conventional in a toolbar.
    case 'ArrowRight': e.preventDefault(); go(activeIndex === last ? 0 : activeIndex + 1); break;
    case 'ArrowLeft':  e.preventDefault(); go(activeIndex === 0 ? last : activeIndex - 1); break;
    case 'Home':       e.preventDefault(); go(0);    break;
    case 'End':        e.preventDefault(); go(last); break;
  }
}

<div role="toolbar" aria-label="Text formatting"
     aria-orientation="horizontal" onKeyDown={onKeyDown}>
  {items.map((item, i) => (
    <button ref={el => refs.current[i] = el}
            tabIndex={i === activeIndex ? 0 : -1}   // ← the whole trick
            aria-label={item.label}
            aria-pressed={isPressed(item)}
            onFocus={() => setActiveIndex(i)}>      // keep in sync on click
      <span aria-hidden="true">{item.glyph}</span>
    </button>
  ))}
</div>

/* Orientation and keys by role (WAI-ARIA Authoring Practices):
     toolbar   horizontal → ← →      vertical → ↑ ↓ (set aria-orientation)
     tablist   horizontal → ← →      + Home/End
     listbox   vertical   → ↑ ↓      + Home/End, type-ahead
     menu      vertical   → ↑ ↓      + Home/End, Esc, Tab closes
     grid      both       → all four + Ctrl+Home/End
   The alternative to real focus is aria-activedescendant: focus
   stays on the container and one attribute points at the active
   child. Fewer moving parts, but weaker AT support; prefer real
   focus unless you have a reason. */`;

/**
 * Registry entry for the roving-tabindex pattern. Placed immediately after
 * `customControlsPattern` in `PATTERNS` because it answers the question that one raises:
 * once you have built a composite widget out of non-semantic elements, how does the keyboard
 * move *within* it. Claims SC 2.1.1 Keyboard (A), SC 2.4.3 Focus Order (A) and SC 4.1.2
 * Name, Role, Value (A), see the file header for why the technique itself is not a
 * criterion.
 */
export const rovingTabindexPattern: PatternMeta = {
  id: 'roving-tabindex',
  title: 'Roving tabindex in a toolbar',
  problem:
    'Every button in a composite widget being its own tab stop turns a thirty-button editor toolbar into thirty keystrokes of obstacle between the user and the next thing on the page. Users of switch devices, who may press once every few seconds, feel this most acutely.',
  keywords: ['toolbar', 'tablist', 'listbox', 'arrow keys', 'tabindex -1', 'composite widget', 'aria-activedescendant'],
  criteria: [
    {
      number: '2.1.1',
      name: 'Keyboard',
      level: 'A',
      since: '2.0',
      why: 'The widget and every item in it must be operable from the keyboard. The broken version claims the toolbar role but leaves the items with no tabindex, so none of them can be reached at all.',
    },
    {
      number: '2.4.3',
      name: 'Focus Order',
      level: 'A',
      since: '2.0',
      why: 'Roving tabindex produces a focus sequence that matches the visual order and keeps the widget a single coherent stop rather than an obstacle course.',
    },
    {
      number: '4.1.2',
      name: 'Name, Role, Value',
      level: 'A',
      since: '2.0',
      why: 'role="toolbar" is a promise about behaviour. Applying it to something that does not implement the arrow-key model is a role/behaviour mismatch, which is a 4.1.2 problem as much as a usability one.',
    },
  ],
  section508:
    'Incorporated through E205.4 (content) and 502/503 (software), which reference WCAG 2.0 Level A and AA. Roving tabindex is not named anywhere in the 508 text; it is a technique from the W3C WAI-ARIA Authoring Practices Guide, which is the reference implementation people mean when they say "the ARIA pattern". Functional Performance Criteria 302.7 With Limited Manipulation and 302.8 With Limited Reach and Strength are the ones that make the keystroke count a real accessibility issue and not just an ergonomics nicety.',
  howToTest: {
    keyboard: [
      'Tab from "Link before the toolbar". In the accessible version you land on exactly one toolbar button.',
      'Press Right Arrow several times. Focus moves along the toolbar and wraps around at the end.',
      'Press Home, then End, to jump to the first and last buttons.',
      'Press Tab. You leave the whole toolbar in one press and land on "Link after the toolbar".',
      'Press Shift+Tab back into the toolbar: focus returns to the button you last used, not to the first.',
      'In the broken version, Tab goes straight from the link before to the link after; the six controls do not exist for you.',
    ],
    screenReader: [
      '"Text formatting, toolbar" on entry, then "Align left, button, not pressed".',
      'Arrowing along should announce each button and its pressed state.',
      'In the broken version you hear the toolbar role announced but arrow keys do nothing; the widget promises a behaviour it does not have.',
    ],
  },
  source: SOURCE,
  brokenBehaviour:
    'The container keeps role="toolbar" while the items become divs with role="button" and no tabindex. Nothing inside is focusable, and arrow keys are not handled; the announced role and the actual behaviour contradict each other.',
  Demo,
};
