import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { DemoProps, PatternMeta } from '../lib/types';
import { computeAccessibleName } from '../lib/focus';

/**
 * Headings and landmarks, inspected live.
 *
 * The accessible variant does something no static example can: it scans **this actual
 * page** and reports the landmarks and heading outline it finds. If the site ever
 * regresses (a second `<h1>`, an unlabelled `<nav>`, a skipped level), the panel says so,
 * in public, on the page. That felt like the only honest way to make this pattern
 * demonstrable rather than merely described.
 *
 * The broken variant renders a self-contained slab of div-soup and points the same scanner
 * at it, which reports exactly nothing to navigate by.
 */

interface LandmarkInfo {
  readonly role: string;
  readonly name: string;
}

interface HeadingInfo {
  readonly level: number;
  readonly text: string;
}

/**
 * Map an element to its landmark role.
 *
 * The implicit mappings are worth memorising because they are the whole reason to use the
 * HTML elements instead of ARIA roles:
 *   <header>  → banner        (only when NOT inside article/aside/main/nav/section)
 *   <nav>     → navigation
 *   <main>    → main
 *   <aside>   → complementary (same scoping caveat as header)
 *   <footer>  → contentinfo   (same scoping caveat)
 *   <form>    → form          (only when it has an accessible name)
 *   <section> → region        (only when it has an accessible name)
 *   <search>  → search        (newer element; role="search" is the portable spelling)
 */
function landmarkRoleOf(element: HTMLElement): string | null {
  const explicit = element.getAttribute('role');
  const LANDMARK_ROLES = [
    'banner',
    'navigation',
    'main',
    'complementary',
    'contentinfo',
    'form',
    'region',
    'search',
  ];
  if (explicit !== null && LANDMARK_ROLES.includes(explicit)) return explicit;

  const tag = element.tagName.toLowerCase();
  // A <header>, <footer> or <aside> nested inside a sectioning element is NOT a landmark,
  // a very common source of "why does this page report four banners". `closest` includes
  // the element itself, so we look at the ancestors only.
  const nestedInSectioning =
    element.parentElement?.closest('article, aside, main, nav, section') != null;

  switch (tag) {
    case 'header':
      return nestedInSectioning ? null : 'banner';
    case 'footer':
      return nestedInSectioning ? null : 'contentinfo';
    case 'nav':
      return 'navigation';
    case 'main':
      return 'main';
    case 'aside':
      return nestedInSectioning ? null : 'complementary';
    case 'search':
      return 'search';
    case 'form':
    case 'section':
      // Only a landmark when named. An unnamed <section> is a generic container.
      return computeAccessibleName(element) !== '' ? (tag === 'form' ? 'form' : 'region') : null;
    default:
      return null;
  }
}

function scanLandmarks(root: ParentNode): readonly LandmarkInfo[] {
  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>(
      'header, footer, nav, main, aside, section, form, search, [role]',
    ),
  );
  const seen = new Set<HTMLElement>();
  const found: LandmarkInfo[] = [];
  for (const element of candidates) {
    if (seen.has(element)) continue;
    seen.add(element);
    const role = landmarkRoleOf(element);
    if (role === null) continue;
    found.push({ role, name: computeAccessibleName(element).slice(0, 60) });
  }
  return found;
}

function scanHeadings(root: ParentNode, maxLevel: number): readonly HeadingInfo[] {
  const selector = Array.from({ length: maxLevel }, (_, i) => `h${i + 1}`).join(',');
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).map((element) => ({
    level: Number(element.tagName.slice(1)),
    text: (element.textContent ?? '').trim().slice(0, 70),
  }));
}

/** Report the first place the outline jumps more than one level, if any. */
function findLevelSkip(headings: readonly HeadingInfo[]): string | null {
  for (let i = 1; i < headings.length; i += 1) {
    const previous = headings[i - 1];
    const current = headings[i];
    if (current.level > previous.level + 1) {
      return `Level ${previous.level} “${previous.text}” is followed by level ${current.level} “${current.text}”.`;
    }
  }
  return null;
}

function Demo({ broken, idPrefix }: DemoProps): ReactNode {
  const soupRef = useRef<HTMLDivElement | null>(null);
  const [landmarks, setLandmarks] = useState<readonly LandmarkInfo[]>([]);
  const [headings, setHeadings] = useState<readonly HeadingInfo[]>([]);
  const [deepCount, setDeepCount] = useState(0);
  const [skip, setSkip] = useState<string | null>(null);

  useEffect(() => {
    // Scan after paint so the DOM reflects the current variant.
    const root: ParentNode = broken ? (soupRef.current ?? document.body) : document.body;

    setLandmarks(scanLandmarks(root));

    if (broken) {
      const all = scanHeadings(root, 6);
      setHeadings(all);
      setDeepCount(0);
      setSkip(findLevelSkip(all));
    } else {
      // On the real page there are well over a hundred headings, so show the top two
      // levels and summarise the rest. Skip detection still runs over all six levels.
      const all = scanHeadings(root, 6);
      setHeadings(all.filter((h) => h.level <= 2));
      setDeepCount(all.filter((h) => h.level > 2).length);
      setSkip(findLevelSkip(all));
    }
  }, [broken]);

  const h1Count = headings.filter((heading) => heading.level === 1).length;

  return (
    <div>
      {broken ? (
        <>
          <p style={{ marginTop: 0 }}>
            A page built entirely from <code>&lt;div&gt;</code>s, with headings faked by
            font size. It looks identical to a correct one.
          </p>
          <div
            ref={soupRef}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '0.75rem',
            }}
          >
            <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>Quarterly report</div>
            <div style={{ display: 'flex', gap: '0.75rem', marginBlock: '0.5rem' }}>
              <a href={`#${idPrefix}-a`} onClick={(e) => e.preventDefault()}>Summary</a>
              <a href={`#${idPrefix}-b`} onClick={(e) => e.preventDefault()}>Detail</a>
              <a href={`#${idPrefix}-c`} onClick={(e) => e.preventDefault()}>Appendix</a>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>Summary</div>
            <p style={{ margin: '0.25rem 0' }}>
              Bold text at 1.2rem is a heading to a sighted reader and plain body text to a
              screen reader. There is nothing to jump to.
            </p>
            {/* One real heading, at the wrong level, to make the skip detector earn its
                keep: the surrounding fake headings mean the outline goes 4 → 6. */}
            <h4 style={{ margin: '0.5rem 0 0.25rem' }}>Detail</h4>
            <h6 style={{ margin: '0.25rem 0' }}>Regional breakdown</h6>
            <p style={{ margin: 0 }}>
              Level 4 straight to level 6. A screen-reader user pressing &ldquo;6&rdquo; to
              move between headings is told the outline has a hole in it.
            </p>
          </div>
        </>
      ) : (
        <p style={{ marginTop: 0 }}>
          The panel below is scanning <strong>this page</strong>, live, right now. That is
          the demo: if this site ever grows a second <code>&lt;h1&gt;</code> or an
          unlabelled <code>&lt;nav&gt;</code>, it will say so here.
        </p>
      )}

      <div className="note" style={{ marginBlockStart: '0.75rem' }}>
        <h5 style={{ marginTop: 0 }}>
          Landmarks found {broken ? 'in the demo above' : 'on this page'}
        </h5>
        {landmarks.length === 0 ? (
          <p style={{ margin: 0 }}>
            <strong>None.</strong> There is nothing for a screen-reader user to navigate
            by. Every one of the div-soup &ldquo;sections&rdquo; above is invisible to the
            landmarks list.
          </p>
        ) : (
          <ul style={{ margin: 0 }}>
            {landmarks.map((landmark, index) => (
              <li key={index}>
                <code>{landmark.role}</code>
                {landmark.name === '' ? (
                  <em> (unnamed)</em>
                ) : (
                  <>: &ldquo;{landmark.name}&rdquo;</>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="note" style={{ marginBlockStart: '0.5rem' }}>
        <h5 style={{ marginTop: 0 }}>Heading outline</h5>
        <p style={{ margin: '0 0 0.35rem' }}>
          {h1Count === 1 ? '✓ Exactly one level-1 heading.' : `✕ ${h1Count} level-1 headings.`}{' '}
          {skip === null ? '✓ No skipped levels.' : `✕ Skipped level: ${skip}`}
        </p>
        {headings.length === 0 ? (
          <p style={{ margin: 0 }}>
            <strong>No real headings at all.</strong>
          </p>
        ) : (
          <ol style={{ margin: 0, paddingInlineStart: '1.25rem' }}>
            {headings.map((heading, index) => (
              <li key={index} style={{ marginInlineStart: `${(heading.level - 1) * 1.1}rem` }}>
                <code>h{heading.level}</code> {heading.text}
              </li>
            ))}
          </ol>
        )}
        {deepCount > 0 ? (
          <p className="hint" style={{ margin: '0.35rem 0 0' }}>
            Plus {deepCount} level-3 and deeper headings inside the pattern cards, omitted
            here for length. Skip detection ran over all of them.
          </p>
        ) : null}
      </div>
    </div>
  );
}

const SOURCE = `<body>
  <a class="skip-link" href="#main">Skip to main content</a>

  {/* <header> at the top level → role="banner". Inside an <article>
      it is NOT a landmark, which trips people up constantly. */}
  <header>
    <h1>Section 508 Patterns</h1>   {/* exactly one h1 per page */}
  </header>

  {/* Multiple navigations MUST be distinguished by name, or the
      landmarks list reads "navigation, navigation, navigation". */}
  <nav aria-label="Site and pattern index"> … </nav>

  <main id="main" tabindex="-1">
    <h2>Patterns</h2>              {/* h1 → h2, no skipping */}
    <article aria-labelledby="skip-link-title">
      <h3 id="skip-link-title">Skip link</h3>
      <h4>Live demo</h4>           {/* h3 → h4 */}
    </article>
  </main>

  <aside aria-label="Related reading"> … </aside>   {/* complementary */}
  <footer> … </footer>                              {/* contentinfo */}
</body>

/* Implicit landmark roles: use the ELEMENT, not the role attribute,
   because the element also carries the browser behaviour:

     <header>   banner         (top level only)
     <nav>      navigation
     <main>     main           (one per page)
     <aside>    complementary  (top level only)
     <footer>   contentinfo    (top level only)
     <form>     form           ONLY when it has an accessible name
     <section>  region         ONLY when it has an accessible name
     <search>   search         (or role="search" for older browsers)

   Rules that actually matter:
     • One <main>, one <h1>, per page.
     • Never skip a heading level going down (h2 → h4 is a failure of
       the outline, though WCAG does not name the skip itself).
     • Name every landmark you have more than one of.
     • Do NOT put "Navigation" in aria-label on a <nav>; the role is
       already announced. aria-label="Primary navigation" produces
       "Primary navigation navigation". Just "Primary".
     • Every visible piece of the page should be inside SOME landmark;
       content outside them is unreachable by landmark navigation. */`;

/**
 * Registry entry for the headings-and-landmarks pattern, the structural navigation most
 * screen-reader users actually rely on, and the thing a page of styled `<div>`s destroys
 * without changing a pixel.
 *
 * The `source` block carries the two corrections people need most: label a landmark only
 * when there is more than one of its kind, and never put the role's own name in the label,
 * or `aria-label="Primary navigation"` on a `<nav>` announces as "Primary navigation
 * navigation".
 *
 * Claims SC 1.3.1 Info and Relationships (A), SC 2.4.1 Bypass Blocks (A), landmarks and a
 * correct heading outline are two of the three accepted bypass mechanisms alongside a skip
 * link: SC 2.4.6 Headings and Labels (AA) and SC 2.4.10 Section Headings (AAA).
 */
export const landmarksPattern: PatternMeta = {
  id: 'landmarks',
  title: 'Headings and landmarks',
  problem:
    'Screen-reader users do not read pages top to bottom; they skim by heading and by landmark, the same way a sighted reader skims by looking. A page of unlabelled divs with font-size headings removes both. Surveys of screen-reader users have consistently put headings at the top of the list of how they find things on a page.',
  keywords: ['h1', 'outline', 'main', 'nav', 'aside', 'banner', 'contentinfo', 'region', 'div soup'],
  criteria: [
    {
      number: '1.3.1',
      name: 'Info and Relationships',
      level: 'A',
      since: '2.0',
      why: 'A visual heading must also be a programmatic heading. Bold 1.4rem text conveys structure visually and conveys nothing to assistive technology.',
    },
    {
      number: '2.4.1',
      name: 'Bypass Blocks',
      level: 'A',
      since: '2.0',
      why: 'Correctly marked-up landmarks are one of the three accepted ways to satisfy this criterion, alongside a skip link and a proper heading structure.',
    },
    {
      number: '2.4.6',
      name: 'Headings and Labels',
      level: 'AA',
      since: '2.0',
      why: 'Headings must describe the topic or purpose. "Overview" on six different sections describes nothing.',
    },
    {
      number: '2.4.10',
      name: 'Section Headings',
      level: 'AAA',
      since: '2.0',
      why: 'Stated honestly: the requirement to use headings to organise content is Level AAA, not AA. What is required at A is that any heading you DO use is marked up as one.',
    },
  ],
  section508:
    'E205.4 incorporates WCAG 2.0 A and AA, which covers 1.3.1, 2.4.1 and 2.4.6. Note the honest boundary: SC 2.4.10 Section Headings is Level AAA, so neither WCAG AA nor Section 508 requires you to add headings that are not already there; they require that structure you do present visually is also present programmatically. Chapter 3 Functional Performance Criterion 302.1 Without Vision is the practical driver, and 302.9 (Limited Language, Cognitive, and Learning Abilities) benefits too, since a clear outline helps anyone who finds long prose hard going.',
  howToTest: {
    keyboard: [
      'Headings and landmarks have no keyboard behaviour of their own; this is a structure problem a keyboard test cannot find.',
      'The nearest keyboard proxy: press Tab from the top of the page and see whether a skip link offers to bypass the navigation.',
      'In Firefox or Chrome devtools, open the Accessibility tree and look at the top-level structure.',
    ],
    screenReader: [
      'NVDA: press H to move to the next heading, 1–6 for a specific level, D for the next landmark, and Insert+F7 for the elements list.',
      'JAWS: H for headings, R for regions/landmarks, Insert+F6 for the headings list, Insert+Ctrl+R for the regions list.',
      'VoiceOver: Ctrl+Option+U opens the rotor; then arrow to the Headings or Landmarks list.',
      'On this page you should hear "banner", "navigation, Site and pattern index", "main", "contentinfo".',
      'On the broken demo, the landmark list is empty and the headings list contains one stray level-4 and one level-6.',
    ],
  },
  source: SOURCE,
  brokenBehaviour:
    'The mini-page is entirely divs with font-size standing in for heading levels, plus one real h4 followed by an h6 so the outline visibly skips a level. The scanner reports what is left: no landmarks, a broken outline.',
  Demo,
};
