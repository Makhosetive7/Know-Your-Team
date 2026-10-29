import styled from 'styled-components';

/**
 * @typedef {object} CenteredLayoutProps
 * @property {import('react').ReactNode} children
 */

/**
 * @param {CenteredLayoutProps} props
 */
export function CenteredLayout({ children }) {
  return <Main>{children}</Main>;
}

const Main = styled.main`
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.space.lg};
`;
