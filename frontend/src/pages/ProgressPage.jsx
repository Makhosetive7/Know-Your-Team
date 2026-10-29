import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { ProgressSummary } from '@/features/progress/ProgressSummary';
import { formatIsoDate } from '@/lib/format-iso-date';
import { ApiError } from '@/services/http';
import { getTeamProgress, listProgressHistory } from '@/services/progress-service';

/** @typedef {import('../types/progress').TeamProgress} TeamProgress */
/** @typedef {import('../types/progress').TeamProgressHistoryItem} TeamProgressHistoryItem */

/**
 * Team-level participation for today and recent days.
 */
export function ProgressPage() {
  const { teamId } = useParams();
  const [progress, setProgress] = useState(/** @type {TeamProgress | null} */ (null));
  const [history, setHistory] = useState(/** @type {TeamProgressHistoryItem[]} */ ([]));
  const [errorMessage, setErrorMessage] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!teamId) {
        return;
      }
      try {
        const [today, rows] = await Promise.all([
          getTeamProgress(teamId),
          listProgressHistory(teamId),
        ]);
        if (!cancelled) {
          setProgress(today);
          setHistory(rows);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof ApiError ? error.message : 'Could not load team progress.',
          );
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  if (errorMessage && progress == null) {
    return (
      <section>
        <PageHeader title="Not found" />
        <ErrorMessage message={errorMessage} />
      </section>
    );
  }

  if (progress == null) {
    return <LoadingState />;
  }

  return (
    <section>
      <PageHeader eyebrow="Team" title="Progress">
        <Lead>Counts are for the team, not individuals.</Lead>
      </PageHeader>
      <ErrorMessage message={errorMessage} />
      <ProgressSummary progress={progress} />
      <Subheading>Recent days</Subheading>
      {history.length === 0 ? (
        <Empty>No previous days yet.</Empty>
      ) : (
        <List>
          {history.map((item) => (
            <Item key={item.date}>
              <strong>{formatIsoDate(item.date)}</strong>
              <span>
                {item.activity.title} · {item.participationPercent}%
              </span>
            </Item>
          ))}
        </List>
      )}
    </section>
  );
}

const Lead = styled.p`
  margin: ${({ theme }) => theme.space.md} 0 0;
`;

const Subheading = styled.h2`
  margin: ${({ theme }) => theme.space.xl} 0 ${({ theme }) => theme.space.md};
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`;

const Item = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  padding: ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
`;

const Empty = styled.p`
  color: ${({ theme }) => theme.color.inkMuted};
`;
