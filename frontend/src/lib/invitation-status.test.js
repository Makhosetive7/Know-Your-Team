import { describe, expect, it } from 'vitest';

import { groupInvitations, INVITATION_STATUS, invitationStatus } from './invitation-status';

const NOW = new Date('2026-10-29T12:00:00Z');

describe('invitationStatus', () => {
  it('treats a future expiry as active', () => {
    expect(
      invitationStatus(
        {
          id: '1',
          expiresAt: '2026-11-04T12:00:00Z',
          revokedAt: null,
          createdAt: '2026-10-28T12:00:00Z',
        },
        NOW,
      ),
    ).toBe(INVITATION_STATUS.ACTIVE);
  });

  it('treats a past expiry as expired unless revoked', () => {
    expect(
      invitationStatus(
        {
          id: '1',
          expiresAt: '2026-10-20T12:00:00Z',
          revokedAt: null,
          createdAt: '2026-10-13T12:00:00Z',
        },
        NOW,
      ),
    ).toBe(INVITATION_STATUS.EXPIRED);
  });

  it('treats a revocation as revoked even if the date is still in the future', () => {
    expect(
      invitationStatus(
        {
          id: '1',
          expiresAt: '2026-11-04T12:00:00Z',
          revokedAt: '2026-10-28T15:00:00Z',
          createdAt: '2026-10-28T12:00:00Z',
        },
        NOW,
      ),
    ).toBe(INVITATION_STATUS.REVOKED);
  });
});

describe('groupInvitations', () => {
  it('splits a mixed list into active, expired, and revoked', () => {
    const grouped = groupInvitations(
      [
        {
          id: 'active',
          expiresAt: '2026-11-04T12:00:00Z',
          revokedAt: null,
          createdAt: '2026-10-28T12:00:00Z',
        },
        {
          id: 'expired',
          expiresAt: '2026-10-20T12:00:00Z',
          revokedAt: null,
          createdAt: '2026-10-13T12:00:00Z',
        },
        {
          id: 'revoked',
          expiresAt: '2026-11-04T12:00:00Z',
          revokedAt: '2026-10-28T15:00:00Z',
          createdAt: '2026-10-28T12:00:00Z',
        },
      ],
      NOW,
    );

    expect(grouped.active.map((row) => row.id)).toEqual(['active']);
    expect(grouped.expired.map((row) => row.id)).toEqual(['expired']);
    expect(grouped.revoked.map((row) => row.id)).toEqual(['revoked']);
  });
});
