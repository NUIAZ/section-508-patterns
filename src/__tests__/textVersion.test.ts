import { describe, expect, it } from 'vitest';
import { renderTextVersion, esc } from '../lib/textVersion';
import { PATTERNS } from '../patterns';
import { CHECKLIST } from '../data/checklist';

/**
 * The text version exists so that a browser without script still gets the whole reference,
 * and it is generated rather than written so it cannot drift from the site. These tests are
 * the "cannot drift" guarantee: if someone adds a pattern or a checklist item and the text
 * page does not carry it, the build fails.
 */
describe('text version', () => {
  const html = renderTextVersion({ generatedOn: '2026-01-01', interactiveUrl: './' });

  it('is a complete, well-formed HTML document with no script and no stylesheet', () => {
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<html lang="en">');
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<link[^>]+stylesheet/i);
    expect(html.trim().endsWith('</html>')).toBe(true);
  });

  it('contains every pattern by id and title, in registry order', () => {
    let last = -1;
    for (const p of PATTERNS) {
      expect(html).toContain(`id="pattern-${p.id}"`);
      expect(html).toContain(esc(p.title));
      const pos = html.indexOf(`id="pattern-${p.id}"`);
      expect(pos).toBeGreaterThan(last);
      last = pos;
    }
  });

  it('carries every criterion, the 508 mapping, both test procedures and the source for each pattern', () => {
    for (const p of PATTERNS) {
      for (const c of p.criteria) expect(html).toContain(`${esc(c.number)} ${esc(c.name)}`);
      expect(html).toContain(esc(p.section508));
      for (const step of p.howToTest.keyboard) expect(html).toContain(esc(step));
      for (const step of p.howToTest.screenReader) expect(html).toContain(esc(step));
      expect(html).toContain(esc(p.brokenBehaviour));
      expect(html).toContain(esc(p.source));
    }
  });

  it('contains every checklist item, and links the ones that have a pattern', () => {
    for (const item of CHECKLIST) {
      expect(html).toContain(esc(item.text));
      if (item.patternId) expect(html).toContain(`href="#pattern-${item.patternId}"`);
    }
  });

  it('tells a no-script reader how to reach the interactive version', () => {
    expect(html).toContain('href="./"');
    expect(html).toMatch(/JavaScript/);
  });

  it('is deterministic for a fixed date', () => {
    expect(renderTextVersion({ generatedOn: '2026-01-01' })).toBe(
      renderTextVersion({ generatedOn: '2026-01-01' }),
    );
    expect(html).toContain('Generated 2026-01-01');
  });

  it('escapes registry text (a "<" in a source snippet must not become markup)', () => {
    // Every pattern's source contains angle brackets; none may survive unescaped inside <pre>.
    const pre = html.match(/<pre><code>([\s\S]*?)<\/code><\/pre>/g) ?? [];
    expect(pre.length).toBe(PATTERNS.length);
    for (const block of pre) {
      const inner = block.replace(/^<pre><code>/, '').replace(/<\/code><\/pre>$/, '');
      expect(inner).not.toMatch(/<[a-z/]/i);
    }
  });
});
