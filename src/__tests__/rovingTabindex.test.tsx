import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { rovingTabindexPattern } from '../patterns/rovingTabindex';

const Demo = rovingTabindexPattern.Demo;

describe('roving tabindex toolbar', () => {
  it('presents exactly one tab stop across the whole toolbar', () => {
    render(<Demo broken={false} idPrefix="r" />);

    const toolbar = screen.getByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');
    expect(buttons).toHaveLength(6);

    const tabbable = buttons.filter((button) => button.getAttribute('tabindex') === '0');
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toBe(buttons[0]);
    buttons.slice(1).forEach((button) => {
      expect(button).toHaveAttribute('tabindex', '-1');
    });
  });

  it('moves focus and the tab stop together with the arrow keys', () => {
    render(<Demo broken={false} idPrefix="r" />);
    const toolbar = screen.getByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');

    fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
    expect(buttons[1]).toHaveFocus();
    expect(buttons[1]).toHaveAttribute('tabindex', '0');
    expect(buttons[0]).toHaveAttribute('tabindex', '-1');

    fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
    expect(buttons[2]).toHaveFocus();

    fireEvent.keyDown(toolbar, { key: 'ArrowLeft' });
    expect(buttons[1]).toHaveFocus();
  });

  it('wraps at both ends and supports Home and End', () => {
    render(<Demo broken={false} idPrefix="r" />);
    const toolbar = screen.getByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');

    fireEvent.keyDown(toolbar, { key: 'ArrowLeft' });
    expect(buttons[5]).toHaveFocus();

    fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
    expect(buttons[0]).toHaveFocus();

    fireEvent.keyDown(toolbar, { key: 'End' });
    expect(buttons[5]).toHaveFocus();

    fireEvent.keyDown(toolbar, { key: 'Home' });
    expect(buttons[0]).toHaveFocus();
  });

  it('does not steal focus on mount', () => {
    render(<Demo broken={false} idPrefix="r" />);
    // Nothing was pressed yet, so focus must still be on the body.
    expect(document.body).toHaveFocus();
  });

  it('names every toolbar button and reports its pressed state', () => {
    render(<Demo broken={false} idPrefix="r" />);
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toHaveAccessibleName('Text formatting');

    const alignLeft = within(toolbar).getByRole('button', { name: 'Align left' });
    expect(alignLeft).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(alignLeft);
    expect(alignLeft).toHaveAttribute('aria-pressed', 'true');
  });

  it('the broken variant claims the toolbar role with nothing focusable inside it', () => {
    render(<Demo broken idPrefix="rb" />);
    const toolbar = screen.getByRole('toolbar');
    const items = within(toolbar).getAllByRole('button');

    expect(items).toHaveLength(6);
    items.forEach((item) => {
      expect(item).not.toHaveAttribute('tabindex');
    });

    // Arrow keys are not handled at all in the broken variant.
    fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
    expect(document.body).toHaveFocus();
  });
});
