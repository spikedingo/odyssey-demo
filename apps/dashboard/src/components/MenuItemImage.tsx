import { useTheme } from '@odyssey/ui';
import { useState } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType, type ImageStyle, type StyleProp } from 'react-native';

import { getMenuItemAsset, MENU_ITEM_FALLBACK } from '@/constants/menuItemAssets';

type MenuItemImageProps = {
  name?: string;
  url?: string | null;
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ImageStyle>;
  dimmed?: boolean;
};

function resolveSource(name?: string, url?: string | null): ImageSourcePropType {
  if (name) {
    const local = getMenuItemAsset(name);
    if (local) return local;
  }
  if (url && !url.startsWith('http')) {
    const fromSlug = name ? getMenuItemAsset(name) : undefined;
    if (fromSlug) return fromSlug;
  }
  if (url?.startsWith('http')) {
    return { uri: url };
  }
  return MENU_ITEM_FALLBACK;
}

export function MenuItemImage({
  name,
  url,
  width = 48,
  height = 48,
  borderRadius = 8,
  style,
  dimmed = false,
}: MenuItemImageProps) {
  const { theme } = useTheme();
  const [failed, setFailed] = useState(false);
  const source = failed ? MENU_ITEM_FALLBACK : resolveSource(name, url);

  return (
    <View
      style={[
        styles.frame,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.border,
          opacity: dimmed ? 0.55 : 1,
        },
      ]}
    >
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="cover"
        source={source}
        style={[{ width: '100%', height: '100%', borderRadius }, style]}
        onError={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
});
