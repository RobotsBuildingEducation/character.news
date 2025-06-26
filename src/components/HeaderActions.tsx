import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoginArea } from "@/components/auth/LoginArea";
import DownloadAppModal from "./DownloadAppModal";

interface HeaderActionsProps {
  className?: string;
}

export default function HeaderActions({ className }: HeaderActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("fixed top-0 right-0 flex gap-2 p-5 z-50", className)}>
      <Button
        className="flex items-center gap-2 px-4 py-2  bg-primary text-primary-foreground w-full font-medium transition-all hover:bg-primary/90 animate-scale-in"
        size="icon"
        onClick={() => setOpen(true)}
        style={{ backgroundColor: "#9e9e9e", color: "black" }}
      >
        <Download className="w-4 h-4" />
      </Button>
      <LoginArea className="max-w-60" />

      <DownloadAppModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
