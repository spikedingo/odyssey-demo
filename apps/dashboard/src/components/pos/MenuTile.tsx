import type { ListMenuItems200Item } from '@odyssey/api-client';
import { formatCents } from '@odyssey/shared';
import { Card, fontFamily } from '@odyssey/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MenuItemImage } from '@/components/MenuItemImage';

type MenuTileProps = {
  item: ListMenuItems200Item;
  quantity: number;
  width?: number;
  onAdd: () => void;
};

const DEFAULT_TILE_WIDTH = 180;

export function MenuTile({ item, quantity, width = DEFAULT_TILE_WIDTH, onAdd }: MenuTileProps) {
  const imageWidth = Math.max(80, width - 24);

  return (
    <Pressable onPress={onAdd} style={{ minHeight: 44 }}>
      <Card style={{ ...styles.card, width }}>
        <MenuItemImage
          borderRadius={8}
          height={100}
          name={item.name}
          url={item.image_url}
          width={imageWidth}
        />
        <Text numberOfLines={2} style={styles.name}>
          {item.name}
        </Text>
        <Text style={styles.price}>{formatCents(item.price_cents)}</Text>
        {quantity > 0 ? (
          <View style={styles.qtyBadge}>
            <Text style={styles.qtyText}>{quantity}</Text>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { position: 'relative', padding: 12, gap: 6 },
  name: { fontFamily: fontFamily.sansMedium, fontSize: 15, color: '#1a1816', minHeight: 42 },
  price: { fontFamily: fontFamily.sans, fontSize: 15, color: '#2d4a3e' },
  qtyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#2d4a3e',
    borderRadius: 999,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  qtyText: { fontFamily: fontFamily.sansBold, fontSize: 12, color: '#fff' },
});
