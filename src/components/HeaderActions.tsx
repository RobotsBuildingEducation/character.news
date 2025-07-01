import { useState } from "react";
import { Download, Wallet as WalletIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { LoginArea } from "~/components/auth/LoginArea";
import DownloadAppModal from "./DownloadAppModal";
import WalletDialog from "./WalletDialog";
import { useLoggedInAccounts } from "~/hooks/useLoggedInAccounts";

interface HeaderActionsProps {
  className?: string;
}

export default function HeaderActions({ className }: HeaderActionsProps) {
  const [open, setOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const { currentUser } = useLoggedInAccounts();

  return (
    <div
      className={cn("fixed top-0 right-0 flex gap-2 p-5 z-50", className)}
      style={{ display: "flex", alignItems: "center" }}
    >
      <Button
        className="flex items-center gap-2 px-4 py-2  bg-primary text-primary-foreground w-full font-medium transition-all hover:bg-primary/90 animate-scale-in"
        size="icon"
        onClick={() => setOpen(true)}
        style={{ backgroundColor: "#bdbdbd", color: "black" }}
      >
        <Download className="w-4 h-4" />
      </Button>
      <LoginArea className="max-w-60" />
      {currentUser && (
        <Button
          className="flex items-center gap-2 px-4 py-2  bg-primary text-primary-foreground w-full font-medium transition-all hover:bg-primary/90 animate-scale-in"
          size="icon"
          onClick={() => setWalletOpen(true)}
          style={{ backgroundColor: "#bdbdbd", color: "black" }}
        >
          <WalletIcon className="w-4 h-4" />
        </Button>
      )}

      <DownloadAppModal open={open} onOpenChange={setOpen} />
      {currentUser && (
        <WalletDialog open={walletOpen} onOpenChange={setWalletOpen} />
      )}
    </div>
  );
}
