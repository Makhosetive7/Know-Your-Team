import { useState } from 'react';
import styled from 'styled-components';

import { Button } from '@/components/Button';
import { ErrorMessage } from '@/components/ErrorMessage';
import { TextField } from '@/components/TextField';

/**
 * @typedef {object} SignInFormProps
 * @property {string | null} [errorMessage]
 * @property {boolean} [isSubmitting]
 * @property {(params: { email: string, password: string }) => void} onSubmit
 */

/**
 * @param {SignInFormProps} props
 */
export function SignInForm({ errorMessage, isSubmitting, onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /**
   * @param {import('react').FormEvent<HTMLFormElement>} event
   */
  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ email, password });
  }

  return (
    <Form onSubmit={handleSubmit}>
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
        autoComplete="current-password"
        required
        onChange={(event) => {
          setPassword(event.target.value);
        }}
      />
      <ErrorMessage message={errorMessage} />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </Form>
  );
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;
