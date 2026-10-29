import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import styled from 'styled-components';

import { Button, BUTTON_VARIANT } from '@/components/Button';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { MEMBERSHIP_ROLE } from '@/types/team';
import { ApiError } from '@/services/http';
import { listTeams } from '@/services/team-service';

/** @typedef {import('../types/team').Team} Team */

/**
 * Signed-in team list, or create/join when the user has none.
 */
export function TeamsPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState(/** @type {Team[] | null} */ (null));
  const [errorMessage, setErrorMessage] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await listTeams();
        if (!cancelled) {
          setTeams(rows);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof ApiError ? error.message : 'Could not load your teams.');
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (teams == null) {
    if (errorMessage) {
      return (
        <section>
          <PageHeader title="Your teams" />
          <ErrorMessage message={errorMessage} />
        </section>
      );
    }
    return <LoadingState />;
  }

  if (teams.length === 0) {
    return (
      <section>
        <PageHeader eyebrow="Get started" title="Create or join a team">
          <Lead>Every member of a team sees the same short activity each day.</Lead>
        </PageHeader>
        <Actions>
          <Button onClick={() => navigate('/teams/new')}>Create a team</Button>
          <Button variant={BUTTON_VARIANT.SECONDARY} onClick={() => navigate('/join')}>
            Join with an invite
          </Button>
        </Actions>
      </section>
    );
  }

  return (
    <section>
      <PageHeader eyebrow="Your workspace" title="Your teams" />
      <ErrorMessage message={errorMessage} />
      <List>
        {(teams ?? []).map((team) => (
          <Item key={team.id}>
            <TeamLink to={`/teams/${team.id}`}>
              <strong>{team.name}</strong>
              <Meta>
                {team.role === MEMBERSHIP_ROLE.TEAM_ADMINISTRATOR ? 'Administrator' : 'Member'} ·{' '}
                {team.timezone}
              </Meta>
            </TeamLink>
          </Item>
        ))}
      </List>
      <Actions>
        <Button variant={BUTTON_VARIANT.SECONDARY} onClick={() => navigate('/teams/new')}>
          Create another team
        </Button>
        <Button variant={BUTTON_VARIANT.GHOST} onClick={() => navigate('/join')}>
          Join with an invite
        </Button>
      </Actions>
    </section>
  );
}

const Lead = styled.p`
  margin: ${({ theme }) => theme.space.md} 0 0;
`;

const List = styled.ul`
  list-style: none;
  margin: 0 0 ${({ theme }) => theme.space.lg};
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`;

const Item = styled.li`
  margin: 0;
`;

const TeamLink = styled(Link)`
  display: block;
  padding: ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.ink};
  text-decoration: none;

  &:hover {
    border-color: ${({ theme }) => theme.color.accent};
  }
`;

const Meta = styled.p`
  margin: ${({ theme }) => theme.space.xs} 0 0;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 0.875rem;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`;
