import { ChevronRight, Search } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDensity } from '../density/DensityContext';
import { useBreakpoint } from '../layout/ResponsiveContext';
import { useTheme } from '../theme/ThemeContext';
import { layout } from '../tokens/layout';
import { Card } from './Card';
import { neutral } from '../tokens/colors';
import { fontFamily, fontSize } from '../tokens/typography';
import { EmptyState } from './EmptyState';
import { Input } from './Input';
import { OdysseyIcon } from './OdysseyIcon';
import { TableSkeleton } from './Skeleton';

export type SidebarItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ color?: string; size?: number }>;
};

export type NavItemProps = {
  label: string;
  icon: React.ComponentType<{ color?: string; size?: number }>;
  active?: boolean;
  onPress: () => void;
  variant?: 'full' | 'rail';
};

export function NavItem({ label, icon: Icon, active = false, onPress, variant = 'full' }: NavItemProps) {
  const { theme } = useTheme();
  const { spacing } = useDensity();
  const isRail = variant === 'rail';

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      style={[
        styles.navItem,
        isRail && styles.navItemRail,
        {
          backgroundColor: active ? theme.colors.primarySubtle : 'transparent',
          paddingVertical: spacing(2),
          paddingHorizontal: isRail ? spacing(2) : spacing(3),
          minHeight: 44,
        },
      ]}
      onPress={onPress}
    >
      <Icon color={active ? theme.colors.primary : theme.colors.textSecondary} size={18} />
      {!isRail ? (
        <Text
          style={{
            color: active ? theme.colors.primary : theme.colors.text,
            fontFamily: active ? fontFamily.sansMedium : fontFamily.sans,
            marginLeft: spacing(2),
          }}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export type SidebarVariant = 'full' | 'rail' | 'hidden';

export function Sidebar({
  items,
  activeHref,
  onNavigate,
  variant = 'full',
}: {
  items: SidebarItem[];
  activeHref: string;
  onNavigate: (href: string) => void;
  variant?: SidebarVariant;
}) {
  const { theme } = useTheme();
  const { spacing } = useDensity();

  if (variant === 'hidden') return null;

  const isRail = variant === 'rail';
  const sidebarWidth = isRail ? layout.sidebarRailWidth : layout.sidebarWidth;

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          width: sidebarWidth,
          paddingVertical: spacing(4),
        },
      ]}
    >
      <View style={[styles.brandRow, isRail && styles.brandRowRail, { paddingHorizontal: spacing(3) }]}>
        <OdysseyIcon size={28} />
        {!isRail ? <Text style={[styles.brand, { color: theme.colors.primary }]}>Odyssey</Text> : null}
      </View>
      {items.map((item) => (
        <NavItem
          key={item.href}
          active={
            activeHref === item.href ||
            (item.href !== '/' && activeHref.startsWith(`${item.href}/`))
          }
          icon={item.icon}
          label={item.label}
          variant={isRail ? 'rail' : 'full'}
          onPress={() => onNavigate(item.href)}
        />
      ))}
    </View>
  );
}

export function AppHeader({
  title,
  onMenuPress,
  trailing,
}: {
  title: string;
  onMenuPress: () => void;
  trailing?: React.ReactNode;
}) {
  const { theme } = useTheme();
  const { spacing } = useDensity();

  return (
    <View
      style={[
        styles.appHeader,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          paddingHorizontal: spacing(3),
          paddingVertical: spacing(2),
        },
      ]}
    >
      <Pressable
        accessibilityLabel="Open navigation menu"
        accessibilityRole="button"
        hitSlop={8}
        style={[styles.menuButton, { minHeight: 44, minWidth: 44 }]}
        onPress={onMenuPress}
      >
        <View style={styles.menuIconBar}>
          <View style={[styles.menuIconLine, { backgroundColor: theme.colors.text }]} />
          <View style={[styles.menuIconLine, { backgroundColor: theme.colors.text }]} />
          <View style={[styles.menuIconLine, { backgroundColor: theme.colors.text }]} />
        </View>
      </Pressable>
      <Text style={[styles.appHeaderTitle, { color: theme.colors.text, flex: 1 }]} numberOfLines={1}>
        {title}
      </Text>
      {trailing}
    </View>
  );
}

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  flex?: number;
};

export type DataTableVariant = 'table' | 'cards' | 'auto';

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyHeading = 'No data',
  onRowPress,
  variant = 'auto',
  cardRender,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyHeading?: string;
  onRowPress?: (row: T) => void;
  variant?: DataTableVariant;
  /** Custom card body when variant resolves to cards. Defaults to first 3 columns. */
  cardRender?: (row: T) => React.ReactNode;
}) {
  const { theme, mode } = useTheme();
  const { spacing } = useDensity();
  const { isPhone } = useBreakpoint();
  const headerBackground = mode === 'light' ? neutral[100] : theme.colors.surfaceElevated;
  const useCards = variant === 'cards' || (variant === 'auto' && isPhone);

  if (loading) return <TableSkeleton columns={columns.length || 4} />;

  const shellStyle = [
    styles.tableShell,
    {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
  ];

  if (data.length === 0) {
    if (useCards) {
      return (
        <View style={shellStyle}>
          <EmptyState heading={emptyHeading} subtext="Nothing to show yet." />
        </View>
      );
    }
    return (
      <View style={shellStyle}>
        <View
          style={[
            styles.headerRow,
            {
              backgroundColor: headerBackground,
              borderBottomColor: theme.colors.borderStrong,
              paddingVertical: spacing(3),
              paddingHorizontal: spacing(3),
            },
          ]}
        >
          {columns.map((col) => (
            <Text
              key={col.key}
              style={[
                styles.headerCell,
                { color: theme.colors.textSecondary, flex: col.flex ?? 1 },
              ]}
            >
              {col.header}
            </Text>
          ))}
        </View>
        <View style={styles.emptyBody}>
          <EmptyState heading={emptyHeading} subtext="Nothing to show yet." />
        </View>
      </View>
    );
  }

  if (useCards) {
    const primaryCols = columns.slice(0, 3);
    return (
      <View style={styles.cardList}>
        {data.map((row, index) => (
          <Pressable
            key={index}
            disabled={!onRowPress}
            style={(state) => {
              const pressed = state.pressed;
              const hovered = 'hovered' in state ? Boolean(state.hovered) : false;
              return [pressed || hovered ? styles.cardPressed : null];
            }}
            onPress={() => onRowPress?.(row)}
          >
            <Card style={styles.dataCard}>
              {cardRender ? (
                cardRender(row)
              ) : (
                <View style={styles.cardRowInner}>
                  <View style={{ flex: 1, gap: 4 }}>
                    {primaryCols.map((col) => (
                      <View key={col.key}>{col.render(row)}</View>
                    ))}
                  </View>
                  {onRowPress ? (
                    <ChevronRight color={theme.colors.textSecondary} size={20} />
                  ) : null}
                </View>
              )}
            </Card>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={shellStyle}>
      <View
        style={[
          styles.headerRow,
          {
            backgroundColor: headerBackground,
            borderBottomColor: theme.colors.borderStrong,
            paddingVertical: spacing(3),
            paddingHorizontal: spacing(3),
          },
        ]}
      >
        {columns.map((col) => (
          <Text
            key={col.key}
            style={[
              styles.headerCell,
              { color: theme.colors.textSecondary, flex: col.flex ?? 1 },
            ]}
          >
            {col.header}
          </Text>
        ))}
      </View>
      <View style={styles.body}>
        {data.map((row, index) => (
          <Pressable
            key={index}
            disabled={!onRowPress}
            style={(state) => {
              const hovered = 'hovered' in state ? Boolean(state.hovered) : false;
              const pressed = state.pressed;
              const isLast = index === data.length - 1;

              return [
                styles.bodyRow,
                {
                  backgroundColor: pressed || hovered
                    ? theme.colors.primarySubtle
                    : index % 2 === 0
                      ? theme.colors.surface
                      : theme.colors.background,
                  borderBottomColor: theme.colors.border,
                  paddingVertical: spacing(3),
                  paddingHorizontal: spacing(3),
                },
                isLast && styles.lastRow,
                onRowPress && (hovered || pressed) && styles.rowInteractive,
              ];
            }}
            onPress={() => onRowPress?.(row)}
          >
            {columns.map((col) => (
              <View key={col.key} style={[styles.cell, { flex: col.flex ?? 1 }]}>
                {col.render(row)}
              </View>
            ))}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search...',
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Input leftIcon={Search} placeholder={placeholder} value={value} onChangeText={onChangeText} />
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const { theme } = useTheme();
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const dim = size === 'sm' ? 28 : size === 'lg' ? 48 : 36;

  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        backgroundColor: theme.colors.primarySubtle,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: theme.colors.primary, fontFamily: fontFamily.sansMedium }}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: { borderRightWidth: 1, height: '100%' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  brandRowRail: { justifyContent: 'center', marginBottom: 12 },
  brand: { fontFamily: fontFamily.sansBold, fontSize: fontSize.xl },
  navItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, marginHorizontal: 8 },
  navItemRail: { justifyContent: 'center' },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: 12,
    width: '100%',
  },
  appHeaderTitle: { fontFamily: fontFamily.sansSemiBold, fontSize: fontSize.lg },
  menuButton: { alignItems: 'center', justifyContent: 'center' },
  menuIconBar: { gap: 5, width: 22 },
  menuIconLine: { height: 2, borderRadius: 1, width: '100%' },
  cardList: { gap: 12, width: '100%' },
  dataCard: { padding: 12 },
  cardRowInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardPressed: { opacity: 0.92 },
  tableShell: {
    width: '100%',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: 1,
  },
  headerCell: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: fontSize.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  body: { width: '100%' },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  lastRow: { borderBottomWidth: 0 },
  rowInteractive: { cursor: 'pointer' as never },
  cell: {
    justifyContent: 'center',
    minWidth: 0,
    paddingRight: 8,
  },
  emptyBody: { paddingVertical: 24 },
});
