import type { ListCustomers200, ListCustomers200DataItem } from '@odyssey/api-client';
import { useCreateCustomer, useListCustomers } from '@odyssey/api-client';
import { formatCents } from '@odyssey/shared';
import {
  Button,
  DataTable,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  useToast,
} from '@odyssey/ui';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { useMounted } from '@/hooks/useMounted';
import { unwrap } from '@/utils/api';

export default function CrmPage() {
  const router = useRouter();
  const toast = useToast();
  const mounted = useMounted();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

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
  const createCustomer = useCreateCustomer();

  const customers = unwrap<ListCustomers200>(response)?.data ?? [];

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const submitCustomer = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Name is required');
      return;
    }
    try {
      await createCustomer.mutateAsync({
        data: {
          name: trimmedName,
          ...(email.trim() ? { email: email.trim() } : {}),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        },
      });
      toast.success('Customer created');
      setModalOpen(false);
      resetForm();
      refetch();
    } catch {
      toast.error('Failed to create customer');
    }
  };

  return (
    <View style={{ width: '100%' }}>
      <PageHeader
        title="CRM"
        subtitle="Customer relationships"
        actions={
          <Button onPress={openCreate}>Add Customer</Button>
        }
      />
      <SearchInput placeholder="Search customers" value={search} onChangeText={setSearch} />
      {mounted && !isLoading && isError ? (
        <ErrorState message="Failed to load customers" onRetry={() => refetch()} />
      ) : (
        <DataTable<ListCustomers200DataItem>
          variant="auto"
          cardRender={(row) => (
            <View style={{ gap: 4 }}>
              <Text style={{ fontWeight: '600', fontSize: 16 }}>{row.name}</Text>
              <Text style={{ color: '#6b6560' }}>{row.email ?? 'No email'} · {row.phone ?? 'No phone'}</Text>
              <Text>{row.order_count} orders · {formatCents(row.total_spend_cents)}</Text>
            </View>
          )}
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

      <Modal
        open={modalOpen}
        title="Add Customer"
        onClose={() => setModalOpen(false)}
        footer={
          <Button loading={createCustomer.isPending} onPress={() => void submitCustomer()}>
            Create Customer
          </Button>
        }
      >
        <Input label="Name" value={name} onChangeText={setName} placeholder="Full name" />
        <Input label="Email" value={email} onChangeText={setEmail} placeholder="Optional" />
        <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="Optional" />
      </Modal>
    </View>
  );
}
