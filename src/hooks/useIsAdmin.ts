import { nip19 } from "nostr-tools";
import { useCurrentUser } from "./useCurrentUser";
import { ADMIN_NPUB } from "~/constants";

const ADMIN_PUBKEY = nip19.decode(ADMIN_NPUB).data as string;

export function useIsAdmin() {
  const { user } = useCurrentUser();
  return user?.pubkey === ADMIN_PUBKEY;
}
