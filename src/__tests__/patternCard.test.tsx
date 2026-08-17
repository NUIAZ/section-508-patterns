import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatternCard } from '../components/PatternCard';
import { accessibleNamePattern } from '../patterns/accessibleName';
import { skipLinkPattern } from '../patterns/skipLink';
import { PATTERNS } from '../patterns';

describe('pattern card', () => {
  it('renders the title, problem, criteria, 508 mapping and testing notes', () => {
    render(<PatternCard pattern={skipLinkPattern} />);

    expect(screen.getByRole('heading', { name: skipLinkPattern.title })).toBeInTheDocument();
    // The card is named by its own heading, so a screen reader announces what it entered.
    expect(screen.getByRole('article')).toHaveAccessibleName(skipLinkPattern.title);

    // Exact string match, so this finds the criterion badge and not the prose in the 508
    // mapping paragraph that also mentions SC 2.4.1.
    expect(screen.getByText('2.4.1')).toHaveClass('criterion-number');
    expect(screen.getByText('Bypass Blocks')).toBeInTheDocument();
    expect(screen.getByText(/E205\.4/)).toBeInTheDocument();
    expect(screen.getByText(/how to test it/i)).toBeInTheDocument();
  });

  it('offers the fixed/broken choice as a real, labelled radio group', () => {
    render(<PatternCard pattern={skipLinkPattern} />);

    const group = screen.getByRole('group', { name: 'Version' });
    const radios = within(group).getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(screen.getByRole('radio', { name: 'Accessible' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Broken' })).not.toBeChecked();
  });

  /**
   * The point of the whole site: the toggle must genuinely change the rendered markup, not
   * merely restyle it. Here the accessible variant names its icon-only buttons and the
   * broken one does not, so the assertion is about the accessibility tree rather than
   * about classes.
   */
  it('actually changes the rendered markup when switched to the broken version', async () => {
    const user = userEvent.setup();
    render(<PatternCard pattern={accessibleNamePattern} />);

    const stage = screen.getByTestId(`demo-${accessibleNamePattern.id}`);
    expect(stage).toHaveAttribute('data-variant', 'fixed');
    expect(within(stage).getByRole('button', { name: 'Delete paragraph' })).toBeInTheDocument();
    expect(screen.queryByText(/broken on purpose/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Broken' }));

    expect(stage).toHaveAttribute('data-variant', 'broken');
    // The named button is gone — the same component, with the naming removed.
    expect(within(stage).queryByRole('button', { name: 'Delete paragraph' })).not.toBeInTheDocument();
    // …and an explanation of what was sabotaged appears, in text.
    expect(screen.getByText(/broken on purpose/i)).toBeInTheDocument();
    expect(screen.getByText(accessibleNamePattern.brokenBehaviour)).toBeInTheDocument();
  });

  it('announces the variant change in a live region', async () => {
    const user = userEvent.setup();
    render(<PatternCard pattern={skipLinkPattern} />);

    expect(screen.getByText('Showing the accessible version.')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Broken' }));
    expect(screen.getByText('Showing the broken version.')).toBeInTheDocument();
  });

  it('exposes the source block as a keyboard-scrollable, named region', () => {
    render(<PatternCard pattern={skipLinkPattern} />);

    const region = screen.getByRole('region', {
      name: `Source code for the ${skipLinkPattern.title} pattern`,
    });
    // Without tabindex a keyboard-only user cannot scroll a wide snippet at all.
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region.tagName).toBe('PRE');
  });
});

describe('pattern registry integrity', () => {
  it('has sixteen patterns with unique ids', () => {
    expect(PATTERNS).toHaveLength(16);
    const ids = PATTERNS.map((pattern) => pattern.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every pattern at least one criterion, a 508 mapping, and testing notes', () => {
    for (const pattern of PATTERNS) {
      expect(pattern.criteria.length, `${pattern.id} has no criteria`).toBeGreaterThan(0);
      expect(pattern.section508.length, `${pattern.id} has no 508 mapping`).toBeGreaterThan(40);
      expect(pattern.howToTest.keyboard.length).toBeGreaterThan(0);
      expect(pattern.howToTest.screenReader.length).toBeGreaterThan(0);
      expect(pattern.source.length).toBeGreaterThan(50);
      expect(pattern.brokenBehaviour.length).toBeGreaterThan(20);
    }
  });

  it('uses only well-formed criterion numbers, levels and versions', () => {
    for (const pattern of PATTERNS) {
      for (const criterion of pattern.criteria) {
        expect(criterion.number, `${pattern.id}: ${criterion.number}`).toMatch(/^\d\.\d\.\d{1,2}$/);
        expect(['A', 'AA', 'AAA']).toContain(criterion.level);
        expect(['2.0', '2.1', '2.2']).toContain(criterion.since);
        expect(criterion.why.length).toBeGreaterThan(20);
      }
    }
  });

  /**
   * A criterion number must always carry the same name, level and version wherever it is
   * cited. This is the guard against the most embarrassing possible bug in a reference
   * about accuracy: the same criterion labelled "AA" on one card and "A" on another.
   */
  it('cites each criterion consistently across every pattern', () => {
    const seen = new Map<string, { name: string; level: string; since: string }>();
    for (const pattern of PATTERNS) {
      for (const criterion of pattern.criteria) {
        const previous = seen.get(criterion.number);
        if (previous === undefined) {
          seen.set(criterion.number, {
            name: criterion.name,
            level: criterion.level,
            since: criterion.since,
          });
        } else {
          expect(previous.name, `name mismatch for ${criterion.number}`).toBe(criterion.name);
          expect(previous.level, `level mismatch for ${criterion.number}`).toBe(criterion.level);
          expect(previous.since, `version mismatch for ${criterion.number}`).toBe(criterion.since);
        }
      }
    }
  });
});
