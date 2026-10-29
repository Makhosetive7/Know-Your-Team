import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from '@/App';
import { authenticatedAuth } from '@/test/auth-fixtures';
import { renderWithProviders } from '@/test/render-with-providers';

describe('ProfilePage', () => {
  it('saves a display name through the auth session', async () => {
    const updateProfile = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<App />, {
      route: '/profile',
      authValue: authenticatedAuth({ updateProfile }),
    });

    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Ada Lovelace' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(updateProfile).toHaveBeenCalledWith({ displayName: 'Ada Lovelace' });
    expect(await screen.findByText('Saved.')).toBeInTheDocument();
  });
});
