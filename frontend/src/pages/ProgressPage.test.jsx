import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from '@/App';
import { getTeamProgress, listProgressHistory } from '@/services/progress-service';
import { getTeam } from '@/services/team-service';
import { authenticatedAuth } from '@/test/auth-fixtures';
import { renderWithProviders } from '@/test/render-with-providers';

vi.mock('@/services/progress-service', () => ({
  getTeamProgress: vi.fn(),
  listProgressHistory: vi.fn(),
}));

vi.mock('@/services/team-service', () => ({
  listTeams: vi.fn(),
  getTeam: vi.fn(),
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
  listMembers: vi.fn(),
  removeOrLeaveMember: vi.fn(),
}));

describe('ProgressPage', () => {
  it('shows team-level counts without naming individuals', async () => {
    vi.mocked(getTeam).mockResolvedValue({
      id: 'team-1',
      name: 'Studio',
      timezone: 'UTC',
      role: 'member',
      createdAt: '2026-10-28T12:00:00Z',
    });
    vi.mocked(getTeamProgress).mockResolvedValue({
      date: '2026-10-28',
      memberCount: 4,
      completedCount: 2,
      skippedCount: 1,
      participationPercent: 50,
      activity: {
        id: 'act-1',
        title: 'Two truths',
        instructions: 'Share two truths and a lie.',
        category: 'icebreaker',
        estimatedMinutes: 5,
      },
    });
    vi.mocked(listProgressHistory).mockResolvedValue([]);

    renderWithProviders(<App />, {
      route: '/teams/team-1/progress',
      authValue: authenticatedAuth(),
    });

    expect(await screen.findByText('Two truths')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Counts are for the team, not individuals.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });
});
