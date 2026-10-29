import { useState } from 'react';
import styled from 'styled-components';

import { Button } from '@/components/Button';
import { ErrorMessage } from '@/components/ErrorMessage';
import { TextField } from '@/components/TextField';

/**
 * @typedef {object} RegisterFormProps
 * @property {string | null} [errorMessage]
 * @property {boolean} [isSubmitting]
 * @property {(params: { email: string, password: string, displayName: string }) => void} onSubmit
 */

/**
 * @param {RegisterFormProps} props
 */
export function RegisterForm({ errorMessage, isSubmitting, onSubmit }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /**
   * @param {import('react').FormEvent<HTMLFormElement>} event
   */
  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ email, password, displayName });
  }

  return (
    <Form onSubmit={handleSubmit}>
      <TextField
        id="displayName"
        label="Display name"
        value={displayName}
        autoComplete="name"
        onChange={(event) => {
          setDisplayName(event.target.value);
        }}
      />
      <TextField
        id="email"
        label="Email"
        type="email"
        value={email}
        autoComplete="email"
        required
        onChange={(event) => {
          setEmail(event.target.value);
        }}
      />
      <TextField
        id="password"
        label="Password"
        type="password"
        value={password}
        autoComplete="new-password"
        required
        onChange={(event) => {
          setPassword(event.target.value);
        }}
      />
      <Hint>At least 8 characters. The server checks this.</Hint>
      <ErrorMessage message={errorMessage} />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>
    </Form>
  );
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;

const Hint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 0.875rem;
`;
