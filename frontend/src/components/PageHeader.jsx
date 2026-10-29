import styled from 'styled-components';

/**
 * @typedef {object} PageHeaderProps
 * @property {string} title
 * @property {string} [eyebrow]
 * @property {import('react').ReactNode} [children]
 */

/**
 * @param {PageHeaderProps} props
 */
export function PageHeader({ title, eyebrow, children }) {
  return (
    <Header>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Title>{title}</Title>
      {children}
    </Header>
  );
}

const Header = styled.header`
  margin-bottom: ${({ theme }) => theme.space.lg};
`;

const Eyebrow = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.sm};
  color: ${({ theme }) => theme.color.accent};
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.85rem, 4vw, 2.4rem);
`;
