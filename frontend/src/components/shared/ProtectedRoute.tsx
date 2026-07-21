import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  roles?: UserRole[];
}

/**
 * Guards nested routes. Redirects unauthenticated users to /login (preserving
 * the intended destination) and users lacking the required role to their home.
 */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { isAuthenticated, profile, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) {
    return <LoadingSpinner fullPage label="Loading…" />;
  }

  if (!isAuthenticated || !profile) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (roles && !roles.includes(profile.role)) {
    const home = profile.role === 'admin' ? '/admin' : profile.role === 'tenant' ? '/tenant/dashboard' : '/dashboard';
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}
