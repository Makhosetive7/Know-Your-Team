import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from '@/App';
import { ApiError } from '@/services/http';
import { listTeams } from '@/services/team-service';
import { anonymousAuth } from '@/test/auth-fixtures';
import { renderWithProviders } from '@/test/render-with-providers';

vi.mock('@/services/team-service', () => ({
  listTeams: vi.fn(),
  getTeam: vi.fn(),
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
  listMembers: vi.fn(),
  removeOrLeaveMember: vi.fn(),
}));

describe('RegisterPage', () => {
  it('creates an account through the auth session', async () => {
    vi.mocked(listTeams).mockResolvedValue([]);
    const register = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<App />, {
      route: '/register',
      authValue: anonymousAuth({ register }),
    });

    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'password1',
        displayName: 'Ada',
      });
    });
  });

  it('shows a conflict when the email is already registered', async () => {
    const register = vi.fn().mockRejectedValue(
      new ApiError({
        code: 'user_already_exists',
        message: 'An account with this email already exists.',
        status: 409,
      }),
    );

    renderWithProviders(<App />, {
      route: '/register',
      authValue: anonymousAuth({ register }),
    });

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An account with this email already exists.',
    );
  });
});
