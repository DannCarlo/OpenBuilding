import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Suppress THREE.Clock deprecation warning until @react-three/drei updates.
// THREE r185 deprecated Clock in favor of Timer, but R3F/Drei internals
// (OrbitControls, etc.) still construct Clock instances internally.
const origWarn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('THREE.Clock') && msg.includes('deprecated')) return;
  origWarn(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

