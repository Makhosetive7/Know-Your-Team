import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithTheme } from '@/test/render-with-theme';

import { ActivityCard } from './ActivityCard';

const AVAILABLE = {
  id: 'daily-1',
  date: '2026-10-28',
  activity: {
    id: 'act-1',
    title: 'Two truths',
    instructions: 'Share two truths and a lie.',
    category: 'icebreaker',
    estimatedMinutes: 5,
  },
  completion: null,
};

describe('ActivityCard', () => {
  it('lets a member complete or skip when the activity is available', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();
    renderWithTheme(
      <ActivityCard dailyActivity={AVAILABLE} onComplete={onComplete} onSkip={onSkip} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onComplete).toHaveBeenCalled();
    expect(onSkip).toHaveBeenCalled();
  });

  it('disables complete and skip after success', () => {
    renderWithTheme(
      <ActivityCard
        dailyActivity={{
          ...AVAILABLE,
          completion: { outcome: 'completed', createdAt: '2026-10-28T12:00:00Z' },
        }}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Mark complete' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeDisabled();
    expect(screen.getByText(/You completed today/)).toBeInTheDocument();
  });

  it('acknowledges a skip without penalty language', () => {
    renderWithTheme(
      <ActivityCard
        dailyActivity={{
          ...AVAILABLE,
          completion: { outcome: 'skipped', createdAt: '2026-10-28T12:00:00Z' },
        }}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    expect(screen.getByText('You skipped today. No penalty.')).toBeInTheDocument();
  });
});
