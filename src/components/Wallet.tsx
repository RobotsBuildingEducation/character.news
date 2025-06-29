import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNutsack } from "@/hooks/useNutsack";
import { useUserWallet } from "@/hooks/useUserWallet";
import { useSendNutzap } from "@/hooks/useSendNutzap";
import { ADMIN_NPUB } from "@/constants";
import { nip19 } from "nostr-tools";

export function Wallet() {
  const { balance, deposit, zap } = useNutsack();
  const isAdmin = useIsAdmin();
  const { data } = useUserWallet();
  const sendZap = useSendNutzap();

  const handleZap = async () => {
    const adminPubkey = nip19.decode(ADMIN_NPUB).data as string;
    try {
      await sendZap(adminPubkey, "", {}, undefined);
      zap(1);
    } catch (error) {
      console.error("Failed to zap admin", error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-sm">Balance: {balance}</div>
      {/* Display token count from wallet query if available */}
      {data?.tokens && (
        <div className="text-xs text-muted-foreground">
          Tokens: {data.tokens.length}
        </div>
      )}
      <div className="flex gap-2">
        <Button onClick={() => deposit(1)}>Deposit 1</Button>
        {!isAdmin && <Button onClick={handleZap}>Zap Admin</Button>}
      </div>
    </div>
  );
}
