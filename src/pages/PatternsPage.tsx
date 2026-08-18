/**
 * The patterns page: the main body of the site.
 *
 * Almost nothing happens here on purpose: the page owns no state, does no filtering, and
 * renders one `PatternCard` per entry it is handed. Search lives in `App`, the accessible
 * behaviour lives in each pattern's own `Demo`, and this file is only the frame. Keeping it
 * that thin is what lets the card and the demo be tested in isolation.
 *
 * The one thing it does own is the empty state. A filter that matches nothing must say so
 * in text and offer a way back; silently rendering nothing leaves a screen-reader user
 * with no signal that anything happened, and leaves everyone else wondering whether the
 * page is broken or the query was.
 */

import type { ReactNode } from 'react';
import type { PatternMeta } from '../lib/types';
import { PatternCard } from '../components/PatternCard';

interface PatternsPageProps {
  readonly patterns: readonly PatternMeta[];
  readonly total: number;
  readonly query: string;
  readonly onClearQuery: () => void;
}

/**
 * Renders the pattern list, or the empty state when the filter matches nothing.
 *
 * `patterns` is the already-filtered set and `total` the unfiltered count; both are needed
 * because "3 patterns" and "3 of 16 patterns" are different sentences and only the caller
 * knows which one is true.
 */
export function PatternsPage({
  patterns,
  total,
  query,
  onClearQuery,
}: PatternsPageProps): ReactNode {
  return (
    <>
      <h2>Patterns</h2>
      <p>
        {total} accessibility patterns, each with a working implementation you can operate,
        a deliberately broken version you can experience failing, the source, the WCAG 2.1
        success criteria it satisfies, how that maps to Section 508, and how to test it
        yourself.
      </p>
      <p className="note">
        <strong>Start here:</strong> put your mouse down. Press <kbd>Tab</kbd> from the top
        of this page. Everything on this site is built to be operated that way, and each
        card&rsquo;s &ldquo;Broken&rdquo; toggle shows you what happens when it is not.
      </p>

      {patterns.length === 0 ? (
        <div className="note note-warning">
          <p style={{ margin: '0 0 0.5rem' }}>
            No patterns match &ldquo;{query}&rdquo;.
          </p>
          <button type="button" className="btn btn-small" onClick={onClearQuery}>
            Clear the filter
          </button>
        </div>
      ) : (
        patterns.map((pattern) => <PatternCard key={pattern.id} pattern={pattern} />)
      )}
    </>
  );
}
