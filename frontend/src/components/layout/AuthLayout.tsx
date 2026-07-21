import { Link } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Centered card layout for the auth pages. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-secondary/40">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container flex flex-1 flex-col items-center justify-center py-10">
        <Link to="/" className="mb-6 flex items-center gap-2 font-bold text-primary">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Droplets className="h-5 w-5" />
          </span>
          <span className="text-xl tracking-tight">WashCo</span>
        </Link>
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
