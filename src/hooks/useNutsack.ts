import { useCallback, useRef, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { NutsackWallet } from 'nostr-wallet/nutsack';

/**
 * Thin wrapper around the nostr-wallet/nutsack API. The actual wallet
 * implementation is provided by the library, this hook merely exposes a few
 * helper methods for the UI. The library isn't included in the repository but
 * the types make intent explicit.
 */

export function useNutsack() {
  const [balance, setBalance] = useLocalStorage<number>('nutsack:balance', 0);
  const [invoice, setInvoice] = useState<string>('');
  const walletRef = useRef<NutsackWallet>();

  /**
   * Request an invoice from the wallet for the given amount. The returned
   * invoice string can be rendered as a QR code by the caller. For simplicity
   * we store the last invoice in state so components can react to it.
   */
  const deposit = useCallback(async (amount: number) => {
    if (!walletRef.current) {
      walletRef.current = new (require('nostr-wallet/nutsack').NutsackWallet)();
    }
    const inv: string = await walletRef.current.getInvoice(amount);
    setInvoice(inv);
    return inv;
  }, []);

  /**
   * Send sats to the recipient. After the zap completes the local balance is
   * decreased. Any errors are bubbled up to the caller.
   */
  const zap = useCallback(async (recipientNpub: string, amount: number) => {
    if (!walletRef.current) {
      walletRef.current = new (require('nostr-wallet/nutsack').NutsackWallet)();
    }
    await walletRef.current.zap(recipientNpub, amount);
    setBalance((b) => b - amount);
  }, []);

  return { balance, invoice, deposit, zap };
}
