import styled from 'styled-components';

/**
 * @typedef {object} LoadingStateProps
 * @property {string} [message]
 */

/**
 * @param {LoadingStateProps} props
 */
export function LoadingState({ message = 'Loading…' }) {
  return <Text>{message}</Text>;
}

const Text = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.inkMuted};
`;
