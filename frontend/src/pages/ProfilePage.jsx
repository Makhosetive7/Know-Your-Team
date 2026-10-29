import { useState } from 'react';
import styled from 'styled-components';

import { Button } from '@/components/Button';
import { ErrorMessage } from '@/components/ErrorMessage';
import { PageHeader } from '@/components/PageHeader';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/features/auth/use-auth';
import { ApiError } from '@/services/http';

/**
 * Basic profile for the signed-in user.
 */
export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [errorMessage, setErrorMessage] = useState(/** @type {string | null} */ (null));
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /**
   * @param {import('react').FormEvent<HTMLFormElement>} event
   * @returns {Promise<void>}
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaved(false);
    try {
      await updateProfile({ displayName: displayName.trim() === '' ? null : displayName.trim() });
      setSaved(true);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not save your profile.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section>
      <PageHeader eyebrow="Account" title="Profile" />
      <Note>{user?.email}</Note>
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
        <ErrorMessage message={errorMessage} />
        {saved ? <Saved>Saved.</Saved> : null}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save profile'}
        </Button>
      </Form>
    </section>
  );
}

const Note = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.lg};
  color: ${({ theme }) => theme.color.inkMuted};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;

const Saved = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.accent};
  font-weight: 600;
`;
