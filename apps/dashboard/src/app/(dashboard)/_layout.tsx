import { type SidebarItem } from '@odyssey/ui';
import { BookOpen, Home, Monitor, Settings, ShoppingBag, Users, UtensilsCrossed } from 'lucide-react-native';

import { DashboardShell } from '@/components/DashboardShell';

const navItems: SidebarItem[] = [
  { label: 'Home', href: '/home', icon: Home as SidebarItem['icon'] },
  { label: 'Orders', href: '/orders', icon: ShoppingBag as SidebarItem['icon'] },
  { label: 'CRM', href: '/crm', icon: Users as SidebarItem['icon'] },
  { label: 'Menu', href: '/menu', icon: UtensilsCrossed as SidebarItem['icon'] },
  { label: 'Order Terminal', href: '/', icon: Monitor as SidebarItem['icon'] },
  { label: 'Settings', href: '/settings', icon: Settings as SidebarItem['icon'] },
  { label: 'UI Library', href: '/ui-library', icon: BookOpen as SidebarItem['icon'] },
];

export default function DashboardLayout() {
  return <DashboardShell navItems={navItems} />;
}
