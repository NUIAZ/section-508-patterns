import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formsPattern } from '../patterns/forms';

const Demo = formsPattern.Demo;

describe('accessible form', () => {
  it('associates every visible label with its control', () => {
    render(<Demo broken={false} idPrefix="f" />);

    // getByLabelText only finds a control through a real programmatic association, so
    // these three assertions ARE the label-association test.
    expect(screen.getByLabelText(/full name/i)).toBeInstanceOf(HTMLInputElement);
    expect(screen.getByLabelText(/email address/i)).toBeInstanceOf(HTMLInputElement);
    expect(screen.getByLabelText(/case reference/i)).toBeInstanceOf(HTMLInputElement);
  });

  it('wires format instructions to the field with aria-describedby before any error', () => {
    render(<Demo broken={false} idPrefix="f" />);
    const reference = screen.getByLabelText(/case reference/i);

    expect(reference).toHaveAttribute('aria-describedby', 'f-reference-hint');
    expect(reference).toHaveAccessibleDescription(/two capital letters, a hyphen, then four digits/i);
  });

  it('marks required fields in words, not by colour alone', () => {
    render(<Demo broken={false} idPrefix="f" />);
    const email = screen.getByLabelText(/email address/i);

    expect(email).toBeRequired();
    // "(required)" is inside the <label>, so it is part of the accessible name.
    expect(email).toHaveAccessibleName(/required/i);
  });

  it('sets aria-invalid and appends the error id to aria-describedby on failure', async () => {
    const user = userEvent.setup();
    render(<Demo broken={false} idPrefix="f" />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    const email = screen.getByLabelText(/email address/i);
    expect(email).toHaveAttribute('aria-invalid', 'true');
    // Both ids, in order: the hint survives and the error is added, so the user still has
    // the format guidance at the moment they need it most.
    expect(email).toHaveAttribute('aria-describedby', 'f-email-hint f-email-error');
    expect(email).toHaveAccessibleDescription(/enter an email address/i);
  });

  it('renders an error summary, moves focus to it, and links each error to its field', async () => {
    const user = userEvent.setup();
    render(<Demo broken={false} idPrefix="f" />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    const summary = screen.getByTestId('f-summary');
    expect(summary).toHaveAttribute('role', 'alert');
    expect(summary).toHaveAttribute('tabindex', '-1');
    expect(summary).toHaveTextContent('There are 2 problems with this form');

    // Focus is moved on a macrotask so React has painted the summary first.
    await waitFor(() => expect(summary).toHaveFocus());

    // Activating a summary link takes the user straight to the offending control.
    const firstError = within(summary).getAllByRole('link')[0];
    await user.click(firstError);
    expect(screen.getByLabelText(/full name/i)).toHaveFocus();
  });

  it('suggests a fix rather than only reporting that something is wrong (SC 3.3.3)', async () => {
    const user = userEvent.setup();
    render(<Demo broken={false} idPrefix="f" />);

    await user.type(screen.getByLabelText(/full name/i), 'A. Person');
    await user.type(screen.getByLabelText(/email address/i), 'not-an-address');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByTestId('f-summary')).toHaveTextContent(/it must include an @/i);
  });

  it('clears the errors and reports success once the form is valid', async () => {
    const user = userEvent.setup();
    render(<Demo broken={false} idPrefix="f" />);

    await user.type(screen.getByLabelText(/full name/i), 'A. Person');
    await user.type(screen.getByLabelText(/email address/i), 'a.person@example.com');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.queryByTestId('f-summary')).not.toBeInTheDocument();
    expect(screen.getByText(/submitted successfully/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).not.toHaveAttribute('aria-invalid');
  });

  describe('the broken variant', () => {
    it('has no programmatic label for its fields', () => {
      render(<Demo broken idPrefix="fb" />);
      // A placeholder and a label-shaped span are not labels, so nothing is findable.
      expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
    });

    it('never sets aria-invalid and never announces or focuses a summary', async () => {
      const user = userEvent.setup();
      render(<Demo broken idPrefix="fb" />);

      const submit = screen.getByRole('button', { name: 'Submit' });
      await user.click(submit);

      expect(screen.queryByTestId('fb-summary')).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText(/full name/i)).not.toHaveAttribute('aria-invalid');
      // Focus is still sitting on the submit button, with no announcement anywhere.
      expect(submit).toHaveFocus();
    });
  });
});
