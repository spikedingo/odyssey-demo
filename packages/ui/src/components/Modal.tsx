import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal as RNModal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useDensity } from '../density/DensityContext';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, fontSize } from '../tokens/typography';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const sizeMap = { sm: 360, md: 480, lg: 640 };

export function Modal({ open, onClose, title, size = 'md', children, footer }: ModalProps) {
  const { theme } = useTheme();
  const { spacing } = useDensity();

  return (
    <RNModal animationType="fade" transparent visible={open} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.content,
            theme.shadows.lg,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              maxWidth: sizeMap[size],
              padding: spacing(4),
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            <Pressable onPress={onClose}>
              <X color={theme.colors.textSecondary} size={20} />
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 400 }}>{children}</ScrollView>
          {footer ? <View style={{ marginTop: spacing(4) }}>{footer}</View> : null}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: fontSize.lg,
  },
});

export type SelectProps<T extends string> = {
  label?: string;
  options: { label: string; value: T }[];
  value: T | null;
  onChange: (v: T) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
};

export function Select<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  error,
  disabled = false,
}: SelectProps<T>) {
  const { theme } = useTheme();
  const { spacing } = useDensity();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ marginBottom: spacing(3) }}>
      {label ? (
        <Text style={[selectStyles.label, { color: theme.colors.text, marginBottom: spacing(1) }]}>{label}</Text>
      ) : null}
      <Pressable
        disabled={disabled}
        style={[
          selectStyles.trigger,
          {
            borderColor: error ? theme.colors.danger : theme.colors.border,
            backgroundColor: theme.colors.surface,
            padding: spacing(3),
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        onPress={() => setOpen(true)}
      >
        <Text style={{ color: selected ? theme.colors.text : theme.colors.textDisabled }}>
          {selected?.label ?? placeholder}
        </Text>
      </Pressable>
      {error ? (
        <Text style={[selectStyles.hint, { color: theme.colors.danger, marginTop: spacing(1) }]}>{error}</Text>
      ) : null}
      <Modal open={open} title={label ?? 'Select'} onClose={() => setOpen(false)}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            style={{ paddingVertical: spacing(2) }}
            onPress={() => {
              onChange(option.value);
              setOpen(false);
            }}
          >
            <Text style={{ color: theme.colors.text, fontFamily: fontFamily.sans }}>{option.label}</Text>
          </Pressable>
        ))}
      </Modal>
    </View>
  );
}

const selectStyles = StyleSheet.create({
  label: { fontFamily: fontFamily.sansMedium, fontSize: fontSize.sm },
  trigger: { borderWidth: 1, borderRadius: 8 },
  hint: { fontFamily: fontFamily.sans, fontSize: fontSize.sm },
});
