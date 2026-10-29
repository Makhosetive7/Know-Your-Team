import styled from 'styled-components';

/**
 * @typedef {object} ErrorMessageProps
 * @property {string | null} [message]
 */

/**
 * @param {ErrorMessageProps} props
 */
export function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return <Text role="alert">{message}</Text>;
}

const Text = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.danger};
`;
