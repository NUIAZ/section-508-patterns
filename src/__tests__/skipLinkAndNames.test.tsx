import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { skipLinkPattern } from '../patterns/skipLink';
import { accessibleNamePattern } from '../patterns/accessibleName';
import { speechInputPattern } from '../patterns/speechInput';
import { computeAccessibleName, getFocusable, FOCUSABLE_SELECTOR } from '../lib/focus';

describe('skip link demo', () => {
  it('is reachable and moves focus to the main-content target', async () => {
    const user = userEvent.setup();
    render(<skipLinkPattern.Demo broken={false} idPrefix="s" />);

    const skip = screen.getByRole('link', { name: /skip to main content/i });
    // It must be the first focusable thing in the fragment, ahead of all six nav links.
    const focusables = getFocusable(document.body);
    expect(focusables[0]).toBe(skip);

    await user.click(skip);
    const target = document.getElementById('s-main');
    expect(target).not.toBeNull();
    expect(target).toHaveFocus();
    // tabindex="-1" makes it focusable by script without adding a tab stop.
    expect(target).toHaveAttribute('tabindex', '-1');
  });

  it('the broken variant hides the link from the accessibility tree entirely', () => {
    render(<skipLinkPattern.Demo broken idPrefix="sb" />);

    // display:none means it is neither announced nor focusable; a scanner that only
    // checks "does a skip link exist in the HTML" would still be satisfied.
    expect(screen.queryByRole('link', { name: /skip to main content/i })).not.toBeInTheDocument();
    const stillInTheMarkup = document.body.textContent ?? '';
    expect(stillInTheMarkup).toContain('Skip to main content');
  });
});

describe('accessible names', () => {
  it('names every icon-only button in the accessible variant', () => {
    render(<accessibleNamePattern.Demo broken={false} idPrefix="n" />);

    for (const name of ['Bold', 'Italic', 'Insert link', 'Delete paragraph', 'Undo']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('leaves the icon-only buttons unnamed in the broken variant', () => {
    render(<accessibleNamePattern.Demo broken idPrefix="nb" />);

    expect(screen.queryByRole('button', { name: 'Bold' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete paragraph' })).not.toBeInTheDocument();
    // The visually-hidden-text button is correct in BOTH variants, and proves the
    // technique is the more robust of the two.
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('computes names from aria-label, labelledby, native labels and text content', () => {
    render(
      <div>
        <span id="ext-label">External label</span>
        <button type="button" aria-label="From aria-label" data-t="a" />
        <button type="button" aria-labelledby="ext-label" data-t="b" />
        <button type="button" data-t="c">
          From text content
        </button>
        <label htmlFor="native">Native label</label>
        <input id="native" type="text" />
        <button type="button" data-t="d" />
      </div>,
    );

    const byTest = (value: string): HTMLElement => {
      const element = document.querySelector<HTMLElement>(`[data-t="${value}"]`);
      if (element === null) throw new Error(`fixture [data-t="${value}"] not found`);
      return element;
    };

    expect(computeAccessibleName(byTest('a'))).toBe('From aria-label');
    expect(computeAccessibleName(byTest('b'))).toBe('External label');
    expect(computeAccessibleName(byTest('c'))).toBe('From text content');
    expect(computeAccessibleName(byTest('d'))).toBe('');

    const input = document.getElementById('native');
    if (!(input instanceof HTMLElement)) throw new Error('fixture input not found');
    expect(computeAccessibleName(input)).toBe('Native label');
  });
});

describe('Label in Name (SC 2.5.3)', () => {
  it('keeps the visible text inside the accessible name in the accessible variant', () => {
    render(<speechInputPattern.Demo broken={false} idPrefix="v" />);

    // "click Save" has to work, so "Save" must appear in the name.
    const save = screen.getByRole('button', { name: /save the application form/i });
    expect(save).toHaveTextContent('Save');
    expect(computeAccessibleName(save).toLowerCase()).toContain('save');

    // The safest button of all has no aria-label, so the two cannot possibly diverge.
    const previous = screen.getByRole('button', { name: /previous step/i });
    expect(computeAccessibleName(previous)).toContain('Previous step');
  });

  it('reports a failure row for every mismatched button in the broken variant', () => {
    render(<speechInputPattern.Demo broken idPrefix="vb" />);

    // The visible label "Save" does not appear in "Submit the application form", so voice
    // control cannot activate it.
    const save = screen.getByRole('button', { name: 'Submit the application form' });
    expect(save).toHaveTextContent('Save');
    expect(computeAccessibleName(save).toLowerCase()).not.toContain('save');

    expect(screen.getAllByText(/cannot be activated by voice/i).length).toBeGreaterThan(0);
  });
});

describe('focusable-element detection', () => {
  it('includes controls that are commonly forgotten and excludes tabindex="-1"', () => {
    render(
      <div>
        <a href="#x">link</a>
        <button type="button">button</button>
        <input type="text" aria-label="text" />
        <input type="hidden" value="nope" />
        <button type="button" disabled>
          disabled
        </button>
        <div tabIndex={0} role="button" aria-label="custom widget" />
        <div tabIndex={-1} data-t="programmatic-only" />
        <details>
          <summary>expandable</summary>
        </details>
        <textarea aria-label="notes" />
      </div>,
    );

    const focusable = getFocusable(document.body);
    const names = focusable.map((element) => element.tagName.toLowerCase());

    expect(names).toContain('a');
    expect(names).toContain('button');
    expect(names).toContain('input');
    expect(names).toContain('summary');
    expect(names).toContain('textarea');
    expect(names).toContain('div'); // the tabindex="0" custom widget

    // A disabled button, a hidden input, and a tabindex="-1" element are all excluded.
    expect(focusable.some((element) => element.hasAttribute('disabled'))).toBe(false);
    expect(focusable.some((element) => element.getAttribute('type') === 'hidden')).toBe(false);
    expect(focusable.some((element) => element.dataset.t === 'programmatic-only')).toBe(false);
  });

  it('excludes tabindex="-1" in the selector itself, not by filtering afterwards', () => {
    expect(FOCUSABLE_SELECTOR).toContain('[tabindex]:not([tabindex="-1"])');
    expect(FOCUSABLE_SELECTOR).toContain('button:not([disabled])');
  });
});
