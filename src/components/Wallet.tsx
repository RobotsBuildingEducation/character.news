import { useState } from "react";
import { Button } from "~/components/ui/button";
import { useIsAdmin } from "~/hooks/useIsAdmin";
import { useNutsack } from "~/hooks/useNutsack";
import { useUserWallet } from "~/hooks/useUserWallet";
import { useSendNutzap } from "~/hooks/useSendNutzap";
import { ADMIN_NPUB } from "~/constants";
import { nip19 } from "nostr-tools";
import { QRCodeSVG } from "qrcode.react";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { Copy, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "~/hooks/useToast";

export function Wallet() {
  const { balance, invoice, deposit, zap, createWallet, walletReady } =
    useNutsack();
  const isAdmin = useIsAdmin();
  const { data } = useUserWallet();
  const sendZap = useSendNutzap();
  const { user } = useCurrentUser();
  const [depositing, setDepositing] = useState(false);
  const [zapping, setZapping] = useState(false);

  if (!user) return null;

  const handleZap = async () => {
    const adminPubkey = nip19.decode(ADMIN_NPUB).data as string;
    try {
      setZapping(true);
      await sendZap(adminPubkey, "", {}, undefined);
      await zap(adminPubkey, 10);
    } catch (error) {
      console.error("Failed to zap admin", error);
    } finally {
      setZapping(false);
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

  const handleGenerate = async () => {
    await handleDeposit();
  };

  const handleCopy = async () => {
    if (!invoice) return;
    try {
      await navigator.clipboard.writeText(invoice);
      toast({ title: "Address copied" });
    } catch (err) {
      toast({ title: "Failed to copy", variant: "destructive" });
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
      {!walletReady ? (
        <Button onClick={createWallet}>Create Wallet</Button>
      ) : (
        <div className="flex gap-2">
          <Button
            onClick={handleDeposit}
            disabled={depositing}
            className="flex items-center gap-1"
          >
            {depositing && <Loader2 className="w-4 h-4 animate-spin" />}
            Deposit 10
          </Button>
          {!isAdmin && (
            <Button
              onClick={handleZap}
              disabled={zapping}
              className="flex items-center gap-1"
            >
              {zapping && <Loader2 className="w-4 h-4 animate-spin" />}
              Zap Admin
            </Button>
          )}
        </div>
      )}
      {depositing && <div className="text-xs">Generating invoice…</div>}
      {zapping && <div className="text-xs">Sending zap…</div>}
      {invoice && (
        <div className="mt-2 flex flex-col items-center gap-2">
          <QRCodeSVG value={invoice} size={192} />
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center gap-1"
            onClick={handleGenerate}
            disabled={depositing}
          >
            {depositing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            Generate new address
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={handleCopy}
          >
            <Copy className="w-4 h-4" /> Copy address
          </Button>
        </div>
      )}
    </div>
  );
}
