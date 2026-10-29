import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';

import { Button, BUTTON_VARIANT } from '@/components/Button';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { ActivityCard } from '@/features/activities/ActivityCard';
import { useAuth } from '@/features/auth/use-auth';
import { formatIsoDate } from '@/lib/format-iso-date';
import { MEMBERSHIP_ROLE } from '@/types/team';
import { ApiError } from '@/services/http';
import {
  completeDailyActivity,
  getDailyActivity,
  skipDailyActivity,
} from '@/services/activity-service';
import { getTeam, removeOrLeaveMember } from '@/services/team-service';

/** @typedef {import('../types/activity').DailyActivity} DailyActivity */
/** @typedef {import('../types/team').Team} Team */

/**
 * Today's featured activity for a team.
 */
export function DailyActivityPage() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState(/** @type {Team | null} */ (null));
  const [dailyActivity, setDailyActivity] = useState(/** @type {DailyActivity | null} */ (null));
  const [errorMessage, setErrorMessage] = useState(/** @type {string | null} */ (null));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!teamId) {
      return;
    }
    const [teamRow, activityRow] = await Promise.all([getTeam(teamId), getDailyActivity(teamId)]);
    setTeam(teamRow);
    setDailyActivity(activityRow);
  }, [teamId]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        await load();
        if (!cancelled) {
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setTeam(null);
          setDailyActivity(null);
          setErrorMessage(error instanceof ApiError ? error.message : 'Could not load today.');
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [load]);

  /**
   * @param {'complete' | 'skip'} action
   * @returns {Promise<void>}
   */
  async function handleOutcome(action) {
    if (!teamId || dailyActivity == null) {
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const completion =
        action === 'complete'
          ? await completeDailyActivity(teamId)
          : await skipDailyActivity(teamId);
      setDailyActivity({ ...dailyActivity, completion });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not save your response.');
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async function handleLeave() {
    if (!teamId || !user) {
      return;
    }
    setErrorMessage(null);
    try {
      await removeOrLeaveMember({ teamId, userId: user.id });
      navigate('/teams', { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not leave the team.');
    }
  }

  if (errorMessage && dailyActivity == null) {
    return (
      <section>
        <PageHeader title="Not found" />
        <ErrorMessage message={errorMessage} />
      </section>
    );
  }

  if (dailyActivity == null || team == null) {
    return <LoadingState />;
  }

  return (
    <section>
      <PageHeader eyebrow={team.name} title="Today">
        <Lead>
          {formatIsoDate(dailyActivity.date)} · {team.timezone}
        </Lead>
      </PageHeader>
      <ErrorMessage message={errorMessage} />
      <ActivityCard
        dailyActivity={dailyActivity}
        isSubmitting={isSubmitting}
        onComplete={() => {
          void handleOutcome('complete');
        }}
        onSkip={() => {
          void handleOutcome('skip');
        }}
      />
      {team.role === MEMBERSHIP_ROLE.MEMBER ? (
        <Leave>
          <Button
            variant={BUTTON_VARIANT.GHOST}
            onClick={() => {
              void handleLeave();
            }}
          >
            Leave team
          </Button>
        </Leave>
      ) : null}
    </section>
  );
}

const Lead = styled.p`
  margin: ${({ theme }) => theme.space.md} 0 0;
  color: ${({ theme }) => theme.color.inkMuted};
`;

const Leave = styled.div`
  margin-top: ${({ theme }) => theme.space.lg};
`;
