import {
  useCreateOrder,
  useListCustomers,
  useListMenuItems,
  useListOrders,
  useUpdateOrderStatus,
} from '@odyssey/api-client';
import type {
  CreateOrder201,
  ListCustomers200,
  ListMenuItems200Item,
  ListOrders200,
  ListOrders200DataItem,
  UpdateOrderStatusBodyStatus,
} from '@odyssey/api-client';
import { formatCents, formatDate } from '@odyssey/shared';
import { getAvailableActions, ORDER_STATUS_LABELS, ORDER_TYPE_LABELS, type OrderStatus, type OrderType } from '@odyssey/types';
import {
  Badge,
  Button,
  DataTable,
  Drawer,
  ErrorState,
  fontFamily,
  Input,
  Modal,
  orderStatus,
  PageHeader,
  Select,
  useToast,
} from '@odyssey/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MenuItemRow } from '@/components/MenuItemRow';
import { useMounted } from '@/hooks/useMounted';
import { unwrap } from '@/utils/api';

const ALL_STATUSES: OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'completed',
  'cancelled',
];

export default function OrdersPage() {
  const router = useRouter();
  const toast = useToast();
  const mounted = useMounted();
  const params = useLocalSearchParams<{ status?: string; search?: string }>();

  const statusFilter = (params.status ?? '')
    .split(',')
    .filter((s): s is OrderStatus => ALL_STATUSES.includes(s as OrderStatus));
  const search = params.search ?? '';

  const { data: ordersResponse, isLoading, isError, refetch } = useListOrders(
    {
      ...(statusFilter.length === 1 ? { status: statusFilter[0] } : {}),
      limit: 50,
    },
    { query: { enabled: mounted } },
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ orderId: number; status: OrderStatus } | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState('');

  const customersQuery = useListCustomers({ limit: 100 }, { query: { enabled: mounted } });
  const menuQuery = useListMenuItems({ available: 'true' }, { query: { enabled: mounted } });
  const createOrder = useCreateOrder();
  const updateStatus = useUpdateOrderStatus();

  const menuItems = unwrap<ListMenuItems200Item[]>(menuQuery.data) ?? [];
  const customers = unwrap<ListCustomers200>(customersQuery.data)?.data ?? [];

  const filteredOrders = useMemo(() => {
    const rows = unwrap<ListOrders200>(ordersResponse)?.data ?? [];
    return rows.filter((row) => {
      const statusOk =
        statusFilter.length === 0 || statusFilter.includes(row.status as OrderStatus);
      const searchOk =
        !search ||
        (row.customer_name ?? 'walk-in').toLowerCase().includes(search.toLowerCase()) ||
        String(row.id).includes(search);
      return statusOk && searchOk;
    });
  }, [ordersResponse, search, statusFilter]);

  const subtotal = useMemo(() => {
    return Object.entries(selectedItems).reduce((sum, [id, qty]) => {
      const item = menuItems.find((m) => m.id === Number(id));
      return sum + (item?.price_cents ?? 0) * qty;
    }, 0);
  }, [menuItems, selectedItems]);

  const toggleStatus = (status: OrderStatus) => {
    const next = statusFilter.includes(status)
      ? statusFilter.filter((s) => s !== status)
      : [...statusFilter, status];
    // Expo Router stringifies `undefined` into the literal "undefined" in the URL.
    router.setParams({ status: next.length ? next.join(',') : '' });
  };

  const applyStatus = async () => {
    if (!confirmAction) return;
    try {
      await updateStatus.mutateAsync({
        id: confirmAction.orderId,
        data: { status: confirmAction.status as UpdateOrderStatusBodyStatus },
      });
      toast.success(`Order #${confirmAction.orderId} updated to ${ORDER_STATUS_LABELS[confirmAction.status]}`);
      setConfirmAction(null);
      refetch();
    } catch {
      toast.error('Invalid status transition');
    }
  };

  const handleCreateOrder = async () => {
    const items = Object.entries(selectedItems)
      .filter(([, qty]) => qty > 0)
      .map(([menu_item_id, quantity]) => ({ menu_item_id: Number(menu_item_id), quantity }));

    if (items.length === 0) {
      toast.error('Add at least one menu item');
      return;
    }

    try {
      const result = await createOrder.mutateAsync({
        data: {
          ...(customerId ? { customer_id: customerId } : {}),
          items,
          total_cents: subtotal,
          ...(notes ? { notes } : {}),
        },
      });
      const order = unwrap<CreateOrder201>(result)!;
      toast.success(`Order #${order.id} created`);
      setDrawerOpen(false);
      setSelectedItems({});
      setNotes('');
      setCustomerId(null);
      refetch();
      router.push(`/orders/${order.id}` as never);
    } catch {
      toast.error('Failed to create order');
    }
  };

  return (
    <View style={{ width: '100%' }}>
      <PageHeader actions={<Button onPress={() => setDrawerOpen(true)}>New Order</Button>} title="Orders" />

      <ScrollView horizontal style={{ marginBottom: 12 }}>
        <View style={styles.filters}>
          {ALL_STATUSES.map((status) => {
            const selected = statusFilter.includes(status);
            const color = orderStatus[status];
            return (
              <Pressable
                key={status}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? `${color}22` : '#ffffff',
                    borderColor: selected ? color : `${color}55`,
                  },
                ]}
                onPress={() => toggleStatus(status)}
              >
                <Text style={[styles.chipLabel, { color }]}>{ORDER_STATUS_LABELS[status]}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Input
        placeholder="Search by customer or order #"
        value={search}
        onChangeText={(v) => router.setParams({ search: v })}
      />

      {mounted && isError ? (
        <ErrorState message="Failed to load orders" onRetry={() => refetch()} />
      ) : (
        <DataTable<ListOrders200DataItem>
          columns={[
            { key: 'id', header: '#', flex: 0.4, render: (row) => <Text>#{row.id}</Text> },
            { key: 'customer', header: 'Customer', render: (row) => <Text>{row.customer_name ?? 'Walk-in'}</Text> },
            {
              key: 'type',
              header: 'Type',
              flex: 0.7,
              render: (row) => (
                <Badge
                  label={ORDER_TYPE_LABELS[row.order_type as OrderType]}
                  size="sm"
                  variant="info"
                />
              ),
            },
            { key: 'items', header: 'Items', flex: 0.5, render: (row) => <Text>{row.item_count}</Text> },
            { key: 'total', header: 'Total', flex: 0.7, render: (row) => <Text>{formatCents(row.total_cents)}</Text> },
            {
              key: 'status',
              header: 'Status',
              flex: 0.9,
              render: (row) => (
                <Badge
                  label={ORDER_STATUS_LABELS[row.status as OrderStatus]}
                  orderStatus={row.status as OrderStatus}
                  variant="order-status"
                />
              ),
            },
            { key: 'created', header: 'Created', flex: 0.9, render: (row) => <Text>{formatDate(row.created_at)}</Text> },
            {
              key: 'actions',
              header: 'Action',
              flex: 1.2,
              render: (row) => {
                const actions = getAvailableActions(row.status as OrderStatus);
                if (actions.length === 0) return null;

                return (
                  <View style={styles.actionRow}>
                    {actions.map((next) => (
                      <Button
                        key={next}
                        size="sm"
                        variant={next === 'cancelled' ? 'danger' : 'secondary'}
                        onPress={() => setConfirmAction({ orderId: row.id, status: next })}
                      >
                        {ORDER_STATUS_LABELS[next]}
                      </Button>
                    ))}
                  </View>
                );
              },
            },
            {
              key: 'view',
              header: 'View',
              flex: 0.5,
              render: (row) => (
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => router.push(`/orders/${row.id}` as never)}
                >
                  View
                </Button>
              ),
            },
          ]}
          data={filteredOrders}
          loading={!mounted || isLoading}
        />
      )}

      <Drawer
        footer={
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: '600' }}>Subtotal: {formatCents(subtotal)}</Text>
            <Button loading={createOrder.isPending} onPress={handleCreateOrder}>
              Create Order
            </Button>
          </View>
        }
        open={drawerOpen}
        title="New Order"
        onClose={() => setDrawerOpen(false)}
      >
        <Select
          label="Customer (optional)"
          options={[
            { label: 'Walk-in', value: 'walk-in' },
            ...customers.map((c) => ({ label: c.name, value: String(c.id) })),
          ]}
          value={customerId ? String(customerId) : 'walk-in'}
          onChange={(v) => setCustomerId(v === 'walk-in' ? null : Number(v))}
        />
        {menuItems.map((item) => (
          <MenuItemRow
            key={item.id}
            name={item.name}
            style={styles.menuRow}
            url={item.image_url}
            trailing={
              <Input
                placeholder="Qty"
                value={String(selectedItems[item.id] ?? '')}
                onChangeText={(v) =>
                  setSelectedItems((prev) => ({ ...prev, [item.id]: Number(v) || 0 }))
                }
              />
            }
          >
            <Text style={{ fontWeight: '500' }}>{item.name}</Text>
            <Text style={{ color: '#6b6560', fontSize: 13 }}>{formatCents(item.price_cents)}</Text>
          </MenuItemRow>
        ))}
        <Input label="Notes" placeholder="Special instructions" value={notes} onChangeText={setNotes} />
      </Drawer>

      <Modal
        footer={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button variant="ghost" onPress={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button loading={updateStatus.isPending} onPress={applyStatus}>
              Confirm
            </Button>
          </View>
        }
        open={confirmAction !== null}
        title="Confirm status change"
        onClose={() => setConfirmAction(null)}
      >
        <Text>
          Change order #{confirmAction?.orderId} to{' '}
          {confirmAction ? ORDER_STATUS_LABELS[confirmAction.status] : ''}?
        </Text>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', gap: 8, paddingBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  chipLabel: { fontFamily: fontFamily.sansMedium, fontSize: 13 },
  menuRow: { marginBottom: 10 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
});
