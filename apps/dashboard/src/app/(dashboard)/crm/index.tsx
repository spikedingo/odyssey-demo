import type { ListCustomers200, ListCustomers200DataItem } from '@odyssey/api-client';
import { useListCustomers } from '@odyssey/api-client';
import { formatCents } from '@odyssey/shared';
import { DataTable, ErrorState, PageHeader, SearchInput } from '@odyssey/ui';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { useMounted } from '@/hooks/useMounted';
import { unwrap } from '@/utils/api';

export default function CrmPage() {
  const router = useRouter();
  const mounted = useMounted();
  const [search, setSearch] = useState('');
  const listParams = useMemo(
    () => ({
      ...(search.trim() ? { search: search.trim() } : {}),
      limit: 50,
    }),
    [search],
  );
  const { data: response, isLoading, isError, refetch } = useListCustomers(listParams, {
    query: { enabled: mounted },
  });

  const customers = unwrap<ListCustomers200>(response)?.data ?? [];

  return (
    <View style={{ width: '100%' }}>
      <PageHeader title="CRM" subtitle="Customer relationships" />
      <SearchInput placeholder="Search customers" value={search} onChangeText={setSearch} />
      {mounted && !isLoading && isError ? (
        <ErrorState message="Failed to load customers" onRetry={() => refetch()} />
      ) : (
        <DataTable<ListCustomers200DataItem>
          columns={[
            { key: 'name', header: 'Name', render: (row) => <Text>{row.name}</Text> },
            { key: 'email', header: 'Email', render: (row) => <Text>{row.email ?? '—'}</Text> },
            { key: 'orders', header: 'Orders', flex: 0.6, render: (row) => <Text>{row.order_count}</Text> },
            { key: 'spend', header: 'Lifetime Spend', render: (row) => <Text>{formatCents(row.total_spend_cents)}</Text> },
          ]}
          data={customers}
          emptyHeading="No customers yet"
          loading={!mounted || isLoading}
          onRowPress={(row) => router.push(`/crm/${row.id}` as never)}
        />
      )}
    </View>
  );
}
