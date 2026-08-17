import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ThemeProvider } from './lib/theme';
import './styles/global.css';

/**
 * Entry point.
 *
 * StrictMode is on deliberately, even though it double-invokes effects in development.
 * Several patterns here manage focus inside effects, and StrictMode's double-invocation is
 * exactly the pressure that exposes a focus handler which is not idempotent — which is a
 * real bug, not a React quirk.
 */
const container = document.getElementById('root');
if (container === null) {
  throw new Error('Root container #root is missing from index.html.');
}

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
