import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useDensity } from '../density/DensityContext';
import { useTheme } from '../theme/ThemeContext';
import type { SpacingKey } from '../tokens/spacing';

export type CardProps = {
  elevation?: 'none' | 'sm' | 'md';
  padding?: SpacingKey;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
};

export function Card({ elevation = 'sm', padding = 4, children, onPress, style }: CardProps) {
  const { theme } = useTheme();
  const { spacing } = useDensity();
  const shadowStyle = elevation === 'none' ? {} : theme.shadows[elevation];

  const content = (
    <View
      style={[
        styles.card,
        shadowStyle,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          padding: spacing(padding),
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
  },
});

export function Divider() {
  const { theme } = useTheme();
  return <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 8 }} />;
}
