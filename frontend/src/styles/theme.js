/**
 * Visual tokens for the Know Your Team UI.
 * Components read these through ThemeProvider; do not copy hex values into styled pieces.
 *
 * Direction: a shared table, not a dashboard. Linen room, cream prompt card, clay
 * for the one action of the day. Display type carries the ritual; UI type stays quiet.
 *
 * @typedef {typeof THEME} Theme
 */

export const THEME = Object.freeze({
  color: Object.freeze({
    bg: '#EFE4D4',
    surface: '#FFF8EE',
    ink: '#1F1712',
    inkMuted: '#6B5C50',
    accent: '#B54A2C',
    accentHover: '#933C24',
    accentSoft: '#F3D9CC',
    border: '#E4D2BE',
    danger: '#B42318',
  }),
  font: Object.freeze({
    ui: '"Figtree", system-ui, sans-serif',
    display: '"Fraunces", Georgia, serif',
  }),
  radius: Object.freeze({
    md: '12px',
    lg: '22px',
    pill: '999px',
  }),
  shadow: '0 18px 50px rgb(31 23 18 / 10%)',
  space: Object.freeze({
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  }),
});
