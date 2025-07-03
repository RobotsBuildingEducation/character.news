import { Button } from "~/components/ui/button";
import { useIsAdmin } from "~/hooks/useIsAdmin";
import { useQuickCashu } from "~/hooks/useQuickCashu";
import { useUserWallet } from "~/hooks/useUserWallet";
import { ADMIN_NPUB } from "~/constants";
import { nip19 } from "nostr-tools";
import { QRCodeSVG } from "qrcode.react";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { useNostr } from "~/hooks/useNostr";

export function Wallet() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const {
    balance,
    invoice,
    deposit10,
    finalizeDeposit,
    zapRecipient,
    isCreatingInvoice,
  } = useQuickCashu(nostr, user);
  const isAdmin = useIsAdmin();
  const { data } = useUserWallet();

  if (!user) return null;

  const handleZap = async () => {
    const adminPubkey = nip19.decode(ADMIN_NPUB).data as string;
    try {
      await zapRecipient();
    } catch (error) {
      console.error("Failed to zap admin", error);
    }
  };

  const handleDeposit = async () => {
    await deposit10();
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
      {isCreatingInvoice && <div className="text-xs">Generating invoice…</div>}
      {invoice && (
        <div className="mt-2">
          <QRCodeSVG value={invoice} size={192} />
          <div className="mt-2 text-center">
            <Button size="sm" onClick={finalizeDeposit} className="mt-2">
              Confirm Payment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
