import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { DemoProps, PatternMeta } from '../lib/types';

/**
 * Images and icons.
 *
 * Everything here is a data: URI so the repository has no binary assets and the demo works
 * from `file://`. The two images are deliberately different KINDS of image, because that
 * is the actual decision:
 *
 *   - The bar chart CARRIES INFORMATION. Its alternative text must convey the same
 *     information, not describe the picture. "Bar chart" is a useless alt.
 *   - The corner flourish is DECORATION. Its correct alternative text is the empty string,
 *     which tells assistive technology to skip it entirely. Omitting `alt` altogether is
 *     not the same thing: many screen readers then fall back to announcing the filename.
 */

const CHART_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120" width="220" height="120">
  <rect width="220" height="120" fill="#eceef2"/>
  <rect x="20" y="70" width="30" height="40" fill="#0f5fb8"/>
  <rect x="65" y="52" width="30" height="58" fill="#0f5fb8"/>
  <rect x="110" y="34" width="30" height="76" fill="#0f5fb8"/>
  <rect x="155" y="20" width="30" height="90" fill="#0f5fb8"/>
  <line x1="10" y1="110" x2="210" y2="110" stroke="#16191d" stroke-width="2"/>
</svg>`;

const FLOURISH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 24" width="120" height="24">
  <path d="M2 12 Q 30 0 60 12 T 118 12" fill="none" stroke="#0f5fb8" stroke-width="3"/>
</svg>`;

const dataUri = (svg: string): string => `data:image/svg+xml,${encodeURIComponent(svg)}`;

interface ImageAudit {
  readonly kind: string;
  readonly alt: string | null;
  readonly hidden: boolean;
}

function Demo({ broken, idPrefix }: DemoProps): ReactNode {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [audit, setAudit] = useState<readonly ImageAudit[]>([]);

  useEffect(() => {
    const stage = stageRef.current;
    if (stage === null) return;
    const images = Array.from(stage.querySelectorAll<HTMLImageElement>('img'));
    setAudit(
      images.map((image) => ({
        kind: image.dataset.kind ?? 'image',
        alt: image.hasAttribute('alt') ? image.getAttribute('alt') : null,
        hidden: image.getAttribute('aria-hidden') === 'true',
      })),
    );
  }, [broken]);

  return (
    <div>
      <div ref={stageRef} style={{ display: 'grid', gap: '1.25rem' }}>
        <section aria-labelledby={`${idPrefix}-informative`}>
          <h5 id={`${idPrefix}-informative`} style={{ marginTop: 0 }}>
            An informative image
          </h5>
          {broken ? (
            // BROKEN: no alt attribute at all. Most screen readers fall back to reading
            // the filename or the URL — with a data: URI that means a wall of gibberish.
            // The second-worst option, `alt="chart"`, is only marginally better: it names
            // the picture and withholds the information.
            <img src={dataUri(CHART_SVG)} data-kind="bar chart" width={220} height={120} />
          ) : (
            <img
              src={dataUri(CHART_SVG)}
              data-kind="bar chart"
              width={220}
              height={120}
              // The alternative conveys the INFORMATION, not the appearance. If the chart
              // needs more than about a sentence, put the full data in a table nearby and
              // make the alt a pointer to it.
              alt="Units shipped per quarter: Q1 400, Q2 580, Q3 760, Q4 900 — a steady rise across the year."
            />
          )}
          <p className="hint" style={{ marginBlockEnd: 0 }}>
            Rule of thumb: read the alt out loud with the image covered. If the sentence
            still tells you what you needed, it is right.
          </p>
        </section>

        <section aria-labelledby={`${idPrefix}-decorative`}>
          <h5 id={`${idPrefix}-decorative`}>A decorative image</h5>
          {broken ? (
            // BROKEN: describing decoration. "Blue decorative swoosh divider graphic" is
            // pure noise; a screen-reader user hears it on every single page.
            <img
              src={dataUri(FLOURISH_SVG)}
              data-kind="flourish"
              width={120}
              height={24}
              alt="Blue decorative swoosh divider graphic"
            />
          ) : (
            <img
              src={dataUri(FLOURISH_SVG)}
              data-kind="flourish"
              width={120}
              height={24}
              // alt="" is PRESENT and EMPTY. That is a deliberate statement: "this conveys
              // nothing, skip it". Omitting alt entirely means "I forgot", and screen
              // readers treat the two very differently.
              alt=""
            />
          )}
          <p className="hint" style={{ marginBlockEnd: 0 }}>
            Purely presentational images belong in CSS as a background where you can. When
            they must be in the markup, <code>alt=&quot;&quot;</code> is the answer.
          </p>
        </section>

        <section aria-labelledby={`${idPrefix}-svg`}>
          <h5 id={`${idPrefix}-svg`}>Inline SVG</h5>
          <p style={{ marginBlockStart: 0 }}>
            Inline SVG needs different handling from <code>&lt;img&gt;</code>, because the
            shapes are real DOM nodes.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
              {broken ? (
                // BROKEN: no aria-hidden. Depending on the browser and screen reader this
                // is announced as "graphic", or worse, the raw <title> of a decorative
                // shape gets read next to the text it decorates. `focusable="false"` is
                // also missing, which in legacy Internet Explorer / Edge made every inline
                // SVG a tab stop — worth keeping for the same reason people keep type=
                // "button": it costs nothing.
                <svg viewBox="0 0 16 16" width="16" height="16">
                  <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M5 8l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                  <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M5 8l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
              Verified — decorative icon beside real text
            </span>

            {/* Always correct in both variants: an SVG that IS the content, named through
                role="img" plus a <title> referenced by aria-labelledby. */}
            <svg
              viewBox="0 0 16 16"
              width="16"
              height="16"
              role="img"
              aria-labelledby={`${idPrefix}-svg-title`}
            >
              <title id={`${idPrefix}-svg-title`}>Warning: 3 unresolved issues</title>
              <path d="M8 1L15 14H1z" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M8 6v4M8 11.5v.5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </section>
      </div>

      <div className="note" style={{ marginBlockStart: '1rem' }}>
        <h5 style={{ marginTop: 0 }}>What the images actually expose</h5>
        <ul style={{ margin: 0 }}>
          {audit.map((entry, index) => (
            <li key={index}>
              <strong>{entry.kind}</strong>:{' '}
              {entry.alt === null ? (
                <em>no alt attribute — the filename or URL may be read out instead</em>
              ) : entry.alt === '' ? (
                <>
                  <code>alt=&quot;&quot;</code> — correctly skipped as decoration
                </>
              ) : (
                <>&ldquo;{entry.alt}&rdquo;</>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const SOURCE = `{/* INFORMATIVE — the alt carries the information, not a
    description of the picture. */}
<img src="q4-shipments.svg"
     alt="Units shipped per quarter: Q1 400, Q2 580, Q3 760, Q4 900
          — a steady rise across the year." />

{/* COMPLEX — when one sentence is not enough, put the real data
    next to it and point at it. */}
<img src="revenue.svg" alt="Revenue by region, 2024. Full data in
                            the table below." />
<table> … </table>

{/* DECORATIVE — alt is PRESENT and EMPTY. Not missing. */}
<img src="flourish.svg" alt="" />

{/* FUNCTIONAL — the image is inside a link or button, so the alt
    describes the ACTION, not the picture. */}
<a href="/"><img src="logo.svg" alt="Home"></a>
{/* not alt="Company logo" — the user cannot "click a logo" */}

{/* INLINE SVG, decorative */}
<svg aria-hidden="true" focusable="false" viewBox="0 0 16 16">…</svg>

{/* INLINE SVG, meaningful */}
<svg role="img" aria-labelledby="warn-title" viewBox="0 0 16 16">
  <title id="warn-title">Warning: 3 unresolved issues</title>
  …
</svg>

{/* TEXT IN IMAGES — SC 1.4.5 Images of Text (AA) says use real
    text unless the presentation is essential (logotypes are the
    main exemption). Real text also zooms, reflows, translates,
    and can be selected. */}

/* Decision tree
   ────────────────────────────────────────────────────────────
   Does the image convey information the surrounding text does not?
     no  → alt=""  (or a CSS background, which is better still)
     yes → is it inside a link or button?
             yes → alt describes the destination or action
             no  → alt conveys the information, as a sentence
   Is the information too complex for a sentence?
     yes → short alt + the full content in adjacent text/table */`;

/**
 * Registry entry for the alternative-text pattern. Note that the broken variant fails in
 * *both* directions at once — an informative chart loses its `alt` entirely while a purely
 * decorative flourish gains a loving description. Only showing the missing-alt half would
 * teach half the rule; the cost of over-describing is a screen-reader user wading through
 * narration of things that carry no information.
 *
 * Claims SC 1.1.1 Non-text Content (A), SC 1.4.5 Images of Text (AA) and SC 1.4.11 Non-text
 * Contrast (AA, WCAG 2.1). The `source` block is a decision tree rather than a snippet,
 * because "what should the alt say" is a judgement, not a syntax.
 */
export const imagesIconsPattern: PatternMeta = {
  id: 'images-icons',
  title: 'Images, icons, and alternative text',
  problem:
    'Alternative text is the oldest accessibility requirement on the web and still the most consistently botched, in both directions: information-carrying images with no alt at all, and decorative flourishes described in loving detail on every page.',
  keywords: ['alt text', 'alt=""', 'aria-hidden', 'svg title', 'decorative', 'figure', 'figcaption', 'images of text'],
  criteria: [
    {
      number: '1.1.1',
      name: 'Non-text Content',
      level: 'A',
      since: '2.0',
      why: 'All non-text content needs a text alternative serving an equivalent purpose — except when it is pure decoration, in which case it must be implemented so assistive technology ignores it. Both halves of that sentence are in the criterion.',
    },
    {
      number: '1.4.5',
      name: 'Images of Text',
      level: 'AA',
      since: '2.0',
      why: 'Use real text rather than a picture of text, unless the exact presentation is essential. Real text zooms, reflows, recolours, and translates; a JPEG of a heading does none of that.',
    },
    {
      number: '1.4.11',
      name: 'Non-text Contrast',
      level: 'AA',
      since: '2.1',
      why: 'An icon that conveys meaning needs 3:1 contrast against its background, the same as a control boundary. A pale grey status icon is unreadable regardless of its alt text.',
    },
  ],
  section508:
    'SC 1.1.1 and 1.4.5 are WCAG 2.0 A/AA criteria, incorporated by E205.4. As with tables, there is history worth knowing: the ORIGINAL 1998 standard stated this directly at §1194.22(a) — "A text equivalent for every non-text element shall be provided" — and that provision was superseded by the 2017 refresh. Chapter 3 Functional Performance Criteria 302.1 Without Vision and 302.2 With Limited Vision apply. SC 1.4.11 is WCAG 2.1 and therefore outside the 508 reference.',
  howToTest: {
    keyboard: [
      'Images are not focusable, so a keyboard test finds nothing here — as with tables, that is the point worth internalising.',
      'One keyboard-adjacent check: an inline SVG inside a link or button must not become its own tab stop. focusable="false" prevents that in legacy engines.',
    ],
    screenReader: [
      'Accessible chart: "Units shipped per quarter: Q1 400, Q2 580, Q3 760, Q4 900 — a steady rise across the year, image."',
      'Accessible flourish: complete silence, which is correct.',
      'Broken chart: the data URI read aloud as a stream of characters, or simply "image".',
      'Broken flourish: "Blue decorative swoosh divider graphic, image" — on every page, forever.',
      'Quick manual audit in any browser: disable images (Chrome: Settings → Site settings → Images) and read the page. What you can still understand is what a screen-reader user gets.',
    ],
  },
  source: SOURCE,
  brokenBehaviour:
    'The informative chart loses its alt attribute entirely, the decorative flourish gains a detailed description of itself, and the decorative inline SVG loses aria-hidden and focusable="false".',
  Demo,
};
