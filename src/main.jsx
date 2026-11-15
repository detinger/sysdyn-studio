import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'reactflow/dist/style.css';
import './index.css';
import App from './App.jsx';
import { MathJaxContext } from 'better-react-mathjax';
import { initTheme } from './app/theme.js';

initTheme();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MathJaxContext>
      <App />
    </MathJaxContext>
  </StrictMode>,
);
