import { describe, expect, it } from 'vitest';

import { THEME } from './theme';

describe('THEME', () => {
  it('locks the agreed palette', () => {
    expect(THEME.color).toEqual({
      bg: '#EFE4D4',
      surface: '#FFF8EE',
      ink: '#1F1712',
      inkMuted: '#6B5C50',
      accent: '#B54A2C',
      accentHover: '#933C24',
      accentSoft: '#F3D9CC',
      border: '#E4D2BE',
      danger: '#B42318',
    });
  });

  it('uses Figtree for UI and Fraunces for display', () => {
    expect(THEME.font.ui).toContain('Figtree');
    expect(THEME.font.display).toContain('Fraunces');
  });
});
