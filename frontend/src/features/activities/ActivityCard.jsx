import styled from 'styled-components';

import { Button, BUTTON_VARIANT } from '@/components/Button';
import { ACTIVITY_CATEGORY_LABEL, COMPLETION_OUTCOME } from '@/types/activity';

/**
 * @typedef {import('../../types/activity').DailyActivity} DailyActivity
 */

/**
 * @typedef {object} ActivityCardProps
 * @property {DailyActivity} dailyActivity
 * @property {boolean} [isSubmitting]
 * @property {() => void} onComplete
 * @property {() => void} onSkip
 */

/**
 * @param {ActivityCardProps} props
 */
export function ActivityCard({ dailyActivity, isSubmitting, onComplete, onSkip }) {
  const { activity, completion } = dailyActivity;
  const outcome = completion?.outcome ?? null;
  const isDone = outcome != null;

  return (
    <Article>
      <Meta>
        <Category>{ACTIVITY_CATEGORY_LABEL[activity.category] ?? activity.category}</Category>
        <span>{activity.estimatedMinutes} min</span>
      </Meta>
      <Title>{activity.title}</Title>
      <Instructions>{activity.instructions}</Instructions>
      {outcome === COMPLETION_OUTCOME.COMPLETED ? (
        <Status>You completed today&apos;s activity.</Status>
      ) : null}
      {outcome === COMPLETION_OUTCOME.SKIPPED ? (
        <Status>You skipped today. No penalty.</Status>
      ) : null}
      <Actions>
        <Button
          disabled={isDone || isSubmitting}
          onClick={() => {
            onComplete();
          }}
        >
          Mark complete
        </Button>
        <Button
          variant={BUTTON_VARIANT.SECONDARY}
          disabled={isDone || isSubmitting}
          onClick={() => {
            onSkip();
          }}
        >
          Skip
        </Button>
      </Actions>
    </Article>
  );
}

const Article = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.xl};
  background: ${({ theme }) => theme.color.surface};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow};
`;

const Meta = styled.p`
  display: flex;
  gap: ${({ theme }) => theme.space.md};
  margin: 0;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 0.875rem;
`;

const Category = styled.span`
  color: ${({ theme }) => theme.color.accent};
  font-weight: 600;
  text-transform: capitalize;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 2rem;
`;

const Instructions = styled.p`
  margin: 0;
  white-space: pre-wrap;
`;

const Status = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.accent};
  font-weight: 600;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`;
