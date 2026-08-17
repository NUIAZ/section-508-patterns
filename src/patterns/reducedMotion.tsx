import { useState, type ReactNode } from 'react';
import type { DemoProps, PatternMeta } from '../lib/types';
import { usePrefersReducedMotion } from '../lib/theme';

/**
 * `prefers-reduced-motion`.
 *
 * Vestibular disorders are common enough — and the effect strong enough — that a
 * parallax hero or a spinning loader can cause genuine nausea and disorientation, not
 * merely annoyance. The OS-level setting exists precisely so people do not have to hunt
 * for a per-site preference, and honouring it costs one media query.
 *
 * The demo includes a manual "simulate reduced motion" checkbox, because most visitors
 * will not have the OS setting turned on and would otherwise see no difference at all.
 * The panel also reports what the real media query currently says.
 */
function Demo({ broken, idPrefix }: DemoProps): ReactNode {
  const systemReduced = usePrefersReducedMotion();
  const [simulate, setSimulate] = useState(false);
  const [playing, setPlaying] = useState(true);

  const reduced = systemReduced || simulate;
  const scope = `${idPrefix}-motion`;

  // The accessible version: the animation is defined once, then neutralised inside the
  // media query. Note it becomes a *state change* rather than nothing — the element still
  // ends up in the right place, it just gets there instantly.
  const goodCss = `
    @keyframes ${scope}-slide {
      from { transform: translateX(0) rotate(0deg); }
      to   { transform: translateX(11rem) rotate(360deg); }
    }
    #${scope} .mover {
      animation: ${scope}-slide 1.6s ease-in-out infinite alternate;
    }
    #${scope}[data-paused='true'] .mover { animation-play-state: paused; }
    #${scope}[data-reduced='true'] .mover {
      animation: none;
      transform: translateX(5.5rem);
    }
    @media (prefers-reduced-motion: reduce) {
      #${scope} .mover { animation: none; transform: translateX(5.5rem); }
    }
  `;

  // The broken version: no media query, no pause control, infinite, and fast enough to be
  // genuinely unpleasant.
  const badCss = `
    @keyframes ${scope}-spin {
      from { transform: translateX(0) rotate(0deg) scale(1); }
      50%  { transform: translateX(11rem) rotate(540deg) scale(1.4); }
      to   { transform: translateX(0) rotate(1080deg) scale(1); }
    }
    #${scope} .mover {
      animation: ${scope}-spin 1.1s linear infinite;
    }
  `;

  return (
    <div id={scope} data-reduced={reduced ? 'true' : 'false'} data-paused={playing ? 'false' : 'true'}>
      <style>{broken ? badCss : goodCss}</style>

      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1rem',
          overflow: 'hidden',
        }}
      >
        <div
          className="mover"
          // Decorative: it carries no information, so it is hidden from assistive
          // technology rather than described.
          aria-hidden="true"
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: 'var(--radius)',
            background: 'var(--accent)',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBlockStart: '0.75rem', alignItems: 'center' }}>
        {broken ? (
          <p className="note note-warning" style={{ margin: 0 }}>
            No pause control, no media query, and it never stops. This is also a{' '}
            <strong>SC 2.2.2 Pause, Stop, Hide (Level A)</strong> failure: any motion that
            starts automatically, lasts more than five seconds, and is presented alongside
            other content needs a mechanism to pause it.
          </p>
        ) : (
          <>
            <button type="button" className="btn" onClick={() => setPlaying((p) => !p)}>
              {playing ? 'Pause animation' : 'Play animation'}
            </button>
            <label
              htmlFor={`${idPrefix}-simulate`}
              style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', margin: 0 }}
            >
              <input
                id={`${idPrefix}-simulate`}
                type="checkbox"
                checked={simulate}
                onChange={(event) => setSimulate(event.target.checked)}
                style={{ width: 'auto' }}
              />
              Simulate &ldquo;reduce motion&rdquo;
            </label>
          </>
        )}
      </div>

      <p className="hint" style={{ marginBlockEnd: 0 }}>
        Your system currently reports{' '}
        <strong>
          prefers-reduced-motion: {systemReduced ? 'reduce' : 'no-preference'}
        </strong>
        . On Windows: Settings → Accessibility → Visual effects → Animation effects. macOS:
        System Settings → Accessibility → Display → Reduce motion. iOS and Android have the
        same setting under Accessibility.
      </p>
    </div>
  );
}

const SOURCE = `/* Define the animation, then neutralise it. Note that the element
   still ENDS UP in the right state — it just gets there instantly.
   Removing the animation must not remove the outcome. */
@keyframes slide-in {
  from { transform: translateX(-2rem); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}

.panel { animation: slide-in 300ms ease-out; }

@media (prefers-reduced-motion: reduce) {
  .panel { animation: none; }          /* final state, no journey */
}

/* A global backstop for everything you forgot. 0.01ms rather than 0
   so transitionend / animationend listeners still fire and nothing
   hangs waiting for an event that never arrives. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Read it in JavaScript for things CSS cannot reach — canvas,
   WebGL, an autoplaying video, a physics-based scroll library. */
const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduced = mql.matches;
mql.addEventListener('change', (e) => setReduced(e.matches));

/* What "reduce" should actually mean, in order of preference:
     1. Remove the movement, keep the outcome.
     2. Cross-fade instead of translating or zooming.
     3. Shorten it drastically.
   What it must NOT mean: removing the feature.

   The worst offenders are parallax, auto-playing carousels, and
   large-area zoom or spin transitions — motion that fills the
   viewport is far more provocative than a small one.

   Also required regardless of the media query, at Level A:
     SC 2.2.2 Pause, Stop, Hide — anything that moves automatically,
       lasts more than 5 seconds, and sits alongside other content
       needs a pause/stop/hide control.
     SC 2.3.1 Three Flashes or Below Threshold — nothing may flash
       more than three times per second. This one is a seizure risk,
       not a comfort preference. */`;

/**
 * Registry entry for the reduced-motion pattern. Worth being precise about what is a
 * preference and what is a requirement, because the card is easy to read as "be considerate
 * about animation": `prefers-reduced-motion` is an OS signal with no criterion of its own,
 * SC 2.2.2 is a hard Level A requirement for anything auto-moving beyond five seconds, and
 * SC 2.3.1 is a seizure-risk threshold rather than a comfort setting.
 *
 * Claims SC 2.2.2 Pause, Stop, Hide (A), SC 2.3.1 Three Flashes or Below Threshold (A) and
 * SC 2.3.3 Animation from Interactions (AAA, WCAG 2.1). The broken variant fails 2.2.2 as
 * well as ignoring the media query, since it offers no way to stop the animation at all.
 */
export const reducedMotionPattern: PatternMeta = {
  id: 'reduced-motion',
  title: 'Respecting reduced motion',
  problem:
    'Large or repetitive movement can cause nausea, dizziness, and migraine in people with vestibular disorders, and it makes content hard to read for anyone with an attention or reading difficulty. The operating system already knows who those people are — the site just has to ask.',
  keywords: ['prefers-reduced-motion', 'animation', 'parallax', 'vestibular', 'pause stop hide', 'carousel'],
  criteria: [
    {
      number: '2.2.2',
      name: 'Pause, Stop, Hide',
      level: 'A',
      since: '2.0',
      why: 'This is the criterion that actually binds at Level A: anything moving, blinking or scrolling that starts automatically, runs more than five seconds, and is presented with other content must have a mechanism to pause, stop, or hide it.',
    },
    {
      number: '2.3.1',
      name: 'Three Flashes or Below Threshold',
      level: 'A',
      since: '2.0',
      why: 'Nothing may flash more than three times in any one second. Unlike the rest of this pattern, this is a seizure-safety rule, not a comfort preference.',
    },
    {
      number: '2.3.3',
      name: 'Animation from Interactions',
      level: 'AAA',
      since: '2.1',
      why: 'Stated accurately: the criterion that specifically requires honouring reduced-motion for interaction animations is Level AAA and WCAG 2.1. Honouring the media query is still the right thing to do — it is simply not what makes you compliant at AA.',
    },
  ],
  section508:
    'Be precise here, because this is a pattern people over-claim. Section 508 incorporates WCAG 2.0 Level A and AA via E205.4, so SC 2.2.2 Pause, Stop, Hide and SC 2.3.1 Three Flashes are 508 requirements. SC 2.3.3 Animation from Interactions — the criterion actually about prefers-reduced-motion — is WCAG 2.1 AND Level AAA, so it is required by neither Section 508 nor WCAG AA. Separately, the Revised 508 Standards do have a directly relevant hardware/software provision: 503.4 requires user controls for captions and audio description, and Chapter 3 Functional Performance Criterion 302.9 covers limited cognitive and learning abilities. Honour the media query because it helps real people, and cite 2.2.2 when you need a requirement to point at.',
  howToTest: {
    keyboard: [
      'Tab to "Pause animation" and press Enter. The motion should stop and the button label should change.',
      'Tab to "Simulate reduce motion" and press Space. The square should snap to its resting position with no movement.',
      'Turn the setting on for real in your OS and reload — the animation should never start.',
      'In the broken version, look for the pause control. There is not one.',
    ],
    screenReader: [
      'The animated square is aria-hidden, so it is announced not at all — correct, because it carries no information.',
      'The pause button announces its current action: "Pause animation, button", then "Play animation, button".',
      'This pattern is mostly not a screen-reader concern. Its users are sighted people with vestibular, migraine, or attention conditions.',
    ],
  },
  source: SOURCE,
  brokenBehaviour:
    'The animation ignores prefers-reduced-motion entirely, runs infinitely at speed with a large translate-rotate-scale, and offers no way to pause it — which also fails SC 2.2.2 at Level A.',
  Demo,
};
