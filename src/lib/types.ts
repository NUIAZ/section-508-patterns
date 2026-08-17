import type { ComponentType } from 'react';

/**
 * Shared types for the pattern registry.
 *
 * Everything on the patterns page is generated from this data, which is deliberate: it
 * means a pattern cannot exist on the site without a criterion mapping, a testing note,
 * and both a working and a broken implementation. Making the *good* thing structurally
 * mandatory is the same idea the site teaches.
 */

/** WCAG conformance levels. Section 508 requires A and AA; AAA is aspirational. */
export type WcagLevel = 'A' | 'AA' | 'AAA';

/** Which version of WCAG first introduced a success criterion. This matters legally —
 *  see {@link PatternMeta.section508} — so it is modelled rather than written in prose. */
export type WcagVersion = '2.0' | '2.1' | '2.2';

/**
 * One success criterion as cited by one pattern.
 *
 * Number, name, level and version are carried together and repeated at every citation
 * rather than looked up from a central table. That is a deliberate trade: it means the
 * same criterion appears many times across the registry, and a test asserts that every
 * copy agrees — so a typo in "2.4.7 Focus Visible, AA" fails the build instead of quietly
 * teaching a reader the wrong level.
 *
 * `why` carries the actual editorial weight. A criterion number with no explanation is a
 * citation; a criterion number with a specific "because this control has a role and a value
 * but no name" is the thing someone came to the page to learn.
 */
export interface WcagCriterion {
  /** Dotted criterion number, e.g. "2.4.1". */
  readonly number: string;
  /** Official criterion name, e.g. "Bypass Blocks". Spelled exactly as WCAG spells it. */
  readonly name: string;
  readonly level: WcagLevel;
  /** WCAG version that introduced the criterion. */
  readonly since: WcagVersion;
  /** Why *this* pattern relates to *this* criterion. One sentence, specific. */
  readonly why: string;
}

/**
 * The manual test procedure printed under every pattern.
 *
 * Split into keyboard and screen-reader steps because they catch different things and
 * conflating them is how teams convince themselves they have tested. A keyboard sweep finds
 * unreachable controls and lost focus; it will happily pass an icon button with no
 * accessible name, which only a screen reader (or the accessibility tree) exposes.
 *
 * Both arrays are phrased as *observable* steps and outcomes — "press Tab, focus should
 * land on the Close button" — so that a reader can disagree with the site if the behaviour
 * in front of them differs. Aspirational prose would not survive that test.
 */
export interface HowToTest {
  /** Ordered keyboard steps a visitor can literally perform on the demo above. */
  readonly keyboard: readonly string[];
  /** What a screen reader should announce, phrased as observable output. */
  readonly screenReader: readonly string[];
}

/**
 * Props every demo component receives.
 *
 * A single component renders both variants so that the broken version is guaranteed to be
 * the *same component* with the accessibility affordances removed — not a separate lookalike
 * that quietly differs in other ways.
 */
export interface DemoProps {
  readonly broken: boolean;
  /** Unique id prefix so a demo can mint ids that never collide with another card. */
  readonly idPrefix: string;
}

/**
 * Everything the site knows about one pattern — the unit the whole application is built
 * from. The sidebar, search index, checklist cross-links, pattern cards and test suite all
 * read from these objects; nothing about a pattern lives anywhere else.
 *
 * Note that no field is optional. That is the point: because the type demands `criteria`,
 * `section508`, `howToTest`, `brokenBehaviour`
 * and a `Demo` before a pattern can compile, it is not possible to publish a pattern here
 * that shows a nice component without saying which criteria it serves, how to verify it,
 * or what failure looks like. The structure enforces the editorial standard so a reviewer
 * does not have to.
 */
export interface PatternMeta {
  /** URL fragment / DOM id. Stable: the checklist page links to these. */
  readonly id: string;
  readonly title: string;
  /** The problem the pattern solves, in plain language. Shown under the title. */
  readonly problem: string;
  /** Extra search terms that are not in the title or problem text. */
  readonly keywords: readonly string[];
  readonly criteria: readonly WcagCriterion[];
  /**
   * How the pattern maps to the Revised Section 508 Standards (2017, compliance date
   * 2018-01-18). The Revised Standards do not restate WCAG criteria with their own
   * numbers — they *incorporate WCAG 2.0 Level A and AA by reference* (E205.4 for
   * electronic content, 502/503 and E207.2 for software). So this field names the 508
   * provision that pulls the criterion in, plus any relevant Chapter 3 Functional
   * Performance Criteria, rather than inventing a "508 provision number" per pattern.
   */
  readonly section508: string;
  readonly howToTest: HowToTest;
  /** The essential source of the working demo, shown in a copyable block. */
  readonly source: string;
  /** What specifically is sabotaged in the broken variant. */
  readonly brokenBehaviour: string;
  readonly Demo: ComponentType<DemoProps>;
}
