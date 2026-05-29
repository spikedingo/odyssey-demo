import { formatCents } from '@odyssey/shared';
import { fontFamily } from '@odyssey/ui';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CartLine } from '@/hooks/usePosCart';

type CartLineItemProps = {
  line: CartLine;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
};

export function CartLineItem({ line, onIncrement, onDecrement, onRemove }: CartLineItemProps) {
  const lineTotal = line.menuItem.price_cents * line.quantity;

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{line.menuItem.name}</Text>
        <Text style={styles.unitPrice}>{formatCents(line.menuItem.price_cents)} each</Text>
      </View>
      <View style={styles.controls}>
        <Pressable style={styles.iconBtn} onPress={onDecrement}>
          <Minus color="#1a1816" size={20} />
        </Pressable>
        <Text style={styles.qty}>{line.quantity}</Text>
        <Pressable style={styles.iconBtn} onPress={onIncrement}>
          <Plus color="#1a1816" size={20} />
        </Pressable>
        <Text style={styles.lineTotal}>{formatCents(lineTotal)}</Text>
        <Pressable style={styles.iconBtn} onPress={onRemove}>
          <Trash2 color="#b54747" size={18} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e4df',
    gap: 8,
  },
  info: { flex: 1, gap: 2 },
  name: { fontFamily: fontFamily.sansMedium, fontSize: 16, color: '#1a1816' },
  unitPrice: { fontFamily: fontFamily.sans, fontSize: 12, color: '#6b6560' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#f5f3f0',
  },
  qty: { fontFamily: fontFamily.sansBold, fontSize: 16, minWidth: 24, textAlign: 'center' },
  lineTotal: { fontFamily: fontFamily.sansMedium, fontSize: 16, minWidth: 56, textAlign: 'right' },
});
