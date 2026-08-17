import { useCallback, useId, useRef, useState, type ReactNode } from 'react';

interface CodeBlockProps {
  readonly code: string;
  readonly language?: string;
  /** Accessible label for the scrollable region, e.g. "Source for the skip link pattern". */
  readonly label: string;
}

/**
 * A copyable code block.
 *
 * Three accessibility decisions worth calling out, since this component appears on every
 * card and would multiply any mistake by sixteen:
 *
 *  1. **The <pre> is `tabindex="0"` with a `role="region"` and a label.** A scrollable
 *     element that is not focusable cannot be scrolled by a keyboard-only user — they can
 *     never read past the right-hand edge of a wide snippet. Making it focusable fixes
 *     that; giving it a name means the screen reader announces what the region contains
 *     instead of "region, blank". (SC 2.1.1 Keyboard, Level A.)
 *
 *  2. **The copy result is announced.** Swapping the button's label from "Copy" to
 *     "Copied" is a purely visual confirmation. The status message goes in a separate
 *     `role="status"` region that is already in the DOM, so assistive technology observes
 *     the change and speaks it. (SC 4.1.3 Status Messages, Level AA — WCAG 2.1.)
 *
 *  3. **The button keeps a stable accessible name.** It always reads "Copy code"; the
 *     transient "Copied" text lives elsewhere. A control whose name changes under the
 *     user is disorienting for speech-input users who just said "click copy code".
 */
export function CodeBlock({ code, language = 'tsx', label }: CodeBlockProps): ReactNode {
  const [status, setStatus] = useState<string>('');
  const timerRef = useRef<number | null>(null);
  const regionId = useId();

  const copy = useCallback(async (): Promise<void> => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    try {
      // The async clipboard API needs a secure context. On http:// (or an old browser)
      // we tell the user what to do instead of silently doing nothing.
      if (typeof navigator !== 'undefined' && navigator.clipboard !== undefined) {
        await navigator.clipboard.writeText(code);
        setStatus('Code copied to the clipboard.');
      } else {
        setStatus('Clipboard is unavailable here. Select the code and press Control + C.');
      }
    } catch {
      setStatus('Copy failed. Select the code and press Control + C.');
    }
    timerRef.current = window.setTimeout(() => setStatus(''), 4000);
  }, [code]);

  return (
    <div className="code-block">
      <div className="code-block-toolbar">
        <span aria-hidden="true">{language}</span>
        <button
          type="button"
          className="btn btn-small"
          onClick={() => {
            void copy();
          }}
        >
          {/* The icon is decorative — the button already has a text label, so announcing
              the glyph as well would produce "clipboard copy code". */}
          <span aria-hidden="true">⧉</span>
          Copy code
        </button>
      </div>

      <pre
        tabIndex={0}
        role="region"
        aria-label={label}
        id={regionId}
      >
        <code>{code}</code>
      </pre>

      {/* Always rendered, even when empty. A live region added to the DOM at the same
          moment as its text is frequently missed by screen readers, because there was no
          region there to observe. */}
      <p className="sr-only" role="status">
        {status}
      </p>
    </div>
  );
}
