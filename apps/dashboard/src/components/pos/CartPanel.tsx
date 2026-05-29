import type { OrderType } from '@odyssey/types';
import { formatCents } from '@odyssey/shared';
import { Button, EmptyState, fontFamily, Input } from '@odyssey/ui';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CartLineItem } from '@/components/pos/CartLineItem';
import type { CartLine } from '@/hooks/usePosCart';

type CartPanelProps = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  orderType: OrderType;
  serviceOpen: boolean;
  isSubmitting: boolean;
  tableNumber: string;
  pickupName: string;
  notes: string;
  onTableNumberChange: (value: string) => void;
  onPickupNameChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onIncrement: (id: number) => void;
  onDecrement: (id: number) => void;
  onRemove: (id: number) => void;
  onClear: () => void;
  onCheckout: () => void;
};

export function CartPanel({
  lines,
  itemCount,
  subtotalCents,
  orderType,
  serviceOpen,
  isSubmitting,
  tableNumber,
  pickupName,
  notes,
  onTableNumberChange,
  onPickupNameChange,
  onNotesChange,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  onCheckout,
}: CartPanelProps) {
  const canCheckout = serviceOpen && lines.length > 0;

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Cart ({itemCount})</Text>

      <ScrollView style={styles.lines}>
        {lines.length === 0 ? (
          <EmptyState heading="Cart is empty" subtext="Tap menu items to add them here" />
        ) : (
          lines.map((line) => (
            <CartLineItem
              key={line.menuItem.id}
              line={line}
              onDecrement={() => onDecrement(line.menuItem.id)}
              onIncrement={() => onIncrement(line.menuItem.id)}
              onRemove={() => onRemove(line.menuItem.id)}
            />
          ))
        )}
      </ScrollView>

      <View style={styles.meta}>
        {orderType === 'dine_in' ? (
          <Input
            label="Table number"
            placeholder="Enter table #"
            value={tableNumber}
            onChangeText={onTableNumberChange}
          />
        ) : (
          <Input
            label="Pickup name"
            placeholder="Your name"
            value={pickupName}
            onChangeText={onPickupNameChange}
          />
        )}

        <Input
          label="Notes (optional)"
          placeholder="Special instructions"
          value={notes}
          onChangeText={onNotesChange}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.subtotal}>Subtotal: {formatCents(subtotalCents)}</Text>
        <View style={styles.actions}>
          <Button disabled={lines.length === 0} size="lg" variant="ghost" onPress={onClear}>
            Clear
          </Button>
          <Button
            disabled={!canCheckout}
            loading={isSubmitting}
            size="lg"
            style={styles.checkoutBtn}
            onPress={onCheckout}
          >
            Submit Order
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: 380,
    borderLeftWidth: 1,
    borderLeftColor: '#e8e4df',
    paddingLeft: 16,
    gap: 12,
  },
  heading: { fontFamily: fontFamily.sansBold, fontSize: 22, color: '#1a1816' },
  lines: { flex: 1, maxHeight: 320 },
  meta: { gap: 10 },
  footer: { gap: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e8e4df' },
  subtotal: { fontFamily: fontFamily.sansBold, fontSize: 20, color: '#1a1816' },
  actions: { flexDirection: 'row', gap: 8 },
  checkoutBtn: { flex: 1 },
});
