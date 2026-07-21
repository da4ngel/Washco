import { Outlet } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Sparkles, CalendarDays, Wallet, Settings, BarChart3 } from 'lucide-react';
import { DashboardShell, NavItem } from './DashboardShell';

const NAV: NavItem[] = [
  { to: '/tenant/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tenant/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/tenant/services', label: 'Services', icon: Sparkles },
  { to: '/tenant/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/tenant/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/tenant/payouts', label: 'Payouts', icon: Wallet },
  { to: '/tenant/settings', label: 'Settings', icon: Settings },
];

export function TenantLayout() {
  return (
    <DashboardShell title="Tenant" nav={NAV}>
      <Outlet />
    </DashboardShell>
  );
}
