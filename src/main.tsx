import { createRoot } from 'react-dom/client';

// Import polyfills first
import './lib/polyfills.ts';

import App from './App.tsx';
import './index.css';

// Custom fonts can be added by importing from '@fontsource-variable/<font-name>'

createRoot(document.getElementById("root")!).render(<App />);
