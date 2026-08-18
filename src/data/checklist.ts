/**
 * The pre-launch checklist.
 *
 * Organised by success criterion, because that is how an audit finding will be written up
 * and how a procurement document will be worded. Each item is a thing you can actually
 * check in an afternoon, not a restatement of the criterion's text: "Every input has a
 * <label for> pointing at its id" is checkable; "Information and relationships can be
 * programmatically determined" is not.
 *
 * `patternId` links the item to the live pattern that demonstrates it, so the checklist is
 * navigable rather than terminal.
 *
 * Scope note carried onto the page: this is a practical working list, not a conformance
 * audit and not legal advice. A real WCAG 2.1 AA conformance claim covers all fifty
 * Level A and AA criteria; this list covers the ones that account for most of what
 * actually goes wrong in an application UI.
 */

export interface ChecklistItem {
  /** Stable id: the persisted tick state is keyed on this, so never renumber. */
  readonly id: string;
  readonly criterion: string;
  readonly criterionName: string;
  readonly level: 'A' | 'AA';
  readonly since: '2.0' | '2.1';
  readonly text: string;
  /** Id of the pattern on the patterns page that demonstrates this, if there is one. */
  readonly patternId?: string;
}

/**
 * The checklist items, as a flat list in WCAG principle order (Perceivable, Operable,
 * Understandable, Robust), with several items per criterion where one sentence would not
 * have been checkable. `ChecklistPage` regroups them by criterion at render time, so the
 * order within a criterion is preserved but the grouping is not encoded here.
 *
 * Flat rather than nested because the identity that matters is the item, not the group: tick
 * state is persisted against `id`, and an item can be reworded or moved between criteria
 * without a visitor losing their ticks. Which is also why ids must never be renumbered.
 *
 * Coverage is deliberately partial. These are the Level A and AA criteria that account for
 * most real findings in application UIs; the audio, video, captioning and several
 * navigation criteria are out of scope and the page says so in as many words. Do not let
 * this list grow into a claim of full WCAG 2.1 AA conformance; it is a working list.
 */
export const CHECKLIST: readonly ChecklistItem[] = [
  // ── Perceivable ──────────────────────────────────────────────────────────
  {
    id: 'c-1-1-1-a',
    criterion: '1.1.1',
    criterionName: 'Non-text Content',
    level: 'A',
    since: '2.0',
    text: 'Every informative image has alt text that conveys the information, not a description of the picture.',
    patternId: 'images-icons',
  },
  {
    id: 'c-1-1-1-b',
    criterion: '1.1.1',
    criterionName: 'Non-text Content',
    level: 'A',
    since: '2.0',
    text: 'Every decorative image has alt="" present-and-empty (not a missing alt attribute), and decorative inline SVG has aria-hidden="true".',
    patternId: 'images-icons',
  },
  {
    id: 'c-1-1-1-c',
    criterion: '1.1.1',
    criterionName: 'Non-text Content',
    level: 'A',
    since: '2.0',
    text: 'Images inside links or buttons have alt text describing the destination or action, not the picture.',
    patternId: 'images-icons',
  },
  {
    id: 'c-1-3-1-a',
    criterion: '1.3.1',
    criterionName: 'Info and Relationships',
    level: 'A',
    since: '2.0',
    text: 'Every visual heading is a real h1–h6 element, and levels are never skipped going down.',
    patternId: 'landmarks',
  },
  {
    id: 'c-1-3-1-b',
    criterion: '1.3.1',
    criterionName: 'Info and Relationships',
    level: 'A',
    since: '2.0',
    text: 'Every form control has a programmatically associated label: <label for> matching the control id.',
    patternId: 'forms',
  },
  {
    id: 'c-1-3-1-c',
    criterion: '1.3.1',
    criterionName: 'Info and Relationships',
    level: 'A',
    since: '2.0',
    text: 'Every data table has <th scope="col"> on column headers and <th scope="row"> on row headers, plus a <caption>.',
    patternId: 'tables',
  },
  {
    id: 'c-1-3-1-d',
    criterion: '1.3.1',
    criterionName: 'Info and Relationships',
    level: 'A',
    since: '2.0',
    text: 'Related radio buttons and checkboxes are grouped in a <fieldset> with a <legend>.',
    patternId: 'forms',
  },
  {
    id: 'c-1-3-2',
    criterion: '1.3.2',
    criterionName: 'Meaningful Sequence',
    level: 'A',
    since: '2.0',
    text: 'The DOM order matches the visual reading order. No CSS order/grid-area reordering that changes meaning, and no layout tables.',
    patternId: 'tables',
  },
  {
    id: 'c-1-3-5',
    criterion: '1.3.5',
    criterionName: 'Identify Input Purpose',
    level: 'AA',
    since: '2.1',
    text: 'Fields collecting information about the user carry the correct autocomplete token (name, email, tel, street-address, …).',
    patternId: 'forms',
  },
  {
    id: 'c-1-4-1-a',
    criterion: '1.4.1',
    criterionName: 'Use of Color',
    level: 'A',
    since: '2.0',
    text: 'No status, error, required-field marker, or chart series is distinguished by colour alone. Print a page in greyscale to check.',
    patternId: 'colour-contrast',
  },
  {
    id: 'c-1-4-1-b',
    criterion: '1.4.1',
    criterionName: 'Use of Color',
    level: 'A',
    since: '2.0',
    text: 'Links inside body text are distinguishable without colour: underlined, or 3:1 against the surrounding text plus a non-colour cue on hover and focus.',
  },
  {
    id: 'c-1-4-3-a',
    criterion: '1.4.3',
    criterionName: 'Contrast (Minimum)',
    level: 'AA',
    since: '2.0',
    text: 'All body text reaches 4.5:1 against its actual background, including text over images, gradients, and hover states.',
    patternId: 'colour-contrast',
  },
  {
    id: 'c-1-4-3-b',
    criterion: '1.4.3',
    criterionName: 'Contrast (Minimum)',
    level: 'AA',
    since: '2.0',
    text: 'Large text (24px, or 18.66px bold, and above) reaches 3:1. Placeholder text and helper text are not exempt.',
    patternId: 'colour-contrast',
  },
  {
    id: 'c-1-4-4-a',
    criterion: '1.4.4',
    criterionName: 'Resize Text',
    level: 'AA',
    since: '2.0',
    text: 'At 200% text size nothing is clipped or overlapped. No fixed height + overflow:hidden on text containers.',
    patternId: 'reflow-zoom',
  },
  {
    id: 'c-1-4-4-b',
    criterion: '1.4.4',
    criterionName: 'Resize Text',
    level: 'AA',
    since: '2.0',
    text: 'The viewport meta tag does not set user-scalable=no or maximum-scale, and the root font size is not pinned in px.',
    patternId: 'reflow-zoom',
  },
  {
    id: 'c-1-4-5',
    criterion: '1.4.5',
    criterionName: 'Images of Text',
    level: 'AA',
    since: '2.0',
    text: 'No text is delivered as a picture of text, except logotypes.',
    patternId: 'images-icons',
  },
  {
    id: 'c-1-4-10',
    criterion: '1.4.10',
    criterionName: 'Reflow',
    level: 'AA',
    since: '2.1',
    text: 'At 320 CSS pixels wide (or 400% zoom on a 1280px window) there is no two-dimensional scrolling. Data tables and complex diagrams are exempt.',
    patternId: 'reflow-zoom',
  },
  {
    id: 'c-1-4-11-a',
    criterion: '1.4.11',
    criterionName: 'Non-text Contrast',
    level: 'AA',
    since: '2.1',
    text: 'Input borders, control boundaries, toggle states, and meaningful icons reach 3:1 against what is next to them.',
    patternId: 'colour-contrast',
  },
  {
    id: 'c-1-4-11-b',
    criterion: '1.4.11',
    criterionName: 'Non-text Contrast',
    level: 'AA',
    since: '2.1',
    text: 'The focus indicator itself reaches 3:1 against both the component and the page background; check it in both light and dark themes.',
    patternId: 'focus-visible',
  },
  {
    id: 'c-1-4-12',
    criterion: '1.4.12',
    criterionName: 'Text Spacing',
    level: 'AA',
    since: '2.1',
    text: 'With line-height 1.5, paragraph spacing 2×, letter-spacing 0.12em and word-spacing 0.16em forced by a user stylesheet, nothing is lost or overlapped.',
    patternId: 'reflow-zoom',
  },
  {
    id: 'c-1-4-13',
    criterion: '1.4.13',
    criterionName: 'Content on Hover or Focus',
    level: 'AA',
    since: '2.1',
    text: 'Tooltips and hover cards are dismissible with Escape, hoverable (the pointer can move onto them), and persist until dismissed or invalid.',
  },

  // ── Operable ─────────────────────────────────────────────────────────────
  {
    id: 'c-2-1-1-a',
    criterion: '2.1.1',
    criterionName: 'Keyboard',
    level: 'A',
    since: '2.0',
    text: 'Every interactive element is reachable and operable by keyboard alone. No div-with-onClick controls.',
    patternId: 'custom-controls',
  },
  {
    id: 'c-2-1-1-b',
    criterion: '2.1.1',
    criterionName: 'Keyboard',
    level: 'A',
    since: '2.0',
    text: 'Anything that scrolls (code blocks, wide tables, map panes) is focusable so a keyboard user can scroll it.',
  },
  {
    id: 'c-2-1-1-c',
    criterion: '2.1.1',
    criterionName: 'Keyboard',
    level: 'A',
    since: '2.0',
    text: 'Nothing depends on hover alone; every hover interaction has a focus and a click equivalent.',
  },
  {
    id: 'c-2-1-2',
    criterion: '2.1.2',
    criterionName: 'No Keyboard Trap',
    level: 'A',
    since: '2.0',
    text: 'Focus can leave every component using standard keys. Modals close on Escape; embedded players and rich-text editors do not swallow Tab permanently.',
    patternId: 'focus-trap',
  },
  {
    id: 'c-2-2-1',
    criterion: '2.2.1',
    criterionName: 'Timing Adjustable',
    level: 'A',
    since: '2.0',
    text: 'Any session or interaction time limit can be turned off, extended to 10× the default, or extended after a warning (at least ten times).',
    patternId: 'timeouts',
  },
  {
    id: 'c-2-2-2',
    criterion: '2.2.2',
    criterionName: 'Pause, Stop, Hide',
    level: 'A',
    since: '2.0',
    text: 'Anything that moves, blinks, scrolls, or auto-updates for more than five seconds has a pause, stop, or hide control. Carousels are the usual offender.',
    patternId: 'reduced-motion',
  },
  {
    id: 'c-2-3-1',
    criterion: '2.3.1',
    criterionName: 'Three Flashes or Below Threshold',
    level: 'A',
    since: '2.0',
    text: 'Nothing flashes more than three times per second. This is a seizure-safety rule, not a comfort preference.',
    patternId: 'reduced-motion',
  },
  {
    id: 'c-2-4-1',
    criterion: '2.4.1',
    criterionName: 'Bypass Blocks',
    level: 'A',
    since: '2.0',
    text: 'A skip link is the first focusable element, becomes visible on focus, and moves focus (not just scroll) to a target with tabindex="-1".',
    patternId: 'skip-link',
  },
  {
    id: 'c-2-4-2',
    criterion: '2.4.2',
    criterionName: 'Page Titled',
    level: 'A',
    since: '2.0',
    text: 'Every page (and every client-side route) has a unique, descriptive <title> that names the view before the site.',
  },
  {
    id: 'c-2-4-3-a',
    criterion: '2.4.3',
    criterionName: 'Focus Order',
    level: 'A',
    since: '2.0',
    text: 'Tab order follows the visual order. No positive tabindex values anywhere.',
    patternId: 'roving-tabindex',
  },
  {
    id: 'c-2-4-3-b',
    criterion: '2.4.3',
    criterionName: 'Focus Order',
    level: 'A',
    since: '2.0',
    text: 'Opening a dialog moves focus into it; closing returns focus to the trigger. Client-side route changes move focus to the new page heading.',
    patternId: 'focus-trap',
  },
  {
    id: 'c-2-4-4',
    criterion: '2.4.4',
    criterionName: 'Link Purpose (In Context)',
    level: 'A',
    since: '2.0',
    text: 'No bare "click here" or "read more" links: the purpose is clear from the link text, or from the link plus its sentence, list item, or table cell.',
  },
  {
    id: 'c-2-4-5',
    criterion: '2.4.5',
    criterionName: 'Multiple Ways',
    level: 'AA',
    since: '2.0',
    text: 'There is more than one way to reach any page: navigation plus search, a sitemap, or an index.',
  },
  {
    id: 'c-2-4-6',
    criterion: '2.4.6',
    criterionName: 'Headings and Labels',
    level: 'AA',
    since: '2.0',
    text: 'Headings and labels describe the topic or purpose. No "Section 1" or "Enter text here".',
    patternId: 'landmarks',
  },
  {
    id: 'c-2-4-7',
    criterion: '2.4.7',
    criterionName: 'Focus Visible',
    level: 'AA',
    since: '2.0',
    text: 'Every focusable element shows a visible indicator. Search the whole codebase for "outline: none" and "outline: 0" and justify every hit.',
    patternId: 'focus-visible',
  },
  {
    id: 'c-2-5-3',
    criterion: '2.5.3',
    criterionName: 'Label in Name',
    level: 'A',
    since: '2.1',
    text: 'Every accessible name contains the control’s visible text. No aria-label that replaces rather than extends the visible label.',
    patternId: 'speech-input',
  },
  {
    id: 'c-2-5-4',
    criterion: '2.5.4',
    criterionName: 'Motion Actuation',
    level: 'A',
    since: '2.1',
    text: 'Nothing is triggered only by device motion (shake, tilt) without a conventional control alternative and a way to disable it.',
  },

  // ── Understandable ───────────────────────────────────────────────────────
  {
    id: 'c-3-1-1',
    criterion: '3.1.1',
    criterionName: 'Language of Page',
    level: 'A',
    since: '2.0',
    text: 'The <html> element has a correct lang attribute, so screen readers use the right pronunciation rules.',
  },
  {
    id: 'c-3-2-1',
    criterion: '3.2.1',
    criterionName: 'On Focus',
    level: 'A',
    since: '2.0',
    text: 'Nothing changes context purely because an element received focus: no auto-submitting, auto-navigating, or auto-opening on focus.',
  },
  {
    id: 'c-3-2-2',
    criterion: '3.2.2',
    criterionName: 'On Input',
    level: 'A',
    since: '2.0',
    text: 'Changing a setting does not automatically change context. A <select> that navigates on change fails unless the user was warned first.',
  },
  {
    id: 'c-3-3-1',
    criterion: '3.3.1',
    criterionName: 'Error Identification',
    level: 'A',
    since: '2.0',
    text: 'Errors are identified in text, associated with their field via aria-describedby, and the field is marked aria-invalid="true".',
    patternId: 'forms',
  },
  {
    id: 'c-3-3-2',
    criterion: '3.3.2',
    criterionName: 'Labels or Instructions',
    level: 'A',
    since: '2.0',
    text: 'Format requirements are stated before the user types, not only after they fail. Placeholders are never the only label.',
    patternId: 'forms',
  },
  {
    id: 'c-3-3-3',
    criterion: '3.3.3',
    criterionName: 'Error Suggestion',
    level: 'AA',
    since: '2.0',
    text: 'Where the fix is known, the message says what it is. "Enter a date in the form DD/MM/YYYY", not "Invalid date".',
    patternId: 'forms',
  },
  {
    id: 'c-3-3-4',
    criterion: '3.3.4',
    criterionName: 'Error Prevention (Legal, Financial, Data)',
    level: 'AA',
    since: '2.0',
    text: 'Submissions with legal or financial consequences are reversible, checked, or confirmed before they commit.',
  },

  // ── Robust ───────────────────────────────────────────────────────────────
  {
    id: 'c-4-1-2-a',
    criterion: '4.1.2',
    criterionName: 'Name, Role, Value',
    level: 'A',
    since: '2.0',
    text: 'Every icon-only control has an accessible name, checked in the browser accessibility tree rather than assumed.',
    patternId: 'accessible-name',
  },
  {
    id: 'c-4-1-2-b',
    criterion: '4.1.2',
    criterionName: 'Name, Role, Value',
    level: 'A',
    since: '2.0',
    text: 'Every custom widget exposes a role and keeps its state attributes (aria-expanded, aria-checked, aria-selected, aria-pressed) up to date.',
    patternId: 'custom-controls',
  },
  {
    id: 'c-4-1-2-c',
    criterion: '4.1.2',
    criterionName: 'Name, Role, Value',
    level: 'A',
    since: '2.0',
    text: 'Every ARIA role that implies a keyboard model actually implements it: no role="toolbar" or role="tablist" without arrow keys.',
    patternId: 'roving-tabindex',
  },
  {
    id: 'c-4-1-3',
    criterion: '4.1.3',
    criterionName: 'Status Messages',
    level: 'AA',
    since: '2.1',
    text: 'Async results, validation summaries, filter counts, and toasts sit in a live region that was already in the DOM before the text changed.',
    patternId: 'live-regions',
  },
];
