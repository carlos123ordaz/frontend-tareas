import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { HashRouter } from 'react-router-dom';
import { ThemeContextProvider } from './contexts/ThemeContext.jsx';

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <ThemeContextProvider>
      <App />
    </ThemeContextProvider>
  </HashRouter>
);