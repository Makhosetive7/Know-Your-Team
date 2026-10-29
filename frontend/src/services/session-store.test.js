import { afterEach, describe, expect, it } from 'vitest';

import {
  ACCESS_TOKEN_KEY,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from './session-store';

describe('session-store', () => {
  afterEach(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  });

  it('stores and reads the access token', () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken('token-1');
    expect(getAccessToken()).toBe('token-1');
  });

  it('clears the access token', () => {
    setAccessToken('token-1');
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });
});
