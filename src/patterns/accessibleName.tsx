/**
 * Pattern: accessible names for icon-only controls.
 *
 * The pattern is giving every control a text name that assistive technology can read, even
 * when nothing about it is text — via `aria-label`, visually hidden text, or a `<title>`
 * inside an SVG — and marking the decorative glyph `aria-hidden` so it does not compete.
 *
 * What breaks without it: a toolbar of pictograms announces as "button, button, button,
 * button". The control is still reachable and still clickable, so it survives a keyboard
 * sweep and often survives an automated scan too; it is simply unusable by anyone who
 * cannot see the icon, and unspeakable by anyone driving the page with their voice.
 *
 * Criteria demonstrated: SC 4.1.2 Name, Role, Value (Level A) — the direct failure, a
 * component with a role and no name; SC 1.1.1 Non-text Content (Level A) — the icon is
 * non-text content carrying the control's purpose; SC 2.5.3 Label in Name (Level A, added
 * in WCAG 2.1) — the constraint on the fix, since a control that *does* have visible text
 * must keep that text inside its accessible name.
 *
 * The demo computes and displays each button's name after render, so the broken variant
 * shows literal empty strings rather than asserting that they are empty. See the caveat on
 * `computeAccessibleName`: it is a simplified implementation and the browser's own
 * accessibility tree remains the authority.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { DemoProps, PatternMeta } from '../lib/types';
import { computeAccessibleName } from '../lib/focus';

interface ToolbarAction {
  readonly key: string;
  readonly label: string;
  readonly glyph: string;
}

const ACTIONS: readonly ToolbarAction[] = [
  { key: 'bold', label: 'Bold', glyph: 'B' },
  { key: 'italic', label: 'Italic', glyph: 'I' },
  { key: 'link', label: 'Insert link', glyph: '🔗' },
  { key: 'delete', label: 'Delete paragraph', glyph: '🗑' },
];

/**
 * Icon-only buttons, named and unnamed.
 *
 * The demo includes a live "accessibility tree preview" that computes each button's
 * accessible name from the DOM after render. That turns an abstract rule into an
 * observation: in the broken variant the preview literally shows empty names, which is
 * exactly what a screen reader would have to work with.
 *
 * Caveat stated on the page as well as here: `computeAccessibleName` is a simplified
 * implementation of the ARIA name computation. It is a teaching aid, not a substitute for
 * checking the real accessibility tree in browser devtools.
 */
function Demo({ broken }: DemoProps): ReactNode {
  const [pressed, setPressed] = useState('');
  const [names, setNames] = useState<readonly string[]>([]);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  // Read the computed names after every render of the variant.
  useEffect(() => {
    const container = toolbarRef.current;
    if (container === null) return;
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button'));
    setNames(buttons.map((button) => computeAccessibleName(button)));
  }, [broken]);

  return (
    <div>
      <p style={{ marginTop: 0 }}>An icon-only editor toolbar.</p>

      <div ref={toolbarRef} style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {ACTIONS.map((action) =>
          broken ? (
            // BROKEN, and this is the exact shape the bug usually takes in real code:
            // someone correctly marks the decorative icon aria-hidden — and then forgets to
            // add the label the icon was supposed to be hidden in favour of. The button now
            // has NO accessible name whatsoever and announces as "button".
            //
            // The other common flavour is leaving the glyph exposed, i.e. <button>🗑</button>,
            // which announces the Unicode name of the picture ("wastebasket, button") rather
            // than the action. Both are failures; this one is the more insidious, because
            // the aria-hidden looks like somebody was paying attention.
            <button
              key={action.key}
              type="button"
              className="btn btn-small btn-icon"
              onClick={() => setPressed(action.label)}
            >
              <span aria-hidden="true">{action.glyph}</span>
            </button>
          ) : (
            <button
              key={action.key}
              type="button"
              className="btn btn-small btn-icon"
              // aria-label supplies the name. The alternative — a visually hidden <span>
              // inside the button — is slightly more robust because it survives automatic
              // page translation, which aria-label historically did not. Both are correct.
              aria-label={action.label}
              onClick={() => setPressed(action.label)}
            >
              {/* aria-hidden on the glyph stops it being announced *in addition to* the
                  label, which would produce "wastebasket Delete paragraph, button". */}
              <span aria-hidden="true">{action.glyph}</span>
            </button>
          ),
        )}

        {/* A third style, shown in both variants, because it is the most robust: real
            text, visually hidden. Nothing to get wrong, and translation-safe. */}
        <button type="button" className="btn btn-small btn-icon" onClick={() => setPressed('Undo')}>
          <span aria-hidden="true">↶</span>
          <span className="sr-only">Undo</span>
        </button>
      </div>

      <p role="status" style={{ minHeight: '1.5em', marginBlockStart: '0.75rem' }}>
        {pressed === '' ? ' ' : `Activated: ${pressed}`}
      </p>

      <div className="note" style={{ marginBlockStart: '0.5rem' }}>
        <strong>Computed accessible names</strong>
        <ol style={{ margin: '0.35rem 0 0', paddingInlineStart: '1.25rem' }}>
          {names.map((name, index) => (
            <li key={index}>
              {name === '' ? (
                <em>(no accessible name — announced as just &ldquo;button&rdquo;)</em>
              ) : (
                <code>{name}</code>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

const SOURCE = `{/* Option 1 — aria-label on the control, aria-hidden on the icon. */}
<button type="button" aria-label="Delete paragraph">
  <span aria-hidden="true">🗑</span>
</button>

{/* Option 2 — visually hidden real text. Slightly more robust:
    it survives machine translation of the page, and it appears in
    the DOM where a developer will actually notice it. */}
<button type="button">
  <svg aria-hidden="true" focusable="false" width="16" height="16">…</svg>
  <span class="sr-only">Delete paragraph</span>
</button>

{/* Option 3 — an SVG that IS the content, named by <title>. */}
<svg role="img" aria-labelledby="trash-title" width="16" height="16">
  <title id="trash-title">Delete paragraph</title>
  <path d="…" />
</svg>

{/* WRONG: title attribute only. Not reliably announced, invisible to
    touch users, and only appears after a hover delay. */}
<button title="Delete">🗑</button>

{/* WRONG: nothing at all. Announced as "button", or worse, as the
    Unicode name of the emoji — "wastebasket, button". */}
<button>🗑</button>

/* The .sr-only class this depends on. Note it is CLIPPED, not
   display:none — display:none removes it from the accessibility
   tree, which defeats the entire purpose. */
.sr-only {
  position: absolute !important;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}`;

/**
 * Registry entry for the accessible-name pattern. The `howToTest.keyboard` steps here are
 * unusual in that they instruct the reader to observe that *both* variants pass: naming is
 * the failure a keyboard walkthrough cannot detect, and saying so is the point of the card.
 *
 * Claims SC 4.1.2 Name, Role, Value (A), SC 1.1.1 Non-text Content (A) and SC 2.5.3 Label
 * in Name (A, WCAG 2.1). The `section508` note records that 2.5.3 postdates the WCAG 2.0
 * reference in the 2017 Revised Standards, so it is a WCAG 2.1 AA obligation rather than a
 * 508 one.
 */
export const accessibleNamePattern: PatternMeta = {
  id: 'accessible-name',
  title: 'Accessible names for icon-only controls',
  problem:
    'A toolbar of pictograms is fast and compact for a sighted mouse user and completely opaque to everyone else. Without a name, a screen reader can only say "button", four times in a row, and a speech-input user has nothing to say out loud to activate it.',
  keywords: ['aria-label', 'sr-only', 'icon button', 'svg title', 'accessibility tree', 'alt'],
  criteria: [
    {
      number: '4.1.2',
      name: 'Name, Role, Value',
      level: 'A',
      since: '2.0',
      why: 'Every user interface component must expose a name. An icon-only button with no label has a role (button) and a value but no name, which is a direct failure.',
    },
    {
      number: '1.1.1',
      name: 'Non-text Content',
      level: 'A',
      since: '2.0',
      why: 'The icon is non-text content that conveys the control’s purpose, so it needs a text alternative serving the equivalent purpose.',
    },
    {
      number: '2.5.3',
      name: 'Label in Name',
      level: 'A',
      since: '2.1',
      why: 'When a control does have visible text, the accessible name must contain that text. It does not apply to a purely graphical button, but it is the reason you must not "fix" a labelled button by giving it an unrelated aria-label.',
    },
  ],
  section508:
    'SC 4.1.2 and 1.1.1 are WCAG 2.0 criteria, incorporated by E205.4 for content and by 502/503 for software interfaces. Chapter 3 applies too: 302.1 Without Vision (nothing to announce) and 302.9 With Limited Language, Cognitive, and Learning Abilities (a picture with no word is ambiguous for far more people than screen-reader users). SC 2.5.3 Label in Name is a WCAG 2.1 addition and so is not part of the 2017 Revised 508 Standards, though it is required by WCAG 2.1 AA.',
  howToTest: {
    keyboard: [
      'Tab through the four toolbar buttons. They are reachable in both variants — this failure is invisible to a keyboard-only test.',
      'That is the lesson: keyboard operability and accessible naming are different problems, and passing one tells you nothing about the other.',
      'Compare the "Computed accessible names" list between the two variants.',
    ],
    screenReader: [
      'Accessible version: "Bold, button", "Italic, button", "Insert link, button", "Delete paragraph, button", "Undo, button".',
      'Broken version: "button", "button", "button", "button" — four identical announcements, because the icon is aria-hidden and no label replaced it.',
      'The other common flavour, an exposed emoji with no label, announces the picture instead of the action: "wastebasket, button".',
      'In browser devtools, open the Accessibility pane and look at the Name field for each button — that is the authoritative answer, not the helper on this page.',
    ],
  },
  source: SOURCE,
  brokenBehaviour:
    'The first four buttons contain only an aria-hidden icon, with no aria-label and no visually hidden text — so they have no accessible name at all. The computed-names panel below shows exactly what is left for assistive technology to work with.',
  Demo,
};
