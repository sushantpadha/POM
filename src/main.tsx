import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { isOn } from './logic/experiment';
import { useStore } from './store/store';
import { startExperimentSession } from './components/dialogs/ExperimentSettings';

// Experiment mode: one session per page load (nothing is logged when the mode is off).
if (isOn()) startExperimentSession();
window.addEventListener('pagehide', () => useStore.getState().track('session_end', { reason: 'page closed' }));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
