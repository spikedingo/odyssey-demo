import type { GetOrder200, UpdateOrderStatusBodyStatus } from '@odyssey/api-client';
import { useGetOrder, useUpdateOrderStatus } from '@odyssey/api-client';
import { formatCents, formatDate } from '@odyssey/shared';
import { getAvailableActions, ORDER_STATUS_LABELS, type OrderStatus } from '@odyssey/types';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Modal,
  PageHeader,
  SkeletonCard,
  useToast,
} from '@odyssey/ui';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MenuItemRow } from '@/components/MenuItemRow';
import { useMounted } from '@/hooks/useMounted';
import { unwrap } from '@/utils/api';

export default function OrderDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);
  const toast = useToast();
  const mounted = useMounted();
  const [confirmStatus, setConfirmStatus] = useState<OrderStatus | null>(null);

  const { data: response, isLoading, isError, refetch } = useGetOrder(orderId, {
    query: { enabled: mounted && Number.isFinite(orderId) },
  });
  const updateStatus = useUpdateOrderStatus();
  const data = unwrap<GetOrder200>(response);

  if (!mounted || isLoading) return <SkeletonCard />;
  if (isError || !data) {
    return <ErrorState message="Order not found" onRetry={() => refetch()} />;
  }

  const status = data.status as OrderStatus;
  const actions = getAvailableActions(status);

  const applyStatus = async (next: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({
        id: orderId,
        data: { status: next as UpdateOrderStatusBodyStatus },
      });
      toast.success(`Order updated to ${ORDER_STATUS_LABELS[next]}`);
      setConfirmStatus(null);
      refetch();
    } catch {
      toast.error('Invalid status transition');
    }
  };

  return (
    <View>
      <PageHeader breadcrumb="Orders" subtitle={`Placed ${formatDate(data.created_at)}`} title={`Order #${data.id}`} />

      <Card>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Badge label={ORDER_STATUS_LABELS[status]} orderStatus={status} variant="order-status" />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Customer</Text>
          <Text>{data.customer_name ?? 'Walk-in'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total</Text>
          <Text>{formatCents(data.total_cents)}</Text>
        </View>
        {data.notes ? (
          <View style={styles.row}>
            <Text style={styles.label}>Notes</Text>
            <Text>{data.notes}</Text>
          </View>
        ) : null}
      </Card>

      <View style={{ marginTop: 16 }}>
        <Card>
          <Text style={styles.sectionTitle}>Items</Text>
          {data.items.map((item) => (
            <MenuItemRow
              key={item.id}
              name={item.menu_item_name}
              style={styles.itemRow}
              trailing={<Text>{formatCents(item.line_total_cents)}</Text>}
            >
              <Text style={{ fontWeight: '500' }}>
                {item.quantity}x {item.menu_item_name}
              </Text>
              <Text style={styles.unitPrice}>{formatCents(item.unit_price_cents)} each</Text>
            </MenuItemRow>
          ))}
        </Card>
      </View>

      <View style={styles.actions}>
        {actions.map((next) => (
          <Button
            key={next}
            variant={next === 'cancelled' ? 'danger' : 'secondary'}
            onPress={() => setConfirmStatus(next)}
          >
            {ORDER_STATUS_LABELS[next]}
          </Button>
        ))}
      </View>

      <Modal
        footer={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button variant="ghost" onPress={() => setConfirmStatus(null)}>
              Cancel
            </Button>
            <Button loading={updateStatus.isPending} onPress={() => confirmStatus && applyStatus(confirmStatus)}>
              Confirm
            </Button>
          </View>
        }
        open={confirmStatus !== null}
        title="Confirm status change"
        onClose={() => setConfirmStatus(null)}
      >
        <Text>Change order to {confirmStatus ? ORDER_STATUS_LABELS[confirmStatus] : ''}?</Text>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  label: { fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  itemRow: { paddingVertical: 8 },
  unitPrice: { fontSize: 13, opacity: 0.7 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
});
