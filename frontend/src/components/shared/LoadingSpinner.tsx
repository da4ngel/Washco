import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  label?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({ className, label, fullPage }: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center gap-2 text-muted-foreground">
      <Loader2 className={cn('h-6 w-6 animate-spin text-primary', className)} />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
  if (fullPage) {
    return <div className="flex min-h-[50vh] items-center justify-center">{spinner}</div>;
  }
  return spinner;
}
