import { useId, type ReactNode } from 'react';
import { useTheme, type ThemeChoice } from '../lib/theme';

const OPTIONS: ReadonlyArray<{ value: ThemeChoice; label: string; icon: string }> = [
  { value: 'system', label: 'System', icon: '🖥' },
  { value: 'light', label: 'Light', icon: '☀' },
  { value: 'dark', label: 'Dark', icon: '☾' },
];

/**
 * Theme picker.
 *
 * Built as a native `<select>` rather than a fancy custom listbox, for the same reason the
 * variant switch uses radios: the native control already has a role, a keyboard model,
 * touch behaviour on mobile, and a screen-reader announcement that no hand-written
 * replacement matches. Every custom widget on this site exists to teach a lesson; a theme
 * picker has no lesson to teach, so it gets the boring correct control.
 *
 * The `<label>` is visible rather than hidden. A visible label is what speech-input users
 * can say ("click theme"), and it is what SC 2.5.3 Label in Name (A, WCAG 2.1) is about.
 */
export function ThemeToggle(): ReactNode {
  const { choice, resolved, setChoice } = useTheme();
  const selectId = useId();

  return (
    <div className="theme-toggle">
      <label htmlFor={selectId}>Theme</label>{' '}
      <select
        id={selectId}
        value={choice}
        onChange={(event) => setChoice(event.target.value as ThemeChoice)}
        style={{ width: 'auto', minWidth: '9rem' }}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.icon} {option.label}
          </option>
        ))}
      </select>
      {/* Tells screen-reader users what "System" actually resolved to — information a
          sighted user gets from simply looking at the page. */}
      <span className="sr-only" role="status">
        {`Theme set to ${choice}. Currently showing the ${resolved} palette.`}
      </span>
    </div>
  );
}
