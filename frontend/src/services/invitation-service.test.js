import { afterEach, describe, expect, it, vi } from 'vitest';

import { invitationJoinPath, previewInvitation } from './invitation-service';

describe('invitation-service', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('previews a token without sending a session', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ team_name: 'Studio' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(previewInvitation('secret-token')).resolves.toBe('Studio');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/teams/join?token=secret-token');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('builds a join path with an encoded token', () => {
    expect(invitationJoinPath('a b')).toBe('/join?token=a%20b');
  });
});
