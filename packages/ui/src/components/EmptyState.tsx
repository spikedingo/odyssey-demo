import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import { fontFamily, fontSize } from '../tokens/typography';
import { Button } from './Button';

export type EmptyStateProps = {
  icon?: React.ReactNode;
  heading: string;
  subtext?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, heading, subtext, actionLabel, onAction }: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {icon}
      <Text style={[styles.heading, { color: theme.colors.text }]}>{heading}</Text>
      {subtext ? (
        <Text style={[styles.subtext, { color: theme.colors.textSecondary }]}>{subtext}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: 16 }}>
          <Button onPress={onAction}>{actionLabel}</Button>
        </View>
      ) : null}
    </View>
  );
}

export type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: theme.colors.danger }]}>Something went wrong</Text>
      <Text style={[styles.subtext, { color: theme.colors.textSecondary }]}>{message}</Text>
      {onRetry ? (
        <View style={{ marginTop: 16 }}>
          <Button variant="secondary" onPress={onRetry}>
            Try again
          </Button>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  heading: { fontFamily: fontFamily.sansSemiBold, fontSize: fontSize.lg, marginTop: 12 },
  subtext: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.base,
    marginTop: 8,
    textAlign: 'center',
  },
});
