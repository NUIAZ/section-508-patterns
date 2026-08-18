/// <reference types="vite/client" />

/**
 * Brings in Vite's ambient module declarations, most importantly the one that lets a
 * `.css` file be imported for its side effect, and the `?raw` / `?url` import suffixes.
 * Without this, `import './styles/global.css'` is a type error under `strict`.
 */
