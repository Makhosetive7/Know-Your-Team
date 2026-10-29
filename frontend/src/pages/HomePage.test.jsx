import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from '@/App';
import { authenticatedAuth, anonymousAuth } from '@/test/auth-fixtures';
import { renderWithProviders } from '@/test/render-with-providers';
import { getDailyActivity } from '@/services/activity-service';
import { getTeam, listTeams } from '@/services/team-service';

import { HomePage } from './HomePage';

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

const STUDIO = {
  id: 'team-1',
  name: 'Studio',
  timezone: 'UTC',
  role: 'team_administrator',
  createdAt: '2026-10-28T12:00:00Z',
};

describe('HomePage', () => {
  it('shows the product name and links to sign in', () => {
    renderWithProviders(<HomePage />, { authValue: anonymousAuth() });

    expect(screen.getByText('Know Your Team')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'One small activity. The whole team.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in');
    expect(screen.getByRole('button', { name: 'Create an account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join with an invite' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How a team shares the day' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Share one invite' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Built for connection, not monitoring' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Platform administrator/)).not.toBeInTheDocument();
  });

  it('sends signed-in visitors with no team to create or join', async () => {
    vi.mocked(listTeams).mockResolvedValue([]);

    renderWithProviders(<App />, {
      route: '/',
      authValue: authenticatedAuth(),
    });

    expect(
      await screen.findByRole('heading', { name: 'Create or join a team' }),
    ).toBeInTheDocument();
  });

  it('sends a signed-in member of one team to today', async () => {
    vi.mocked(listTeams).mockResolvedValue([STUDIO]);
    vi.mocked(getTeam).mockResolvedValue(STUDIO);
    vi.mocked(getDailyActivity).mockResolvedValue({
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
    });

    renderWithProviders(<App />, {
      route: '/',
      authValue: authenticatedAuth(),
    });

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Library' })).not.toBeInTheDocument();
  });
});
