import { useMemo, useState, type ReactNode } from 'react';
import type { DemoProps, PatternMeta } from '../lib/types';
import { evaluateContrast, parseColor, toHex, type Rgb } from '../lib/contrast';

interface CheckRow {
  readonly label: string;
  readonly threshold: number;
  readonly passes: boolean;
  readonly detail: string;
}

/**
 * Live contrast checker plus a "colour is the only signal" demonstration.
 *
 * The checker computes the WCAG contrast ratio from two colour inputs and reports every
 * threshold at once. The maths lives in `src/lib/contrast.ts` and is unit-tested against
 * known values (black on white is exactly 21:1; #767676 on white is 4.54:1, the classic
 * "darkest grey that still passes AA on white").
 *
 * The broken variant reports the same results using colour alone: green squares and red
 * squares, no words. It is the fastest way to feel SC 1.4.1, because the information is
 * genuinely all there and genuinely unavailable.
 */
function Demo({ broken, idPrefix }: DemoProps): ReactNode {
  const [foreground, setForeground] = useState('#767676');
  const [background, setBackground] = useState('#ffffff');

  const fgRgb: Rgb | null = useMemo(() => parseColor(foreground), [foreground]);
  const bgRgb: Rgb | null = useMemo(() => parseColor(background), [background]);

  const verdict = useMemo(
    () => (fgRgb !== null && bgRgb !== null ? evaluateContrast(fgRgb, bgRgb) : null),
    [fgRgb, bgRgb],
  );

  const rows: readonly CheckRow[] =
    verdict === null
      ? []
      : [
          {
            label: 'AA, normal text',
            threshold: 4.5,
            passes: verdict.aaNormal,
            detail: 'SC 1.4.3, body copy, anything under 18pt / 24px',
          },
          {
            label: 'AA, large text',
            threshold: 3,
            passes: verdict.aaLarge,
            detail: 'SC 1.4.3, 18pt / 24px, or 14pt / 18.66px bold and larger',
          },
          {
            label: 'AA, non-text',
            threshold: 3,
            passes: verdict.nonText,
            detail: 'SC 1.4.11 (WCAG 2.1), control borders, icons, focus rings, chart strokes',
          },
          {
            label: 'AAA, normal text',
            threshold: 7,
            passes: verdict.aaaNormal,
            detail: 'SC 1.4.6, not required by AA or by Section 508',
          },
          {
            label: 'AAA, large text',
            threshold: 4.5,
            passes: verdict.aaaLarge,
            detail: 'SC 1.4.6, not required by AA or by Section 508',
          },
        ];

  const swap = (): void => {
    setForeground(background);
    setBackground(foreground);
  };

  const fgId = `${idPrefix}-fg`;
  const bgId = `${idPrefix}-bg`;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
        <div className="field" style={{ marginBlockEnd: 0 }}>
          <label htmlFor={`${fgId}-text`}>Foreground colour</label>
          <span className="hint" id={`${fgId}-hint`}>
            Hex, such as #767676, or rgb(118 118 118)
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <input
              id={`${fgId}-text`}
              type="text"
              value={foreground}
              aria-describedby={`${fgId}-hint`}
              aria-invalid={fgRgb === null ? true : undefined}
              onChange={(event) => setForeground(event.target.value)}
              style={{ width: '10rem' }}
            />
            {/* The colour swatch input is a SECOND control for the same value, so it gets
                its own label rather than sharing one. Two controls sharing an id would be
                invalid HTML and would break the label association for both. */}
            <label htmlFor={fgId} className="sr-only">
              Pick the foreground colour visually
            </label>
            <input
              id={fgId}
              type="color"
              value={fgRgb !== null ? toHex(fgRgb) : '#000000'}
              onChange={(event) => setForeground(event.target.value)}
              style={{ width: '3rem', height: '2.4rem', padding: 0 }}
            />
          </div>
        </div>

        <div className="field" style={{ marginBlockEnd: 0 }}>
          <label htmlFor={`${bgId}-text`}>Background colour</label>
          <span className="hint" id={`${bgId}-hint`}>
            The colour immediately behind the text
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <input
              id={`${bgId}-text`}
              type="text"
              value={background}
              aria-describedby={`${bgId}-hint`}
              aria-invalid={bgRgb === null ? true : undefined}
              onChange={(event) => setBackground(event.target.value)}
              style={{ width: '10rem' }}
            />
            <label htmlFor={bgId} className="sr-only">
              Pick the background colour visually
            </label>
            <input
              id={bgId}
              type="color"
              value={bgRgb !== null ? toHex(bgRgb) : '#ffffff'}
              onChange={(event) => setBackground(event.target.value)}
              style={{ width: '3rem', height: '2.4rem', padding: 0 }}
            />
          </div>
        </div>

        <button type="button" className="btn" onClick={swap}>
          <span aria-hidden="true">⇄</span> Swap
        </button>
      </div>

      {/* Sample rendering at both text sizes, so the number has something to mean. */}
      {fgRgb !== null && bgRgb !== null ? (
        <div
          style={{
            background: toHex(bgRgb),
            color: toHex(fgRgb),
            padding: '0.85rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            marginBlockStart: '1rem',
          }}
        >
          <p style={{ margin: 0, fontSize: '1rem' }}>
            Normal text at 16px: this needs 4.5:1 for AA.
          </p>
          <p style={{ margin: '0.35rem 0 0', fontSize: '1.5rem', fontWeight: 400 }}>
            Large text at 24px: 3:1 is enough.
          </p>
        </div>
      ) : (
        <p className="field-error" style={{ marginBlockStart: '1rem' }}>
          ✕ One of the colours could not be parsed. Use a hex value like #1a6b34 or an
          rgb() value.
        </p>
      )}

      {/* role="status" so the recomputed ratio is announced as the user types. */}
      <div role="status" aria-live="polite" style={{ marginBlockStart: '1rem' }}>
        {verdict !== null ? (
          <>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
              Contrast ratio {verdict.displayRatio}:1
            </p>

            {broken ? (
              // BROKEN: the same five results, communicated only by the colour of a
              // square. There is nothing to read, nothing to announce, and nothing for a
              // visitor with deuteranopia to distinguish.
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {rows.map((row) => (
                  <li
                    key={row.label}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: '0.9rem',
                        height: '0.9rem',
                        background: row.passes ? '#22c55e' : '#ef4444',
                        borderRadius: '2px',
                      }}
                    />
                    <span>{row.label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <caption>Results against every WCAG threshold</caption>
                  <thead>
                    <tr>
                      <th scope="col">Requirement</th>
                      <th scope="col">Needs</th>
                      <th scope="col">Result</th>
                      <th scope="col">Applies to</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.label}>
                        <th scope="row">{row.label}</th>
                        <td>{row.threshold}:1</td>
                        <td style={{ color: row.passes ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                          {/* Glyph AND word AND colour: three redundant signals, so
                              removing any one of them still leaves the result readable. */}
                          <span aria-hidden="true">{row.passes ? '✓ ' : '✕ '}</span>
                          {row.passes ? 'Pass' : 'Fail'}
                        </td>
                        <td>{row.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}
      </div>

      <p className="note" style={{ marginBlockStart: '1rem' }}>
        <strong>Try these:</strong> <code>#767676</code> on white is 4.54:1, the darkest
        plain grey that still passes AA for body text. <code>#777777</code> on white is
        4.48:1 and fails. <code>#949494</code> on white is 3.03:1: fine for a 24px heading,
        not for a paragraph.
      </p>
    </div>
  );
}

const SOURCE = `/** Linearise one 8-bit sRGB channel.
 *  The 0.03928 branch is normative: this is NOT a plain gamma 2.2. */
function linearise(channel8Bit) {
  const c = channel8Bit / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance. Coefficients are Rec. 709 primaries. */
function relativeLuminance({ r, g, b }) {
  return 0.2126 * linearise(r)
       + 0.7152 * linearise(g)
       + 0.0722 * linearise(b);
}

/** Contrast ratio. The +0.05 models ambient flare, which is why the
 *  maximum is 21:1 (black on white) and not infinity. */
function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/* Thresholds
   ───────────────────────────────────────────────────────────────
   SC 1.4.3  Contrast (Minimum)   AA   4.5:1 normal, 3:1 large
   SC 1.4.6  Contrast (Enhanced)  AAA  7:1   normal, 4.5:1 large
   SC 1.4.11 Non-text Contrast    AA   3:1   UI components, graphics

   "Large" = 18pt (24px), or 14pt bold (18.66px bold).

   Exempt from 1.4.3: disabled controls, pure decoration, logotypes,
   and text that is part of a picture of significant other content.
   "Disabled" is an exemption people over-claim; a disabled control
   nobody can read is still a usability failure.

   Round DOWN when you display the ratio. 4.4996 shown as "4.50,
   passes" is a quiet lie. */

/* Anti-pattern this criterion does NOT cover, but 1.4.1 does:
   using colour as the ONLY way to convey something. Add a glyph,
   a word, a shape, an underline, anything that survives being
   printed in greyscale. */`;

/**
 * Registry entry for the colour and contrast pattern. Its demo is the live checker, so this
 * is the one card whose "broken" variant is not a broken component but a broken *readout*:
 * the verdict table is replaced by coloured squares, encoding the pass/fail result in hue
 * alone: a contrast tool committing the failure it exists to detect.
 *
 * Claims SC 1.4.3 Contrast (Minimum) (AA), SC 1.4.1 Use of Color (A), SC 1.4.11 Non-text
 * Contrast (AA, WCAG 2.1) and SC 1.4.6 Contrast (Enhanced) (AAA). The AAA entry is offered
 * as a target, not an obligation, neither WCAG AA nor Section 508 requires it.
 */
export const colourContrastPattern: PatternMeta = {
  id: 'colour-contrast',
  title: 'Colour contrast, and colour as the only signal',
  problem:
    'Low contrast is the most-reported accessibility failure on the web, year after year, and it is entirely mechanical to detect. Separately and just as importantly: roughly 1 in 12 men has some form of colour vision deficiency, so red-versus-green as the only difference between "passed" and "failed" is information that simply does not arrive.',
  keywords: ['1.4.3', '1.4.1', 'contrast ratio', 'relative luminance', 'colour blind', 'wcag ratio', 'large text'],
  criteria: [
    {
      number: '1.4.3',
      name: 'Contrast (Minimum)',
      level: 'AA',
      since: '2.0',
      why: 'Text and images of text need a contrast ratio of at least 4.5:1, or 3:1 for large text. This is the threshold Section 508 actually requires.',
    },
    {
      number: '1.4.1',
      name: 'Use of Color',
      level: 'A',
      since: '2.0',
      why: 'Colour must not be the only visual means of conveying information, indicating an action, prompting a response, or distinguishing an element. The broken variant is this failure in its purest form.',
    },
    {
      number: '1.4.11',
      name: 'Non-text Contrast',
      level: 'AA',
      since: '2.1',
      why: 'Interface component boundaries and meaningful graphics need 3:1. This is why a pale grey input border or a faint focus ring fails even when the text inside is fine.',
    },
    {
      number: '1.4.6',
      name: 'Contrast (Enhanced)',
      level: 'AAA',
      since: '2.0',
      why: 'The 7:1 / 4.5:1 tier. Included for completeness and clearly marked AAA; it is not a Section 508 or WCAG AA requirement, and presenting it as one is a common way to lose an argument with a designer for no reason.',
    },
  ],
  section508:
    'SC 1.4.3 and 1.4.1 are WCAG 2.0 Level A/AA criteria and are incorporated by E205.4. Two things worth being precise about: SC 1.4.11 Non-text Contrast is a WCAG 2.1 addition and so is not a 2017 Revised 508 requirement, and SC 1.4.6 is Level AAA and is not required by either. Chapter 3 Functional Performance Criteria 302.2 (With Limited Vision) and 302.3 (Without Perception of Color) are the 508 provisions that speak to this most directly, and 302.3 is unusually explicit for a functional criterion; it requires a mode of operation that does not require user perception of colour.',
  howToTest: {
    keyboard: [
      'Tab into the colour fields and type a hex value. The ratio and every verdict update as you type.',
      'Tab to Swap and press Enter: the ratio is unchanged, because contrast is symmetric.',
      'Enter an unparseable value like "blueish": the field is marked aria-invalid and an error explains what is accepted.',
    ],
    screenReader: [
      'Typing a new colour should produce a polite announcement of the new ratio, because the results sit in a role="status" region.',
      'The results table announces "AA normal text, Needs 4.5 to 1, Result Pass": the verdict is a word, so it survives being spoken.',
      'In the broken variant the same region announces only "AA, normal text" with no verdict at all. The pass/fail lives entirely in a coloured square.',
    ],
  },
  source: SOURCE,
  brokenBehaviour:
    'The verdict table is replaced by a list of coloured squares. The information is present on screen and encoded purely in hue: nothing to read, nothing to announce, and indistinguishable to a visitor with red–green colour blindness.',
  Demo,
};
