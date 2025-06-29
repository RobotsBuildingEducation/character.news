import { useNostr } from "@nostrify/react";
import { useCurrentUser } from "./useCurrentUser";
import { useQuery } from "@tanstack/react-query";
import type { NostrEvent } from "@nostrify/nostrify";

export function useUserWallet() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery<{ wallet?: NostrEvent; tokens: NostrEvent[]; history: NostrEvent[] }>({
    queryKey: ["wallet", user?.pubkey ?? ""],
    queryFn: async ({ signal }) => {
      if (!user) return { tokens: [], history: [] };
      const events = await nostr.query(
        [{ kinds: [17375, 7375, 7376], authors: [user.pubkey] }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(1500)]) }
      );
      return {
        wallet: events.find((e) => e.kind === 17375),
        tokens: events.filter((e) => e.kind === 7375),
        history: events.filter((e) => e.kind === 7376),
      };
    },
    enabled: !!user,
    retry: 3,
  });
}
