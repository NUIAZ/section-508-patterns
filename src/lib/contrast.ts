/**
 * WCAG contrast maths.
 *
 * Implemented from the normative definitions in WCAG 2.1 rather than copied from a
 * library, because the exact shape of the formula is one of the things people get wrong:
 *   - the channel transfer function has a *linear* segment below 0.03928, it is not a
 *     plain gamma 2.2 curve;
 *   - luminance coefficients are 0.2126 / 0.7152 / 0.0722 (Rec. 709 primaries);
 *   - the ratio adds 0.05 to both luminances to model ambient flare, which is why the
 *     maximum possible ratio is 21:1 and not infinity.
 *
 * References:
 *   WCAG 2.1 "relative luminance" and "contrast ratio" definitions.
 *   SC 1.4.3 Contrast (Minimum), Level AA  — 4.5:1 normal text, 3:1 large text.
 *   SC 1.4.6 Contrast (Enhanced), Level AAA — 7:1 normal text, 4.5:1 large text.
 *   SC 1.4.11 Non-text Contrast, Level AA (WCAG 2.1) — 3:1 for UI components and
 *   meaningful graphics.
 *
 * "Large text" is defined by WCAG as at least 18pt, or 14pt bold. At the usual 96dpi
 * mapping that is 24px, or 18.66px bold.
 */

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/*
 * Threshold constants, named so the call sites read like the spec.
 *
 * Two of these share a value (4.5) while meaning completely different things, which is the
 * whole reason they are separate names: a reviewer who sees a bare `4.5` in a comparison
 * cannot tell whether the code is claiming AA for body copy or AAA for a heading, and the
 * difference decides whether a 5:1 pairing is a pass or a fail.
 */

/**
 * SC 1.4.3 Contrast (Minimum), Level AA — normal-size text against its background.
 * The default threshold: if you only ever check one number, check this one.
 */
export const AA_NORMAL = 4.5;

/**
 * SC 1.4.3 Contrast (Minimum), Level AA — *large* text only, i.e. at least 18pt, or 14pt
 * bold (≈24px, or ≈18.66px bold at 96dpi). Large text is allowed the lower ratio because
 * thicker strokes stay legible with less luminance separation. Applying this to body copy
 * because "the heading passes" is the most common way a design sails through review and
 * fails an audit.
 */
export const AA_LARGE = 3;

/** SC 1.4.6 Contrast (Enhanced), Level AAA — normal-size text. Beyond what Section 508
 *  requires (it references Level A and AA only), but a sensible target for long-form
 *  reading and for interfaces used in bright ambient light. */
export const AAA_NORMAL = 7;

/** SC 1.4.6 Contrast (Enhanced), Level AAA — large text, same size definition as
 *  {@link AA_LARGE}. Equal in value to {@link AA_NORMAL} and unrelated to it in meaning. */
export const AAA_LARGE = 4.5;

/**
 * SC 1.4.11 Non-text Contrast, Level AA (added in WCAG 2.1) — the parts of a UI that are
 * not text: input borders, focus indicators, toggle states, icon glyphs that carry meaning,
 * and the strokes of a chart you have to read.
 *
 * This is the threshold designers most often do not know exists. A 1px hairline border in
 * a pale grey may look tasteful and still leave a low-vision user unable to see where the
 * text field is. Purely decorative graphics are exempt — the test is whether removing the
 * thing would lose information.
 */
export const NON_TEXT = 3;

const HEX_SHORT = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX_LONG = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const RGB_FUNC = /^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/i;

/**
 * Parse a CSS colour string into 8-bit channels.
 *
 * Returns `null` rather than throwing, because this runs on every keystroke of a text
 * input in the live checker and "you are halfway through typing a hex code" is a normal
 * state, not an error worth shouting about.
 */
export function parseColor(input: string): Rgb | null {
  const value = input.trim();
  if (value === '') return null;

  const short = HEX_SHORT.exec(value);
  if (short) {
    // #abc expands to #aabbcc — each nibble is duplicated, not zero-padded.
    return {
      r: Number.parseInt(short[1] + short[1], 16),
      g: Number.parseInt(short[2] + short[2], 16),
      b: Number.parseInt(short[3] + short[3], 16),
    };
  }

  const long = HEX_LONG.exec(value);
  if (long) {
    return {
      r: Number.parseInt(long[1], 16),
      g: Number.parseInt(long[2], 16),
      b: Number.parseInt(long[3], 16),
    };
  }

  const fn = RGB_FUNC.exec(value);
  if (fn) {
    const channels = [Number(fn[1]), Number(fn[2]), Number(fn[3])];
    if (channels.some((c) => !Number.isFinite(c) || c < 0 || c > 255)) return null;
    return { r: channels[0], g: channels[1], b: channels[2] };
  }

  return null;
}

/** Normalise to the `#rrggbb` form that `<input type="color">` requires as its value. */
export function toHex(color: Rgb): string {
  const part = (n: number): string =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${part(color.r)}${part(color.g)}${part(color.b)}`;
}

/** Linearise one 8-bit sRGB channel. The 0.03928 branch is normative, not a rounding. */
function linearise(channel8Bit: number): number {
  const c = channel8Bit / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance, in the range 0 (black) to 1 (white). */
export function relativeLuminance(color: Rgb): number {
  return (
    0.2126 * linearise(color.r) + 0.7152 * linearise(color.g) + 0.0722 * linearise(color.b)
  );
}

/**
 * Contrast ratio between two colours, always >= 1 and <= 21.
 *
 * Order does not matter: the lighter colour is always the numerator, which is why the
 * checker can offer a "swap" button that changes nothing about the verdict.
 */
export function contrastRatio(foreground: Rgb, background: Rgb): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * One colour pair judged against every threshold at once.
 *
 * All five booleans are reported together rather than the caller passing in "which level
 * am I targeting?", because the useful answer to "does this pass?" is usually "it passes
 * here and fails there" — a pairing that clears AA for large text but not for body copy is
 * a real, actionable result, and a single pass/fail flag would hide it.
 *
 * `ratio` is the exact value for comparisons; `displayRatio` is the string for humans.
 * Never compare against `displayRatio` — it is deliberately lossy (see below).
 */
export interface ContrastVerdict {
  /** Exact ratio, 1 to 21 inclusive. Use this for any threshold comparison. */
  readonly ratio: number;
  /** Rounded down to 2dp. Rounding *down* matters: 4.499 must not be reported as 4.50. */
  readonly displayRatio: string;
  /** Clears {@link AA_NORMAL} — SC 1.4.3 (AA) for body-size text. */
  readonly aaNormal: boolean;
  /** Clears {@link AA_LARGE} — SC 1.4.3 (AA), but *only* if the text really is 18pt / 14pt
   *  bold or larger. The checker cannot see your font size, so this one is a conditional
   *  pass the caller has to qualify. */
  readonly aaLarge: boolean;
  /** Clears {@link AAA_NORMAL} — SC 1.4.6 (AAA) for body-size text. */
  readonly aaaNormal: boolean;
  /** Clears {@link AAA_LARGE} — SC 1.4.6 (AAA) for large text. */
  readonly aaaLarge: boolean;
  /** SC 1.4.11 Non-text Contrast — borders, icons, focus rings, chart strokes. */
  readonly nonText: boolean;
}

/**
 * Evaluate a pair of colours against every threshold at once.
 *
 * The ratio is floored to two decimals for display. Ceiling or nearest-rounding would let
 * a 4.4996:1 pair render as "4.50 — passes", which is exactly the sort of quiet lie this
 * site exists to argue against.
 */
export function evaluateContrast(foreground: Rgb, background: Rgb): ContrastVerdict {
  const ratio = contrastRatio(foreground, background);
  const floored = Math.floor(ratio * 100) / 100;
  return {
    ratio,
    displayRatio: floored.toFixed(2),
    aaNormal: ratio >= AA_NORMAL,
    aaLarge: ratio >= AA_LARGE,
    aaaNormal: ratio >= AAA_NORMAL,
    aaaLarge: ratio >= AAA_LARGE,
    nonText: ratio >= NON_TEXT,
  };
}
