import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './app/fonts.css';
import './app/styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('missing #root');
createRoot(root).render(<App />);
