import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { HashRouter } from 'react-router-dom';
import { ThemeContextProvider } from './contexts/ThemeContext.jsx';
import { AuthContextProvider } from './contexts/AuthContext.jsx';

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <AuthContextProvider>
      <ThemeContextProvider>
        <App />
      </ThemeContextProvider>
    </AuthContextProvider>
  </HashRouter>
);