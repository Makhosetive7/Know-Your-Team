import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from '@/App';
import { listTeams } from '@/services/team-service';
import { authenticatedAuth, anonymousAuth } from '@/test/auth-fixtures';
import { renderWithProviders } from '@/test/render-with-providers';

vi.mock('@/services/team-service', () => ({
  listTeams: vi.fn(),
  getTeam: vi.fn(),
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
  listMembers: vi.fn(),
  removeOrLeaveMember: vi.fn(),
}));

describe('TeamsPage', () => {
  it('sends anonymous visitors to sign-in', () => {
    renderWithProviders(<App />, {
      route: '/teams',
      authValue: anonymousAuth(),
    });

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows create and join when the user has no teams', async () => {
    vi.mocked(listTeams).mockResolvedValue([]);

    renderWithProviders(<App />, {
      route: '/teams',
      authValue: authenticatedAuth(),
    });

    expect(
      await screen.findByRole('heading', { name: 'Create or join a team' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create a team' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join with an invite' })).toBeInTheDocument();
  });

  it('lists the caller teams', async () => {
    vi.mocked(listTeams).mockResolvedValue([
      {
        id: 'team-1',
        name: 'Studio',
        timezone: 'Africa/Johannesburg',
        role: 'team_administrator',
        createdAt: '2026-10-28T12:00:00Z',
      },
    ]);

    renderWithProviders(<App />, {
      route: '/teams',
      authValue: authenticatedAuth(),
    });

    expect(await screen.findByRole('link', { name: /Studio/ })).toHaveAttribute(
      'href',
      '/teams/team-1',
    );
    expect(screen.getByText(/Administrator/)).toBeInTheDocument();
  });
});
