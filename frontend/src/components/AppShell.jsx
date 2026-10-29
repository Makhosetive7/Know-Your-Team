import { useEffect, useState } from 'react';
import { NavLink, Outlet, useParams } from 'react-router';
import styled from 'styled-components';

import { useAuth } from '@/features/auth/use-auth';
import { MEMBERSHIP_ROLE } from '@/types/team';
import { ApiError } from '@/services/http';
import { getTeam } from '@/services/team-service';

import { BrandLockup } from './BrandLockup';
import { Button, BUTTON_VARIANT } from './Button';

/**
 * Authenticated chrome with team navigation when a team is in the URL.
 */
export function AppShell() {
  const { user, signOut } = useAuth();
  const { teamId } = useParams();
  const label = user?.displayName ?? user?.email ?? 'Account';
  const [adminForTeamId, setAdminForTeamId] = useState(/** @type {string | null} */ (null));
  const isTeamAdmin = teamId != null && adminForTeamId === teamId;
  const homeTo = teamId ? `/teams/${teamId}` : '/teams';

  useEffect(() => {
    if (!teamId) {
      return undefined;
    }
    let cancelled = false;
    async function loadRole() {
      try {
        const team = await getTeam(teamId);
        if (!cancelled && team.role === MEMBERSHIP_ROLE.TEAM_ADMINISTRATOR) {
          setAdminForTeamId(teamId);
        }
      } catch (error) {
        if (!(error instanceof ApiError && (error.status === 401 || error.status === 404))) {
          console.error('Failed to load team navigation', error);
        }
      }
    }
    loadRole();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  return (
    <Shell>
      <TopBar>
        <BrandLockup to={homeTo} />
        {teamId ? (
          <Nav>
            <NavItem to={`/teams/${teamId}`} end>
              Today
            </NavItem>
            <NavItem to={`/teams/${teamId}/progress`}>Progress</NavItem>
            <NavItem to={`/teams/${teamId}/history`}>History</NavItem>
            {isTeamAdmin ? <NavItem to={`/teams/${teamId}/settings`}>Admin</NavItem> : null}
          </Nav>
        ) : (
          <Nav>
            <NavItem to="/teams" end>
              Teams
            </NavItem>
          </Nav>
        )}
        <Actions>
          {user?.isSuperuser ? <NavItem to="/admin/activities">Library</NavItem> : null}
          <NavItem to="/profile">{label}</NavItem>
          <Button
            variant={BUTTON_VARIANT.GHOST}
            fullWidth={false}
            onClick={() => {
              void signOut();
            }}
          >
            Sign out
          </Button>
        </Actions>
      </TopBar>
      <Content>
        <Outlet />
      </Content>
    </Shell>
  );
}

const Shell = styled.div`
  min-height: 100vh;
`;

const TopBar = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => `${theme.space.md} ${theme.space.lg}`};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.ink};
`;

const Nav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  flex: 1;
`;

const NavItem = styled(NavLink)`
  padding: ${({ theme }) => `${theme.space.xs} ${theme.space.md}`};
  border-radius: ${({ theme }) => theme.radius.pill};
  color: ${({ theme }) => theme.color.inkMuted};
  font-weight: 600;
  text-decoration: none;

  &.active {
    color: ${({ theme }) => theme.color.accent};
    background: ${({ theme }) => theme.color.accentSoft};
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`;

const Content = styled.div`
  max-width: 44rem;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.xl} ${({ theme }) => theme.space.lg};
`;
