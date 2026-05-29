import { X } from 'lucide-react-native';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import { fontFamily, fontSize } from '../tokens/typography';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
      warning: (message) => show(message, 'warning'),
      info: (message) => show(message, 'info'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const { theme } = useTheme();

  if (toasts.length === 0) return null;

  const variantColors: Record<ToastVariant, string> = {
    success: theme.colors.success,
    error: theme.colors.danger,
    warning: theme.colors.warning,
    info: theme.colors.info,
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <View
          key={toast.id}
          style={[
            styles.toast,
            theme.shadows.md,
            {
              backgroundColor: theme.colors.surface,
              borderLeftColor: variantColors[toast.variant],
            },
          ]}
        >
          <Text style={[styles.message, { color: theme.colors.text }]}>{toast.message}</Text>
          <Pressable onPress={() => onDismiss(toast.id)}>
            <X color={theme.colors.textSecondary} size={16} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    gap: 8,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    minWidth: 280,
  },
  message: { fontFamily: fontFamily.sans, fontSize: fontSize.sm, flex: 1 },
});

export function Toast({
  message,
  variant = 'info',
  onClose,
}: {
  message: string;
  variant?: ToastVariant;
  onClose?: () => void;
}) {
  const { theme } = useTheme();
  const colors = {
    success: theme.colors.success,
    error: theme.colors.danger,
    warning: theme.colors.warning,
    info: theme.colors.info,
  };

  return (
    <View style={[styles.toast, { borderLeftColor: colors[variant], backgroundColor: theme.colors.surface }]}>
      <Text style={{ color: theme.colors.text, flex: 1 }}>{message}</Text>
      {onClose ? (
        <Pressable onPress={onClose}>
          <X color={theme.colors.textSecondary} size={16} />
        </Pressable>
      ) : null}
    </View>
  );
}
