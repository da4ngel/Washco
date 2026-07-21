import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'washco-pwa-dismissed';

/** Dismissible bottom banner offering to install WashCo as a PWA. */
export function InstallPrompt() {
  const { isAvailable, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  if (!isAvailable || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm sm:p-0">
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-lg">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Download className="h-4 w-4" />
        </span>
        <div className="flex-1 text-sm">
          <p className="font-semibold">Install WashCo</p>
          <p className="text-muted-foreground">Add it to your home screen for quick access.</p>
        </div>
        <Button size="sm" onClick={() => void promptInstall()}>
          Install
        </Button>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
