import {
  useCreateMenuItem,
  useDeleteMenuItem,
  useListCategories,
  useListMenuItems,
  useUpdateMenuItem,
} from '@odyssey/api-client';
import type { ListCategories200Item, ListMenuItems200Item } from '@odyssey/api-client';
import { formatCents } from '@odyssey/shared';
import {
  Badge,
  Button,
  Card,
  Drawer,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  Switch,
  TextArea,
  useBreakpoint,
  useTheme,
  useToast,
} from '@odyssey/ui';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { MenuItemImage } from '@/components/MenuItemImage';
import { useMounted } from '@/hooks/useMounted';
import { unwrap } from '@/utils/api';

export default function MenuPage() {
  const toast = useToast();
  const { theme } = useTheme();
  const { isPhone, isTablet } = useBreakpoint();
  const mounted = useMounted();
  const categoriesQuery = useListCategories({ query: { enabled: mounted } });
  const menuItemsQuery = useListMenuItems({}, { query: { enabled: mounted } });
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();

  const categories = unwrap<ListCategories200Item[]>(categoriesQuery.data) ?? [];
  const menuItems = unwrap<ListMenuItems200Item[]>(menuItemsQuery.data) ?? [];

  const groupedItems = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          items: menuItems.filter((item) => item.category_id === category.id),
        }))
        .filter((group) => group.items.length > 0),
    [categories, menuItems],
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [available, setAvailable] = useState(true);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setCategoryId(categories[0]?.id ?? null);
    setAvailable(true);
  };

  const openCreate = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const openEdit = (item: ListMenuItems200Item) => {
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description ?? '');
    setPrice(String(item.price_cents / 100));
    setCategoryId(item.category_id);
    setAvailable(item.available);
    setDrawerOpen(true);
  };

  const saveItem = async () => {
    const price_cents = Math.round(Number(price) * 100);
    if (!name || !categoryId || !Number.isFinite(price_cents) || price_cents <= 0) {
      toast.error('Fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        await updateItem.mutateAsync({
          id: editingId,
          data: { name, description, price_cents, category_id: categoryId, available },
        });
        toast.success('Menu item updated');
      } else {
        await createItem.mutateAsync({
          data: { name, description, price_cents, category_id: categoryId, available },
        });
        toast.success('Menu item created');
      }
      setDrawerOpen(false);
      resetForm();
      menuItemsQuery.refetch();
    } catch {
      toast.error('Failed to save menu item');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteItem.mutateAsync({ id: deleteId });
      toast.success('Menu item deleted');
      setDeleteId(null);
      menuItemsQuery.refetch();
    } catch {
      toast.error('Failed to delete menu item');
    }
  };

  const isLoading = categoriesQuery.isLoading || menuItemsQuery.isLoading;
  const isError = categoriesQuery.isError || menuItemsQuery.isError;

  if (mounted && !isLoading && isError) {
    return (
      <ErrorState
        message="Failed to load menu"
        onRetry={() => {
          void categoriesQuery.refetch();
          void menuItemsQuery.refetch();
        }}
      />
    );
  }

  return (
    <View style={{ width: '100%' }}>
      <PageHeader actions={<Button onPress={openCreate}>Add Item</Button>} title="Menu" subtitle="Manage categories and items" />

      {!mounted || isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        groupedItems.map(({ category, items }) => (
          <View key={category.id} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{category.name}</Text>
            <View style={[styles.grid, isPhone && styles.gridPhone, isTablet && !isPhone && styles.gridTablet]}>
              {items.map((item) => (
                <Card
                  key={item.id}
                  style={
                    isPhone
                      ? { ...styles.menuCard, ...styles.menuCardPhone }
                      : isTablet
                        ? { ...styles.menuCard, ...styles.menuCardTablet }
                        : styles.menuCard
                  }
                >
                  <MenuItemImage
                    borderRadius={10}
                    dimmed={!item.available}
                    height={160}
                    name={item.name}
                    url={item.image_url}
                    width="100%"
                  />
                  <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                      <Text numberOfLines={1} style={[styles.itemName, { color: theme.colors.text }]}>
                        {item.name}
                      </Text>
                      <Badge
                        label={item.available ? 'Available' : 'Unavailable'}
                        variant={item.available ? 'success' : 'warning'}
                      />
                    </View>
                    {item.description ? (
                      <Text numberOfLines={2} style={[styles.itemDescription, { color: theme.colors.textSecondary }]}>
                        {item.description}
                      </Text>
                    ) : null}
                    <Text style={[styles.itemPrice, { color: theme.colors.text }]}>{formatCents(item.price_cents)}</Text>
                    <View style={styles.cardActions}>
                      <Button size="sm" variant="ghost" onPress={() => openEdit(item)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onPress={() => setDeleteId(item.id)}>
                        Delete
                      </Button>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        ))
      )}

      <Drawer
        footer={<Button loading={createItem.isPending || updateItem.isPending} onPress={saveItem}>Save</Button>}
        open={drawerOpen}
        title={editingId ? 'Edit Menu Item' : 'New Menu Item'}
        onClose={() => setDrawerOpen(false)}
      >
        {name ? (
          <View style={styles.drawerPreview}>
            <MenuItemImage borderRadius={10} height={120} name={name} width="100%" dimmed={!available} />
          </View>
        ) : null}
        <Input label="Name" value={name} onChangeText={setName} />
        <TextArea label="Description" value={description} onChangeText={setDescription} />
        <Input label="Price (USD)" placeholder="12.50" value={price} onChangeText={setPrice} />
        <Switch label="Available" value={available} onValueChange={setAvailable} />
      </Drawer>

      <Modal
        footer={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button variant="ghost" onPress={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteItem.isPending} onPress={confirmDelete}>Delete</Button>
          </View>
        }
        open={deleteId !== null}
        title="Delete menu item?"
        onClose={() => setDeleteId(null)}
      >
        <Text>This cannot be undone. Historical orders keep price snapshots.</Text>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridPhone: { flexDirection: 'column' },
  gridTablet: { gap: 12 },
  menuCard: {
    flexBasis: 260,
    flexGrow: 1,
    maxWidth: 320,
    padding: 0,
    overflow: 'hidden',
  },
  menuCardPhone: { flexBasis: '100%', maxWidth: '100%', width: '100%' },
  menuCardTablet: { flexBasis: '48%', maxWidth: '48%' },
  cardBody: {
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  drawerPreview: {
    marginBottom: 12,
  },
});
