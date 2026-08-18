/**
 * The pre-launch checklist page: renders `CHECKLIST` as tickable groups, with print and
 * Markdown export.
 *
 * Tick state is per-browser `localStorage`, keyed on item id, and that is the whole
 * persistence story: there is no account, no sync, and no server. Said plainly because the
 * page looks like an audit tool: clearing site data loses the ticks, and two people
 * reviewing the same product see two independent checklists. Anyone who needs a shared
 * record should use the Markdown export, which is why it exists.
 *
 * The page is also itself a demonstration (grouped checkboxes, an announced progress
 * count, and print styles), so changes here should be held to the standard the rest of the
 * site argues for. The specifics are documented on the component.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { CHECKLIST, type ChecklistItem } from '../data/checklist';
import { compareCriterionNumbers, getPattern } from '../patterns';
import { routeHref } from '../lib/router';

const STORAGE_KEY = 'section-508-patterns:checklist';

function readTicks(): ReadonlySet<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((entry): entry is string => typeof entry === 'string'));
  } catch {
    return new Set();
  }
}

interface Group {
  readonly criterion: string;
  readonly criterionName: string;
  readonly level: string;
  readonly since: string;
  readonly items: readonly ChecklistItem[];
}

/** Group the flat list by criterion, preserving numeric criterion order. */
function groupByCriterion(items: readonly ChecklistItem[]): readonly Group[] {
  const map = new Map<string, ChecklistItem[]>();
  for (const item of items) {
    const bucket = map.get(item.criterion);
    if (bucket === undefined) map.set(item.criterion, [item]);
    else bucket.push(item);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => compareCriterionNumbers(a, b))
    .map(([criterion, bucket]) => ({
      criterion,
      criterionName: bucket[0].criterionName,
      level: bucket[0].level,
      since: bucket[0].since,
      items: bucket,
    }));
}

/**
 * Pre-launch checklist.
 *
 * Design decisions worth noting, since this page is also a demonstration:
 *  - Each group is a `<fieldset>` with a `<legend>` naming the criterion, so a screen
 *    reader announces "1.4.3 Contrast (Minimum), Level AA" as context for every checkbox
 *    inside it, rather than reading fifty unrelated checkboxes in a row.
 *  - Progress is reported in a `role="status"` region, so ticking a box confirms itself.
 *  - The Markdown export builds a Blob and clicks a generated link. No dependency, and the
 *    result is a plain text file that survives being pasted into a ticket.
 *  - Print styles in `global.css` drop the sidebar and expand link targets, so
 *    Ctrl+P produces something you can hand to somebody.
 */
export function ChecklistPage(): ReactNode {
  const [ticked, setTicked] = useState<ReadonlySet<string>>(readTicks);
  const [hideDone, setHideDone] = useState(false);

  const groups = useMemo(() => groupByCriterion(CHECKLIST), []);

  const persist = useCallback((next: ReadonlySet<string>): void => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // Non-fatal: the checklist still works for this session.
    }
  }, []);

  const toggle = useCallback(
    (id: string): void => {
      setTicked((previous) => {
        const next = new Set(previous);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const reset = useCallback((): void => {
    const empty = new Set<string>();
    setTicked(empty);
    persist(empty);
  }, [persist]);

  const exportMarkdown = useCallback((): void => {
    const lines: string[] = [
      '# Pre-launch accessibility checklist',
      '',
      'Generated from section-508-patterns. Organised by WCAG 2.1 success criterion.',
      'Section 508 (Revised, 2017) incorporates WCAG 2.0 Level A and AA by reference;',
      'items marked "WCAG 2.1" are required by WCAG 2.1 AA but are outside the 508 reference.',
      '',
    ];
    for (const group of groups) {
      lines.push(
        `## ${group.criterion} ${group.criterionName} (Level ${group.level}, WCAG ${group.since})`,
        '',
      );
      for (const item of group.items) {
        lines.push(`- [${ticked.has(item.id) ? 'x' : ' '}] ${item.text}`);
      }
      lines.push('');
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'accessibility-checklist.md';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [groups, ticked]);

  const doneCount = CHECKLIST.filter((item) => ticked.has(item.id)).length;

  return (
    <>
      <h2>Pre-launch accessibility checklist</h2>
      <p>
        {CHECKLIST.length} checkable items across {groups.length} success criteria. Each one
        is something you can verify in an afternoon; where there is a live pattern
        demonstrating it, the item links straight to it.
      </p>

      <p className="note note-warning">
        <strong>Scope, honestly stated.</strong> This is a practical working list, not a
        conformance audit and not legal advice. A full WCAG 2.1 Level AA conformance claim
        covers all fifty Level A and AA success criteria, including the audio, video, and
        captioning criteria this site does not cover. Ticking every box here means you have
        cleared the failures that most commonly appear in application interfaces; it does
        not by itself constitute a conformance claim, an Accessibility Conformance Report,
        or a VPAT.
      </p>

      <div
        className="no-print"
        style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBlockEnd: '1rem' }}
      >
        <button type="button" className="btn" onClick={() => window.print()}>
          <span aria-hidden="true">🖨</span> Print this checklist
        </button>
        <button type="button" className="btn" onClick={exportMarkdown}>
          <span aria-hidden="true">⭳</span> Export as Markdown
        </button>
        <button type="button" className="btn" onClick={reset} disabled={doneCount === 0}>
          Clear all ticks
        </button>
        <label htmlFor="hide-done" style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', margin: 0 }}>
          <input
            id="hide-done"
            type="checkbox"
            checked={hideDone}
            onChange={(event) => setHideDone(event.target.checked)}
            style={{ width: 'auto' }}
          />
          Hide completed items
        </label>
      </div>

      <p className="progress-line" role="status">
        {doneCount} of {CHECKLIST.length} items checked
        {doneCount === CHECKLIST.length ? ', all done.' : '.'}
      </p>

      {groups.map((group) => {
        const visible = hideDone
          ? group.items.filter((item) => !ticked.has(item.id))
          : group.items;
        if (visible.length === 0) return null;

        return (
          <fieldset className="checklist-group" key={group.criterion}>
            {/* The legend gives every checkbox inside this group its criterion context
                when a screen reader enters the fieldset. */}
            <legend>
              <strong>{group.criterion}</strong> {group.criterionName}{' '}
              <span className={`badge badge-level-${group.level}`}>Level {group.level}</span>{' '}
              <span className="badge">WCAG {group.since}</span>
            </legend>

            {group.since === '2.1' ? (
              <p className="hint" style={{ marginBlockEnd: '0.5rem' }}>
                Added in WCAG 2.1: required by WCAG 2.1 AA and by the DOJ ADA Title II rule
                (2024), but outside the WCAG 2.0 reference in the 2017 Revised Section 508
                Standards.
              </p>
            ) : null}

            {visible.map((item) => {
              const pattern = item.patternId === undefined ? undefined : getPattern(item.patternId);
              return (
                <div className="checklist-item" key={item.id}>
                  <input
                    type="checkbox"
                    id={item.id}
                    checked={ticked.has(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                  <label htmlFor={item.id}>
                    {item.text}
                    {pattern !== undefined ? (
                      <span className="checklist-meta">
                        Demonstrated by{' '}
                        <a href={routeHref('patterns', pattern.id)}>{pattern.title}</a>
                      </span>
                    ) : null}
                  </label>
                </div>
              );
            })}
          </fieldset>
        );
      })}
    </>
  );
}
