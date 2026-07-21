import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Building2, CalendarCheck, TrendingUp, Users } from 'lucide-react';
import { DashboardShell, NavItem } from './DashboardShell';

const NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/tenants', label: 'Approvals', icon: Building2 },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/admin/revenue', label: 'Revenue', icon: TrendingUp },
  { to: '/admin/users', label: 'Users', icon: Users },
];

export function AdminLayout() {
  return (
    <DashboardShell title="Admin" nav={NAV}>
      <Outlet />
    </DashboardShell>
  );
}
