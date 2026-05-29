import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useDensity } from '../density/DensityContext';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, fontSize } from '../tokens/typography';

export type TextAreaProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
};

export function TextArea({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  hint,
  disabled = false,
  rows = 4,
  maxLength,
}: TextAreaProps) {
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
      <TextInput
        editable={!disabled}
        maxLength={maxLength}
        multiline
        numberOfLines={rows}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textDisabled}
        style={[
          styles.input,
          {
            borderColor,
            backgroundColor: disabled ? theme.colors.background : theme.colors.surface,
            color: theme.colors.text,
            padding: spacing(3),
            minHeight: rows * 22,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        textAlignVertical="top"
        value={value}
        onBlur={() => setFocused(false)}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
      />
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.base,
  },
  hint: { fontFamily: fontFamily.sans, fontSize: fontSize.sm },
});
