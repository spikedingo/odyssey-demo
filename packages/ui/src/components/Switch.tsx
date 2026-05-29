import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDensity } from '../density/DensityContext';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, fontSize } from '../tokens/typography';

export type SwitchProps = {
  label?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  hint?: string;
};

export function Switch({ label, value, onValueChange, disabled = false, hint }: SwitchProps) {
  const { theme } = useTheme();
  const { spacing } = useDensity();

  return (
    <View style={{ marginBottom: spacing(3), opacity: disabled ? 0.5 : 1 }}>
      <Pressable
        disabled={disabled}
        style={styles.row}
        onPress={() => onValueChange(!value)}
      >
        {label ? (
          <Text style={[styles.label, { color: theme.colors.text, flex: 1 }]}>{label}</Text>
        ) : null}
        <View
          style={[
            styles.track,
            {
              backgroundColor: value ? theme.colors.primary : theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.thumb,
              {
                backgroundColor: theme.colors.surface,
                transform: [{ translateX: value ? 18 : 2 }],
              },
            ]}
          />
        </View>
      </Pressable>
      {hint ? (
        <Text style={[styles.hint, { color: theme.colors.textSecondary, marginTop: spacing(1) }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { fontFamily: fontFamily.sansMedium, fontSize: fontSize.base },
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  hint: { fontFamily: fontFamily.sans, fontSize: fontSize.sm },
});
