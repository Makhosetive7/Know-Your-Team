import styled from 'styled-components';

/**
 * @typedef {object} CardProps
 * @property {import('react').ReactNode} children
 */

/**
 * @param {CardProps} props
 */
export function Card({ children }) {
  return <Shell>{children}</Shell>;
}

const Shell = styled.article`
  width: min(100%, 32rem);
  padding: ${({ theme }) => theme.space.xl};
  background: ${({ theme }) => theme.color.surface};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow};
`;
