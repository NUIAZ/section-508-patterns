# Section 508 Patterns

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A live, working reference of accessibility patterns for web applications — each one
demonstrated by a real interactive component, shown beside a **deliberately broken
version** you can switch to and experience failing with a keyboard or a screen reader.

**Live demo:** https://&lt;user&gt;.github.io/section-508-patterns/

Most accessibility guides are prose about markup. This one is markup. Every pattern on the
site is a component you can operate right now, with its source, the WCAG 2.1 success
criteria it satisfies, how those map to Section 508, and a note on how to test it yourself.
The site is also its own proof: it is built to the standards it documents.

---

## Why the broken versions

Reading "a modal must trap focus" teaches you a rule. Tabbing straight out of an untrapped
modal into a form you cannot see, on a page you cannot leave, teaches you the reason. Every
pattern card has an **Accessible / Broken** switch, and the broken variant is the *same
component* with the accessibility affordances removed — not a separate lookalike that
quietly differs in other ways.

Try one with your mouse pushed away from the keyboard. That is the entire pitch.

---

## What it covers

Sixteen patterns, each genuinely implemented:

| Pattern | The failure it prevents |
| --- | --- |
| **Skip link** | Thirty tab stops before the content, on every page |
| **Visible focus indicator** | `outline: none` with no replacement |
| **Focus trap in a modal** | Focus escaping behind the overlay; focus lost on close |
| **Keyboard-operable custom controls** | `<div onClick>` switches and menus |
| **Roving tabindex** | A thirty-button toolbar that is thirty tab stops |
| **Accessible names** | Icon-only buttons announced as "button, button, button" |
| **Live regions** | Async results that update the screen in total silence |
| **Form labels, instructions, errors** | Placeholders as labels; red borders as error messages |
| **Headings and landmarks** | Div soup with font-size standing in for structure |
| **Data tables** | `1,022` with no idea which row or column it belongs to |
| **Colour contrast** | Low contrast, and colour as the only signal |
| **Images and icons** | Missing alt on charts; lovingly described decoration |
| **Reflow and text resize** | Fixed pixel widths; fixed heights that clip at 200% |
| **Reduced motion** | Parallax that makes people ill, with no way to stop it |
| **Session timeouts** | Silent expiry that eats an hour of unsaved work |
| **Speech input / Label in Name** | An `aria-label` that makes a button unclickable by voice |

Plus two supporting pages:

- **Pre-launch checklist** — 49 checkable items organised by success criterion, each
  linking to the pattern that demonstrates it. Ticks persist locally; the page prints, and
  exports to Markdown for pasting into a ticket.
- **How to test** — the keyboard-only walkthrough, zoom and reflow testing, NVDA / JAWS /
  VoiceOver key commands, and an honest table of what each automated tool can and cannot
  see.

---

## Scope, honestly stated

**This is a practical reference, not legal advice, and not a conformance audit.**

- A full WCAG 2.1 Level AA conformance claim covers all fifty Level A and AA success
  criteria, including the audio, video, and captioning criteria this project does not
  demonstrate. Working through everything here does not by itself produce a conformance
  claim, an Accessibility Conformance Report, or a VPAT.
- **Section 508 does not have its own numbered rule for "focus indicators" or "alt text".**
  The Revised Section 508 Standards (published 2017, compliance date 18 January 2018)
  *incorporate WCAG 2.0 Level A and AA by reference* — E205.4 for electronic content, and
  502/503 together with E207.2 for software user interfaces. Chapter 3 adds nine Functional
  Performance Criteria (302.1 Without Vision through 302.9 With Limited Language,
  Cognitive, and Learning Abilities). Anyone quoting a "Section 508 provision number" for
  an individual criterion is either citing the superseded 1998 standard (the §1194.22
  series) or making it up. This site says so on every card.
- Because 508 references **WCAG 2.0**, criteria added in **WCAG 2.1** — including 1.3.5,
  1.4.10, 1.4.11, 1.4.12, 1.4.13, 2.5.3 and 4.1.3 — are *not* Section 508 requirements.
  They are required by WCAG 2.1 AA, by EN 301 549, and by the U.S. Department of Justice's
  2024 ADA Title II rule for state and local government. Every criterion on the site is
  labelled with the version that introduced it, so you can tell which is which.
- Where a criterion is **Level AAA** (1.4.6, 2.2.6, 2.3.3, 2.4.10) it is labelled AAA and
  described as good practice rather than as a requirement. Over-claiming is how you lose an
  argument with a designer for no reason.

If you need a conformance determination, get an audit from people who do them, and involve
users of assistive technology.

---

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest — 98 tests
npm run build    # tsc -b (strict) then vite build → dist/
npm run preview  # serve the production build locally
```

Requires Node 20 or newer; CI uses Node 22.

---

## Tests

98 tests across 10 files, covering the things automated scanners cannot see:

- **Focus trap** — Tab cycles forward from the last control, Shift+Tab cycles backward from
  the first, focus never reaches the background form, Escape closes, and focus is restored
  to the trigger (not to `<body>`).
- **Roving tabindex** — exactly one tab stop, arrow keys move focus and the tab stop
  together, Home/End, wrapping, and no focus stolen on mount.
- **Custom controls** — the switch responds to both Space and Enter and keeps `aria-checked`
  in step; the menu button reports `aria-expanded`, arrow keys move between `menuitem`s,
  Escape closes and returns focus.
- **Forms** — labels are programmatically associated, hints are wired with
  `aria-describedby` *before* any error, `aria-invalid` is set on failure and the error id
  is *appended* to `aria-describedby` rather than replacing the hint, and the error summary
  takes focus.
- **Live regions** — both regions exist on first paint before there is anything to
  announce, `role="status"` is polite and `role="alert"` is assertive, and an async result
  lands in the region without moving focus.
- **Contrast maths** — black on white is exactly 21:1; `#767676` on white is 4.54:1 and
  passes AA while `#777777` is 4.48:1 and fails; `#949494` sits in the large-text-only band;
  the displayed ratio is floored rather than rounded up.
- **Broken/fixed toggle** — switching the variant genuinely changes the accessibility tree,
  not just the styling.
- **The site shell** — one `h1`, one `main`, named landmarks, `aria-current` on the current
  page, the skip link first in the document and actually moving focus, and route changes
  that move focus and announce themselves.
- **axe-core** — every working demo, and a full-page harness with the page-level rules
  enabled, report zero violations.

### Why `color-contrast` is disabled in the axe runs

jsdom has no layout and no paint, so there is no computed background colour for axe to
measure — the rule cannot run there at all. It is covered instead by the unit tests that
pin the contrast maths against known values, and by the ratio noted beside every colour
token in `src/styles/global.css`. `heading-order`, `region`, `landmark-one-main` and
`page-has-heading-one` are disabled only for the isolated-fragment runs, because a demo
rendered on its own has no page context; the harness test re-enables all of them.

### The point of the last two tests

`src/__tests__/axe.test.tsx` ends with two tests that exist to mark the boundary of
automated testing: axe **does** flag the unnamed icon buttons in the broken accessible-name
demo, and it **says nothing at all** about the broken focus trap — a serious, user-blocking
failure that the keyboard tests catch in milliseconds. Automated tooling detects roughly a
third of WCAG issues. A green scan is a floor, not a ceiling.

---

## Project layout

```
src/
  lib/
    contrast.ts      WCAG relative luminance + contrast ratio, from the spec
    focus.ts         focusable-element detection, useFocusTrap, accessible-name computation
    router.ts        ~40-line hash router (GitHub Pages serves static files only)
    search.ts        client-side search over titles, problems, and criteria
    theme.tsx        prefers-color-scheme + persisted manual override
    types.ts         the PatternMeta shape every card is generated from
  components/        PatternCard, CodeBlock, Sidebar, ThemeToggle
  patterns/          one file per pattern: metadata, criteria, demo, broken demo, source
  pages/             PatternsPage, ChecklistPage, TestingPage
  data/checklist.ts  the pre-launch checklist
  styles/global.css  design tokens with their contrast ratios noted inline
```

Every pattern is a single file exporting one `PatternMeta` object. The sidebar, the search
index, the checklist deep links, and the test suite all read from `src/patterns/index.ts`,
so adding a pattern is one import and one line — and the type makes it impossible to add
one without a criterion mapping, a testing note, and both variants.

---

## Deploying

`.github/workflows/deploy-pages.yml` builds and publishes on every push to `main`. Enable
it once in **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The Vite config sets `base: './'`, so the built site works from a repository sub-path, from
`vite preview`, and from opening `dist/index.html` directly off disk.

The workflow runs `npm test` before `npm run build`, so a failing accessibility test blocks
the deploy. That is the whole argument for accessibility tests in CI, in one line of YAML.

---

## Related

A companion demonstration of voice-driven navigation lives at
`https://github.com/<user>/voice-command-demo` — see the **Speech input and Label in Name**
pattern for why accessible names and visible labels have to agree.

---

## Sources

- W3C — *Web Content Accessibility Guidelines (WCAG) 2.1*, and the *Understanding* and
  *Techniques* documents for each criterion.
- U.S. Access Board — *Revised Section 508 Standards and Section 255 Guidelines*
  (2017; compliance date 18 January 2018).
- W3C — *ARIA Authoring Practices Guide*, for the keyboard model of every composite widget.
- U.S. Department of Justice — 2024 ADA Title II web and mobile accessibility rule.

---

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Ryan Gross.
