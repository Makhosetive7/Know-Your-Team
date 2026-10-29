import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from '@/App';
import { createAdminActivity, listAdminActivities } from '@/services/activity-service';
import { ApiError } from '@/services/http';
import { authenticatedAuth } from '@/test/auth-fixtures';
import { renderWithProviders } from '@/test/render-with-providers';

vi.mock('@/services/activity-service', () => ({
  listAdminActivities: vi.fn(),
  createAdminActivity: vi.fn(),
  getDailyActivity: vi.fn(),
  listActivityHistory: vi.fn(),
  completeDailyActivity: vi.fn(),
  skipDailyActivity: vi.fn(),
}));

const LIBRARY = [
  {
    id: 'act-1',
    title: 'Two truths',
    instructions: 'Share two truths and a lie.',
    category: 'icebreaker',
    estimatedMinutes: 5,
    isActive: true,
  },
];

describe('AdminActivitiesPage', () => {
  it('lists the library and adds an activity for a platform administrator', async () => {
    vi.mocked(listAdminActivities).mockResolvedValue(LIBRARY);
    vi.mocked(createAdminActivity).mockResolvedValue({
      ...LIBRARY[0],
      id: 'act-2',
      title: 'Tea round',
      instructions: 'Offer to make tea.',
    });

    renderWithProviders(<App />, {
      route: '/admin/activities',
      authValue: authenticatedAuth({
        user: {
          id: 'user-1',
          email: 'platform@example.com',
          displayName: 'Platform',
          isSuperuser: true,
        },
      }),
    });

    expect(await screen.findByRole('heading', { name: 'Activity library' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Library' })).toBeInTheDocument();
    expect(screen.getByText('Two truths')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Tea round' } });
    fireEvent.change(screen.getByLabelText('Instructions'), {
      target: { value: 'Offer to make tea.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add activity' }));

    await waitFor(() => {
      expect(createAdminActivity).toHaveBeenCalledWith({
        title: 'Tea round',
        instructions: 'Offer to make tea.',
        category: 'icebreaker',
        estimatedMinutes: 5,
      });
    });
  });

  it('hides the library link and explains a forbidden library request', async () => {
    vi.mocked(listAdminActivities).mockRejectedValue(
      new ApiError({ code: 'permission_denied', message: 'Forbidden.', status: 403 }),
    );

    renderWithProviders(<App />, {
      route: '/admin/activities',
      authValue: authenticatedAuth(),
    });

    expect(screen.queryByRole('link', { name: 'Library' })).not.toBeInTheDocument();
    expect(
      await screen.findByText(
        'You need a platform administrator account to manage the activity library.',
      ),
    ).toBeInTheDocument();
  });
});
