import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { HomePage } from '@/pages/user/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { TenantRegisterPage } from '@/pages/auth/TenantRegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { AuthCallbackPage } from '@/pages/auth/AuthCallbackPage';
import { SearchPage } from '@/pages/user/SearchPage';
import { TenantDetailPage } from '@/pages/user/TenantDetailPage';
import { BookingPage } from '@/pages/user/BookingPage';
import { BookingSuccessPage } from '@/pages/user/BookingSuccessPage';
import { UserDashboardPage } from '@/pages/user/UserDashboardPage';
import { ProfilePage } from '@/pages/user/ProfilePage';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { TenantLayout } from '@/components/layout/TenantLayout';
import { TenantDashboardPage } from '@/pages/tenant/TenantDashboardPage';
import { BookingsPage as TenantBookingsPage } from '@/pages/tenant/BookingsPage';
import { ServicesPage } from '@/pages/tenant/ServicesPage';
import { SchedulePage } from '@/pages/tenant/SchedulePage';
import { PayoutsPage } from '@/pages/tenant/PayoutsPage';
import { AnalyticsPage } from '@/pages/tenant/AnalyticsPage';
import { TenantSettingsPage } from '@/pages/tenant/TenantSettingsPage';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { TenantApprovalsPage } from '@/pages/admin/TenantApprovalsPage';
import { AllBookingsPage } from '@/pages/admin/AllBookingsPage';
import { RevenuePage } from '@/pages/admin/RevenuePage';
import { UsersPage } from '@/pages/admin/UsersPage';

/**
 * Application routes. Feature routes are added to the appropriate layout
 * children as each phase lands (booking, tenant, admin).
 */
export const router = createBrowserRouter([
  // Auth (standalone, no navbar/footer)
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/register/tenant', element: <TenantRegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },

  // Public / customer-facing
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/wash/:slug', element: <TenantDetailPage /> },
      { path: '/book/:tenantId', element: <BookingPage /> },
      { path: '/booking/:id/success', element: <BookingSuccessPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/dashboard', element: <UserDashboardPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },

  // Tenant dashboard
  {
    element: <ProtectedRoute roles={['tenant', 'admin']} />,
    children: [
      {
        element: <TenantLayout />,
        children: [
          { path: '/tenant/dashboard', element: <TenantDashboardPage /> },
          { path: '/tenant/bookings', element: <TenantBookingsPage /> },
          { path: '/tenant/services', element: <ServicesPage /> },
          { path: '/tenant/schedule', element: <SchedulePage /> },
          { path: '/tenant/analytics', element: <AnalyticsPage /> },
          { path: '/tenant/payouts', element: <PayoutsPage /> },
          { path: '/tenant/settings', element: <TenantSettingsPage /> },
        ],
      },
    ],
  },

  // Admin dashboard
  {
    element: <ProtectedRoute roles={['admin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <AdminDashboardPage /> },
          { path: '/admin/tenants', element: <TenantApprovalsPage /> },
          { path: '/admin/bookings', element: <AllBookingsPage /> },
          { path: '/admin/revenue', element: <RevenuePage /> },
          { path: '/admin/users', element: <UsersPage /> },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);
