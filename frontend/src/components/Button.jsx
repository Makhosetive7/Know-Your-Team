import styled from 'styled-components';

export const BUTTON_VARIANT = Object.freeze({
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  GHOST: 'ghost',
});

/**
 * @typedef {object} ButtonProps
 * @property {import('react').ReactNode} children
 * @property {'button' | 'submit'} [type]
 * @property {'primary' | 'secondary' | 'ghost'} [variant]
 * @property {boolean} [disabled]
 * @property {boolean} [fullWidth]
 * @property {() => void} [onClick]
 */

/**
 * @param {ButtonProps} props
 */
export function Button({
  children,
  type = 'button',
  variant = BUTTON_VARIANT.PRIMARY,
  disabled,
  fullWidth = true,
  onClick,
}) {
  return (
    <StyledButton
      type={type}
      $variant={variant}
      $fullWidth={fullWidth}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </StyledButton>
  );
}

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  min-height: 2.75rem;
  padding: ${({ theme }) => `${theme.space.sm} ${theme.space.md}`};
  border: 1px solid
    ${({ theme, $variant }) => {
      if ($variant === BUTTON_VARIANT.GHOST) {
        return 'transparent';
      }
      return $variant === BUTTON_VARIANT.SECONDARY ? theme.color.border : theme.color.accent;
    }};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme, $variant }) => {
    if ($variant === BUTTON_VARIANT.GHOST) {
      return 'transparent';
    }
    return $variant === BUTTON_VARIANT.SECONDARY ? theme.color.surface : theme.color.accent;
  }};
  color: ${({ theme, $variant }) =>
    $variant === BUTTON_VARIANT.PRIMARY ? theme.color.surface : theme.color.ink};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme, $variant }) => {
      if ($variant === BUTTON_VARIANT.PRIMARY) {
        return theme.color.accentHover;
      }
      return theme.color.accentSoft;
    }};
    border-color: ${({ theme, $variant }) =>
      $variant === BUTTON_VARIANT.GHOST ? 'transparent' : theme.color.accent};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;
