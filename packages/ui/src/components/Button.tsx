import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useDensity } from '../density/DensityContext';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, fontSize } from '../tokens/typography';

export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  onPress: () => void;
  children: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onPress,
  children,
  style,
}: ButtonProps) {
  const { theme } = useTheme();
  const { spacing } = useDensity();
  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: { paddingVertical: spacing(1), paddingHorizontal: spacing(3), fontSize: fontSize.sm },
    md: { paddingVertical: spacing(2), paddingHorizontal: spacing(4), fontSize: fontSize.base },
    lg: { paddingVertical: spacing(3), paddingHorizontal: spacing(5), fontSize: fontSize.md },
  }[size];

  const variantStyles = {
    primary: { bg: theme.colors.primary, text: theme.colors.textInverse, border: theme.colors.primary },
    secondary: { bg: theme.colors.surface, text: theme.colors.text, border: theme.colors.border },
    ghost: { bg: 'transparent', text: theme.colors.primary, border: 'transparent' },
    danger: { bg: theme.colors.danger, text: theme.colors.textInverse, border: theme.colors.danger },
  }[variant];

  const getStyle = ({ pressed }: PressableStateCallbackType): ViewStyle[] => [
    styles.base,
    {
      backgroundColor: pressed && !isDisabled ? theme.colors.primaryPressed : variantStyles.bg,
      borderColor: variantStyles.border,
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      opacity: isDisabled ? 0.4 : 1,
      transform: [{ scale: pressed && !isDisabled ? 0.97 : 1 }],
    },
    style as ViewStyle,
  ];

  const IconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  return (
    <Pressable disabled={isDisabled} onPress={onPress} style={getStyle}>
      {loading ? (
        <ActivityIndicator color={variantStyles.text} size="small" />
      ) : (
        <>
          {LeftIcon ? <LeftIcon color={variantStyles.text} size={IconSize} style={styles.iconLeft} /> : null}
          <Text style={[styles.label, { color: variantStyles.text, fontSize: sizeStyles.fontSize }]}>
            {children}
          </Text>
          {RightIcon ? <RightIcon color={variantStyles.text} size={IconSize} style={styles.iconRight} /> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  label: {
    fontFamily: fontFamily.sansMedium,
  },
  iconLeft: { marginRight: 6 },
  iconRight: { marginLeft: 6 },
});
