import { useNostrPublish } from "./useNostrPublish";
import { useCurrentUser } from "./useCurrentUser";

export function useSendNutzap() {
  const { mutateAsync: publish } = useNostrPublish();
  const { user } = useCurrentUser();

  return async (
    recipientPubkey: string,
    mintUrl: string,
    proof: Record<string, unknown>,
    targetEventId?: string
  ) => {
    if (!user) throw new Error("Not logged in");
    await publish({
      kind: 9321,
      content: "",
      tags: [
        ["proof", JSON.stringify(proof)],
        ["u", mintUrl],
        ["p", recipientPubkey],
        ...(targetEventId ? [["e", targetEventId]] : []),
      ],
    });
  };
}

export function useFetchNutzapInfo() {
  const fetchNutzapInfo = async (pubkey: string) => {
    return Promise.resolve(undefined as any);
  };
  return { fetchNutzapInfo };
}
