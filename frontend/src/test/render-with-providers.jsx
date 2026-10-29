import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from 'styled-components';

import { AuthContext } from '@/features/auth/auth-context';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { THEME } from '@/styles/theme';

/**
 * @typedef {object} RenderWithProvidersOptions
 * @property {string} [route]
 * @property {import('../features/auth/auth-context').AuthContextValue} [authValue]
 */

/**
 * Render UI with theme, router, and auth.
 *
 * @param {import('react').ReactElement} ui
 * @param {RenderWithProvidersOptions} [options]
 * @returns {import('@testing-library/react').RenderResult}
 */
export function renderWithProviders(ui, { route = '/', authValue, ...options } = {}) {
  const routed = (
    <MemoryRouter initialEntries={[route]}>
      {authValue ? (
        <AuthContext.Provider value={authValue}>{ui}</AuthContext.Provider>
      ) : (
        <AuthProvider>{ui}</AuthProvider>
      )}
    </MemoryRouter>
  );

  return render(<ThemeProvider theme={THEME}>{routed}</ThemeProvider>, options);
}
