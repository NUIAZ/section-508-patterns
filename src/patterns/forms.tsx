/**
 * Pattern: accessible form labelling, validation and error recovery.
 *
 * The pattern is the full round trip, not just labelling: `<label for>` bound to each
 * control, format hints exposed through `aria-describedby` *before* the user types,
 * required state carried by the `required` attribute rather than a red asterisk, errors
 * announced in text and linked to their field with `aria-invalid` plus `aria-describedby`,
 * and a submit failure that moves focus to a summary of every problem.
 *
 * What breaks without it: this is the pattern where partial credit is most dangerous. A
 * form with placeholder-only labels looks finished, passes a click-through, and strands a
 * screen-reader user with an unnamed edit box the moment they start typing and the
 * placeholder disappears. A form that shows errors visually but never associates them
 * announces "invalid" with no reason, or nothing at all, and the user is left hunting for
 * which of eight fields is the problem.
 *
 * Criteria demonstrated: more than any other pattern here, which is why forms account for
 * so many audit findings: SC 1.3.1 Info and Relationships (A) for the label/control
 * association; SC 3.3.2 Labels or Instructions (A); SC 3.3.1 Error Identification (A);
 * SC 3.3.3 Error Suggestion (AA), which requires saying how to fix it and not merely that
 * it is wrong; SC 1.4.1 Use of Color (A) for required and error state; SC 4.1.2 Name, Role,
 * Value (A); SC 2.4.6 Headings and Labels (AA); and SC 1.3.5 Identify Input Purpose (AA,
 * added in WCAG 2.1) for `autocomplete` on fields about the user themselves.
 */

import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { DemoProps, PatternMeta } from '../lib/types';

interface Values {
  readonly fullName: string;
  readonly email: string;
  readonly reference: string;
}

type Errors = Partial<Record<keyof Values, string>>;

const EMPTY: Values = { fullName: '', email: '', reference: '' };

/**
 * Accessible form with error handling.
 *
 * Five separate things have to be right, and most forms get two or three:
 *
 *  1. **Label association.** `<label for>` pointing at the control's `id`. Not a
 *     placeholder, not a nearby `<span>`, not `aria-label` duplicating visible text.
 *  2. **Instructions before input.** Format hints belong in `aria-describedby`, so they
 *     are read as part of the field rather than discovered after the failure.
 *  3. **Required indication that is not colour-only.** A red asterisk alone is invisible
 *     to a screen reader and to anyone who cannot see red. Use the word, plus `required`.
 *  4. **Errors identified in text and associated with the field.** `aria-invalid="true"`
 *     plus the error message id appended to `aria-describedby`.
 *  5. **An error summary that takes focus.** On submit failure, focus moves to a summary
 *     listing every problem, each item a link to its field. This is what a screen-reader
 *     user needs: otherwise they are told "the form did not submit" and left to hunt.
 */
function Demo({ broken, idPrefix }: DemoProps): ReactNode {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const summaryRef = useRef<HTMLDivElement | null>(null);

  const id = (field: string): string => `${idPrefix}-${field}`;

  const validate = (candidate: Values): Errors => {
    const next: Errors = {};
    if (candidate.fullName.trim() === '') {
      next.fullName = 'Enter your full name.';
    }
    if (candidate.email.trim() === '') {
      next.email = 'Enter an email address.';
    } else if (!candidate.email.includes('@')) {
      // SC 3.3.3 Error Suggestion (AA): say what is wrong AND how to fix it, when the fix
      // is known. "Invalid input" fails; "must include an @" passes.
      next.email = 'Enter an email address in the form name@example.com; it must include an @.';
    }
    if (candidate.reference.trim() !== '' && !/^[A-Z]{2}-\d{4}$/.test(candidate.reference.trim())) {
      next.reference = 'Reference must be two capital letters, a hyphen, then four digits, like AB-1234.';
    }
    return next;
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    setSubmitted(true);

    if (Object.keys(found).length > 0 && !broken) {
      // Focus the summary *after* React has painted it. A queueMicrotask/timeout of 0 is
      // the pragmatic way to do this without a layout effect that fights React 19's
      // concurrent rendering.
      window.setTimeout(() => summaryRef.current?.focus(), 0);
    }
  };

  const errorEntries = (Object.keys(errors) as Array<keyof Values>).filter(
    (key) => errors[key] !== undefined,
  );
  const hasErrors = errorEntries.length > 0;
  const succeeded = submitted && !hasErrors;

  const FIELD_LABELS: Record<keyof Values, string> = {
    fullName: 'Full name',
    email: 'Email address',
    reference: 'Case reference',
  };

  return (
    <form onSubmit={onSubmit} noValidate data-testid={`${idPrefix}-form`}>
      {/* ── ERROR SUMMARY ─────────────────────────────────────────────── */}
      {submitted && hasErrors ? (
        broken ? (
          // BROKEN: no role, not focusable, focus is not moved. The submit button stays
          // focused and a screen-reader user is told nothing whatsoever.
          <div style={{ color: 'var(--danger)', fontWeight: 700, marginBlockEnd: '1rem' }}>
            Please fix the errors below.
          </div>
        ) : (
          <div
            ref={summaryRef}
            data-testid={`${idPrefix}-summary`}
            // tabindex="-1" so it can be focused by script but is not a permanent tab stop.
            tabIndex={-1}
            // role="alert" makes it announce even in the rare case focus does not land
            // here; the aria-labelledby names it when it does.
            role="alert"
            aria-labelledby={id('summary-heading')}
            style={{
              border: '2px solid var(--danger)',
              borderRadius: 'var(--radius)',
              padding: '0.75rem 1rem',
              marginBlockEnd: '1rem',
            }}
          >
            <h5 id={id('summary-heading')} style={{ marginTop: 0, color: 'var(--danger)' }}>
              There {errorEntries.length === 1 ? 'is 1 problem' : `are ${errorEntries.length} problems`} with this form
            </h5>
            <ul style={{ marginBlockEnd: 0 }}>
              {errorEntries.map((key) => (
                <li key={key}>
                  {/* Each summary item links to the field, so activating it moves focus
                      straight to the input that needs fixing. */}
                  <a
                    href={`#${id(key)}`}
                    onClick={(event) => {
                      event.preventDefault();
                      document.getElementById(id(key))?.focus();
                    }}
                  >
                    {errors[key]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : null}

      {succeeded ? (
        <p role="status" style={{ color: 'var(--success)', fontWeight: 700 }}>
          ✓ Submitted successfully.
        </p>
      ) : null}

      <p className="hint" style={{ marginTop: 0 }}>
        {broken ? (
          <span style={{ color: 'var(--danger)' }}>
            Fields marked <span aria-hidden="true">*</span> are required.
          </span>
        ) : (
          'Fields marked “(required)” must be completed.'
        )}
      </p>

      {/* ── FULL NAME ─────────────────────────────────────────────────── */}
      <div className="field">
        {broken ? (
          // BROKEN: the placeholder is the only label. It vanishes on first keystroke, it
          // is typically too low-contrast, it is not a reliable accessible name, and a
          // user who tabs back to review has no idea what the field was for.
          <input
            id={id('fullName')}
            type="text"
            placeholder="Full name *"
            value={values.fullName}
            onChange={(e) => setValues({ ...values, fullName: e.target.value })}
            style={errors.fullName !== undefined ? { borderColor: 'var(--danger)' } : undefined}
          />
        ) : (
          <>
            <label htmlFor={id('fullName')}>
              Full name <span className="hint" style={{ display: 'inline' }}>(required)</span>
            </label>
            <input
              id={id('fullName')}
              type="text"
              required
              value={values.fullName}
              // aria-invalid must be present only when there IS an error. Hard-coding
              // aria-invalid="false" everywhere is harmless; hard-coding "true" is not.
              aria-invalid={errors.fullName !== undefined ? true : undefined}
              aria-describedby={errors.fullName !== undefined ? id('fullName-error') : undefined}
              onChange={(e) => setValues({ ...values, fullName: e.target.value })}
            />
            {errors.fullName !== undefined ? (
              <span className="field-error" id={id('fullName-error')}>
                <span aria-hidden="true">✕ </span>
                {errors.fullName}
              </span>
            ) : null}
          </>
        )}
      </div>

      {/* ── EMAIL ─────────────────────────────────────────────────────── */}
      <div className="field">
        {broken ? (
          <>
            {/* BROKEN: a label-shaped <span> with no `for`. Visually identical, and
                completely unassociated: clicking it does not focus the field, and a
                screen reader announces the input as "edit, blank". */}
            <span style={{ fontWeight: 600, display: 'block' }}>Email address *</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              We will only use this to reply.
            </span>
            <input
              id={id('email')}
              type="text"
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
              style={errors.email !== undefined ? { borderColor: 'var(--danger)' } : undefined}
            />
            {errors.email !== undefined ? (
              // BROKEN: the message is adjacent in the visual layout only. Nothing
              // connects it to the input, so it is never read with the field.
              <span style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{errors.email}</span>
            ) : null}
          </>
        ) : (
          <>
            <label htmlFor={id('email')}>
              Email address <span className="hint" style={{ display: 'inline' }}>(required)</span>
            </label>
            <span className="hint" id={id('email-hint')}>
              We will only use this to reply. Format: name@example.com
            </span>
            <input
              id={id('email')}
              type="email"
              required
              // autocomplete is SC 1.3.5 Identify Input Purpose (AA, WCAG 2.1): it lets
              // the browser fill the field and lets personalisation tools swap in icons or
              // simpler wording.
              autoComplete="email"
              aria-invalid={errors.email !== undefined ? true : undefined}
              // Both ids, space-separated: the hint stays available *and* the error is
              // added. Replacing the hint with the error loses the format guidance exactly
              // when the user needs it most.
              aria-describedby={
                errors.email !== undefined
                  ? `${id('email-hint')} ${id('email-error')}`
                  : id('email-hint')
              }
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
            />
            {errors.email !== undefined ? (
              <span className="field-error" id={id('email-error')}>
                <span aria-hidden="true">✕ </span>
                {errors.email}
              </span>
            ) : null}
          </>
        )}
      </div>

      {/* ── CASE REFERENCE (optional, format-constrained) ─────────────── */}
      <div className="field">
        {broken ? (
          <input
            id={id('reference')}
            type="text"
            placeholder="Case reference"
            value={values.reference}
            onChange={(e) => setValues({ ...values, reference: e.target.value })}
          />
        ) : (
          <>
            <label htmlFor={id('reference')}>Case reference</label>
            <span className="hint" id={id('reference-hint')}>
              Optional. Two capital letters, a hyphen, then four digits, for example
              AB-1234.
            </span>
            <input
              id={id('reference')}
              type="text"
              aria-invalid={errors.reference !== undefined ? true : undefined}
              aria-describedby={
                errors.reference !== undefined
                  ? `${id('reference-hint')} ${id('reference-error')}`
                  : id('reference-hint')
              }
              value={values.reference}
              onChange={(e) => setValues({ ...values, reference: e.target.value })}
            />
            {errors.reference !== undefined ? (
              <span className="field-error" id={id('reference-error')}>
                <span aria-hidden="true">✕ </span>
                {errors.reference}
              </span>
            ) : null}
          </>
        )}
      </div>

      <button type="submit" className="btn btn-primary">
        Submit
      </button>{' '}
      <button
        type="button"
        className="btn"
        onClick={() => {
          setValues(EMPTY);
          setErrors({});
          setSubmitted(false);
        }}
      >
        Reset
      </button>

      <p className="hint" style={{ marginBlockEnd: 0 }}>
        Submit with the fields empty to see the error handling. {FIELD_LABELS.fullName} and{' '}
        {FIELD_LABELS.email} are required.
      </p>
    </form>
  );
}

const SOURCE = `{/* 1. Label association: <label for> ↔ id. Nothing else. */}
<label for="email">
  Email address <span class="hint">(required)</span>
</label>

{/* 2. Instructions BEFORE the input, wired with aria-describedby
      so they are announced as part of the field. */}
<span class="hint" id="email-hint">
  We will only use this to reply. Format: name@example.com
</span>

<input id="email"
       type="email"
       required
       autocomplete="email"              {/* SC 1.3.5 (AA, WCAG 2.1) */}
       aria-invalid={hasError || undefined}
       {/* Keep the hint AND add the error. Space-separated id list,
           in the order you want them read. */}
       aria-describedby={hasError ? "email-hint email-error" : "email-hint"} />

{hasError && (
  <span class="field-error" id="email-error">
    <span aria-hidden="true">✕ </span>
    Enter an email address in the form name@example.com; it must include an @.
  </span>
)}

{/* 3. Error summary that TAKES FOCUS on submit failure. */}
<div ref={summaryRef} tabindex="-1" role="alert"
     aria-labelledby="summary-heading">
  <h2 id="summary-heading">There are 2 problems with this form</h2>
  <ul>
    <li><a href="#email" onClick={focusField}>Enter an email address.</a></li>
  </ul>
</div>

function onSubmit(e) {
  e.preventDefault();
  const errs = validate(values);
  setErrors(errs);
  if (Object.keys(errs).length) {
    // After paint, so the summary exists to receive focus.
    setTimeout(() => summaryRef.current.focus(), 0);
  }
}

/* Required indication that is not colour-only:
     ✅ the word "(required)" in the label, plus the required attribute
     ✅ "All fields are required unless marked optional"
     ❌ a red asterisk and nothing else
   If you must use an asterisk, keep the required attribute AND
   explain the convention in text before the first field. */

/* Anti-patterns, all of which look fine to a sighted mouse user:
     ❌ placeholder as the only label
     ❌ a <span> styled to look like a label, with no for=
     ❌ aria-label that differs from the visible label (breaks 2.5.3)
     ❌ "Invalid input" with no explanation of what would be valid
     ❌ errors announced only by turning the border red
     ❌ title="…" as the label, hover-only, and unreliable */`;

/**
 * Registry entry for the forms pattern. It cites eight success criteria, more than any
 * other card here, which is not padding: a form is where labelling, instructions, error
 * identification, error suggestion, colour independence, naming, heading quality and input
 * purpose all have to be right at once, and getting seven of the eight still leaves a user
 * stuck. See the file header for the criterion-by-criterion breakdown.
 */
export const formsPattern: PatternMeta = {
  id: 'forms',
  title: 'Form labels, instructions, and errors',
  problem:
    'Forms are where accessibility failures become expensive, because a form is usually the point of the whole page. An unlabelled field is announced as "edit, blank"; a validation error shown only as a red border is invisible; and a failed submit that leaves focus on the button gives a screen-reader user no idea anything went wrong.',
  keywords: [
    'label for',
    'aria-describedby',
    'aria-invalid',
    'error summary',
    'required',
    'placeholder',
    'autocomplete',
    'validation',
  ],
  criteria: [
    {
      number: '1.3.1',
      name: 'Info and Relationships',
      level: 'A',
      since: '2.0',
      why: 'The relationship between a label, its hint, its error message, and the input must be programmatic, not just visual proximity. That is what for/id and aria-describedby encode.',
    },
    {
      number: '3.3.2',
      name: 'Labels or Instructions',
      level: 'A',
      since: '2.0',
      why: 'Labels or instructions are provided when content requires user input. The format hint for the case reference is the instruction half of this criterion.',
    },
    {
      number: '3.3.1',
      name: 'Error Identification',
      level: 'A',
      since: '2.0',
      why: 'If an input error is detected, the item in error is identified and described to the user in text. A red border alone identifies nothing in text.',
    },
    {
      number: '3.3.3',
      name: 'Error Suggestion',
      level: 'AA',
      since: '2.0',
      why: 'When you know how to fix it, say so. "Enter an email address in the form name@example.com" passes; "Invalid email" does not.',
    },
    {
      number: '1.4.1',
      name: 'Use of Color',
      level: 'A',
      since: '2.0',
      why: 'Required fields and errored fields must be identifiable without perceiving colour. Hence the word "(required)" and the ✕ glyph beside the message.',
    },
    {
      number: '4.1.2',
      name: 'Name, Role, Value',
      level: 'A',
      since: '2.0',
      why: 'aria-invalid is the programmatic "value" of the field’s validity state, so assistive technology can announce "invalid entry" when the user returns to the field.',
    },
    {
      number: '1.3.5',
      name: 'Identify Input Purpose',
      level: 'AA',
      since: '2.1',
      why: 'autocomplete="email" identifies the purpose of the field from the standard token list, which enables autofill and personalisation tools.',
    },
    {
      number: '2.4.6',
      name: 'Headings and Labels',
      level: 'AA',
      since: '2.0',
      why: 'Labels must describe the purpose. "Reference" is worse than "Case reference"; "Enter text here" is worthless.',
    },
  ],
  section508:
    'The 2.0-era criteria here (1.3.1, 3.3.1, 3.3.2, 3.3.3, 1.4.1, 4.1.2, 2.4.6) are all incorporated by E205.4 for content and 502/503 for software. SC 1.3.5 Identify Input Purpose is a WCAG 2.1 addition and is therefore NOT part of the 2017 Revised 508 Standards; it is included here because it is required by WCAG 2.1 AA and is genuinely useful. Functional Performance Criteria that bear on forms: 302.1 Without Vision, 302.3 Without Perception of Color (the required-field indicator), and 302.9 With Limited Language, Cognitive, and Learning Abilities (error messages that explain the fix rather than restating that something is wrong).',
  howToTest: {
    keyboard: [
      'Tab through the form. Each field should announce its label; in the broken version they announce nothing useful.',
      'Click the visible "Email address" text. In the accessible version this focuses the input (that is what a real <label> does); in the broken version nothing happens.',
      'Leave everything empty and press Enter on Submit.',
      'Focus should jump to the error summary at the top of the form.',
      'Tab to the first error link and press Enter: focus moves to the field that needs fixing.',
      'Type an email without an @ and submit again. The message should tell you what would be valid.',
    ],
    screenReader: [
      'Accessible: "Email address (required), edit, We will only use this to reply. Format: name at example dot com".',
      'After a failed submit: "There are 2 problems with this form" read immediately, because focus moved there.',
      'Returning to the errored field: "Email address, invalid entry, edit, … Enter an email address in the form name@example.com".',
      'Broken: "edit, blank" for every field, and after submitting, silence.',
    ],
  },
  source: SOURCE,
  brokenBehaviour:
    'Labels become placeholders or unassociated spans, error messages are visually adjacent but not linked by aria-describedby, aria-invalid is never set, required is shown by a red asterisk only, and the error summary neither announces nor takes focus.',
  Demo,
};
