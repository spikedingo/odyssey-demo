import { Search } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDensity } from '../density/DensityContext';
import { useTheme } from '../theme/ThemeContext';
import { layout } from '../tokens/layout';
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
};

export function NavItem({ label, icon: Icon, active = false, onPress }: NavItemProps) {
  const { theme } = useTheme();
  const { spacing } = useDensity();

  return (
    <Pressable
      style={[
        styles.navItem,
        {
          backgroundColor: active ? theme.colors.primarySubtle : 'transparent',
          paddingVertical: spacing(2),
          paddingHorizontal: spacing(3),
        },
      ]}
      onPress={onPress}
    >
      <Icon color={active ? theme.colors.primary : theme.colors.textSecondary} size={18} />
      <Text
        style={{
          color: active ? theme.colors.primary : theme.colors.text,
          fontFamily: active ? fontFamily.sansMedium : fontFamily.sans,
          marginLeft: spacing(2),
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Sidebar({
  items,
  activeHref,
  onNavigate,
}: {
  items: SidebarItem[];
  activeHref: string;
  onNavigate: (href: string) => void;
}) {
  const { theme } = useTheme();
  const { spacing } = useDensity();

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          width: layout.sidebarWidth,
          paddingVertical: spacing(4),
        },
      ]}
    >
      <View style={[styles.brandRow, { paddingHorizontal: spacing(3) }]}>
        <OdysseyIcon size={28} />
        <Text style={[styles.brand, { color: theme.colors.primary }]}>Odyssey</Text>
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
          onPress={() => onNavigate(item.href)}
        />
      ))}
    </View>
  );
}

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  flex?: number;
};

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyHeading = 'No data',
  onRowPress,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyHeading?: string;
  onRowPress?: (row: T) => void;
}) {
  const { theme, mode } = useTheme();
  const { spacing } = useDensity();
  const headerBackground = mode === 'light' ? neutral[100] : theme.colors.surfaceElevated;

  if (loading) return <TableSkeleton columns={columns.length || 4} />;

  const shellStyle = [
    styles.tableShell,
    {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
  ];

  if (data.length === 0) {
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
  brand: { fontFamily: fontFamily.sansBold, fontSize: fontSize.xl },
  navItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, marginHorizontal: 8 },
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
