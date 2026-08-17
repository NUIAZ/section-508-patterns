import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  evaluateContrast,
  parseColor,
  relativeLuminance,
  toHex,
} from '../lib/contrast';

/**
 * The contrast maths is the one piece of this repository that produces a number somebody
 * might quote in an audit, so it is pinned against values that can be checked independently
 * against any conforming implementation.
 */
describe('contrast maths', () => {
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  it('gives white a relative luminance of 1 and black 0', () => {
    expect(relativeLuminance(white)).toBeCloseTo(1, 10);
    expect(relativeLuminance(black)).toBeCloseTo(0, 10);
  });

  it('computes black on white as exactly 21:1, the maximum possible ratio', () => {
    expect(contrastRatio(black, white)).toBeCloseTo(21, 10);
  });

  it('is symmetric — swapping foreground and background changes nothing', () => {
    expect(contrastRatio(black, white)).toBeCloseTo(contrastRatio(white, black), 10);
  });

  it('gives an identical pair a ratio of exactly 1:1', () => {
    expect(contrastRatio(white, white)).toBeCloseTo(1, 10);
  });

  /**
   * #767676 is the well-known boundary case: the darkest plain grey that still clears
   * 4.5:1 on white. #777777, one step lighter, does not. Any implementation that gets the
   * 0.03928 linear segment or the +0.05 flare term wrong will miss this by enough to flip
   * the verdict.
   */
  it('places #767676 just above the AA threshold on white and #777777 just below', () => {
    const bg = parseColor('#ffffff');
    const passing = parseColor('#767676');
    const failing = parseColor('#777777');
    expect(bg).not.toBeNull();
    expect(passing).not.toBeNull();
    expect(failing).not.toBeNull();
    if (bg === null || passing === null || failing === null) return;

    expect(contrastRatio(passing, bg)).toBeCloseTo(4.54, 2);
    expect(contrastRatio(failing, bg)).toBeCloseTo(4.48, 2);

    expect(evaluateContrast(passing, bg).aaNormal).toBe(true);
    expect(evaluateContrast(failing, bg).aaNormal).toBe(false);
    // Both still clear the 3:1 large-text bar, which is the point of having two tiers.
    expect(evaluateContrast(failing, bg).aaLarge).toBe(true);
  });

  it('places #949494 on white in the large-text-only band (3:1 but not 4.5:1)', () => {
    const fg = parseColor('#949494');
    const bg = parseColor('#fff');
    if (fg === null || bg === null) throw new Error('fixture colours failed to parse');

    const verdict = evaluateContrast(fg, bg);
    expect(verdict.ratio).toBeCloseTo(3.03, 2);
    expect(verdict.aaLarge).toBe(true);
    expect(verdict.nonText).toBe(true);
    expect(verdict.aaNormal).toBe(false);
    expect(verdict.aaaLarge).toBe(false);
  });

  it('places #595959 on white above the AAA normal-text threshold of 7:1', () => {
    const fg = parseColor('#595959');
    const bg = parseColor('#ffffff');
    if (fg === null || bg === null) throw new Error('fixture colours failed to parse');

    const verdict = evaluateContrast(fg, bg);
    expect(verdict.ratio).toBeCloseTo(7.0, 1);
    expect(verdict.aaaNormal).toBe(true);
  });

  it('floors the displayed ratio rather than rounding it up', () => {
    const verdict = evaluateContrast({ r: 119, g: 119, b: 119 }, { r: 255, g: 255, b: 255 });
    // 4.4787… must display as 4.47, never as 4.48 and certainly never as "4.5 — passes".
    expect(verdict.displayRatio).toBe('4.47');
    expect(verdict.aaNormal).toBe(false);
  });

  describe('parseColor', () => {
    it('expands three-digit hex by duplicating each nibble', () => {
      expect(parseColor('#abc')).toEqual({ r: 0xaa, g: 0xbb, b: 0xcc });
    });

    it('accepts six-digit hex with or without the leading hash', () => {
      expect(parseColor('1a6b34')).toEqual({ r: 26, g: 107, b: 52 });
      expect(parseColor('#1A6B34')).toEqual({ r: 26, g: 107, b: 52 });
    });

    it('accepts both comma and space separated rgb() notation', () => {
      expect(parseColor('rgb(18, 21, 26)')).toEqual({ r: 18, g: 21, b: 26 });
      expect(parseColor('rgb(18 21 26)')).toEqual({ r: 18, g: 21, b: 26 });
    });

    it('returns null for anything it cannot parse, instead of throwing', () => {
      expect(parseColor('blueish')).toBeNull();
      expect(parseColor('')).toBeNull();
      expect(parseColor('#12')).toBeNull();
      expect(parseColor('rgb(300 0 0)')).toBeNull();
    });
  });

  it('round-trips through toHex', () => {
    const parsed = parseColor('rgb(15 95 184)');
    if (parsed === null) throw new Error('fixture colour failed to parse');
    expect(toHex(parsed)).toBe('#0f5fb8');
  });
});
