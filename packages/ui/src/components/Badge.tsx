import type { OrderStatus } from '@odyssey/types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';


import { useTheme } from '../theme/ThemeContext';
import { orderStatus } from '../tokens/colors';
import { fontFamily, fontSize } from '../tokens/typography';

export type BadgeProps = {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'order-status';
  orderStatus?: OrderStatus;
  size?: 'sm' | 'md';
};

export function Badge({
  label,
  variant = 'default',
  orderStatus: status,
  size = 'md',
}: BadgeProps) {
  const { theme } = useTheme();

  const colors = {
    default: { bg: theme.colors.background, text: theme.colors.textSecondary },
    success: { bg: theme.colors.successSubtle, text: theme.colors.success },
    warning: { bg: theme.colors.warningSubtle, text: theme.colors.warning },
    error: { bg: theme.colors.dangerSubtle, text: theme.colors.danger },
    info: { bg: '#eff6ff', text: theme.colors.info },
    'order-status': status
      ? { bg: `${orderStatus[status]}22`, text: orderStatus[status] }
      : { bg: theme.colors.background, text: theme.colors.text },
  }[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: size === 'sm' ? 6 : 10,
          paddingVertical: size === 'sm' ? 2 : 4,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
            fontSize: size === 'sm' ? fontSize.xs : fontSize.sm,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 999, alignSelf: 'flex-start' },
  label: { fontFamily: fontFamily.sansMedium },
});
