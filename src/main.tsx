import { createRoot } from 'react-dom/client';

// Import polyfills first
import './lib/polyfills.ts';

import App from './App.tsx';
import './index.css';

// TODO: include a custom font if desired

createRoot(document.getElementById("root")!).render(<App />);
