import type { GetCustomer200 } from '@odyssey/api-client';
import { useGetCustomer } from '@odyssey/api-client';
import { formatCents } from '@odyssey/shared';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@odyssey/types';
import { Badge, Card, DataTable, ErrorState, PageHeader, SkeletonCard } from '@odyssey/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { useMounted } from '@/hooks/useMounted';
import { unwrap } from '@/utils/api';

export default function CustomerDetailPage() {
  const router = useRouter();
  const mounted = useMounted();
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const customerId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  const { data: response, isLoading, isError, refetch } = useGetCustomer(customerId, {
    query: { enabled: mounted && Number.isFinite(customerId) },
  });

  const data = unwrap<GetCustomer200>(response);

  if (!mounted || isLoading) return <SkeletonCard />;
  if (isError || !data) return <ErrorState message="Customer not found" onRetry={() => refetch()} />;

  return (
    <View>
      <PageHeader breadcrumb="CRM" title={data.name} />
      <Card>
        <Text>Email: {data.email ?? '—'}</Text>
        <Text>Phone: {data.phone ?? '—'}</Text>
        <Text>Orders: {data.order_count}</Text>
        <Text>Lifetime spend: {formatCents(data.total_spend_cents)}</Text>
      </Card>
      <View style={{ marginTop: 16, width: '100%' }}>
        <Text style={{ fontWeight: '600', marginBottom: 12 }}>Recent Orders</Text>
        <DataTable
            variant="auto"
            cardRender={(row) => (
              <View style={{ gap: 4 }}>
                <Text style={{ fontWeight: '600' }}>Order #{row.id}</Text>
                <Badge
                  label={ORDER_STATUS_LABELS[row.status as OrderStatus]}
                  orderStatus={row.status as OrderStatus}
                  variant="order-status"
                />
                <Text>{formatCents(row.total_cents)}</Text>
              </View>
            )}
            columns={[
              { key: 'id', header: '#', render: (row) => <Text>#{row.id}</Text> },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <Badge
                    label={ORDER_STATUS_LABELS[row.status as OrderStatus]}
                    orderStatus={row.status as OrderStatus}
                    variant="order-status"
                  />
                ),
              },
              { key: 'total', header: 'Total', render: (row) => <Text>{formatCents(row.total_cents)}</Text> },
            ]}
            data={data.recent_orders ?? []}
            onRowPress={(row) => router.push(`/orders/${row.id}` as never)}
          />
      </View>
    </View>
  );
}
