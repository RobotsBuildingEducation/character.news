import { useState } from "react";
import { Button } from "~/components/ui/button";
import { useIsAdmin } from "~/hooks/useIsAdmin";
import { useNostrCashuManager } from "~/hooks/useNostrCashuManager";
import { QRCodeSVG } from "qrcode.react";
import { useCurrentUser } from "~/hooks/useCurrentUser";

export function Wallet() {
  const {
    balance,
    wallet,
    createDepositInvoice,
    finalizeDeposit,
    zapSheilfer,
  } = useNostrCashuManager();
  const isAdmin = useIsAdmin();
  const { user } = useCurrentUser();
  const [depositing, setDepositing] = useState(false);
  const [invoice, setInvoice] = useState<string | null>(null);

  if (!user) return null;

  const handleZap = async () => {
    try {
      await zapSheilfer(1);
    } catch (error) {
      console.error("Failed to zap", error);
    }
  };

  const handleDeposit = async () => {
    setDepositing(true);
    try {
      const { paymentRequest, quoteId } = await createDepositInvoice(10);
      setInvoice(paymentRequest);
      await finalizeDeposit(quoteId, 10);
    } finally {
      setDepositing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-sm">Balance: {balance}</div>
      {wallet && (
        <div className="text-xs text-muted-foreground">
          Tokens: {wallet.proofs.length}
        </div>
      )}
      {wallet ? (
        <div className="flex gap-2">
          <Button onClick={handleDeposit}>Deposit 10</Button>
          {!isAdmin && <Button onClick={handleZap}>Zap</Button>}
        </div>
      ) : (
        <div className="text-sm">Loading wallet...</div>
      )}
      {depositing && <div className="text-xs">Generating invoice…</div>}
      {invoice && (
        <div className="mt-2">
          <QRCodeSVG value={invoice} size={192} />
        </div>
      )}
    </div>
  );
}
