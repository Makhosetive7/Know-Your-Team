import { describe, expect, it } from 'vitest';

import { formatParticipation } from './format-participation';

describe('formatParticipation', () => {
  it('returns 0 when a team has no members', () => {
    expect(formatParticipation({ completedCount: 0, memberCount: 0 })).toBe(0);
  });

  it('rounds the team completion share', () => {
    expect(formatParticipation({ completedCount: 2, memberCount: 3 })).toBe(67);
  });
});
