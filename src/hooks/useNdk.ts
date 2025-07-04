import { useEffect, useMemo, useRef } from 'react';
import { useNostrLogin } from '@nostrify/react/login';
import NDK, { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { nip19 } from 'nostr-tools';

/**
 * Returns the user's nsec (if available) and a configured NDK instance.
 */
export function useNdk() {
  const { logins } = useNostrLogin();
  const ndkRef = useRef<NDK>();

  const nsec = useMemo(() => {
    const login = logins.find((l) => l.type === 'nsec') as { nsec: string } | undefined;
    return login?.nsec;
  }, [logins]);

  useEffect(() => {
    if (!ndkRef.current) {
      ndkRef.current = new NDK();
    }

    if (ndkRef.current && nsec) {
      try {
        const sk = Buffer.from(nip19.decode(nsec).data as Uint8Array).toString('hex');
        ndkRef.current.signer = new NDKPrivateKeySigner(sk);
      } catch (err) {
        console.warn('Failed to set signer from nsec:', err);
      }
    }
  }, [nsec]);

  return { ndk: ndkRef.current, nsec } as const;
}
