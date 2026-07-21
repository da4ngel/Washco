import { Link, useNavigate } from 'react-router-dom';
import { Droplets, Menu, X, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { isAuthenticated, profile, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const dashboardPath =
    profile?.role === 'admin' ? '/admin' : profile?.role === 'tenant' ? '/tenant/dashboard' : '/dashboard';

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-black uppercase tracking-tight text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Droplets className="h-5 w-5" />
          </span>
          <span className="text-lg">WashCo</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/search" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Find a wash
          </Link>
          <Link
            to="/register/tenant"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            List your business
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <Button variant="ghost" size="sm" asChild>
                <Link to={dashboardPath}>
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              </Button>
              <Link to="/profile">
                <Avatar
                  src={profile?.avatar_url}
                  fallback={profile?.full_name ?? 'U'}
                  className="h-9 w-9"
                />
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <span className="inline-flex items-center gap-1.5">
                <Button variant="accent" size="sm" shape="pill" asChild>
                  <Link to="/register">Join Today</Link>
                </Button>
                <span className="h-8 w-3 rounded-md bg-accent" aria-hidden />
              </span>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="inline-flex items-center justify-center rounded-md p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={cn('border-t md:hidden', open ? 'block' : 'hidden')}>
        <nav className="container flex flex-col gap-1 py-3">
          <Link to="/search" className="rounded-md px-3 py-2 text-sm hover:bg-secondary" onClick={() => setOpen(false)}>
            Find a wash
          </Link>
          <Link
            to="/register/tenant"
            className="rounded-md px-3 py-2 text-sm hover:bg-secondary"
            onClick={() => setOpen(false)}
          >
            List your business
          </Link>
          <div className="px-1 py-1">
            <ThemeToggle showLabel />
          </div>
          {isAuthenticated ? (
            <>
              <Link
                to={dashboardPath}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary"
                onClick={() => setOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary"
                onClick={() => setOpen(false)}
              >
                <UserIcon className="h-4 w-4" /> Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </>
          ) : (
            <div className="flex gap-2 px-3 py-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link to="/login" onClick={() => setOpen(false)}>
                  Log in
                </Link>
              </Button>
              <Button variant="accent" size="sm" className="flex-1" asChild>
                <Link to="/register" onClick={() => setOpen(false)}>
                  Sign up
                </Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
