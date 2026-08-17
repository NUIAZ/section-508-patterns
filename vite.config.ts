// `vitest/config` re-exports Vite's defineConfig with the `test` block typed, so one
// config file can drive both `vite build` and `vitest run` without a `any` cast.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration.
 *
 * WHY `base: './'`
 * ----------------
 * GitHub Pages serves project sites from a sub-path (https://<user>.github.io/<repo>/).
 * A root-absolute base ('/') would make the built bundle request /assets/... which 404s
 * on a project page. A *relative* base makes every emitted asset URL relative to the
 * document, so the same build works from the repo sub-path, from a local `vite preview`,
 * and from a plain `file://` open. That last one matters here: this repo is a reference
 * people fork and poke at, and "just open dist/index.html" should work.
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // Sourcemaps are cheap here and make the "view the real source" promise of this
    // site literally true in devtools as well as in the on-page code blocks.
    sourcemap: true,
    outDir: 'dist',
  },
  test: {
    // jsdom gives us a DOM with focus management, which is the single most important
    // thing to be able to assert on in an accessibility test suite.
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
