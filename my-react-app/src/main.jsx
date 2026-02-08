import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/** * IDDA Project Styles
 * We import index.css first to set the base variables, 
 * then App.jsx handles specific component styles.
 */
import './styles/index.css'; 

// Main Application Component
import App from './App.jsx';

// Targeting the 'root' div in your public/index.html
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Failed to find the root element. Ensure index.html has <div id='root'></div>");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);