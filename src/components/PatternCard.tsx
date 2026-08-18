import { useId, useState, type ReactNode } from 'react';
import type { PatternMeta } from '../lib/types';
import { CodeBlock } from './CodeBlock';

interface PatternCardProps {
  readonly pattern: PatternMeta;
}

/**
 * The card every pattern is rendered into.
 *
 * The structure is fixed on purpose: name, problem, live demo, broken toggle, source,
 * criteria, how to test. A consistent shape means a returning visitor knows where the
 * "how do I test this" note is without hunting, which is itself an accessibility property
 * (predictable structure: the spirit of SC 3.2.3 Consistent Navigation, AA).
 *
 * Implementation notes:
 *  - The fixed/broken switch is a real radio group in a fieldset with a legend. It could
 *    have been two <button>s with aria-pressed, but radios are the semantically correct
 *    control for "pick exactly one of these" and get arrow-key navigation, grouping, and
 *    the "1 of 2" announcement for free. Reaching for native elements first is the whole
 *    lesson.
 *  - Switching to the broken variant announces the change through a live region, because
 *    for a screen-reader user the *visual* red dashed border communicates nothing.
 *  - The demo is keyed on the variant so React unmounts and remounts it. That guarantees
 *    the broken version starts from a clean state rather than inheriting focus or open
 *    dialogs from the working one.
 */
export function PatternCard({ pattern }: PatternCardProps): ReactNode {
  const [broken, setBroken] = useState(false);
  const groupName = useId();
  const titleId = `${pattern.id}-title`;

  return (
    <article className="pattern-card" id={pattern.id} aria-labelledby={titleId}>
      <h3 id={titleId}>{pattern.title}</h3>
      <p className="pattern-problem">{pattern.problem}</p>

      <h4 className="pattern-section-heading" id={`${pattern.id}-demo-heading`}>
        Live demo
      </h4>

      <fieldset className="variant-switch">
        <legend>Version</legend>
        <label className="variant-option" htmlFor={`${groupName}-fixed`}>
          <input
            type="radio"
            id={`${groupName}-fixed`}
            name={groupName}
            checked={!broken}
            onChange={() => setBroken(false)}
          />
          Accessible
        </label>
        <label className="variant-option" htmlFor={`${groupName}-broken`}>
          <input
            type="radio"
            id={`${groupName}-broken`}
            name={groupName}
            checked={broken}
            onChange={() => setBroken(true)}
          />
          Broken
        </label>
      </fieldset>

      {/* Politeness matters here: this is a confirmation of something the user just did,
          so "polite" is right. "assertive" would interrupt them mid-sentence for news
          they already expected. */}
      <p className="sr-only" role="status">
        {broken ? 'Showing the broken version.' : 'Showing the accessible version.'}
      </p>

      <div
        className="demo-stage"
        data-variant={broken ? 'broken' : 'fixed'}
        data-testid={`demo-${pattern.id}`}
      >
        <pattern.Demo key={broken ? 'broken' : 'fixed'} broken={broken} idPrefix={`${pattern.id}-${broken ? 'b' : 'f'}`} />
      </div>

      {broken ? (
        <p className="broken-banner">
          <strong>Broken on purpose.</strong>
          <span>{pattern.brokenBehaviour}</span>
        </p>
      ) : null}

      <h4 className="pattern-section-heading">Source</h4>
      <CodeBlock code={pattern.source} label={`Source code for the ${pattern.title} pattern`} />

      <h4 className="pattern-section-heading">Criteria this satisfies</h4>
      <ul className="criteria-list">
        {pattern.criteria.map((criterion) => (
          <li key={criterion.number}>
            <div className="criterion-head">
              <span className="criterion-number">{criterion.number}</span>
              <span>{criterion.name}</span>
              <span className={`badge badge-level-${criterion.level}`}>
                {/* The visible text is "Level AA"; the AAA badge is also italic and
                    unfilled, so level is never signalled by colour alone. */}
                Level {criterion.level}
              </span>
              <span className="badge">WCAG {criterion.since}</span>
            </div>
            <p className="criterion-why">{criterion.why}</p>
          </li>
        ))}
      </ul>

      <h4 className="pattern-section-heading">Section 508 mapping</h4>
      <p className="note">{pattern.section508}</p>

      <h4 className="pattern-section-heading">How to test it</h4>
      <p>
        <strong>With the keyboard</strong>: put focus in the demo above and:
      </p>
      <ol>
        {pattern.howToTest.keyboard.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
      <p>
        <strong>With a screen reader</strong>: you should hear:
      </p>
      <ul>
        {pattern.howToTest.screenReader.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ul>
    </article>
  );
}
