import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { COMPLETION_OUTCOME } from '@/types/activity';
import { formatIsoDate } from '@/lib/format-iso-date';
import { ApiError } from '@/services/http';
import { listActivityHistory } from '@/services/activity-service';

/** @typedef {import('../types/activity').DailyActivity} DailyActivity */

/**
 * @param {DailyActivity} item
 * @returns {string}
 */
function outcomeLabel(item) {
  if (item.completion?.outcome === COMPLETION_OUTCOME.COMPLETED) {
    return 'Completed';
  }
  if (item.completion?.outcome === COMPLETION_OUTCOME.SKIPPED) {
    return 'Skipped';
  }
  return 'Not yet';
}

/**
 * Featured activities this team has already had, with your outcome.
 */
export function HistoryPage() {
  const { teamId } = useParams();
  const [history, setHistory] = useState(/** @type {DailyActivity[] | null} */ (null));
  const [errorMessage, setErrorMessage] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!teamId) {
        return;
      }
      try {
        const rows = await listActivityHistory(teamId);
        if (!cancelled) {
          setHistory(rows);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof ApiError ? error.message : 'Could not load activity history.',
          );
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  if (errorMessage && history == null) {
    return (
      <section>
        <PageHeader title="Not found" />
        <ErrorMessage message={errorMessage} />
      </section>
    );
  }

  if (history == null) {
    return <LoadingState />;
  }

  return (
    <section>
      <PageHeader eyebrow="Past days" title="Activity history" />
      <ErrorMessage message={errorMessage} />
      {history.length === 0 ? (
        <Empty>No featured activities yet.</Empty>
      ) : (
        <List>
          {history.map((item) => (
            <Item key={item.id}>
              <strong>{item.activity.title}</strong>
              <Meta>
                {formatIsoDate(item.date)} · {outcomeLabel(item)}
              </Meta>
            </Item>
          ))}
        </List>
      )}
    </section>
  );
}

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`;

const Item = styled.li`
  padding: ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
`;

const Meta = styled.p`
  margin: ${({ theme }) => theme.space.xs} 0 0;
  color: ${({ theme }) => theme.color.inkMuted};
`;

const Empty = styled.p`
  color: ${({ theme }) => theme.color.inkMuted};
`;
