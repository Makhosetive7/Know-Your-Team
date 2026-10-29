import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    min-height: 100%;
  }

  body {
    margin: 0;
    background-color: ${({ theme }) => theme.color.bg};
    background-image: radial-gradient(
      1200px 640px at 12% -10%,
      rgb(181 74 44 / 12%),
      transparent 55%
    );
    color: ${({ theme }) => theme.color.ink};
    font-family: ${({ theme }) => theme.font.ui};
    font-size: 1rem;
    line-height: 1.5;
  }

  h1,
  h2,
  h3 {
    font-family: ${({ theme }) => theme.font.display};
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }

  button,
  input,
  select,
  textarea {
    font-family: inherit;
  }
`;
