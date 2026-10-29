import { Link } from 'react-router';
import styled from 'styled-components';

/**
 * @typedef {object} TextLinkProps
 * @property {string} to
 * @property {import('react').ReactNode} children
 */

/**
 * @param {TextLinkProps} props
 */
export function TextLink({ to, children }) {
  return <StyledLink to={to}>{children}</StyledLink>;
}

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.color.accent};
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;
