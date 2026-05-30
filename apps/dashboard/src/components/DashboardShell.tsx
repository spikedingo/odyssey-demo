import {
  AppHeader,
  Drawer,
  NavItem,
  OdysseyIcon,
  Sidebar,
  useBreakpoint,
  useTheme,
  type SidebarItem,
} from '@odyssey/ui';
import { Slot, usePathname, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ROUTE_TITLES: Record<string, string> = {
  '/home': 'Home',
  '/orders': 'Orders',
  '/crm': 'CRM',
  '/menu': 'Menu',
  '/settings': 'Settings',
  '/ui-library': 'UI Library',
  '/pos': 'Order Terminal',
};

function routeTitle(pathname: string): string {
  if (pathname.startsWith('/orders/')) return 'Order Detail';
  if (pathname.startsWith('/crm/')) return 'Customer';
  return ROUTE_TITLES[pathname] ?? 'Odyssey';
}

type DashboardShellProps = {
  navItems: SidebarItem[];
};

export function DashboardShell({ navItems }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const { breakpoint, contentPadding, isPhone, isTablet, isDesktop } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const [navOpen, setNavOpen] = useState(false);

  const sidebarVariant = isDesktop ? 'full' : isTablet ? 'rail' : 'hidden';
  const title = useMemo(() => routeTitle(pathname), [pathname]);

  const navigate = (href: string) => {
    router.push(href as never);
    setNavOpen(false);
  };

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: theme.colors.background,
          paddingTop: isPhone ? insets.top : 0,
          minHeight: Platform.OS === 'web' ? ('100dvh' as never) : '100%',
        },
      ]}
    >
      {isPhone ? (
        <AppHeader title={title} onMenuPress={() => setNavOpen(true)} />
      ) : null}

      <View style={styles.bodyRow}>
        <Sidebar
          activeHref={pathname}
          items={navItems}
          variant={sidebarVariant}
          onNavigate={navigate}
        />
        <View
          style={[
            styles.content,
            {
              padding: contentPadding,
              paddingBottom: Math.max(contentPadding, insets.bottom),
            },
          ]}
        >
          <View style={styles.page}>
            <Slot />
          </View>
        </View>
      </View>

      {isPhone ? (
        <Drawer open={navOpen} placement="left" title="Navigation" onClose={() => setNavOpen(false)}>
          <View style={styles.drawerBrand}>
            <OdysseyIcon size={28} />
            <Text style={[styles.drawerBrandText, { color: theme.colors.primary }]}>Odyssey</Text>
          </View>
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              active={
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(`${item.href}/`))
              }
              icon={item.icon}
              label={item.label}
              onPress={() => navigate(item.href)}
            />
          ))}
        </Drawer>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, width: '100%' },
  bodyRow: { flex: 1, flexDirection: 'row', minHeight: 0 },
  content: { flex: 1, overflow: 'scroll', alignItems: 'stretch', minWidth: 0 },
  page: { flex: 1, width: '100%', alignSelf: 'stretch' },
  drawerBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  drawerBrandText: { fontSize: 20, fontWeight: '700' },
});
