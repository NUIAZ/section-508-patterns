/**
 * The "how to test" page: keyboard walkthrough, zoom and reflow, screen readers, and a
 * closing section on what automated tooling can and cannot find.
 *
 * The ordering is the argument. Techniques are presented by how much you learn per minute
 * spent, which puts the free ones that need no software first and the automated scanner
 * last — the opposite of the order most teams adopt them in.
 *
 * The screen-reader key table below is static prose, not something the site can verify.
 * Shortcuts drift between versions and are remapped by users, so treat it as a starting
 * point; where a key has changed, the fix is to correct the table, not to work around it in
 * a demo elsewhere.
 */

import type { ReactNode } from 'react';
import { routeHref } from '../lib/router';

interface KeyRow {
  readonly action: string;
  readonly nvda: string;
  readonly jaws: string;
  readonly voiceOver: string;
}

const SCREEN_READER_KEYS: readonly KeyRow[] = [
  {
    action: 'Start / stop the screen reader',
    nvda: 'Ctrl+Alt+N to start, Insert+Q to quit',
    jaws: 'Insert+J for the menu, Insert+F4 to quit',
    voiceOver: 'Cmd+F5',
  },
  {
    action: 'Stop it talking, right now',
    nvda: 'Ctrl',
    jaws: 'Ctrl',
    voiceOver: 'Ctrl',
  },
  {
    action: 'Read from here to the end',
    nvda: 'Insert+↓',
    jaws: 'Insert+↓',
    voiceOver: 'VO+A',
  },
  {
    action: 'Next / previous heading',
    nvda: 'H / Shift+H',
    jaws: 'H / Shift+H',
    voiceOver: 'VO+Cmd+H',
  },
  {
    action: 'Heading of a specific level',
    nvda: '1 – 6',
    jaws: '1 – 6',
    voiceOver: 'Rotor → Headings',
  },
  {
    action: 'Next landmark / region',
    nvda: 'D',
    jaws: 'R',
    voiceOver: 'VO+U → Landmarks',
  },
  {
    action: 'Next form field / next button',
    nvda: 'F / B',
    jaws: 'F / B',
    voiceOver: 'VO+Cmd+J',
  },
  {
    action: 'Next link',
    nvda: 'K',
    jaws: 'Tab, or U for unvisited',
    voiceOver: 'VO+Cmd+L',
  },
  {
    action: 'Next table, then move between cells',
    nvda: 'T, then Ctrl+Alt+arrows',
    jaws: 'T, then Ctrl+Alt+arrows',
    voiceOver: 'VO+Cmd+T, then VO+arrows',
  },
  {
    action: 'List every element of a type',
    nvda: 'Insert+F7',
    jaws: 'Insert+F7 (links), Insert+F6 (headings), Insert+Ctrl+R (regions)',
    voiceOver: 'VO+U (the rotor)',
  },
  {
    action: 'Switch between browse and forms/focus mode',
    nvda: 'Insert+Space (usually automatic)',
    jaws: 'Insert+Z (usually automatic)',
    voiceOver: 'VO+Shift+↓ to interact, VO+Shift+↑ to stop',
  },
  {
    action: 'See what was said, as text',
    nvda: 'NVDA menu → Tools → Speech Viewer',
    jaws: 'Utilities → Speech History',
    voiceOver: 'Enable the caption panel in VoiceOver Utility',
  },
];

/**
 * The testing page.
 *
 * The one section that matters most is the last one: the honest limits of automated
 * testing. Nearly every accessibility programme that fails does so by treating a green
 * axe score as the finish line.
 */
export function TestingPage(): ReactNode {
  return (
    <>
      <h2>How to actually test this</h2>
      <p>
        Three techniques, in the order of how much you learn per minute spent: keyboard
        only, browser zoom, then a screen reader. Automated tools come fourth, and the
        reason is at the bottom of this page.
      </p>

      {/* ── KEYBOARD ─────────────────────────────────────────────────────── */}
      <h3 id="keyboard">1. The keyboard-only walkthrough</h3>
      <p>
        Costs nothing, needs no software, and finds a disproportionate share of real
        problems. Physically move your hand off the mouse — the temptation to grab it when
        you get stuck is the whole test.
      </p>
      <ol>
        <li>
          Load the page and press <kbd>Tab</kbd> once. A skip link should appear. If
          nothing visible happens, you have found your first bug.
        </li>
        <li>
          Keep pressing <kbd>Tab</kbd> to the end of the page. At <em>every single stop</em>{' '}
          you must be able to see where you are. Note anywhere the indicator vanishes.
        </li>
        <li>
          Watch the order. It should follow the visual layout. A jump from the header to
          the footer and back means someone used a positive <code>tabindex</code>.
        </li>
        <li>
          Count the stops before the main content. More than about ten and you need a skip
          link, or better landmarks.
        </li>
        <li>
          Operate everything: <kbd>Enter</kbd> on links and buttons, <kbd>Space</kbd> on
          buttons and checkboxes, arrows in radio groups, selects, tabs, and menus.
        </li>
        <li>
          Open every dialog, drawer, popover, and dropdown. Does focus move in? Does{' '}
          <kbd>Esc</kbd> close it? Does focus come back to what opened it?
        </li>
        <li>
          Try to Tab <em>out</em> of every widget. Anything you cannot escape with the
          keyboard is a Level A failure of 2.1.2.
        </li>
        <li>
          Submit a form with errors. Where does focus go? If it stays on the submit button
          and the errors appear elsewhere, a screen-reader user has just been told nothing.
        </li>
        <li>
          Do the same journey with <kbd>Shift</kbd>+<kbd>Tab</kbd>. Backwards order is
          often subtly different and rarely tested.
        </li>
      </ol>
      <p className="note">
        Everything in that list is demonstrated on the{' '}
        <a href={routeHref('patterns')}>patterns page</a>, with a broken version of each so
        you can see what failing looks like before you have to recognise it in the wild.
      </p>

      {/* ── ZOOM ─────────────────────────────────────────────────────────── */}
      <h3 id="zoom">2. Zoom and text size</h3>
      <ol>
        <li>
          Set the browser window to 1280 CSS pixels wide and press <kbd>Ctrl</kbd>+
          <kbd>+</kbd> (<kbd>Cmd</kbd>+<kbd>+</kbd> on macOS) until you reach 400%. That is
          the 320px reflow target from SC 1.4.10. There must be no horizontal page
          scrollbar — data tables and complex diagrams excepted.
        </li>
        <li>
          Separately, raise <em>text size only</em> to 200% (Firefox: View → Zoom → Zoom
          Text Only; Chrome: Settings → Appearance → Font size). This is SC 1.4.4 and it
          finds different bugs from page zoom, because it breaks fixed-height containers
          rather than fixed-width ones.
        </li>
        <li>
          Apply the SC 1.4.12 text-spacing overrides as a user stylesheet: line-height
          1.5, paragraph spacing 2×, letter-spacing 0.12em, word-spacing 0.16em. Nothing
          may be clipped or overlapped.
        </li>
        <li>
          On a phone, try to pinch-zoom. If it is locked, someone shipped{' '}
          <code>user-scalable=no</code>.
        </li>
        <li>
          Turn on Windows High Contrast / Forced Colors mode (Windows: <kbd>Left Alt</kbd>+
          <kbd>Left Shift</kbd>+<kbd>PrtScn</kbd>). Controls drawn with{' '}
          <code>background-image</code> or <code>box-shadow</code> tend to disappear
          entirely.
        </li>
      </ol>

      {/* ── SCREEN READER ────────────────────────────────────────────────── */}
      <h3 id="screen-readers">3. Screen readers</h3>
      <p>
        You do not need to be fluent. You need to be able to turn one on, move by heading,
        move by landmark, tab through the form, and hear whether the thing you built
        announces itself. That is an hour of learning and it changes how you write markup
        permanently.
      </p>
      <p>
        Pair them the way real users do:{' '}
        <strong>NVDA with Firefox or Chrome</strong> on Windows (free, open source),{' '}
        <strong>JAWS with Chrome</strong> on Windows (commercial, still dominant in
        enterprise and government), <strong>VoiceOver with Safari</strong> on macOS and iOS
        (built in), and <strong>TalkBack with Chrome</strong> on Android. A component can
        behave differently in each; if you only ever test one, test the one your users
        actually have.
      </p>

      <div className="table-scroll">
        <table className="data-table">
          <caption>The commands that cover most of what you need</caption>
          <thead>
            <tr>
              <th scope="col">What you want to do</th>
              <th scope="col">NVDA (Windows)</th>
              <th scope="col">JAWS (Windows)</th>
              <th scope="col">VoiceOver (macOS)</th>
            </tr>
          </thead>
          <tbody>
            {SCREEN_READER_KEYS.map((row) => (
              <tr key={row.action}>
                <th scope="row">{row.action}</th>
                <td>{row.nvda}</td>
                <td>{row.jaws}</td>
                <td>{row.voiceOver}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">
        &ldquo;VO&rdquo; is the VoiceOver modifier — <kbd>Ctrl</kbd>+<kbd>Option</kbd> by
        default. NVDA&rsquo;s and JAWS&rsquo;s modifier is <kbd>Insert</kbd> (or{' '}
        <kbd>Caps Lock</kbd> in laptop layout). The single most useful trick for a
        developer is the speech viewer / speech history: it prints what was announced as
        text, so you can iterate without listening.
      </p>

      <h4>A five-minute screen-reader smoke test</h4>
      <ol>
        <li>Turn it on and load the page. Is the page title announced, and does it say where you are?</li>
        <li>
          Press <kbd>H</kbd> repeatedly. Does the heading outline describe the page, in
          order, with one level 1?
        </li>
        <li>
          Press <kbd>D</kbd> (NVDA) or <kbd>R</kbd> (JAWS). Are there named landmarks, and
          is every part of the page inside one?
        </li>
        <li>
          <kbd>Tab</kbd> through the interactive elements. Does each announce a{' '}
          <em>name</em>, a <em>role</em>, and, where it has one, a <em>state</em>?
        </li>
        <li>Open a dialog. Is it announced as a dialog, with a name?</li>
        <li>Trigger an async action. Do you hear the result without going to look for it?</li>
        <li>Submit an invalid form. Are you told what is wrong, and taken to it?</li>
      </ol>

      {/* ── AUTOMATED ────────────────────────────────────────────────────── */}
      <h3 id="automated">4. Automated tools — and what they cannot see</h3>
      <p className="note note-warning">
        <strong>The number that matters:</strong> automated accessibility testing detects
        roughly a third of WCAG issues. Published figures vary with methodology and with
        who is publishing them — vendor studies that include guided manual steps report
        higher, and independent audits of automated-only scanning often report lower.
        Treat &ldquo;about a third&rdquo; as an order of magnitude, not a measurement. The
        important half of the sentence is the other one:{' '}
        <strong>a clean automated scan tells you almost nothing about whether your site
        is usable.</strong>
      </p>

      <div className="table-scroll">
        <table className="data-table">
          <caption>What each kind of check is actually good for</caption>
          <thead>
            <tr>
              <th scope="col">Check</th>
              <th scope="col">Catches reliably</th>
              <th scope="col">Cannot see</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">axe DevTools / axe-core</th>
              <td>
                Missing alt, missing form labels, missing accessible names, contrast on
                plain backgrounds, duplicate ids, invalid ARIA attributes and roles,
                missing document language, ARIA required-children violations.
              </td>
              <td>
                Whether the alt text is <em>right</em>. Whether focus order makes sense.
                Whether the modal traps focus. Whether the announcement is useful. Whether
                the heading structure describes the page.
              </td>
            </tr>
            <tr>
              <th scope="row">Lighthouse accessibility score</th>
              <td>
                A subset of axe rules, packaged as a number. Useful as a regression gate in
                CI.
              </td>
              <td>
                Everything above, plus: a score of 100 is routine on completely unusable
                pages. It is a smoke alarm, not an inspection.
              </td>
            </tr>
            <tr>
              <th scope="row">WAVE (browser extension)</th>
              <td>
                Structure visualised in place — headings, landmarks, alt text, contrast,
                overlaid on the real page. Excellent for a fast eyeball.
              </td>
              <td>Anything requiring interaction: dialogs, menus, async states.</td>
            </tr>
            <tr>
              <th scope="row">HTML validator</th>
              <td>
                Duplicate ids, mis-nested elements, and broken attribute syntax — all of
                which quietly corrupt the accessibility tree.
              </td>
              <td>Everything semantic.</td>
            </tr>
            <tr>
              <th scope="row">Browser accessibility tree (devtools)</th>
              <td>
                The authoritative answer to &ldquo;what is this control&rsquo;s name and
                role?&rdquo; — better than guessing from the markup.
              </td>
              <td>Behaviour over time; anything about focus movement.</td>
            </tr>
            <tr>
              <th scope="row">A keyboard and ten minutes</th>
              <td>
                Focus traps, missing focus indicators, unreachable controls, illogical tab
                order, dialogs that leak — most of the highest-severity issues.
              </td>
              <td>Naming, alt text quality, announcement quality.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4>What to automate in CI, and what to leave to people</h4>
      <ul>
        <li>
          <strong>Automate:</strong> axe-core in your component tests (this repository does
          exactly that), so a missing label or a duplicate id can never merge.
        </li>
        <li>
          <strong>Automate:</strong> focus behaviour. Focus traps, focus restoration, and
          roving tabindex are all testable in jsdom — see this project&rsquo;s test suite.
        </li>
        <li>
          <strong>Do not pretend to automate:</strong> whether the alt text is correct,
          whether an error message is comprehensible, whether the reading order tells the
          story, whether the experience is any good. Those need a person, and ideally a
          person who uses assistive technology every day.
        </li>
      </ul>

      <h3 id="further">Primary sources</h3>
      <ul>
        <li>
          W3C — <em>Web Content Accessibility Guidelines (WCAG) 2.1</em>, and the{' '}
          <em>Understanding</em> and <em>Techniques</em> documents that accompany each
          criterion. The <em>Understanding</em> pages are where the actual answers are.
        </li>
        <li>
          U.S. Access Board — <em>Revised Section 508 Standards and Section 255
          Guidelines</em> (published 2017, compliance date 18 January 2018). E205.4 is the
          provision that incorporates WCAG 2.0 Level A and AA for electronic content;
          Chapter 3 holds the Functional Performance Criteria.
        </li>
        <li>
          W3C — <em>ARIA Authoring Practices Guide</em>, for the keyboard model of every
          composite widget.
        </li>
        <li>
          U.S. Department of Justice — the 2024 ADA Title II web and mobile accessibility
          rule, which adopts WCAG 2.1 Level AA for state and local government.
        </li>
        <li>
          WebAIM — the annual <em>WebAIM Million</em> survey of the top million home pages,
          and the periodic screen reader user surveys.
        </li>
      </ul>
    </>
  );
}
