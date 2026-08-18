import { useEffect, useRef, type RefObject } from 'react';

/**
 * Focus management helpers.
 *
 * These are the load-bearing parts of half the patterns on this site, so they live in one
 * audited place rather than being re-typed per demo.
 */

/**
 * Selector for things that can receive keyboard focus.
 *
 * Notes on the choices, because this selector is where most home-grown focus traps go
 * wrong:
 *  - `[tabindex]:not([tabindex="-1"])`, programmatically-focusable-only elements
 *    (tabindex="-1") must be *skipped* when cycling, even though they can hold focus.
 *  - `:not([disabled])`, a disabled control is not in the tab order.
 *  - `[contenteditable]` and `audio/video[controls]` are genuinely focusable and are
 *    routinely forgotten.
 *  - `details > summary` is focusable; plain `details` is not.
 *
 * Known limits: a CSS selector cannot express these, so {@link isFocusableNow} filters
 * what it can and the rest are accepted as the cost of not shipping a layout engine:
 *  - **Hidden by stylesheet.** `display:none` or `visibility:hidden` applied from a CSS
 *    rule (rather than an inline `style`) is invisible to both the selector and the
 *    filter. Only inline styles and the `hidden` attribute are caught.
 *  - **Off-screen or zero-sized.** An element positioned outside the viewport, collapsed
 *    to 0×0, or clipped to nothing still matches. That is partly deliberate: the
 *    `.sr-only-focusable` skip link is clipped to 1px and *must* stay in the list.
 *  - **`content-visibility: hidden`** and closed `<details>` content are not detected.
 *  - **Shadow DOM.** `querySelectorAll` does not pierce shadow roots, so focusable
 *    elements inside a web component are missed entirely.
 *  - **`inert`** *is* handled, but by the filter's ancestor check rather than by this
 *    selector: the `:has()`-free selector syntax here cannot look upwards.
 *
 * For the demos on this site that is all fine. For a production focus trap in an app with
 * web components or CSS-driven visibility, use a maintained library and read its caveats.
 */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Is this element actually reachable, as opposed to merely matching the selector?
 *
 * `offsetParent === null` is the usual browser test for "not rendered", but jsdom has no
 * layout engine and reports null for everything, which would make the trap think there is
 * nothing to focus during tests. So we test the things that are true in both environments:
 * an explicit `hidden` attribute, `aria-hidden`, `display:none` from inline style, or an
 * ancestor `[inert]`.
 */
export function isFocusableNow(element: HTMLElement): boolean {
  if (element.hasAttribute('hidden')) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;
  if (element.closest('[inert]') !== null) return false;
  if (element.style.display === 'none' || element.style.visibility === 'hidden') return false;
  return true;
}

/** All tabbable descendants of `container`, in DOM order (which is tab order here). */
export function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    isFocusableNow,
  );
}

/**
 * Configuration for {@link useFocusTrap}.
 *
 * `onEscape` is required rather than optional on purpose. A trap you cannot leave from the
 * keyboard is a failure of SC 2.1.2 No Keyboard Trap (Level A), so the type refuses to let
 * you build one by omission: forgetting the exit has to be a deliberate act, not a
 * default. `returnFocusTo` is the only genuinely optional part, because the sensible
 * default (whatever had focus when the trap opened) is right almost every time.
 */
export interface FocusTrapOptions {
  /** When false the trap is completely inert: no listeners, no focus movement. */
  readonly active: boolean;
  /** Called on Escape. The pattern requires *some* keyboard exit; Escape is the standard. */
  readonly onEscape: () => void;
  /**
   * Element to return focus to when the trap deactivates. Defaults to whatever had focus
   * at the moment the trap turned on, which is almost always the trigger button.
   */
  readonly returnFocusTo?: RefObject<HTMLElement | null>;
}

/**
 * Trap keyboard focus inside a container while it is `active`.
 *
 * Why this is *not* a violation of SC 2.1.2 No Keyboard Trap (Level A): 2.1.2 forbids a
 * component that focus can enter but cannot leave *using standard keyboard commands*. A
 * modal dialog that closes on Escape (and has a visible, focusable Close control) provides
 * exactly that standard exit, so it conforms. A trap with no exit is the violation.
 *
 * What this hook guarantees:
 *  1. On activation, focus moves into the container (first focusable, else the container).
 *  2. Tab from the last focusable wraps to the first; Shift+Tab from the first wraps to
 *     the last. Focus that has somehow escaped is pulled back.
 *  3. Escape calls `onEscape`.
 *  4. On deactivation, focus returns to the trigger. SC 2.4.3 Focus Order (A). Dropping
 *     focus to <body> instead is the single most common modal bug: the screen reader user
 *     is dumped at the top of the page with no idea where they were.
 */
export function useFocusTrap({
  active,
  onEscape,
  returnFocusTo,
}: FocusTrapOptions): RefObject<HTMLDivElement | null> {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keep the escape handler in a ref so that an inline arrow function passed by the caller
  // does not tear down and rebuild the trap (and re-steal focus) on every render.
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (container === null) return;

    const explicitReturn = returnFocusTo?.current ?? null;
    const previouslyFocused =
      explicitReturn ??
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);

    const initial = getFocusable(container)[0] ?? container;
    initial.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        // stopPropagation so a dialog inside another Escape-sensitive widget only closes
        // the innermost layer, which is what users expect.
        event.stopPropagation();
        onEscapeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = getFocusable(container);
      if (focusable.length === 0) {
        // Nothing to move to: hold focus on the container itself rather than letting Tab
        // walk out into the page behind the overlay.
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      const insideTrap = current instanceof HTMLElement && container.contains(current);

      if (event.shiftKey) {
        if (!insideTrap || current === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!insideTrap || current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus. `isConnected` matters because the trigger may itself have been
      // unmounted (e.g. a dialog that deletes the row it was opened from), and calling
      // focus() on a detached node silently sends focus to <body>.
      if (previouslyFocused !== null && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [active, returnFocusTo]);

  return containerRef;
}

/**
 * Text content of an element, EXCLUDING any subtree marked `aria-hidden="true"`.
 *
 * This distinction is the whole point of the accessible-name pattern: a button whose only
 * child is an aria-hidden icon has no accessible name at all, even though `textContent`
 * cheerfully returns the glyph. Using plain `textContent` here would make the helper
 * disagree with every real screen reader in exactly the case being demonstrated.
 */
function visibleTextContent(element: Element): string {
  let out = '';
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? '';
    } else if (node instanceof Element) {
      if (node.getAttribute('aria-hidden') === 'true') continue;
      if (node.hasAttribute('hidden')) continue;
      out += visibleTextContent(node);
    }
  }
  return out.trim().replace(/\s+/g, ' ');
}

/**
 * Compute an element's accessible name, for the "what would a screen reader call this?"
 * read-outs on the accessible-name and speech-input patterns.
 *
 * This is a *simplified* implementation of the ARIA accessible name computation: it covers
 * aria-labelledby, aria-label, native labels, alt/title and text content, in specification
 * precedence order. The real algorithm handles pseudo-content, recursion limits, and role
 * exceptions. Comparing this to what NVDA or VoiceOver actually says is part of the
 * exercise: the honest lesson is that you verify names with a real screen reader or the
 * browser accessibility tree, not with a helper like this one.
 */
export function computeAccessibleName(element: HTMLElement): string {
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy !== null && labelledBy.trim() !== '') {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => element.ownerDocument.getElementById(id)?.textContent?.trim() ?? '')
      .filter((part) => part !== '')
      .join(' ');
    if (text !== '') return text;
  }

  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel !== null && ariaLabel.trim() !== '') return ariaLabel.trim();

  // Native <label for> / wrapping <label>, which is what form controls use.
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    const labels = Array.from(element.labels ?? []);
    const text = labels
      .map((l) => l.textContent?.trim() ?? '')
      .filter((t) => t !== '')
      .join(' ');
    if (text !== '') return text;
  }

  if (element instanceof HTMLImageElement) {
    const alt = element.getAttribute('alt');
    // An empty (but present) alt is a deliberate "this is decorative"; name is "".
    if (alt !== null) return alt.trim();
  }

  // SVG exposes its name through a child <title>, not textContent of shapes.
  const svgTitle = element.tagName.toLowerCase() === 'svg' ? element.querySelector('title') : null;
  if (svgTitle !== null) return svgTitle.textContent?.trim() ?? '';

  const text = visibleTextContent(element);
  if (text !== '') return text;

  const title = element.getAttribute('title');
  if (title !== null && title.trim() !== '') return title.trim();

  return '';
}
