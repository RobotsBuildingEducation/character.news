import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { FC } from "react";
import { Wallet as WalletIcon } from "lucide-react";
import { Wallet } from "./Wallet";

interface WalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WalletDialog: FC<WalletDialogProps> = ({ open, onOpenChange }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <WalletIcon className="w-4 h-4" /> Wallet
        </DialogTitle>
      </DialogHeader>
      <Wallet />

      <div>
        <b>How to use</b>
      </div>

      <ol>
        <li>1. Create a wallet</li>
        <li>
          2. Deposit $0.01 USD worth of Bitcoin with a lightning wallet. We
          recommend <a href="https://click.cash.app/ui6m/home2022">Cash App</a>{" "}
          if you're in the US.
        </li>
        <li>3. Use the zap author button to send 1 sat ($0.001 USD)</li>
      </ol>

      <hr />
      <div>
        This feature is an experimental cross-platform using the nostr protocol.
        It may not work as expected for now.
      </div>
    </DialogContent>
  </Dialog>
);

export default WalletDialog;
