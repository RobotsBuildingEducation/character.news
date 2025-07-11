import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import NDK, {
  NDKZapper,
  NDKPrivateKeySigner,
  NDKUser,
  type NDKSigner,
} from "@nostr-dev-kit/ndk";
import { nip19 } from "nostr-tools";
import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { useCurrentUser } from "./useCurrentUser";
import { NostrifySignerAdapter } from "~/lib/NostrifySignerAdapter";
import type { NostrSigner } from "@nostrify/nostrify";

/**
 * Thin wrapper around the NDKCashuWallet API. The actual wallet
 * implementation is provided by `@nostr-dev-kit/ndk-wallet`. This hook merely
 * exposes a few helper methods for the UI.
 */

export function useNutsack() {
  const [balance, setBalance] = useLocalStorage<number>("nutsack:balance", 0);
  const [invoice, setInvoice] = useState<string>("");
  const [walletReady, setWalletReady] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const ndkRef = useRef<NDK>();
  const walletRef = useRef<NDKCashuWallet>();
  const { user } = useCurrentUser();

  // console.log("user", user);

  const getPrivateKey = useCallback((signer: unknown): string | undefined => {
    if (!signer) return undefined;
    const s = signer as Record<string, unknown>;
    const sk = s.privateKey || s.secretKey || s.privkey || s.sk;
    if (sk) return sk as string;

    const nsec = (s as Record<string, unknown>).nsec as string | undefined;
    if (!nsec) return undefined;

    try {
      const data = nip19.decode(nsec).data as Uint8Array;
      return Buffer.from(data).toString("hex");
    } catch {
      return undefined;
    }
  }, []);

  const ensureNdk = useCallback(async () => {
    if (ndkRef.current) {
      if (user && !ndkRef.current.signer) {
        const sk = getPrivateKey(user.signer);
        ndkRef.current.signer = sk
          ? new NDKPrivateKeySigner(sk)
          : new NostrifySignerAdapter(user.signer as NostrSigner, ndkRef.current);
      }
      return;
    }

    const sk = user ? getPrivateKey(user.signer) : undefined;
    let signer: NDKSigner | undefined;
    if (sk) signer = new NDKPrivateKeySigner(sk);
    else if (user?.signer)
      signer = new NostrifySignerAdapter(user.signer as NostrSigner);

    ndkRef.current = new NDK({
      explicitRelayUrls: ["wss://relay.damus.io", "wss://relay.primal.net"],
      signer,
    });
    if (signer instanceof NostrifySignerAdapter) signer.setNdk(ndkRef.current);
    await ndkRef.current.connect();
  }, [getPrivateKey, user]);

  const startWallet = useCallback(
    (wallet: NDKCashuWallet) => {
      walletRef.current = wallet;
      wallet.start();
      wallet.on("balance_updated", (wb) => {
        const amt = wb?.amount ?? wallet.balance?.amount ?? 0;
        setBalance(amt);
      });
      if (wallet.balance?.amount !== undefined) {
        setBalance(wallet.balance.amount);
      }
      setWalletReady(true);
      setLoadingWallet(false);
    },
    [setBalance]
  );

  const loadExistingWallet = useCallback(
    async (pubkey: string) => {
      setLoadingWallet(true);
      await ensureNdk();
      if (!ndkRef.current) {
        setLoadingWallet(false);
        return;
      }
      if (walletRef.current) {
        setLoadingWallet(false);
        return;
      }
      const existing = await ndkRef.current.fetchEvent({
        kinds: [17375],
        authors: [pubkey],
      });
      if (existing) {
        const w = await NDKCashuWallet.from(existing);
        if (w) startWallet(w);
      }
      if (!existing) setLoadingWallet(false);
    },
    [ensureNdk, startWallet]
  );

  const createWallet = useCallback(async () => {
    setLoadingWallet(true);
    await ensureNdk();
    if (!ndkRef.current || walletRef.current) return;
    const wallet = new NDKCashuWallet(ndkRef.current);
    wallet.mints = ["https://mint.minibits.cash/Bitcoin"];
    wallet.walletId = "Robots Building Education Wallet";
    await wallet.getP2pk();
    await wallet.publish();
    startWallet(wallet);
    setLoadingWallet(false);
  }, [ensureNdk, startWallet]);

  useEffect(() => {
    if (user && !walletRef.current) {
      loadExistingWallet(user.pubkey);
    } else if (!user) {
      setLoadingWallet(false);
    }
  }, [loadExistingWallet, user]);

  const deposit = useCallback(
    async (amount: number) => {
      await ensureNdk();
      if (!walletRef.current) return;
      const dep = walletRef.current.deposit(amount, walletRef.current.mints[0]);
      const inv: string = await dep.start();
      setInvoice(inv);
      dep.on("success", () => {
        setBalance(walletRef.current?.balance?.amount ?? 0);
        setInvoice("");
      });
      return inv;
    },
    [ensureNdk, setBalance]
  );

  /**
   * Send sats to the recipient. After the zap completes the local balance is
   * decreased. Any errors are bubbled up to the caller.
   */
  const zap = useCallback(
    async (_recipientNpub: string, _amount: number) => {
      await ensureNdk();
      if (!walletRef.current || !ndkRef.current) return;
      ndkRef.current.wallet = walletRef.current;
      // const user = ndkRef.current.getUser({ pubkey: recipientNpub });
      console.log("ndkref", ndkRef);
      const user = await NDKUser.fromNip05(
        "sheilfer@primal.net",
        ndkRef.current
      );

      console.log("user", user);
      const zapper = new NDKZapper(user, 1, "sat", { comment: "test" });
      await zapper.zap();
      setBalance(walletRef.current.balance?.amount ?? 0);
    },
    [ensureNdk, setBalance]
  );

  return {
    balance,
    invoice,
    deposit,
    zap,
    createWallet,
    walletReady,
    loadingWallet,
  };
}
