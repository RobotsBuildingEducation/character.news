import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNutsack } from "@/hooks/useNutsack";
import { useUserWallet } from "@/hooks/useUserWallet";
import { useSendNutzap } from "@/hooks/useSendNutzap";
import { ADMIN_NPUB } from "@/constants";
import { nip19 } from "nostr-tools";
import { QRCodeSVG } from "qrcode.react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function Wallet() {
  const { balance, invoice, deposit, zap } = useNutsack();
  const isAdmin = useIsAdmin();
  const { data } = useUserWallet();
  const sendZap = useSendNutzap();
  const { user } = useCurrentUser();
  const [depositing, setDepositing] = useState(false);

  if (!user) return null;

  const handleZap = async () => {
    const adminPubkey = nip19.decode(ADMIN_NPUB).data as string;
    try {
      await sendZap(adminPubkey, "", {}, undefined);
      await zap(adminPubkey, 1);
    } catch (error) {
      console.error("Failed to zap admin", error);
    }
  };

  const handleDeposit = async () => {
    setDepositing(true);
    try {
      await deposit(10);
    } finally {
      setDepositing(false);
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
        <Button onClick={handleDeposit}>Deposit 10</Button>
        {!isAdmin && <Button onClick={handleZap}>Zap Admin</Button>}
      </div>
      {depositing && <div className="text-xs">Generating invoice…</div>}
      {invoice && (
        <div className="mt-2">
          <QRCodeSVG value={invoice} size={192} />
        </div>
      )}
    </div>
  );
}
