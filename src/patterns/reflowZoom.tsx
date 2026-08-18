import { useState, type ReactNode } from 'react';
import type { DemoProps, PatternMeta } from '../lib/types';

const WIDTH_PRESETS: readonly number[] = [320, 480, 768, 1024];
const SCALE_PRESETS: readonly number[] = [100, 150, 200];

/**
 * Reflow and text resize.
 *
 * Two separate criteria that get conflated:
 *
 *  - **1.4.10 Reflow (AA, WCAG 2.1)**: content must be presentable at 320 CSS pixels of
 *    width without needing to scroll in two directions. 320px is not arbitrary: it is
 *    1280px at 400% zoom, which is how a low-vision user on a desktop actually reaches it.
 *  - **1.4.4 Resize Text (AA, WCAG 2.0)**: text must be resizable to 200% without loss of
 *    content or functionality. This one IS a Section 508 requirement; 1.4.10 is not.
 *
 * The demo makes both testable in place: a width control that squeezes the container down
 * to 320px, and a scale control that raises the font size to 200%. The accessible layout
 * uses fluid widths, wrapping flex, and `rem` sizing with no fixed heights. The broken one
 * pins a `900px` width, uses `white-space: nowrap`, and clips its own text with a fixed
 * `height` plus `overflow: hidden`, which is how "text resize" failures actually look in
 * production.
 */
function Demo({ broken, idPrefix }: DemoProps): ReactNode {
  const [width, setWidth] = useState(480);
  const [scale, setScale] = useState(100);

  const widthId = `${idPrefix}-width`;
  const scaleId = `${idPrefix}-scale`;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        <fieldset style={{ margin: 0 }}>
          <legend>Container width</legend>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {WIDTH_PRESETS.map((preset) => (
              <label
                key={preset}
                htmlFor={`${widthId}-${preset}`}
                style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center', margin: 0 }}
              >
                <input
                  id={`${widthId}-${preset}`}
                  type="radio"
                  name={widthId}
                  checked={width === preset}
                  onChange={() => setWidth(preset)}
                  style={{ width: 'auto' }}
                />
                {preset}px
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset style={{ margin: 0 }}>
          <legend>Text size</legend>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {SCALE_PRESETS.map((preset) => (
              <label
                key={preset}
                htmlFor={`${scaleId}-${preset}`}
                style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center', margin: 0 }}
              >
                <input
                  id={`${scaleId}-${preset}`}
                  type="radio"
                  name={scaleId}
                  checked={scale === preset}
                  onChange={() => setScale(preset)}
                  style={{ width: 'auto' }}
                />
                {preset}%
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="hint">
        The frame below is {width} CSS pixels wide with text at {scale}%. Watch for a
        horizontal scrollbar appearing inside it, and for text being clipped.
      </p>

      {/* The viewport simulator. `resize: horizontal` also lets the visitor drag it. */}
      <div
        data-testid={`${idPrefix}-frame`}
        style={{
          width: `${width}px`,
          maxWidth: '100%',
          border: '2px solid var(--border-strong)',
          borderRadius: 'var(--radius)',
          padding: '0.75rem',
          overflowX: 'auto',
          resize: 'horizontal',
          fontSize: `${scale}%`,
          background: 'var(--bg)',
        }}
      >
        {broken ? (
          <div style={{ width: '900px' }}>
            {/* BROKEN #1: a fixed pixel width wider than the container. Guaranteed
                horizontal scrolling at any small viewport. */}
            <h5 style={{ marginTop: 0, whiteSpace: 'nowrap' }}>
              Account settings and preferences overview
            </h5>
            {/* BROKEN #2: nowrap on a paragraph. */}
            <p style={{ whiteSpace: 'nowrap' }}>
              This paragraph refuses to wrap, so it extends past the edge no matter how
              narrow the window gets.
            </p>
            {/* BROKEN #3: a fixed height with hidden overflow. The text does not
                disappear at 100%; raise the text size to 200% and watch it get cut off.
                This is what a real 1.4.4 failure looks like. */}
            <div
              style={{
                height: '3.5rem',
                overflow: 'hidden',
                border: '1px dashed var(--danger)',
                padding: '0.25rem',
              }}
            >
              A fixed-height box. At 100% this text fits. At 150% it is clipped. At 200%
              most of it is gone, and the user has no way to get it back, because the
              container will never grow.
            </div>
            {/* BROKEN #4: a table forced wide. */}
            <div style={{ display: 'flex', gap: '1rem', marginBlockStart: '0.5rem' }}>
              <div style={{ width: '280px', flexShrink: 0, background: 'var(--surface-2)', padding: '0.5rem' }}>
                Fixed 280px sidebar, flex-shrink 0
              </div>
              <div style={{ width: '560px', flexShrink: 0, background: 'var(--surface-2)', padding: '0.5rem' }}>
                Fixed 560px content, flex-shrink 0. Two fixed columns that never stack.
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h5 style={{ marginTop: 0 }}>Account settings and preferences overview</h5>
            <p style={{ maxWidth: '60ch' }}>
              Everything here is sized in relative units and allowed to wrap, so the layout
              narrows instead of overflowing. Measure is capped in <code>ch</code>, which
              scales with the font rather than fighting it.
            </p>
            <div
              style={{
                // min-height, never height. The box grows with its content.
                minHeight: '3.5rem',
                border: '1px dashed var(--success)',
                padding: '0.25rem',
              }}
            >
              A min-height box. Raise the text to 200% and it grows to fit. Nothing is
              clipped and nothing is lost.
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBlockStart: '0.5rem',
              }}
            >
              {/* flex-basis with wrap: the two columns stack when there is not room for
                  both, which is the entire mechanism behind reflow. */}
              <div style={{ flex: '1 1 14rem', minWidth: 0, background: 'var(--surface-2)', padding: '0.5rem' }}>
                Sidebar column, flex-basis 14rem
              </div>
              <div style={{ flex: '2 1 18rem', minWidth: 0, background: 'var(--surface-2)', padding: '0.5rem' }}>
                Content column, flex-basis 18rem. Below the combined basis these stack
                instead of overflowing.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const SOURCE = `/* ── REFLOW (SC 1.4.10, AA, WCAG 2.1) ──────────────────────────
   Target: usable at 320 CSS px wide with no two-dimensional
   scrolling. 320px = 1280px at 400% zoom, which is how a low-vision
   desktop user actually gets there. */

/* 1. Never set a width in px on a layout container. */
.card { width: 100%; max-width: 60rem; }      /* not width: 960px */

/* 2. Let flex children shrink. flex-basis + wrap, and minWidth: 0
      because the default min-width:auto refuses to shrink below
      content size: the number-one cause of mystery overflow. */
.row { display: flex; flex-wrap: wrap; gap: 1rem; }
.col { flex: 1 1 18rem; min-width: 0; }

/* 3. Same for grid: minmax(0, 1fr), not 1fr. */
.shell { display: grid; grid-template-columns: minmax(0,1fr); }

/* 4. Long unbreakable strings (URLs, hashes, code) overflow
      everything. */
.prose { overflow-wrap: anywhere; }

/* 5. Wide things scroll INSIDE their own box, not the page. Make
      the box focusable so a keyboard user can scroll it. */
.table-scroll { overflow-x: auto; }
<div class="table-scroll" tabindex="0" role="region" aria-label="…">


/* ── RESIZE TEXT (SC 1.4.4, AA, WCAG 2.0, a real 508 requirement) ──
   Target: 200% text size with no loss of content or functionality. */

/* 6. min-height, never height, on anything containing text. */
.badge { min-height: 2rem; }                  /* not height: 2rem */

/* 7. Never overflow: hidden on a text container "to keep it tidy".
      Tidy at 100% is deleted at 200%. */

/* 8. Do not pin the root font size; that overrides the visitor's
      browser preference outright. */
html { font-size: 16px; }   /* ❌ */
html { }                    /* ✅ inherit the browser default */

/* 9. Never disable pinch-zoom. This is a real, shipped, common
      failure of 1.4.4 on mobile. */
<meta name="viewport" content="width=device-width, initial-scale=1">
{/* ❌ maximum-scale=1, ❌ user-scalable=no */}


/* ── TEXT SPACING (SC 1.4.12, AA, WCAG 2.1) ────────────────────
   The user may override, and nothing may be lost:
     line-height   1.5 × font size
     paragraph gap 2   × font size
     letter-spacing 0.12em
     word-spacing   0.16em
   Test it by pasting that as a user stylesheet. If your layout
   already uses min-height and wrapping, it will pass unchanged. */`;

/**
 * Registry entry for the reflow-and-zoom pattern. The number that makes it concrete: a
 * desktop site at 400% zoom is, to the browser, a 320px viewport. Any fixed pixel width
 * left in the layout turns every line of text into a horizontal scroll and back.
 *
 * Claims SC 1.4.4 Resize Text (AA), SC 1.4.10 Reflow (AA, WCAG 2.1) and SC 1.4.12 Text
 * Spacing (AA, WCAG 2.1). The last of those is the cheapest to test and the least known,
 * paste the spacing overrides from the `source` block in as a user stylesheet and a layout
 * built on `min-height` and normal wrapping passes untouched.
 */
export const reflowZoomPattern: PatternMeta = {
  id: 'reflow-zoom',
  title: 'Reflow at 320px and text resize to 200%',
  problem:
    'A low-vision user browsing a desktop site at 400% zoom is effectively on a 320-pixel-wide viewport. If the layout has any fixed pixel width in it, they get a page that scrolls both ways, meaning every single line of text requires a horizontal scroll to read, then a scroll back. It is the difference between slow and impossible.',
  keywords: ['reflow', '320px', 'zoom', '200%', 'resize text', 'responsive', 'overflow', 'text spacing'],
  criteria: [
    {
      number: '1.4.4',
      name: 'Resize Text',
      level: 'AA',
      since: '2.0',
      why: 'Text must scale to 200% without assistive technology and without loss of content or functionality. Fixed heights with hidden overflow are the classic failure, and this criterion IS incorporated by Section 508.',
    },
    {
      number: '1.4.10',
      name: 'Reflow',
      level: 'AA',
      since: '2.1',
      why: 'Content must reflow to 320 CSS pixels wide without requiring scrolling in two dimensions. Data tables and complex diagrams are explicitly exempted from the no-horizontal-scroll rule.',
    },
    {
      number: '1.4.12',
      name: 'Text Spacing',
      level: 'AA',
      since: '2.1',
      why: 'Nothing may be lost when the user forces line-height to 1.5, paragraph spacing to 2×, letter-spacing to 0.12em and word-spacing to 0.16em. A layout that already survives 200% text usually survives this unchanged.',
    },
  ],
  section508:
    'This pattern is a good example of why version matters. SC 1.4.4 Resize Text is WCAG 2.0 Level AA and IS incorporated by Section 508 via E205.4. SC 1.4.10 Reflow and SC 1.4.12 Text Spacing are both WCAG 2.1 additions and are therefore NOT part of the 2017 Revised 508 Standards; they are required by WCAG 2.1 AA, by EN 301 549, and by the DOJ ADA Title II rule (2024). If a procurement document asks for "508 compliance" and you build to WCAG 2.1 AA, you have exceeded the requirement, which is the correct direction to err. Functional Performance Criterion 302.2 With Limited Vision is the underlying 508 hook.',
  howToTest: {
    keyboard: [
      'Set the container width to 320px. In the accessible version everything stacks; in the broken version a horizontal scrollbar appears inside the frame.',
      'Set the text size to 200%. In the broken version the dashed box clips its own content and there is no way to recover it.',
      'Drag the bottom-right corner of the frame; it is a resizable element, so you can try intermediate widths.',
      'For the real test: press Ctrl and + (Cmd and + on macOS) five times to reach 400% browser zoom on a 1280px window, and check that no page-level horizontal scrollbar appears.',
    ],
    screenReader: [
      'Reflow is not a screen-reader concern; its users are people with low vision using magnification or zoom.',
      'One overlap worth knowing: if you fix reflow by hiding content at narrow widths, you may create a 1.4.13 or 2.4.3 problem instead. Reflow means rearranged, not removed.',
    ],
  },
  source: SOURCE,
  brokenBehaviour:
    'The inner layout is pinned to 900px, the heading and paragraph use white-space: nowrap, one box has a fixed height with overflow hidden, and two columns have flex-shrink: 0 so they can never stack.',
  Demo,
};
