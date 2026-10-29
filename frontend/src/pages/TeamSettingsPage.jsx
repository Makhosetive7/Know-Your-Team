import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';

import { Button, BUTTON_VARIANT } from '@/components/Button';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import { ProgressSummary } from '@/features/progress/ProgressSummary';
import { useAuth } from '@/features/auth/use-auth';
import { formatIsoDate } from '@/lib/format-iso-date';
import { groupInvitations, invitationStatus, INVITATION_STATUS } from '@/lib/invitation-status';
import { listTimezones } from '@/lib/timezones';
import { MEMBERSHIP_ROLE } from '@/types/team';
import { ApiError } from '@/services/http';
import {
  createInvitation,
  invitationJoinPath,
  listInvitations,
  revokeInvitation,
} from '@/services/invitation-service';
import { getTeamProgress } from '@/services/progress-service';
import { getTeam, listMembers, removeOrLeaveMember, updateTeam } from '@/services/team-service';

/** @typedef {import('../types/invitation').CreatedInvitation} CreatedInvitation */
/** @typedef {import('../types/invitation').Invitation} Invitation */
/** @typedef {import('../types/progress').TeamProgress} TeamProgress */
/** @typedef {import('../types/team').Team} Team */
/** @typedef {import('../types/team').TeamMember} TeamMember */

/**
 * Team admin home, or a quiet membership page for members.
 */
export function TeamSettingsPage() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const timezones = listTimezones();
  const [team, setTeam] = useState(/** @type {Team | null} */ (null));
  const [members, setMembers] = useState(/** @type {TeamMember[]} */ ([]));
  const [invitations, setInvitations] = useState(/** @type {Invitation[]} */ ([]));
  const [progress, setProgress] = useState(/** @type {TeamProgress | null} */ (null));
  const [createdInvite, setCreatedInvite] = useState(
    /** @type {CreatedInvitation | null} */ (null),
  );
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [errorMessage, setErrorMessage] = useState(/** @type {string | null} */ (null));
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const isAdmin = team?.role === MEMBERSHIP_ROLE.TEAM_ADMINISTRATOR;

  useEffect(() => {
    if (!teamId) {
      return undefined;
    }
    let cancelled = false;
    async function run() {
      try {
        const teamRow = await getTeam(teamId);
        const memberRows = await listMembers(teamId);
        if (cancelled) {
          return;
        }
        setTeam(teamRow);
        setMembers(memberRows);
        setName(teamRow.name);
        setTimezone(teamRow.timezone);
        if (teamRow.role === MEMBERSHIP_ROLE.TEAM_ADMINISTRATOR) {
          const [inviteRows, pulse] = await Promise.all([
            listInvitations(teamId),
            getTeamProgress(teamId),
          ]);
          if (cancelled) {
            return;
          }
          setInvitations(inviteRows);
          setProgress(pulse);
        }
        setErrorMessage(null);
      } catch (error) {
        if (!cancelled) {
          setTeam(null);
          setErrorMessage(error instanceof ApiError ? error.message : 'Could not load the team.');
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [teamId, reloadKey]);

  /**
   * @param {import('react').FormEvent<HTMLFormElement>} event
   * @returns {Promise<void>}
   */
  async function handleSave(event) {
    event.preventDefault();
    if (!teamId) {
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated = await updateTeam({ teamId, name, timezone });
      setTeam(updated);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not update the team.');
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async function handleCreateInvite() {
    if (!teamId) {
      return;
    }
    setErrorMessage(null);
    try {
      const created = await createInvitation({ teamId });
      setCreatedInvite(created);
      setCopied(false);
      setInvitations(await listInvitations(teamId));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not create an invite.');
    }
  }

  /**
   * @param {string} invitationId
   * @returns {Promise<void>}
   */
  async function handleRevoke(invitationId) {
    if (!teamId) {
      return;
    }
    setErrorMessage(null);
    try {
      await revokeInvitation({ teamId, invitationId });
      setInvitations(await listInvitations(teamId));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not revoke the invite.');
    }
  }

  /**
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async function handleRemoveOrLeave(userId) {
    if (!teamId) {
      return;
    }
    setErrorMessage(null);
    try {
      await removeOrLeaveMember({ teamId, userId });
      if (userId === user?.id) {
        navigate('/teams', { replace: true });
        return;
      }
      setReloadKey((key) => key + 1);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not update membership.');
    }
  }

  if (errorMessage && team == null) {
    return (
      <section>
        <PageHeader title="Not found" />
        <ErrorMessage message={errorMessage} />
      </section>
    );
  }

  if (team == null) {
    return <LoadingState />;
  }

  const inviteUrl = createdInvite
    ? `${window.location.origin}${invitationJoinPath(createdInvite.token)}`
    : null;
  const grouped = groupInvitations(invitations);

  /**
   * @returns {Promise<void>}
   */
  async function handleCopyInvite() {
    if (!inviteUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch (error) {
      setCopied(false);
      setErrorMessage('Could not copy the invite link. Select it and copy it yourself.');
      console.error('Failed to copy invite link', error);
    }
  }

  if (!isAdmin) {
    return (
      <section>
        <PageHeader eyebrow={team.name} title="This team">
          <Lead>
            {team.name} uses {team.timezone}. Today is the home for this team.
          </Lead>
        </PageHeader>
        <ErrorMessage message={errorMessage} />
        <Button
          variant={BUTTON_VARIANT.SECONDARY}
          onClick={() => {
            if (user?.id) {
              void handleRemoveOrLeave(user.id);
            }
          }}
        >
          Leave team
        </Button>
      </section>
    );
  }

  return (
    <section>
      <PageHeader eyebrow={team.name} title="Run this team">
        <Lead>Issue links, see who is on the team, and watch the team pulse. Not individuals.</Lead>
      </PageHeader>
      <ErrorMessage message={errorMessage} />

      {progress ? (
        <>
          <Subheading>Team pulse</Subheading>
          <ProgressSummary progress={progress} />
        </>
      ) : null}

      <Subheading>Members</Subheading>
      <List>
        {members.map((member) => (
          <Item key={member.userId}>
            <div>
              <strong>{member.displayName ?? member.email}</strong>
              <Meta>
                {member.role === MEMBERSHIP_ROLE.TEAM_ADMINISTRATOR ? 'Administrator' : 'Member'}
              </Meta>
            </div>
            {member.userId === user?.id ? (
              <Button
                variant={BUTTON_VARIANT.SECONDARY}
                fullWidth={false}
                onClick={() => {
                  void handleRemoveOrLeave(member.userId);
                }}
              >
                Leave team
              </Button>
            ) : (
              <Button
                variant={BUTTON_VARIANT.SECONDARY}
                fullWidth={false}
                onClick={() => {
                  void handleRemoveOrLeave(member.userId);
                }}
              >
                Remove
              </Button>
            )}
          </Item>
        ))}
      </List>

      <Subheading>Invitations</Subheading>
      <Button variant={BUTTON_VARIANT.SECONDARY} onClick={() => void handleCreateInvite()}>
        Create invite link
      </Button>
      {inviteUrl ? (
        <InviteBox>
          <p>Share this link once. People who open it land on today after they join.</p>
          <code>{inviteUrl}</code>
          <Button
            variant={BUTTON_VARIANT.SECONDARY}
            fullWidth={false}
            onClick={() => {
              void handleCopyInvite();
            }}
          >
            {copied ? 'Copied' : 'Copy invite link'}
          </Button>
        </InviteBox>
      ) : null}
      <InvitationGroup
        title="Active"
        empty="No active invitations."
        invitations={grouped.active}
        onRevoke={handleRevoke}
      />
      <InvitationGroup title="Expired" invitations={grouped.expired} />
      <InvitationGroup title="Revoked" invitations={grouped.revoked} />

      <Subheading>Workspace</Subheading>
      <Form onSubmit={handleSave}>
        <TextField
          id="name"
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
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save workspace'}
        </Button>
      </Form>
    </section>
  );
}

/**
 * @typedef {object} InvitationGroupProps
 * @property {string} title
 * @property {Invitation[]} invitations
 * @property {string} [empty]
 * @property {(invitationId: string) => void} [onRevoke]
 */

/**
 * @param {InvitationGroupProps} props
 */
function InvitationGroup({ title, invitations, empty, onRevoke }) {
  if (invitations.length === 0) {
    return empty ? (
      <Group>
        <GroupTitle>{title}</GroupTitle>
        <Empty>{empty}</Empty>
      </Group>
    ) : null;
  }

  return (
    <Group>
      <GroupTitle>{title}</GroupTitle>
      <List>
        {invitations.map((invitation) => {
          return (
            <Item key={invitation.id}>
              <div>
                <strong>{invitationRowLabel(invitation)}</strong>
                <Meta>Created {formatIsoDate(invitation.createdAt)}</Meta>
              </div>
              {onRevoke ? (
                <Button
                  variant={BUTTON_VARIANT.GHOST}
                  fullWidth={false}
                  onClick={() => {
                    onRevoke(invitation.id);
                  }}
                >
                  Revoke
                </Button>
              ) : null}
            </Item>
          );
        })}
      </List>
    </Group>
  );
}

/**
 * @param {Invitation} invitation
 * @returns {string}
 */
function invitationRowLabel(invitation) {
  const status = invitationStatus(invitation);
  if (status === INVITATION_STATUS.REVOKED) {
    return 'Revoked';
  }
  if (status === INVITATION_STATUS.EXPIRED) {
    return `Expired ${formatIsoDate(invitation.expiresAt)}`;
  }
  return `Expires ${formatIsoDate(invitation.expiresAt)}`;
}

const Lead = styled.p`
  margin: ${({ theme }) => theme.space.md} 0 0;
  color: ${({ theme }) => theme.color.inkMuted};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.xl};
`;

const Subheading = styled.h2`
  margin: ${({ theme }) => theme.space.xl} 0 ${({ theme }) => theme.space.md};
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
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
`;

const Meta = styled.p`
  margin: ${({ theme }) => theme.space.xs} 0 0;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 0.875rem;
`;

const InviteBox = styled.div`
  margin: ${({ theme }) => theme.space.md} 0;
  padding: ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.accentSoft};

  code {
    display: block;
    margin-top: ${({ theme }) => theme.space.sm};
    word-break: break-all;
  }

  button {
    margin-top: ${({ theme }) => theme.space.md};
  }
`;

const Group = styled.div`
  margin-top: ${({ theme }) => theme.space.md};
`;

const GroupTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.space.sm};
  font-size: 1rem;
`;

const Empty = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.md};
  color: ${({ theme }) => theme.color.inkMuted};
`;
