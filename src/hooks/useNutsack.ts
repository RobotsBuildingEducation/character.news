import { useCallback, useRef, useState } from "react";
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
  const ndkRef = useRef<NDK>();
  const walletRef = useRef<NDKCashuWallet>();
  const { user } = useCurrentUser();

  // console.log("user", user);

  const getPrivateKey = useCallback((signer: unknown): string | undefined => {
    if (!signer) return undefined;
    const s = signer as Record<string, any>;
    const sk = s.privateKey || s.secretKey || s.privkey || s.sk;
    if (sk) return sk as string;

    const nsec = (s as Record<string, any>).nsec;
    if (!nsec) return undefined;

    try {
      const data = nip19.decode(nsec).data as Uint8Array;
      return Buffer.from(data).toString("hex");
    } catch {
      return undefined;
    }
  }, []);

  /**
   * Request an invoice from the wallet for the given amount. The returned
   * invoice string can be rendered as a QR code by the caller. For simplicity
   * we store the last invoice in state so components can react to it.
   */
  const init = useCallback(async () => {
    if (!ndkRef.current) {
      const sk = user ? getPrivateKey(user.signer) : undefined;
      console.log("Private", sk);
      let signer;
      if (sk) {
        signer = new NDKPrivateKeySigner(sk);
      } else if (user?.signer) {
        signer = new NostrifySignerAdapter(user.signer as NostrSigner);
      }
      ndkRef.current = new NDK({
        explicitRelayUrls: ["wss://relay.damus.io", "wss://relay.primal.net"],
        signer: signer as unknown as NDKSigner,
      });
      if (signer instanceof NostrifySignerAdapter)
        signer.setNdk(ndkRef.current);
      await ndkRef.current.connect();
    } else if (user && !ndkRef.current.signer) {
      const sk = getPrivateKey(user.signer);
      ndkRef.current.signer = sk
        ? new NDKPrivateKeySigner(sk)
        : new NostrifySignerAdapter(
            user.signer as NostrSigner,
            ndkRef.current
          );
    }
    if (!walletRef.current) {
      const existing = await ndkRef.current.fetchEvent({
        kinds: [17375],
        authors: user ? [user.pubkey] : [],
      });
      if (existing) {
        const w = await NDKCashuWallet.from(existing);
        if (w) walletRef.current = w;
      }
      if (!walletRef.current) {
        walletRef.current = new NDKCashuWallet(ndkRef.current);
        walletRef.current.mints = ["https://mint.minibits.cash/Bitcoin"];
        walletRef.current.walletId = "Robots Building Education Wallet";
        await walletRef.current.getP2pk();
        await walletRef.current.publish();
      }
      const wallet = walletRef.current;
      wallet.start();
      wallet.on("balance_updated", (wb) => {
        const amt = wb?.amount ?? wallet.balance?.amount ?? 0;
        setBalance(amt);
      });
    }
    setWalletReady(true);
  }, [setBalance, user]);

  const deposit = useCallback(
    async (amount: number) => {
      await init();
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
    async (_recipientNpub: string, _amount: number) => {
      await init();
      if (!walletRef.current || !ndkRef.current) return;
      ndkRef.current.wallet = walletRef.current;
      // const user = ndkRef.current.getUser({ pubkey: recipientNpub });
      console.log("ndkref", ndkRef);
      const user = await NDKUser.fromNip05(
        "sheilfer@primal.net",
        ndkRef.current
      );
      if (!user) return;

      console.log("user", user);
      const zapper = new NDKZapper(user, 1, "sat", { comment: "test" });
      await zapper.zap();
      setBalance(walletRef.current.balance?.amount ?? 0);
    },
    [init, setBalance]
  );

  const createWallet = useCallback(async () => {
    await init();
  }, [init]);

  return { balance, invoice, deposit, zap, createWallet, walletReady };
}
