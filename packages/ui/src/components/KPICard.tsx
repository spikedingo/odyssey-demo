import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import { fontFamily, fontSize } from '../tokens/typography';
import { Card } from './Card';

export type KPICardProps = {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  style?: ViewStyle;
};

export function KPICard({ label, value, trend, trendLabel, style }: KPICardProps) {
  const { theme } = useTheme();
  const trendColor =
    trend === 'up' ? theme.colors.success : trend === 'down' ? theme.colors.danger : theme.colors.textSecondary;

  return (
    <Card style={style}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
      {trendLabel ? (
        <Text style={[styles.trend, { color: trendColor }]}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendLabel}
        </Text>
      ) : null}
    </Card>
  );
}

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: string;
};

export function PageHeader({ title, subtitle, actions, breadcrumb }: PageHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        {breadcrumb ? (
          <Text style={[styles.breadcrumb, { color: theme.colors.textSecondary }]}>{breadcrumb}</Text>
        ) : null}
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      {actions}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  breadcrumb: { fontFamily: fontFamily.sans, fontSize: fontSize.sm, marginBottom: 4 },
  title: { fontFamily: fontFamily.sansBold, fontSize: fontSize['2xl'] },
  subtitle: { fontFamily: fontFamily.sans, fontSize: fontSize.base, marginTop: 4 },
  label: { fontFamily: fontFamily.sans, fontSize: fontSize.sm },
  value: { fontFamily: fontFamily.sansBold, fontSize: fontSize['3xl'], marginTop: 4 },
  trend: { fontFamily: fontFamily.sans, fontSize: fontSize.sm, marginTop: 8 },
});
