import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithTheme } from '@/test/render-with-theme';

import { ProgressSummary } from './ProgressSummary';

describe('ProgressSummary', () => {
  it('renders team participation, not a leaderboard', () => {
    renderWithTheme(
      <ProgressSummary
        progress={{
          date: '2026-10-28',
          memberCount: 3,
          completedCount: 1,
          skippedCount: 1,
          participationPercent: 33,
          activity: {
            id: 'act-1',
            title: 'Two truths',
            instructions: 'Share two truths and a lie.',
            category: 'icebreaker',
            estimatedMinutes: 5,
          },
        }}
      />,
    );

    expect(screen.getByText('Two truths')).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();
    expect(screen.queryByText(/Ada/)).not.toBeInTheDocument();
  });
});
