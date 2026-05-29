import { formatCents } from '@odyssey/shared';
import { ORDER_TYPE_LABELS, type OrderType } from '@odyssey/types';
import { Button, Modal, fontFamily } from '@odyssey/ui';
import { StyleSheet, Text, View } from 'react-native';

import type { CartLine } from '@/hooks/usePosCart';

type CheckoutModalProps = {
  open: boolean;
  lines: CartLine[];
  subtotalCents: number;
  orderType: OrderType;
  tableNumber: string;
  pickupName: string;
  notes: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function CheckoutModal({
  open,
  lines,
  subtotalCents,
  orderType,
  tableNumber,
  pickupName,
  notes,
  isSubmitting,
  onClose,
  onConfirm,
}: CheckoutModalProps) {
  return (
    <Modal
      footer={
        <View style={styles.footer}>
          <Button variant="ghost" onPress={onClose}>
            Cancel
          </Button>
          <Button loading={isSubmitting} onPress={onConfirm}>
            Confirm Order
          </Button>
        </View>
      }
      open={open}
      title="Review Order"
      onClose={onClose}
    >
      <Text style={styles.meta}>Type: {ORDER_TYPE_LABELS[orderType]}</Text>
      {orderType === 'dine_in' && tableNumber ? (
        <Text style={styles.meta}>Table: {tableNumber}</Text>
      ) : null}
      {orderType !== 'dine_in' && pickupName ? (
        <Text style={styles.meta}>Pickup: {pickupName}</Text>
      ) : null}
      {notes ? <Text style={styles.meta}>Notes: {notes}</Text> : null}

      <View style={styles.items}>
        {lines.map((line) => (
          <View key={line.menuItem.id} style={styles.itemRow}>
            <Text style={styles.itemName}>
              {line.menuItem.name} × {line.quantity}
            </Text>
            <Text style={styles.itemPrice}>
              {formatCents(line.menuItem.price_cents * line.quantity)}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.total}>Total: {formatCents(subtotalCents)}</Text>
    </Modal>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  meta: { fontFamily: fontFamily.sans, fontSize: 14, color: '#6b6560', marginBottom: 4 },
  items: { marginTop: 12, marginBottom: 12, gap: 6 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { fontFamily: fontFamily.sans, fontSize: 14, color: '#1a1816', flex: 1 },
  itemPrice: { fontFamily: fontFamily.sansMedium, fontSize: 14, color: '#1a1816' },
  total: { fontFamily: fontFamily.sansBold, fontSize: 16, color: '#1a1816' },
});
