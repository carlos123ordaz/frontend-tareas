import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { HashRouter } from 'react-router-dom';
import { ThemeContextProvider } from './contexts/ThemeContext.jsx';
import { AuthContextProvider } from './contexts/AuthContext.jsx';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/es';

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <AuthContextProvider>
      <ThemeContextProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
          <App />
        </LocalizationProvider>
      </ThemeContextProvider>
    </AuthContextProvider>
  </HashRouter>
);
