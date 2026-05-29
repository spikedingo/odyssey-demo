import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { MenuItemImage } from './MenuItemImage';

type MenuItemRowProps = {
  name: string;
  url?: string | null;
  size?: number;
  dimmed?: boolean;
  trailing?: ReactNode;
  children?: ReactNode;
  style?: ViewStyle;
};

export function MenuItemRow({
  name,
  url,
  size = 44,
  dimmed = false,
  trailing,
  children,
  style,
}: MenuItemRowProps) {
  return (
    <View style={[styles.row, style]}>
      <MenuItemImage borderRadius={8} dimmed={dimmed} height={size} name={name} url={url} width={size} />
      {children ? <View style={styles.content}>{children}</View> : null}
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  content: {
    flex: 1,
    gap: 2,
  },
});
