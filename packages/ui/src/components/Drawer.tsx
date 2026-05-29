import { X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useDensity } from '../density/DensityContext';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, fontSize } from '../tokens/typography';

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
};

const BACKDROP_DURATION = 220;
const PANEL_DURATION = 300;

export function Drawer({ open, onClose, title, children, footer, width = 480 }: DrawerProps) {
  const { theme } = useTheme();
  const { spacing } = useDensity();
  const panelWidth = Math.min(width, 600);

  const [visible, setVisible] = useState(open);
  const visibleRef = useRef(open);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(panelWidth)).current;

  useEffect(() => {
    if (open) {
      visibleRef.current = true;
      setVisible(true);
      backdropOpacity.setValue(0);
      slideX.setValue(panelWidth);

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: BACKDROP_DURATION,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideX, {
          toValue: 0,
          duration: PANEL_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!visibleRef.current) return;

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: BACKDROP_DURATION,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideX, {
        toValue: panelWidth,
        duration: PANEL_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        visibleRef.current = false;
        setVisible(false);
      }
    });
  }, [open, panelWidth, backdropOpacity, slideX]);

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          pointerEvents={open ? 'auto' : 'none'}
          style={[StyleSheet.absoluteFillObject, { opacity: backdropOpacity }]}
        >
          <Pressable style={styles.backdrop} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            styles.panel,
            theme.shadows.lg,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              width: panelWidth,
              padding: spacing(4),
              transform: [{ translateX: slideX }],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            <Pressable onPress={onClose}>
              <X color={theme.colors.textSecondary} size={20} />
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }}>{children}</ScrollView>
          {footer ? <View style={{ marginTop: spacing(4) }}>{footer}</View> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  panel: {
    height: '100%',
    borderLeftWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontFamily: fontFamily.sansSemiBold, fontSize: fontSize.lg },
});
