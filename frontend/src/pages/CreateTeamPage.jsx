import { useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';

import { Button } from '@/components/Button';
import { ErrorMessage } from '@/components/ErrorMessage';
import { PageHeader } from '@/components/PageHeader';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import { guessTimezone, listTimezones } from '@/lib/timezones';
import { ApiError } from '@/services/http';
import { createTeam } from '@/services/team-service';

/**
 * Create a team and become its administrator.
 */
export function CreateTeamPage() {
  const navigate = useNavigate();
  const timezones = listTimezones();
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState(guessTimezone());
  const [errorMessage, setErrorMessage] = useState(/** @type {string | null} */ (null));
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * @param {import('react').FormEvent<HTMLFormElement>} event
   * @returns {Promise<void>}
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const team = await createTeam({ name, timezone });
      navigate(`/teams/${team.id}`, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not create the team.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <PageHeader eyebrow="New workspace" title="Create a team">
        <Lead>The team timezone decides which activity is today.</Lead>
      </PageHeader>
      <Form onSubmit={handleSubmit}>
        <TextField
          id="teamName"
          label="Team name"
          value={name}
          required
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
        <SelectField
          id="timezone"
          label="Timezone"
          value={timezone}
          options={timezones.includes(timezone) ? timezones : [timezone, ...timezones]}
          required
          onChange={(event) => {
            setTimezone(event.target.value);
          }}
        />
        <ErrorMessage message={errorMessage} />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create team'}
        </Button>
      </Form>
    </section>
  );
}

const Lead = styled.p`
  margin: ${({ theme }) => theme.space.md} 0 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;
