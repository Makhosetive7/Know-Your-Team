import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from '@/App';
import { ApiError } from '@/services/http';
import { getDailyActivity } from '@/services/activity-service';
import { previewInvitation } from '@/services/invitation-service';
import { getTeam, listTeams } from '@/services/team-service';
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

vi.mock('@/services/activity-service', () => ({
  getDailyActivity: vi.fn(),
  listActivityHistory: vi.fn(),
  completeDailyActivity: vi.fn(),
  skipDailyActivity: vi.fn(),
}));

vi.mock('@/services/invitation-service', () => ({
  previewInvitation: vi.fn(),
  joinTeam: vi.fn(),
  createInvitation: vi.fn(),
  listInvitations: vi.fn(),
  revokeInvitation: vi.fn(),
  invitationJoinPath: (token) => `/join?token=${encodeURIComponent(token)}`,
}));

describe('SignInPage', () => {
  it('submits credentials to the auth session', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined);
    vi.mocked(listTeams).mockResolvedValue([]);

    renderWithProviders(<App />, {
      route: '/sign-in',
      authValue: anonymousAuth({ signIn }),
    });

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'password1',
      });
    });
  });

  it('shows the API error when sign-in fails', async () => {
    const signIn = vi.fn().mockRejectedValue(
      new ApiError({
        code: 'login_bad_credentials',
        message: 'Incorrect email or password.',
        status: 401,
      }),
    );

    renderWithProviders(<App />, {
      route: '/sign-in',
      authValue: anonymousAuth({ signIn }),
    });

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.');
  });

  it('redirects authenticated visitors with one team to today', async () => {
    const studio = {
      id: 'team-1',
      name: 'Studio',
      timezone: 'UTC',
      role: 'member',
      createdAt: '2026-10-28T12:00:00Z',
    };
    vi.mocked(listTeams).mockResolvedValue([studio]);
    vi.mocked(getTeam).mockResolvedValue(studio);
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
      route: '/sign-in',
      authValue: authenticatedAuth(),
    });

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Leave team' })).toBeInTheDocument();
  });

  it('redirects authenticated visitors to their teams', async () => {
    vi.mocked(listTeams).mockResolvedValue([]);

    renderWithProviders(<App />, {
      route: '/sign-in',
      authValue: authenticatedAuth(),
    });

    expect(
      await screen.findByRole('heading', { name: 'Create or join a team' }),
    ).toBeInTheDocument();
  });

  it('returns to a safe next path after sign-in', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined);
    vi.mocked(previewInvitation).mockResolvedValue('Studio');

    renderWithProviders(<App />, {
      route: '/sign-in?next=%2Fjoin%3Ftoken%3Dabc',
      authValue: anonymousAuth({ signIn }),
    });

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByLabelText('Invite token')).toHaveValue('abc');
    expect(await screen.findByRole('heading', { name: 'Join Studio' })).toBeInTheDocument();
  });
});
