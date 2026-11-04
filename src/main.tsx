import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { createAppModules } from './app/modules';
import { systemClock } from './shared/clock';
import './app/fonts.css';
import './app/styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('missing #root');
// Everything is built from the seed on each page load, so a reload starts again (AC4).
createRoot(root).render(<App modules={createAppModules(systemClock)} />);
