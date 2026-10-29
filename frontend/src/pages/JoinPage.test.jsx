import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from '@/App';
import { getDailyActivity } from '@/services/activity-service';
import { joinTeam, previewInvitation } from '@/services/invitation-service';
import { getTeam } from '@/services/team-service';
import { authenticatedAuth, anonymousAuth } from '@/test/auth-fixtures';
import { renderWithProviders } from '@/test/render-with-providers';

vi.mock('@/services/invitation-service', () => ({
  previewInvitation: vi.fn(),
  joinTeam: vi.fn(),
  createInvitation: vi.fn(),
  listInvitations: vi.fn(),
  revokeInvitation: vi.fn(),
  invitationJoinPath: (token) => `/join?token=${encodeURIComponent(token)}`,
}));

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

const TEAM = {
  id: 'team-1',
  name: 'Studio',
  timezone: 'UTC',
  role: 'member',
  createdAt: '2026-10-28T12:00:00Z',
};

describe('JoinPage', () => {
  it('previews an invitation and asks guests to sign in', async () => {
    vi.mocked(previewInvitation).mockResolvedValue('Studio');

    renderWithProviders(<App />, {
      route: '/join?token=abc',
      authValue: anonymousAuth(),
    });

    expect(await screen.findByRole('heading', { name: 'Join Studio' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in to join' })).toHaveAttribute(
      'href',
      '/sign-in?next=%2Fjoin%3Ftoken%3Dabc',
    );
  });

  it('redeems an invitation for a signed-in member', async () => {
    vi.mocked(previewInvitation).mockResolvedValue('Studio');
    vi.mocked(joinTeam).mockResolvedValue(TEAM);
    vi.mocked(getTeam).mockResolvedValue(TEAM);
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
      route: '/join?token=abc',
      authValue: authenticatedAuth(),
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Join team' }));

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(joinTeam).toHaveBeenCalledWith('abc');
  });
});
