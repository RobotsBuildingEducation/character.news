import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Share, SquarePlus } from "lucide-react";
import type { FC } from "react";

interface DownloadAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DownloadAppModal: FC<DownloadAppModalProps> = ({
  open,
  onOpenChange,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Install Character News</DialogTitle>
        <DialogDescription>
          Follow these steps to add the app to your home screen:
        </DialogDescription>
      </DialogHeader>
      <ol className="list-decimal list-inside space-y-3 py-2 text-sm">
        <li className="flex items-start gap-2">
          <MoreHorizontal className="w-4 h-4 mt-1" />
          <span>
            Tap <strong>More</strong> to open the app in your browser if you're
            accessing this through social media.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Share className="w-4 h-4 mt-1" />
          Tap <strong>Share</strong> in your browser window.
        </li>

        <li className="flex items-start gap-2">
          <SquarePlus className="w-4 h-4 mt-1" />
          <span>
            Choose <strong>Add to Home Screen</strong>.
          </span>
        </li>
      </ol>
      <div className="pt-2 text-right">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default DownloadAppModal;
