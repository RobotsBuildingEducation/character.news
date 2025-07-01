import { useCallback, useRef, useState, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import NDK, { NDKZapper, NDKUser, NDKNip07Signer } from "@nostr-dev-kit/ndk";
import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { useCurrentUser } from "./useCurrentUser";

/**
 * Thin wrapper around the NDKCashuWallet API. The actual wallet
 * implementation is provided by `@nostr-dev-kit/ndk-wallet`. This hook merely
 * exposes a few helper methods for the UI.
 */

export function useNutsack() {
  const [balance, setBalance] = useLocalStorage<number>("nutsack:balance", 0);
  const [invoice, setInvoice] = useState<string>("");
  const ndkRef = useRef<NDK>();
  const walletRef = useRef<NDKCashuWallet>();
  const { user } = useCurrentUser();

  /**
   * Request an invoice from the wallet for the given amount. The returned
   * invoice string can be rendered as a QR code by the caller. For simplicity
   * we store the last invoice in state so components can react to it.
   */
  const init = useCallback(async () => {
    if (!ndkRef.current) {
      ndkRef.current = new NDK({
        explicitRelayUrls: ["wss://relay.damus.io", "wss://relay.primal.net"],
        signer: user ? new NDKNip07Signer(user.signer as any) : undefined,
      });
      await ndkRef.current.connect();
    } else if (user && !ndkRef.current.signer) {
      ndkRef.current.signer = new NDKNip07Signer(user.signer as any);
    }
    if (!walletRef.current) {
      walletRef.current = new NDKCashuWallet(ndkRef.current);
      walletRef.current.mints = ["https://mint.minibits.cash/Bitcoin"];
      walletRef.current.walletId = "Character News Wallet";
      await walletRef.current.getP2pk();
      walletRef.current.start({ since: Date.now() });
      walletRef.current.on("balance_updated", (wb) => {
        const amt = wb?.amount ?? walletRef.current?.balance?.amount ?? 0;
        setBalance(amt);
      });
    }
  }, [setBalance, user]);

  useEffect(() => {
    if (user) {
      void init();
    }
  }, [user, init]);

  const deposit = useCallback(
    async (amount: number) => {
      // await init();
      if (!walletRef.current) return;
      const dep = walletRef.current.deposit(amount, walletRef.current.mints[0]);
      const inv: string = await dep.start();
      setInvoice(inv);
      dep.on("success", () => {
        setBalance(walletRef.current?.balance?.amount ?? 0);
      });
      return inv;
    },
    [
      // init
      // ,
      setBalance,
    ]
  );

  /**
   * Send sats to the recipient. After the zap completes the local balance is
   * decreased. Any errors are bubbled up to the caller.
   */
  const zap = useCallback(
    async (recipientNpub: string, amount: number) => {
      await init();
      if (!walletRef.current || !ndkRef.current) return;
      ndkRef.current.wallet = walletRef.current;
      const user = new NDKUser({ pubkey: recipientNpub }, ndkRef.current);
      const zapper = new NDKZapper(user, amount, "sat");
      await zapper.zap();
      setBalance(walletRef.current.balance?.amount ?? 0);
    },
    [init, setBalance]
  );

  return { balance, invoice, deposit, zap };
}
