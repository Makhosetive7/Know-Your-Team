import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { THEME } from '@/styles/theme';

/**
 * Render UI inside the app theme so styled-components tokens resolve in tests.
 *
 * @param {import('react').ReactElement} ui
 * @param {import('@testing-library/react').RenderOptions} [options]
 * @returns {import('@testing-library/react').RenderResult}
 */
export function renderWithTheme(ui, options) {
  return render(<ThemeProvider theme={THEME}>{ui}</ThemeProvider>, options);
}
