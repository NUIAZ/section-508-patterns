/**
 * Barrel and registry for the pattern library.
 *
 * Every pattern is imported eagerly and listed in `PATTERNS`. No dynamic import, no glob,
 * no filesystem convention: adding a pattern is two visible lines in this file, and a
 * pattern that is not listed here does not exist as far as the site is concerned. That
 * bluntness is worth more than the ceremony it costs — the alternative fails silently, and
 * a criterion nobody can find is indistinguishable from one that was never written.
 *
 * The helpers below are the only queries the rest of the application makes against the
 * registry. Keeping them here means the sidebar, the checklist deep links and the tests all
 * agree about ordering and lookup, rather than each re-deriving it.
 */

import type { PatternMeta } from '../lib/types';

import { skipLinkPattern } from './skipLink';
import { focusVisiblePattern } from './focusVisible';
import { focusTrapPattern } from './focusTrap';
import { accessibleNamePattern } from './accessibleName';
import { liveRegionsPattern } from './liveRegions';
import { customControlsPattern } from './customControls';
import { rovingTabindexPattern } from './rovingTabindex';
import { formsPattern } from './forms';
import { tablesPattern } from './tables';
import { landmarksPattern } from './landmarks';
import { colourContrastPattern } from './colourContrast';
import { reducedMotionPattern } from './reducedMotion';
import { reflowZoomPattern } from './reflowZoom';
import { imagesIconsPattern } from './imagesIcons';
import { timeoutsPattern } from './timeouts';
import { speechInputPattern } from './speechInput';

/**
 * The pattern registry.
 *
 * Order is pedagogical rather than alphabetical: the things a keyboard user hits first
 * (skip link, focus ring, focus traps) come before the structural topics, and the
 * measurement-style patterns (contrast, reflow) come after the ones they depend on.
 *
 * The sidebar, the search index, the checklist deep links, and the test suite all read
 * from this one array, so adding a pattern is a single import plus a single line.
 */
export const PATTERNS: readonly PatternMeta[] = [
  skipLinkPattern,
  focusVisiblePattern,
  focusTrapPattern,
  customControlsPattern,
  rovingTabindexPattern,
  accessibleNamePattern,
  liveRegionsPattern,
  formsPattern,
  landmarksPattern,
  tablesPattern,
  colourContrastPattern,
  imagesIconsPattern,
  reflowZoomPattern,
  reducedMotionPattern,
  timeoutsPattern,
  speechInputPattern,
];

/** Look a pattern up by its id — used by the checklist page's deep links. */
export function getPattern(id: string): PatternMeta | undefined {
  return PATTERNS.find((pattern) => pattern.id === id);
}

/**
 * Every distinct success criterion mentioned anywhere in the registry, sorted by number.
 *
 * Sorting is numeric per segment, so 1.4.10 comes after 1.4.9 rather than after 1.4.1 —
 * a string sort gets this wrong and is the reason so many published WCAG checklists list
 * their criteria in a slightly mad order.
 */
export function allCriteria(): ReadonlyArray<{
  readonly number: string;
  readonly name: string;
  readonly level: string;
  readonly since: string;
  readonly patternIds: readonly string[];
}> {
  const map = new Map<
    string,
    { number: string; name: string; level: string; since: string; patternIds: string[] }
  >();

  for (const pattern of PATTERNS) {
    for (const criterion of pattern.criteria) {
      const existing = map.get(criterion.number);
      if (existing === undefined) {
        map.set(criterion.number, {
          number: criterion.number,
          name: criterion.name,
          level: criterion.level,
          since: criterion.since,
          patternIds: [pattern.id],
        });
      } else if (!existing.patternIds.includes(pattern.id)) {
        existing.patternIds.push(pattern.id);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => compareCriterionNumbers(a.number, b.number));
}

/** Numeric, segment-by-segment comparison of dotted criterion numbers. */
export function compareCriterionNumbers(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
