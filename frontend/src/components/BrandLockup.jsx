import { Link } from 'react-router';
import styled, { css } from 'styled-components';

/**
 * @typedef {object} BrandLockupProps
 * @property {string} [to]
 */

/**
 * Product mark and name: one shared day.
 *
 * @param {BrandLockupProps} props
 */
export function BrandLockup({ to }) {
  const contents = (
    <>
      <Mark aria-hidden="true" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="16" r="4.5" />
      </Mark>
      <Word>Know Your Team</Word>
    </>
  );

  if (to) {
    return <LockupLink to={to}>{contents}</LockupLink>;
  }

  return <Lockup>{contents}</Lockup>;
}

const lockupStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: inherit;
  text-decoration: none;
`;

const Lockup = styled.p`
  ${lockupStyles}
  margin: 0;
`;

const LockupLink = styled(Link)`
  ${lockupStyles}
`;

const Mark = styled.svg`
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  color: ${({ theme }) => theme.color.accent};
`;

const Word = styled.span`
  font-family: ${({ theme }) => theme.font.display};
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
`;
