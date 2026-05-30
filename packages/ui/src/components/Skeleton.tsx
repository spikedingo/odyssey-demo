import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, type ViewStyle } from 'react-native';

const SKELETON_USE_NATIVE_DRIVER = Platform.OS === 'web';

import { useTheme } from '../theme/ThemeContext';

export function SkeletonBox({
  width = '100%',
  height = 16,
  style,
}: {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: SKELETON_USE_NATIVE_DRIVER,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: SKELETON_USE_NATIVE_DRIVER,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
      opacity.stopAnimation();
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.box,
        { width: width as number, height, backgroundColor: theme.colors.border, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonText({ width = '80%' }: { width?: number | string }) {
  return <SkeletonBox height={14} width={width} />;
}

export function SkeletonCard() {
  return (
    <View style={{ gap: 8 }}>
      <SkeletonBox height={120} />
      <SkeletonText width="60%" />
      <SkeletonText width="40%" />
    </View>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        width: '100%',
        alignSelf: 'stretch',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: theme.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.borderStrong,
        }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBox key={`head-${i}`} height={12} width={i === 0 ? '20%' : '100%'} style={{ flex: 1 }} />
        ))}
      </View>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: rowIndex === rows - 1 ? 0 : StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.border,
            backgroundColor: rowIndex % 2 === 0 ? theme.colors.surface : theme.colors.background,
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonBox
              key={`${rowIndex}-${colIndex}`}
              height={14}
              width={colIndex === 0 ? '40%' : '100%'}
              style={{ flex: 1 }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 6 },
});
