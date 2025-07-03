import { useState } from "react";
import { Button } from "~/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { useQuickCashu } from "~/hooks/useQuickCashu";
import { useCurrentUser } from "~/hooks/useCurrentUser";

export function Wallet() {
  const {
    wallet,
    invoice,
    isCreatingInvoice,
    deposit10,
    finalizeDeposit,
    zapRecipient,
  } = useQuickCashu();
  const { user } = useCurrentUser();
  const [depositing, setDepositing] = useState(false);

  if (!user) return null;

  const handleDeposit = async () => {
    setDepositing(true);
    try {
      await deposit10();
    } finally {
      setDepositing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-sm">Balance: {wallet?.balance ?? 0}</div>
      <div className="flex gap-2">
        <Button onClick={handleDeposit}>Deposit 10</Button>
        <Button onClick={zapRecipient}>Zap Recipient</Button>
        {invoice && <Button onClick={finalizeDeposit}>Finalize Deposit</Button>}
      </div>
      {(depositing || isCreatingInvoice) && (
        <div className="text-xs">Generating invoice…</div>
      )}
      {invoice && (
        <div className="mt-2">
          <QRCodeSVG value={invoice} size={192} />
        </div>
      )}
    </div>
  );
}
