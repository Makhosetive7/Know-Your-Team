import '@fontsource/figtree/400.css';
import '@fontsource/figtree/500.css';
import '@fontsource/figtree/600.css';
import '@fontsource/fraunces/500.css';
import '@fontsource/fraunces/500-italic.css';
import '@fontsource/fraunces/600.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { ThemeProvider } from 'styled-components';

import { App } from '@/App';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { GlobalStyle } from '@/styles/global-style';
import { THEME } from '@/styles/theme';

const rootElement = document.getElementById('root');

if (rootElement == null) {
  throw new Error('Root element #root was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider theme={THEME}>
      <GlobalStyle />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
