import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import styled from 'styled-components';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CenteredLayout } from '@/components/CenteredLayout';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { TextField } from '@/components/TextField';
import { TextLink } from '@/components/TextLink';
import { useAuth } from '@/features/auth/use-auth';
import { guestHref } from '@/lib/safe-next-path';
import { ApiError } from '@/services/http';
import { joinTeam, previewInvitation } from '@/services/invitation-service';

/**
 * Preview and redeem an invitation token.
 */
export function JoinPage() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get('token') ?? '';
  const [draftToken, setDraftToken] = useState(/** @type {string | null} */ (null));
  const token = draftToken ?? queryToken;
  const [teamName, setTeamName] = useState(/** @type {string | null} */ (null));
  const [errorMessage, setErrorMessage] = useState(/** @type {string | null} */ (null));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (queryToken === '') {
      return undefined;
    }
    let cancelled = false;
    async function loadPreview() {
      try {
        const name = await previewInvitation(queryToken);
        if (!cancelled) {
          setTeamName(name);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setTeamName(null);
          setErrorMessage(error instanceof ApiError ? error.message : 'Invitation not found.');
        }
      }
    }
    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [queryToken]);

  /**
   * @param {import('react').FormEvent<HTMLFormElement>} event
   * @returns {Promise<void>}
   */
  async function handleSubmit(event) {
    event.preventDefault();
    if (status !== 'authenticated') {
      navigate(guestHref('/sign-in', `/join?token=${encodeURIComponent(token)}`));
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const team = await joinTeam(token);
      navigate(`/teams/${team.id}`, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not join the team.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const nextPath = token === '' ? '/join' : `/join?token=${encodeURIComponent(token)}`;

  return (
    <CenteredLayout>
      <Card>
        <PageHeader eyebrow="Invitation" title={teamName ? `Join ${teamName}` : 'Join a team'}>
          <Lead>
            {status === 'authenticated'
              ? 'Join and you land on today for this team, not a dashboard.'
              : "Sign in or create an account. After you join, you see today's prompt."}
          </Lead>
        </PageHeader>
        {queryToken && teamName == null && errorMessage == null ? <LoadingState /> : null}
        <Form onSubmit={handleSubmit}>
          <TextField
            id="token"
            label="Invite token"
            value={token}
            required
            onChange={(event) => {
              setDraftToken(event.target.value);
            }}
          />
          <ErrorMessage message={errorMessage} />
          {status === 'authenticated' ? (
            <>
              <Button type="submit" disabled={isSubmitting || token === ''}>
                {isSubmitting ? 'Joining…' : 'Join team'}
              </Button>
              <TextLink to="/teams">Back to your teams</TextLink>
            </>
          ) : (
            <Actions>
              <TextLink to={guestHref('/sign-in', nextPath)}>Sign in to join</TextLink>
              <TextLink to={guestHref('/register', nextPath)}>Create an account</TextLink>
            </Actions>
          )}
        </Form>
      </Card>
    </CenteredLayout>
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

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`;
