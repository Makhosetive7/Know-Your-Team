import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from '@/App';
import { ApiError } from '@/services/http';
import {
  completeDailyActivity,
  getDailyActivity,
  skipDailyActivity,
} from '@/services/activity-service';
import { getTeam } from '@/services/team-service';
import { authenticatedAuth } from '@/test/auth-fixtures';
import { renderWithProviders } from '@/test/render-with-providers';

const TEAM = {
  id: 'team-1',
  name: 'Studio',
  timezone: 'UTC',
  role: 'member',
  createdAt: '2026-10-28T12:00:00Z',
};

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

vi.mock('@/services/team-service', () => ({
  listTeams: vi.fn(),
  getTeam: vi.fn(),
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
  listMembers: vi.fn(),
  removeOrLeaveMember: vi.fn(),
}));

vi.mock('@/services/activity-service', () => ({
  getDailyActivity: vi.fn(),
  listActivityHistory: vi.fn(),
  completeDailyActivity: vi.fn(),
  skipDailyActivity: vi.fn(),
}));

describe('DailyActivityPage', () => {
  it('records complete and disables the actions', async () => {
    vi.mocked(getTeam).mockResolvedValue(TEAM);
    vi.mocked(getDailyActivity).mockResolvedValue(AVAILABLE);
    vi.mocked(completeDailyActivity).mockResolvedValue({
      outcome: 'completed',
      createdAt: '2026-10-28T12:00:00Z',
    });

    renderWithProviders(<App />, {
      route: '/teams/team-1',
      authValue: authenticatedAuth(),
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Mark complete' }));

    expect(await screen.findByText(/You completed today/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark complete' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Leave team' })).toBeInTheDocument();
  });

  it('records skip without penalty copy', async () => {
    vi.mocked(getTeam).mockResolvedValue(TEAM);
    vi.mocked(getDailyActivity).mockResolvedValue(AVAILABLE);
    vi.mocked(skipDailyActivity).mockResolvedValue({
      outcome: 'skipped',
      createdAt: '2026-10-28T12:00:00Z',
    });

    renderWithProviders(<App />, {
      route: '/teams/team-1',
      authValue: authenticatedAuth(),
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Skip' }));

    expect(await screen.findByText('You skipped today. No penalty.')).toBeInTheDocument();
  });

  it('uses generic not-found copy when the team is hidden', async () => {
    vi.mocked(getTeam).mockRejectedValue(
      new ApiError({ code: 'team_not_found', message: 'Team not found.', status: 404 }),
    );
    vi.mocked(getDailyActivity).mockRejectedValue(
      new ApiError({ code: 'team_not_found', message: 'Team not found.', status: 404 }),
    );

    renderWithProviders(<App />, {
      route: '/teams/team-1',
      authValue: authenticatedAuth(),
    });

    expect(await screen.findByRole('heading', { name: 'Not found' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Team not found.');
    expect(screen.queryByText('Hidden team')).not.toBeInTheDocument();
  });
});
