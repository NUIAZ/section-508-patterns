/**
 * Pattern: data tables with real header semantics.
 *
 * The pattern is `<th scope="col">` and `<th scope="row">` on a table that carries data,
 * plus a `<caption>` naming what the table is about — so that a screen reader can prefix
 * every value with the headers that apply to it ("South, Q2, 1,022").
 *
 * What breaks without it: nothing visible. A first row that is bold and shaded reads as a
 * header to a sighted user by pure convention, and if every cell is a `<td>` that
 * convention is all there is. The screen-reader user hears "1,022" with no row and no
 * column — the data is entirely present and its meaning is entirely gone, which makes this
 * one of the few failures that is invisible to sighted review *and* to a keyboard sweep.
 * The second demo shows the opposite error, a layout table, which announces a grid
 * structure over content that has no rows and columns to speak of.
 *
 * Criteria demonstrated: SC 1.3.1 Info and Relationships (Level A) — the header/data
 * relationship must be programmatically determinable, not just visual; SC 1.3.2 Meaningful
 * Sequence (Level A) — a table read cell by cell has to still make sense in reading order;
 * SC 2.4.6 Headings and Labels (Level AA) — the caption and headers have to actually
 * describe what they label.
 *
 * `scope` is sufficient for a regular grid. Irregular tables with merged cells or stacked
 * header rows need explicit `headers`/`id` pairing, but splitting them into several simple
 * tables is nearly always the better answer.
 */

import type { ReactNode } from 'react';
import type { DemoProps, PatternMeta } from '../lib/types';

interface Row {
  readonly region: string;
  readonly q1: string;
  readonly q2: string;
  readonly q3: string;
}

const ROWS: readonly Row[] = [
  { region: 'North', q1: '1,204', q2: '1,338', q3: '1,411' },
  { region: 'South', q1: '980', q2: '1,022', q3: '1,190' },
  { region: 'East', q1: '1,455', q2: '1,390', q3: '1,502' },
  { region: 'West', q1: '766', q2: '812', q3: '905' },
];

/**
 * Data tables.
 *
 * A screen reader reads a table cell by cell and, when the headers are marked up, prefixes
 * each value with the headers that apply to it: "South, Q2, 1,022". Without `<th scope>`
 * the user hears "1,022" with no idea which row or column it belongs to — the data is
 * present and the meaning is gone.
 *
 * `scope="col"` and `scope="row"` are enough for a simple grid like this. Genuinely
 * irregular tables (merged cells, multiple header levels) need `headers`/`id` pairing, but
 * the far better answer is almost always to split the table into several simple ones.
 */
function Demo({ broken, idPrefix }: DemoProps): ReactNode {
  const captionId = `${idPrefix}-caption`;

  if (broken) {
    return (
      <div>
        <p style={{ marginTop: 0 }}>
          Two failures, both extremely common.
        </p>

        <h5>1. A data table with no header semantics</h5>
        {/* Every cell is a <td>. The first row LOOKS like a header because it is bold and
            shaded, which is a visual convention, not a semantic one. */}
        <div className="table-scroll">
          <table className="data-table" data-testid={`${idPrefix}-table`}>
            <tbody>
              <tr style={{ background: 'var(--surface-2)', fontWeight: 700 }}>
                <td>Region</td>
                <td>Q1</td>
                <td>Q2</td>
                <td>Q3</td>
              </tr>
              {ROWS.map((row) => (
                <tr key={row.region}>
                  <td style={{ fontWeight: 700 }}>{row.region}</td>
                  <td>{row.q1}</td>
                  <td>{row.q2}</td>
                  <td>{row.q3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h5>2. A layout table</h5>
        <p>
          A <code>&lt;table&gt;</code> used purely to place things side by side. A screen
          reader announces &ldquo;table with 1 row and 2 columns&rdquo; and then reads the
          cells in source order, which has nothing to do with the reading order the
          designer intended.
        </p>
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ width: '40%', verticalAlign: 'top', paddingInlineEnd: '1rem' }}>
                <strong>Sidebar-ish thing</strong>
                <p style={{ margin: 0 }}>Placed here with a table cell.</p>
              </td>
              <td style={{ verticalAlign: 'top' }}>
                <strong>Content-ish thing</strong>
                <p style={{ margin: 0 }}>
                  Use CSS grid or flexbox. There is no reason to lay out with tables in
                  2026, and if you inherit one, <code>role=&quot;presentation&quot;</code>{' '}
                  on the table removes the misleading semantics.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div className="table-scroll">
        <table className="data-table" data-testid={`${idPrefix}-table`} aria-describedby={captionId}>
          {/* <caption> is the table's accessible name and belongs to the table
              structurally. A heading above the table is *not* a substitute: it is not
              associated, and it does not appear when the user lists tables on the page. */}
          <caption id={captionId}>
            Units shipped by region, first three quarters
          </caption>
          <thead>
            <tr>
              {/* scope="col" tells the screen reader that this header applies down its
                  column. */}
              <th scope="col">Region</th>
              <th scope="col">Q1</th>
              <th scope="col">Q2</th>
              <th scope="col">Q3</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.region}>
                {/* The row header is a <th scope="row">, not a <td>. This is the one most
                    often missed — people remember the column headers and forget that the
                    first column is a header too. */}
                <th scope="row">{row.region}</th>
                <td>{row.q1}</td>
                <td>{row.q2}</td>
                <td>{row.q3}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="note" style={{ marginBlockStart: '0.75rem' }}>
        Navigate this with a screen reader&rsquo;s table keys (NVDA and JAWS:{' '}
        <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+arrows). Each cell should be announced with both its
        row and column header — &ldquo;South, Q2, 1,022&rdquo;.
      </p>
    </div>
  );
}

const SOURCE = `<table>
  {/* The caption IS the table's accessible name, and it appears in
      the screen reader's list-of-tables dialog. A heading above the
      table is not associated with it. */}
  <caption>Units shipped by region, first three quarters</caption>

  <thead>
    <tr>
      <th scope="col">Region</th>
      <th scope="col">Q1</th>
      <th scope="col">Q2</th>
      <th scope="col">Q3</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      {/* Row headers matter as much as column headers, and are the
          ones people forget. */}
      <th scope="row">North</th>
      <td>1,204</td><td>1,338</td><td>1,411</td>
    </tr>
  </tbody>
</table>

{/* Irregular tables (merged cells, two header rows) need explicit
    pairing. Prefer splitting into simple tables instead — this is
    fragile and almost never maintained correctly. */}
<th id="h-q1-units">Units</th>
<td headers="h-region-north h-q1 h-q1-units">1,204</td>

{/* A table used for layout, if you cannot remove it, must have its
    semantics suppressed so it is not announced as a data table: */}
<table role="presentation"> … </table>

{/* Responsive tables: do NOT set display:block / display:flex on
    table elements to make them stack — that DESTROYS the table
    semantics in the accessibility tree. Wrap it in a scroll
    container instead, and make the container focusable so a
    keyboard user can scroll it: */}
<div class="table-scroll" tabindex="0" role="region"
     aria-label="Units shipped by region">
  <table> … </table>
</div>`;

/**
 * Registry entry for the data-tables pattern. Its broken variant carries two failures
 * rather than one — a data table with no header semantics, and a layout table announcing
 * structure over content that has none — because they are opposite mistakes with the same
 * root cause: treating `<table>` as a visual arrangement instead of a set of relationships.
 * Claims SC 1.3.1 Info and Relationships (A), SC 1.3.2 Meaningful Sequence (A) and SC 2.4.6
 * Headings and Labels (AA).
 */
export const tablesPattern: PatternMeta = {
  id: 'tables',
  title: 'Data tables with real headers',
  problem:
    'A table without header semantics is a grid of numbers with the meaning stripped out. A sighted user reconstructs "which row, which column" from position in a fraction of a second; a screen-reader user, hearing one cell at a time, gets "1,022" and nothing else.',
  keywords: ['th scope', 'caption', 'layout table', 'role presentation', 'headers id', 'responsive table'],
  criteria: [
    {
      number: '1.3.1',
      name: 'Info and Relationships',
      level: 'A',
      since: '2.0',
      why: 'The row/column relationship is information conveyed through presentation. It must also be available programmatically, which is exactly what th and scope do.',
    },
    {
      number: '1.3.2',
      name: 'Meaningful Sequence',
      level: 'A',
      since: '2.0',
      why: 'A layout table forces a reading sequence that may not match the visual one. Once the visual arrangement carries meaning, the underlying order has to carry it too.',
    },
    {
      number: '2.4.6',
      name: 'Headings and Labels',
      level: 'AA',
      since: '2.0',
      why: 'The caption is the table’s label and must describe its topic or purpose. "Table 1" describes nothing.',
    },
  ],
  section508:
    'Incorporated by E205.4 via WCAG 2.0 A and AA. Worth knowing the history: the ORIGINAL 1998 Section 508 standards had explicit table provisions — §1194.22(g) "Row and column headers shall be identified for data tables" and (h) for multi-level headers. Those provisions were REPLACED by the 2017 refresh, which references WCAG instead. If you see a requirements document citing 1194.22(g), it is quoting the superseded standard. Functional Performance Criterion 302.1 Without Vision is what makes this concrete.',
  howToTest: {
    keyboard: [
      'Tables are not interactive, so there is nothing to Tab to — which is precisely why a keyboard-only test finds nothing wrong here.',
      'If the table scrolls horizontally, its scroll container must be focusable so a keyboard user can reach the right-hand columns. Tab to the table region and press the arrow keys.',
    ],
    screenReader: [
      'Accessible: "Units shipped by region, first three quarters, table with 5 rows and 4 columns."',
      'Moving cell to cell: "South, Q2, 1,022" — row header, column header, value.',
      'Broken: "1,022" alone. The number is there; the meaning is not.',
      'NVDA/JAWS table navigation: Ctrl+Alt+arrow keys. VoiceOver: Ctrl+Option+arrow keys inside the table.',
      'Both NVDA and JAWS can list all tables on a page (NVDA: press T; JAWS: press T). The caption is what appears in that list.',
    ],
  },
  source: SOURCE,
  brokenBehaviour:
    'The data table uses <td> for every cell with bold styling standing in for header semantics, and has no caption. A second example shows a layout table, which announces a table structure that means nothing.',
  Demo,
};
