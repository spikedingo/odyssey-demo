import { X } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/** Transform + ScrollView under native driver breaks iOS (addAnimatedEventToView). */
const PANEL_USE_NATIVE_DRIVER = false;
const BACKDROP_USE_NATIVE_DRIVER = Platform.OS !== 'web';

import { useDensity } from '../density/DensityContext';
import { useBreakpoint } from '../layout/ResponsiveContext';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, fontSize } from '../tokens/typography';

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  placement?: 'left' | 'right';
};

const BACKDROP_DURATION = 220;
const PANEL_DURATION = 300;

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  width = 480,
  placement = 'right',
}: DrawerProps) {
  const { theme } = useTheme();
  const { spacing } = useDensity();
  const { isPhone, width: windowWidth } = useBreakpoint();

  const panelWidth = useMemo(() => {
    if (isPhone) return windowWidth;
    return Math.min(width, 600);
  }, [isPhone, width, windowWidth]);

  const isLeft = placement === 'left';
  const closedOffset = isLeft ? -panelWidth : panelWidth;

  const [visible, setVisible] = useState(open);
  const visibleRef = useRef(open);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(closedOffset)).current;

  useEffect(() => {
    if (open) {
      visibleRef.current = true;
      setVisible(true);
      backdropOpacity.setValue(0);
      slideX.setValue(closedOffset);

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: BACKDROP_DURATION,
          easing: Easing.out(Easing.quad),
          useNativeDriver: BACKDROP_USE_NATIVE_DRIVER,
        }),
        Animated.timing(slideX, {
          toValue: 0,
          duration: PANEL_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: PANEL_USE_NATIVE_DRIVER,
        }),
      ]).start();
      return () => {
        backdropOpacity.stopAnimation();
        slideX.stopAnimation();
      };
    }

    if (!visibleRef.current) return;

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: BACKDROP_DURATION,
        easing: Easing.in(Easing.quad),
        useNativeDriver: BACKDROP_USE_NATIVE_DRIVER,
      }),
      Animated.timing(slideX, {
        toValue: closedOffset,
        duration: PANEL_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: PANEL_USE_NATIVE_DRIVER,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        visibleRef.current = false;
        setVisible(false);
      }
    });

    return () => {
      backdropOpacity.stopAnimation();
      slideX.stopAnimation();
    };
  }, [open, closedOffset, backdropOpacity, slideX]);

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={onClose}>
      <View style={[styles.overlay, isLeft ? styles.overlayLeft : styles.overlayRight]}>
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
            isLeft ? styles.panelLeft : styles.panelRight,
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
            <Pressable hitSlop={8} onPress={onClose}>
              <X color={theme.colors.textSecondary} size={20} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
            {children}
          </ScrollView>
          {footer ? <View style={{ marginTop: spacing(4) }}>{footer}</View> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  overlayRight: { justifyContent: 'flex-end' },
  overlayLeft: { justifyContent: 'flex-start' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  panel: { height: '100%' },
  panelRight: { borderLeftWidth: 1 },
  panelLeft: { borderRightWidth: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontFamily: fontFamily.sansSemiBold, fontSize: fontSize.lg },
});
