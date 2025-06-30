import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    </DialogContent>
  </Dialog>
);

export default WalletDialog;
