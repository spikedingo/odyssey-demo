import { Sidebar, useTheme, type SidebarItem } from '@odyssey/ui';
import { Slot, usePathname, useRouter } from 'expo-router';
import { BookOpen, Home, Monitor, Settings, ShoppingBag, Users, UtensilsCrossed } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

const navItems: SidebarItem[] = [
  { label: 'Home', href: '/home', icon: Home as SidebarItem['icon'] },
  { label: 'Orders', href: '/orders', icon: ShoppingBag as SidebarItem['icon'] },
  { label: 'CRM', href: '/crm', icon: Users as SidebarItem['icon'] },
  { label: 'Menu', href: '/menu', icon: UtensilsCrossed as SidebarItem['icon'] },
  { label: 'Order Terminal', href: '/pos', icon: Monitor as SidebarItem['icon'] },
  { label: 'Settings', href: '/settings', icon: Settings as SidebarItem['icon'] },
  { label: 'UI Library', href: '/ui-library', icon: BookOpen as SidebarItem['icon'] },
];

export default function DashboardLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();

  return (
    <View style={[styles.shell, { backgroundColor: theme.colors.background }]}>
      <Sidebar activeHref={pathname} items={navItems} onNavigate={(href) => router.push(href as never)} />
      <View style={styles.content}>
        <View style={styles.page}>
          <Slot />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row', minHeight: '100%' },
  content: { flex: 1, padding: 24, overflow: 'scroll', alignItems: 'stretch' },
  page: { flex: 1, width: '100%', alignSelf: 'stretch' },
});
