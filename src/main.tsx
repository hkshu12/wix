import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { AppRouter } from './router/AppRouter';
import { ThemeProvider } from './theme/ThemeProvider';
import './layout/safeArea.css';
import './theme/tokens.css';

registerSW({ immediate: true });

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter basename={routerBasename}>
        <AppRouter />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
