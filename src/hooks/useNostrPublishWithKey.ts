// hooks/useNostrPublishWithKey.ts
import { useMutation } from "@tanstack/react-query";
import { useNostr } from "@nostrify/react";
import { nip19, getPublicKey, finalizeEvent } from "nostr-tools";
import type { Event as NostrEvent } from "nostr-tools";

interface PublishOpts {
  /** User's private key in NIP-19 format */
  nsec: string;
  /** Event kind (defaults to 1) */
  kind?: number;
  /** Event content */
  content: string;
  /** Optional tags array */
  tags?: Array<[string, string]>;
  /** Optional timestamp (defaults to now) */
  created_at?: number;
}

export function useNostrPublishWithKey() {
  const { nostr } = useNostr();

  return useMutation<NostrEvent, Error, PublishOpts>({
    mutationFn: async ({ nsec, content, tags = [], kind = 1, created_at }) => {
      // Decode secret key and derive pubkey (v2.x nip19 returns Uint8Array)
      const sk = nip19.decode(nsec).data as Uint8Array;
      const pk = getPublicKey(sk);

      // Build unsigned template
      const template = {
        kind,
        pubkey: pk,
        content,
        tags,
        created_at: created_at ?? Math.floor(Date.now() / 1000),
      };

      // finalizeEvent computes id and sig internally
      const signedEvent = finalizeEvent(template, sk);

      // optional verification
      // if (!verifyEvent(signedEvent)) throw new Error("Invalid signature");

      // Publish via Nostrify pool
      await nostr.event(signedEvent, { signal: AbortSignal.timeout(5000) });
      return signedEvent;
    },
    onError(error) {
      console.error("Failed to publish event with key:", error);
    },
    onSuccess(event) {
      console.log("Event published with key:", event);
    },
  });
}
