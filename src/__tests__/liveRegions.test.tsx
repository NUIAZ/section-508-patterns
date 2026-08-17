import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { liveRegionsPattern } from '../patterns/liveRegions';

const Demo = liveRegionsPattern.Demo;

afterEach(() => {
  vi.useRealTimers();
});

describe('live regions', () => {
  it('renders both regions before there is anything to announce', () => {
    render(<Demo broken={false} idPrefix="l" />);

    // This is the assertion that matters most. A live region created at the same moment as
    // its text is routinely missed by screen readers, so the empty region must already
    // exist on first paint.
    const status = screen.getByTestId('l-status');
    const alert = screen.getByTestId('l-alert');
    expect(status).toBeEmptyDOMElement();
    expect(alert).toBeEmptyDOMElement();
  });

  it('gives the status region polite semantics and the alert region assertive', () => {
    render(<Demo broken={false} idPrefix="l" />);

    const status = screen.getByTestId('l-status');
    expect(status).toHaveAttribute('role', 'status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');

    const alert = screen.getByTestId('l-alert');
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('announces an asynchronous result through the polite region without moving focus', () => {
    vi.useFakeTimers();
    render(<Demo broken={false} idPrefix="l" />);

    const saveButton = screen.getByRole('button', { name: /save \(polite status\)/i });
    saveButton.focus();
    fireEvent.click(saveButton);

    const status = screen.getByTestId('l-status');
    expect(status).toHaveTextContent('Saving…');

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(status).toHaveTextContent('Saved. 3 records updated.');
    // Focus stayed exactly where the user left it — that is the whole point of a live
    // region as opposed to moving focus to the message.
    expect(saveButton).toHaveFocus();
  });

  it('puts an error into the assertive region, in words rather than colour alone', () => {
    vi.useFakeTimers();
    render(<Demo broken={false} idPrefix="l" />);

    fireEvent.click(screen.getByRole('button', { name: /too-large file/i }));
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    const alert = screen.getByTestId('l-alert');
    expect(alert).toHaveTextContent('Upload failed');
    expect(alert).toHaveTextContent('larger than 25 MB');
  });

  it('the broken variant renders the same text with no live region semantics', () => {
    vi.useFakeTimers();
    render(<Demo broken idPrefix="lb" />);

    // Nothing exists to subscribe to before the message arrives.
    expect(screen.queryByTestId('lb-status')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /save \(polite status\)/i }));
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    const status = screen.getByTestId('lb-status');
    expect(status).toHaveTextContent('Saved. 3 records updated.');
    // Visible, and completely silent.
    expect(status).not.toHaveAttribute('role');
    expect(status).not.toHaveAttribute('aria-live');
  });
});
