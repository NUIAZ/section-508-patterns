import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customControlsPattern } from '../patterns/customControls';

const Demo = customControlsPattern.Demo;

describe('custom switch built from a div', () => {
  it('exposes role, tab stop, name and checked state', () => {
    render(<Demo broken={false} idPrefix="s" />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('tabindex', '0');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(toggle).toHaveAccessibleName('Email notifications');
  });

  it('toggles on Space and on Enter, and keeps aria-checked in step', () => {
    render(<Demo broken={false} idPrefix="s" />);
    const toggle = screen.getByRole('switch');
    toggle.focus();

    fireEvent.keyDown(toggle, { key: ' ' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(toggle, { key: 'Enter' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    // A key with no meaning for this control must not change anything.
    fireEvent.keyDown(toggle, { key: 'a' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('mirrors its state in visible text, so it is not conveyed by position alone', () => {
    render(<Demo broken={false} idPrefix="s" />);
    expect(screen.getByText('Off')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('switch'), { key: ' ' });
    expect(screen.getByText('On')).toBeInTheDocument();
  });

  it('the broken variant has no switch role at all', () => {
    render(<Demo broken idPrefix="sb" />);
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});

describe('menu button built from divs', () => {
  it('reports its expanded state on the trigger', async () => {
    const user = userEvent.setup();
    render(<Demo broken={false} idPrefix="m" />);

    const trigger = screen.getByRole('button', { name: /actions/i });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toHaveAccessibleName('Project actions');
  });

  it('moves focus between menu items with the arrow keys and closes on Escape', async () => {
    const user = userEvent.setup();
    render(<Demo broken={false} idPrefix="m" />);

    const trigger = screen.getByRole('button', { name: /actions/i });
    await user.click(trigger);

    const menu = screen.getByRole('menu');
    const items = within(menu).getAllByRole('menuitem');
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveFocus();
    // Roving tabindex inside the menu: exactly one tab stop.
    expect(items[0]).toHaveAttribute('tabindex', '0');
    expect(items[1]).toHaveAttribute('tabindex', '-1');

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(items[1]).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'End' });
    expect(items[3]).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    // Wraps from the last item back to the first.
    expect(items[0]).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('the broken variant exposes neither menu semantics nor focusable items', async () => {
    const user = userEvent.setup();
    render(<Demo broken idPrefix="mb" />);

    const trigger = screen.getByRole('button', { name: /actions/i });
    expect(trigger).not.toHaveAttribute('aria-haspopup');
    expect(trigger).not.toHaveAttribute('aria-expanded');

    await user.click(trigger);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
    // The text is on screen; there is simply no way to reach it from the keyboard.
    expect(screen.getByText('Move to archive')).toBeInTheDocument();
  });
});
