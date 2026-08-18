/**
 * textVersion.ts: renders the whole reference as one plain, static HTML page.
 *
 * Why this exists. The site is a JavaScript application, and a browser with
 * scripting off (or a text-only browser such as Lynx or w3m) sees nothing but
 * the <noscript> notice. Section 508 and WCAG do not require a site to work
 * without script, but the 1998 rules did allow a "text-only page with
 * equivalent information" as a last resort, with one condition that everyone
 * forgot to meet: it had to be kept up to date. Hand-written text pages drift.
 *
 * So this one is not written; it is generated. It reads the same PATTERNS and
 * CHECKLIST arrays the interactive site renders, at build time, and writes
 * text.html into the published bundle. It cannot go stale, because it does not
 * exist independently of the source. A test asserts every pattern and every
 * checklist item is present in the output.
 *
 * What it deliberately leaves out: the live demos and the Accessible / Broken
 * switch. Those are the point of the interactive site and they need script.
 * The text page says so, and tells the reader how to get to them.
 *
 * Output rules: semantic HTML only (headings, lists, definition lists), no
 * external CSS or script, no colour as the only signal, and every section has
 * an id so it can be linked to. It should read well in a terminal browser, in a
 * screen reader, and when printed.
 */

import { PATTERNS } from '../patterns';
import { CHECKLIST } from '../data/checklist';

/** Escape text for HTML. Everything from the registry goes through this. */
export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Options let the test render deterministically and the script stamp the date. */
export interface TextVersionOptions {
  /** ISO date shown in the footer; defaults to today. */
  readonly generatedOn?: string;
  /** Where the interactive site lives, for the "try the full version" link. */
  readonly interactiveUrl?: string;
}

/**
 * Render the complete text version. Pure: same input, same string.
 */
export function renderTextVersion(options: TextVersionOptions = {}): string {
  const generatedOn = options.generatedOn ?? new Date().toISOString().slice(0, 10);
  const interactiveUrl = options.interactiveUrl ?? './';

  const toc = PATTERNS.map(p => `<li><a href="#pattern-${esc(p.id)}">${esc(p.title)}</a></li>`).join('\n');

  const patterns = PATTERNS.map(p => {
    const criteria = p.criteria
      .map(
        c =>
          `<li><strong>${esc(c.number)} ${esc(c.name)}</strong> (Level ${esc(c.level)}, WCAG ${esc(c.since)}): ${esc(c.why)}</li>`,
      )
      .join('\n');
    const kb = p.howToTest.keyboard.map(s => `<li>${esc(s)}</li>`).join('\n');
    const sr = p.howToTest.screenReader.map(s => `<li>${esc(s)}</li>`).join('\n');
    return `
<section id="pattern-${esc(p.id)}">
<h2>${esc(p.title)}</h2>
<p><strong>The problem:</strong> ${esc(p.problem)}</p>
<h3>WCAG success criteria</h3>
<ul>
${criteria}
</ul>
<h3>Section 508</h3>
<p>${esc(p.section508)}</p>
<h3>How to test with a keyboard</h3>
<ol>
${kb}
</ol>
<h3>What a screen reader should announce</h3>
<ul>
${sr}
</ul>
<h3>What the broken version does</h3>
<p>${esc(p.brokenBehaviour)}</p>
<h3>Source of the working demo</h3>
<pre><code>${esc(p.source)}</code></pre>
<p><a href="#top">Back to top</a></p>
</section>`;
  }).join('\n');

  // Group checklist items by criterion, preserving the registry's order.
  const groups = new Map<string, typeof CHECKLIST[number][]>();
  for (const item of CHECKLIST) {
    const key = `${item.criterion} ${item.criterionName} (Level ${item.level}, WCAG ${item.since})`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  const checklist = [...groups.entries()]
    .map(
      ([heading, items]) => `
<h3>${esc(heading)}</h3>
<ul>
${items
  .map(
    i =>
      `<li>${esc(i.text)}${
        i.patternId ? ` (see <a href="#pattern-${esc(i.patternId)}">${esc(i.patternId)}</a>)` : ''
      }</li>`,
  )
  .join('\n')}
</ul>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Section 508 Patterns: text version</title>
<meta name="description" content="Plain-text version of the Section 508 Patterns reference: every pattern with its WCAG criteria, Section 508 mapping, test procedure and source. Generated from the same data as the interactive site.">
</head>
<body>
<a id="top"></a>
<header>
<h1>Section 508 Patterns: text version</h1>
<p>This is the complete written content of the Section 508 Patterns reference in plain HTML,
with no script and no stylesheet: ${PATTERNS.length} patterns and a ${CHECKLIST.length}-item
pre-launch checklist. It is generated at build time from the same data the interactive site
uses, so it is always current.</p>
<p>What it does not have is the live demos: the interactive components you can operate with a
keyboard or screen reader, and the Accessible / Broken switch that lets you experience each
failure. Those need JavaScript. If your browser has scripting turned off, or you are using a
text-only browser, you have two options: read on here, or open
<a href="${esc(interactiveUrl)}">the interactive version</a> in a browser with JavaScript
enabled. Any current Firefox, Chrome, Edge or Safari works, including with a screen reader;
if you are in a locked-down environment, this page is the fallback and it is not second-rate:
every criterion, mapping and test step is here.</p>
</header>
<nav aria-labelledby="toc-heading">
<h2 id="toc-heading">Contents</h2>
<ol>
${toc}
<li><a href="#checklist">Pre-launch checklist</a></li>
</ol>
</nav>
<main>
${patterns}
<section id="checklist">
<h2>Pre-launch checklist</h2>
<p>${CHECKLIST.length} checkable items, organised by success criterion. A practical working list,
not a conformance audit and not legal advice.</p>
${checklist}
<p><a href="#top">Back to top</a></p>
</section>
</main>
<footer>
<p>Generated ${esc(generatedOn)} from the pattern registry. Source and interactive site:
<a href="https://github.com/NUIAZ/section-508-patterns">github.com/NUIAZ/section-508-patterns</a>.
MIT licensed.</p>
</footer>
</body>
</html>
`;
}
