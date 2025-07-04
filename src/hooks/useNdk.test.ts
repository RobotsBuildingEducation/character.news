import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNdk } from './useNdk';

vi.mock('@nostrify/react/login', () => ({
  useNostrLogin: () => ({ logins: [{ id: '1', type: 'nsec', nsec: 'nsec_test' }] }),
}));

vi.mock('@nostr-dev-kit/ndk', () => ({
  default: class { public signer: unknown; connect = vi.fn(); },
  NDKPrivateKeySigner: class { constructor(public sk: string) {} },
}));

describe('useNdk', () => {
  it('returns nsec from login', () => {
    const { result } = renderHook(() => useNdk());
    expect(result.current.nsec).toBe('nsec_test');
    expect(result.current.ndk).toBeDefined();
  });
});
