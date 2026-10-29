import styled from 'styled-components';

/**
 * @typedef {import('../../types/progress').TeamProgress} TeamProgress
 */

/**
 * @typedef {object} ProgressSummaryProps
 * @property {TeamProgress} progress
 */

/**
 * @param {ProgressSummaryProps} props
 */
export function ProgressSummary({ progress }) {
  const activityTitle = progress.activity?.title ?? 'No activity assigned yet.';

  return (
    <Board>
      <Hero>
        <Label>Participation</Label>
        <Percent>{progress.participationPercent}%</Percent>
        <Caption>
          {progress.completedCount} of {progress.memberCount} completed today
        </Caption>
      </Hero>
      <List>
        <Item>
          <Label>Today</Label>
          <Value>{activityTitle}</Value>
        </Item>
        <Item>
          <Label>Members</Label>
          <Value>{progress.memberCount}</Value>
        </Item>
        <Item>
          <Label>Completed</Label>
          <Value>{progress.completedCount}</Value>
        </Item>
        <Item>
          <Label>Skipped</Label>
          <Value>{progress.skippedCount}</Value>
        </Item>
      </List>
    </Board>
  );
}

const Board = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
`;

const Hero = styled.div`
  padding: ${({ theme }) => theme.space.xl};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.color.surface};
  box-shadow: ${({ theme }) => theme.shadow};
`;

const Percent = styled.p`
  margin: ${({ theme }) => theme.space.xs} 0;
  font-family: ${({ theme }) => theme.font.display};
  font-size: clamp(3rem, 8vw, 4.5rem);
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1;
`;

const Caption = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.inkMuted};
`;

const List = styled.dl`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space.md};
  margin: 0;
`;

const Item = styled.div`
  margin: 0;
`;

const Label = styled.dt`
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const Value = styled.dd`
  margin: ${({ theme }) => theme.space.xs} 0 0;
  font-weight: 600;
`;
