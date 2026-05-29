import { AlertTriangle, X } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDensity } from '../density/DensityContext';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, fontSize } from '../tokens/typography';

export type WarningBannerProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
};

export function WarningBanner({
  message,
  actionLabel,
  onAction,
  dismissible = false,
  onDismiss,
}: WarningBannerProps) {
  const { theme } = useTheme();
  const { spacing } = useDensity();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.warningSubtle,
          borderColor: theme.colors.warning,
          padding: spacing(3),
        },
      ]}
    >
      <AlertTriangle color={theme.colors.warning} size={18} />
      <Text style={[styles.message, { color: theme.colors.text, flex: 1 }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <Text style={[styles.action, { color: theme.colors.warning }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
      {dismissible && onDismiss ? (
        <Pressable onPress={onDismiss}>
          <X color={theme.colors.textSecondary} size={16} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  message: { fontFamily: fontFamily.sans, fontSize: fontSize.sm },
  action: { fontFamily: fontFamily.sansMedium, fontSize: fontSize.sm },
});
