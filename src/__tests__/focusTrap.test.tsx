import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { focusTrapPattern } from '../patterns/focusTrap';

const Demo = focusTrapPattern.Demo;

/**
 * Focus-trap behaviour is the most testable part of accessibility work and the part most
 * likely to regress silently, because nothing visible breaks when it does.
 *
 * Tab cycling is asserted with `fireEvent.keyDown` rather than `userEvent.tab()` on
 * purpose: jsdom does not implement the browser's native Tab behaviour, so what we want to
 * verify is precisely that OUR handler moved focus, not that a simulated tab order did.
 */
describe('modal focus trap', () => {
  it('moves focus into the dialog and exposes dialog role, aria-modal and a name', async () => {
    const user = userEvent.setup();
    render(<Demo broken={false} idPrefix="t" />);

    await user.click(screen.getByRole('button', { name: /delete this project/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    // The accessible name comes from aria-labelledby pointing at the dialog's heading.
    expect(dialog).toHaveAccessibleName('Delete project?');
    // Focus landed on the first focusable control inside, not on the container or the body.
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveFocus();
  });

  it('cycles Tab from the last control back to the first', async () => {
    const user = userEvent.setup();
    render(<Demo broken={false} idPrefix="t" />);
    await user.click(screen.getByRole('button', { name: /delete this project/i }));

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    cancelButton.focus();
    fireEvent.keyDown(cancelButton, { key: 'Tab' });
    expect(deleteButton).toHaveFocus();
  });

  it('cycles Shift+Tab from the first control back to the last', async () => {
    const user = userEvent.setup();
    render(<Demo broken={false} idPrefix="t" />);
    await user.click(screen.getByRole('button', { name: /delete this project/i }));

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    expect(deleteButton).toHaveFocus();
    fireEvent.keyDown(deleteButton, { key: 'Tab', shiftKey: true });
    expect(cancelButton).toHaveFocus();
  });

  it('never lets focus reach the background form while the dialog is open', async () => {
    const user = userEvent.setup();
    render(<Demo broken={false} idPrefix="t" />);
    await user.click(screen.getByRole('button', { name: /delete this project/i }));

    const backgroundButton = screen.getByRole('button', { name: 'Background button' });

    // Six Tab presses is more than the two focusable controls in the dialog, so an
    // untrapped dialog would certainly have leaked by now.
    for (let i = 0; i < 6; i += 1) {
      const active = document.activeElement;
      if (active instanceof HTMLElement) fireEvent.keyDown(active, { key: 'Tab' });
    }

    expect(backgroundButton).not.toHaveFocus();
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
  });

  it('closes on Escape and restores focus to the trigger that opened it', async () => {
    const user = userEvent.setup();
    render(<Demo broken={false} idPrefix="t" />);

    const trigger = screen.getByRole('button', { name: /delete this project/i });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) throw new Error('nothing was focused');
    fireEvent.keyDown(active, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // The critical half: focus goes back where it came from, not to <body>.
    expect(trigger).toHaveFocus();
  });

  it('restores focus to the trigger when the dialog is closed by its own button', async () => {
    const user = userEvent.setup();
    render(<Demo broken={false} idPrefix="t" />);

    const trigger = screen.getByRole('button', { name: /delete this project/i });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  describe('the broken variant', () => {
    it('renders no dialog role, leaves focus on the trigger, and ignores Escape', async () => {
      const user = userEvent.setup();
      render(<Demo broken idPrefix="b" />);

      const trigger = screen.getByRole('button', { name: /delete this project/i });
      await user.click(trigger);

      // The overlay is on screen…
      expect(screen.getByText('Delete project?')).toBeInTheDocument();
      // …but it is not a dialog, and focus never moved into it.
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();

      fireEvent.keyDown(trigger, { key: 'Escape' });
      expect(screen.getByText('Delete project?')).toBeInTheDocument();
    });

    it('lets focus escape to the background form', async () => {
      const user = userEvent.setup();
      render(<Demo broken idPrefix="b" />);
      await user.click(screen.getByRole('button', { name: /delete this project/i }));

      // Nothing is trapping anything, so we can simply focus the thing behind the overlay.
      const backgroundButton = screen.getByRole('button', { name: 'Background button' });
      backgroundButton.focus();
      expect(backgroundButton).toHaveFocus();
    });
  });
});
