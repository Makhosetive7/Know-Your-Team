import { describe, expect, it } from 'vitest';

import { guestHref, safeNextPath } from './safe-next-path';

describe('safeNextPath', () => {
  it('keeps in-app paths', () => {
    expect(safeNextPath('/teams/new')).toBe('/teams/new');
    expect(safeNextPath('/join?token=abc')).toBe('/join?token=abc');
  });

  it('rejects open redirects', () => {
    expect(safeNextPath('https://evil.example')).toBe('/teams');
    expect(safeNextPath('//evil.example')).toBe('/teams');
    expect(safeNextPath(null)).toBe('/teams');
  });
});

describe('guestHref', () => {
  it('omits the default teams destination', () => {
    expect(guestHref('/register', '/teams')).toBe('/register');
    expect(guestHref('/sign-in', null)).toBe('/sign-in');
  });

  it('encodes an in-app next path', () => {
    expect(guestHref('/sign-in', '/join?token=abc')).toBe('/sign-in?next=%2Fjoin%3Ftoken%3Dabc');
  });
});
