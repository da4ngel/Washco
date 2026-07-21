import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { router } from '@/router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useNotificationRealtime } from '@/hooks/useRealtime';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { InstallPrompt } from '@/components/shared/InstallPrompt';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

/** Runs app-wide realtime subscriptions (must live inside QueryClientProvider). */
function GlobalRealtime() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  useNotificationRealtime(userId);
  return null;
}

export default function App() {
  const { initialize, isInitialized } = useAuthStore();
  const initTheme = useThemeStore((s) => s.initTheme);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);

  useEffect(() => {
    void initialize();
    initTheme();
  }, [initialize, initTheme]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GlobalRealtime />
        {isInitialized ? (
          <RouterProvider router={router} />
        ) : (
          <div className="flex min-h-screen items-center justify-center">
            <LoadingSpinner label="Loading WashCo…" />
          </div>
        )}
        <Toaster richColors position="top-center" closeButton theme={resolvedTheme} />
        <InstallPrompt />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
