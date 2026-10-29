import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from '@/App';
import { createInvitation, listInvitations } from '@/services/invitation-service';
import { getTeamProgress } from '@/services/progress-service';
import { getTeam, listMembers } from '@/services/team-service';
import { authenticatedAuth } from '@/test/auth-fixtures';
import { renderWithProviders } from '@/test/render-with-providers';

vi.mock('@/services/team-service', () => ({
  listTeams: vi.fn(),
  getTeam: vi.fn(),
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
  listMembers: vi.fn(),
  removeOrLeaveMember: vi.fn(),
}));

vi.mock('@/services/invitation-service', () => ({
  previewInvitation: vi.fn(),
  joinTeam: vi.fn(),
  createInvitation: vi.fn(),
  listInvitations: vi.fn(),
  revokeInvitation: vi.fn(),
  invitationJoinPath: (token) => `/join?token=${encodeURIComponent(token)}`,
}));

vi.mock('@/services/progress-service', () => ({
  getTeamProgress: vi.fn(),
  listProgressHistory: vi.fn(),
}));

const PULSE = {
  date: '2026-10-28',
  memberCount: 2,
  completedCount: 1,
  skippedCount: 0,
  participationPercent: 50,
  activity: {
    id: 'act-1',
    title: 'Two truths',
    instructions: 'Share two truths and a lie.',
    category: 'icebreaker',
    estimatedMinutes: 5,
  },
};

describe('TeamSettingsPage', () => {
  it('shows pulse, invite link, and grouped invitations for an administrator', async () => {
    vi.mocked(getTeam).mockResolvedValue({
      id: 'team-1',
      name: 'Studio',
      timezone: 'UTC',
      role: 'team_administrator',
      createdAt: '2026-10-28T12:00:00Z',
    });
    vi.mocked(listMembers).mockResolvedValue([
      {
        userId: 'user-1',
        email: 'ada@example.com',
        displayName: 'Ada',
        role: 'team_administrator',
      },
    ]);
    vi.mocked(getTeamProgress).mockResolvedValue(PULSE);
    vi.mocked(listInvitations).mockResolvedValue([
      {
        id: 'expired-1',
        expiresAt: '2020-01-01T12:00:00Z',
        revokedAt: null,
        createdAt: '2019-12-25T12:00:00Z',
      },
    ]);
    vi.mocked(createInvitation).mockResolvedValue({
      id: 'invite-1',
      token: 'secret-token',
      expiresAt: '2026-11-04T12:00:00Z',
      revokedAt: null,
    });

    renderWithProviders(<App />, {
      route: '/teams/team-1/settings',
      authValue: authenticatedAuth(),
    });

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    expect(await screen.findByRole('heading', { name: 'Run this team' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 completed today')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Expired' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Library' })).not.toBeInTheDocument();

    vi.mocked(listInvitations).mockResolvedValue([
      {
        id: 'invite-1',
        expiresAt: '2026-11-04T12:00:00Z',
        revokedAt: null,
        createdAt: '2026-10-28T12:00:00Z',
      },
    ]);
    fireEvent.click(await screen.findByRole('button', { name: 'Create invite link' }));

    expect(await screen.findByText(/Share this link once/)).toBeInTheDocument();
    expect(screen.getByText(/secret-token/)).toBeInTheDocument();
    expect(screen.getByText(/land on today after they join/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/join?token=secret-token'));
    });
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('hides invitation controls and admin nav from members', async () => {
    vi.mocked(getTeam).mockResolvedValue({
      id: 'team-1',
      name: 'Studio',
      timezone: 'UTC',
      role: 'member',
      createdAt: '2026-10-28T12:00:00Z',
    });
    vi.mocked(listMembers).mockResolvedValue([
      {
        userId: 'user-1',
        email: 'ada@example.com',
        displayName: 'Ada',
        role: 'member',
      },
    ]);

    renderWithProviders(<App />, {
      route: '/teams/team-1/settings',
      authValue: authenticatedAuth(),
    });

    expect(await screen.findByRole('heading', { name: 'This team' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create invite link' })).not.toBeInTheDocument();
    expect(listInvitations).not.toHaveBeenCalled();
    expect(getTeamProgress).not.toHaveBeenCalled();
  });
});
