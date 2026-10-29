import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  completeDailyActivity,
  createAdminActivity,
  getDailyActivity,
  listAdminActivities,
  skipDailyActivity,
} from './activity-service';

const ACTIVITY_JSON = {
  id: 'act-1',
  title: 'Two truths',
  instructions: 'Share two truths and a lie.',
  category: 'icebreaker',
  estimated_minutes: 5,
};

describe('activity-service', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps a daily activity including a missing completion', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'daily-1',
          date: '2026-10-28',
          activity: ACTIVITY_JSON,
          completion: null,
        }),
      }),
    );

    await expect(getDailyActivity('team-1')).resolves.toEqual({
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
  });

  it('records an idempotent complete', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          outcome: 'completed',
          created_at: '2026-10-28T12:00:00Z',
        }),
      }),
    );

    await expect(completeDailyActivity('team-1')).resolves.toEqual({
      outcome: 'completed',
      createdAt: '2026-10-28T12:00:00Z',
    });
  });

  it('records an idempotent skip', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          outcome: 'skipped',
          created_at: '2026-10-28T12:00:00Z',
        }),
      }),
    );

    await expect(skipDailyActivity('team-1')).resolves.toEqual({
      outcome: 'skipped',
      createdAt: '2026-10-28T12:00:00Z',
    });
  });

  it('maps the platform activity library and a created activity', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ ...ACTIVITY_JSON, is_active: true }],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          ...ACTIVITY_JSON,
          id: 'act-2',
          title: 'Tea round',
          is_active: true,
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(listAdminActivities()).resolves.toEqual([
      {
        id: 'act-1',
        title: 'Two truths',
        instructions: 'Share two truths and a lie.',
        category: 'icebreaker',
        estimatedMinutes: 5,
        isActive: true,
      },
    ]);

    await expect(
      createAdminActivity({
        title: 'Tea round',
        instructions: 'Offer to make tea.',
        category: 'fun',
        estimatedMinutes: 3,
      }),
    ).resolves.toMatchObject({ id: 'act-2', title: 'Tea round', isActive: true });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/v1/admin/activities',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: 'Tea round',
          instructions: 'Offer to make tea.',
          category: 'fun',
          estimated_minutes: 3,
        }),
      }),
    );
  });
});
