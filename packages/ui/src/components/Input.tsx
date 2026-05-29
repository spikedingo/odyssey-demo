import type { LucideIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useDensity } from '../density/DensityContext';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, fontSize } from '../tokens/typography';

export type InputProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  leftIcon?: LucideIcon;
  rightElement?: React.ReactNode;
};

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  hint,
  disabled = false,
  leftIcon: LeftIcon,
  rightElement,
}: InputProps) {
  const { theme } = useTheme();
  const { spacing } = useDensity();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View style={{ marginBottom: spacing(3) }}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.text, marginBottom: spacing(1) }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputWrap,
          {
            borderColor,
            backgroundColor: disabled ? theme.colors.background : theme.colors.surface,
            paddingHorizontal: spacing(3),
            paddingVertical: spacing(2),
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {LeftIcon ? <LeftIcon color={theme.colors.textSecondary} size={16} style={{ marginRight: 8 }} /> : null}
        <TextInput
          editable={!disabled}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textDisabled}
          style={[styles.input, { color: theme.colors.text }]}
          value={value}
          onBlur={() => setFocused(false)}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
        />
        {rightElement}
      </View>
      {error ? (
        <Text style={[styles.hint, { color: theme.colors.danger, marginTop: spacing(1) }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: theme.colors.textSecondary, marginTop: spacing(1) }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fontFamily.sansMedium, fontSize: fontSize.sm },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.base,
    padding: 0,
  },
  hint: { fontFamily: fontFamily.sans, fontSize: fontSize.sm },
});
