import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LoginArea } from '@/components/auth/LoginArea';
import DownloadAppModal from './DownloadAppModal';

interface HeaderActionsProps {
  className?: string;
}

export default function HeaderActions({ className }: HeaderActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('fixed top-0 right-0 flex gap-2 p-2 z-50', className)}>
      <LoginArea className="max-w-60" />
      <Button size='icon' variant='ghost' onClick={() => setOpen(true)}>
        <Download className='w-4 h-4' />
      </Button>
      <DownloadAppModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
