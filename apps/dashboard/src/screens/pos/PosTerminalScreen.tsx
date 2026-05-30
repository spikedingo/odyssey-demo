import {
  useGetSettings,
  useListCategories,
  useListMenuItems,
} from '@odyssey/api-client';
import type { GetSettings200, ListCategories200Item, ListMenuItems200Item } from '@odyssey/api-client';
import type { OrderType } from '@odyssey/types';
import { ErrorState, SkeletonCard } from '@odyssey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CartPanel } from '@/components/pos/CartPanel';
import { CategoryTabs } from '@/components/pos/CategoryTabs';
import { MenuGrid } from '@/components/pos/MenuGrid';
import { OrderSuccessOverlay } from '@/components/pos/OrderSuccessOverlay';
import { PosHeader } from '@/components/pos/PosHeader';
import { ServiceClosedBanner } from '@/components/pos/ServiceClosedBanner';
import { usePosCart } from '@/hooks/usePosCart';
import { usePosOrderSubmit } from '@/hooks/usePosOrderSubmit';
import { useMounted } from '@/hooks/useMounted';
import { unwrap } from '@/utils/api';

export function PosTerminalScreen({ standalone = false }: { standalone?: boolean }) {
  const mounted = useMounted();

  const settingsQuery = useGetSettings({ query: { enabled: mounted, refetchOnMount: 'always' } });
  const categoriesQuery = useListCategories({ query: { enabled: mounted, refetchOnMount: 'always' } });
  const menuQuery = useListMenuItems(
    { available: 'true' },
    { query: { enabled: mounted, refetchOnMount: 'always' } },
  );

  const settings = unwrap<GetSettings200>(settingsQuery.data);
  const categories = unwrap<ListCategories200Item[]>(categoriesQuery.data) ?? [];
  const menuItems = unwrap<ListMenuItems200Item[]>(menuQuery.data) ?? [];

  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [pickupName, setPickupName] = useState('');
  const [notes, setNotes] = useState('');
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null);

  const cart = usePosCart(menuItems);
  const { submitOrder, isSubmitting } = usePosOrderSubmit();

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );

  const resolvedCategoryId = useMemo(() => {
    if (
      activeCategoryId !== null &&
      sortedCategories.some((category) => category.id === activeCategoryId)
    ) {
      return activeCategoryId;
    }
    return sortedCategories[0]?.id ?? null;
  }, [activeCategoryId, sortedCategories]);

  useEffect(() => {
    if (orderType === 'delivery' && settings && !settings.delivery_available) {
      setOrderType('dine_in');
    }
  }, [orderType, settings]);

  const categoryItems = useMemo(() => {
    if (resolvedCategoryId === null) return menuItems;
    return menuItems.filter((item) => item.category_id === resolvedCategoryId);
  }, [menuItems, resolvedCategoryId]);

  const catalogEmpty = sortedCategories.length === 0 && menuItems.length === 0;

  const quantities = useMemo(() => {
    const map: Record<number, number> = {};
    for (const line of cart.lines) {
      map[line.menuItem.id] = line.quantity;
    }
    return map;
  }, [cart.lines]);

  const resetOrderForm = useCallback(() => {
    cart.clearCart();
    setTableNumber('');
    setPickupName('');
    setNotes('');
  }, [cart]);

  const handleSuccessDismiss = useCallback(() => {
    setSuccessOrderId(null);
    resetOrderForm();
  }, [resetOrderForm]);

  const handleCheckout = async () => {
    const order = await submitOrder({
      lines: cart.lines,
      subtotalCents: cart.subtotalCents,
      orderType,
      customerId: null,
      tableNumber,
      pickupName,
      notes,
    });

    if (!order) return;

    setSuccessOrderId(order.id);
  };

  const isLoading =
    !mounted || settingsQuery.isLoading || categoriesQuery.isLoading || menuQuery.isLoading;
  const isError = settingsQuery.isError || categoriesQuery.isError || menuQuery.isError;
  const serviceOpen = settings?.service_available ?? true;

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (isError) {
    return (
      <ErrorState
        message="Failed to load POS data"
        onRetry={() => {
          settingsQuery.refetch();
          categoriesQuery.refetch();
          menuQuery.refetch();
        }}
      />
    );
  }

  return (
    <View style={[styles.screen, standalone ? styles.screenStandalone : styles.screenEmbedded]}>
      <PosHeader
        deliveryAvailable={settings?.delivery_available ?? true}
        orderType={orderType}
        restaurantName={settings?.restaurant_name ?? 'Restaurant'}
        onOrderTypeChange={setOrderType}
      />

      {!serviceOpen ? (
        <View style={styles.banner}>
          <ServiceClosedBanner />
        </View>
      ) : null}

      <View style={styles.body}>
        <View style={styles.menuArea}>
          <View style={styles.categoryBar}>
            <CategoryTabs
              activeId={resolvedCategoryId}
              categories={sortedCategories}
              onSelect={setActiveCategoryId}
            />
          </View>
          <View style={styles.menuGridWrap}>
            <MenuGrid
              catalogEmpty={catalogEmpty}
              items={categoryItems}
              quantities={quantities}
              onAddItem={cart.addItem}
            />
          </View>
        </View>

        <CartPanel
          isSubmitting={isSubmitting}
          itemCount={cart.itemCount}
          lines={cart.lines}
          notes={notes}
          orderType={orderType}
          pickupName={pickupName}
          serviceOpen={serviceOpen}
          subtotalCents={cart.subtotalCents}
          tableNumber={tableNumber}
          onCheckout={() => void handleCheckout()}
          onClear={cart.clearCart}
          onDecrement={cart.decrement}
          onIncrement={cart.increment}
          onNotesChange={setNotes}
          onPickupNameChange={setPickupName}
          onRemove={cart.removeItem}
          onTableNumberChange={setTableNumber}
        />
      </View>

      <OrderSuccessOverlay orderId={successOrderId} onDismiss={handleSuccessDismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    minHeight: '100%',
    backgroundColor: '#faf9f7',
  },
  screenStandalone: {},
  screenEmbedded: { margin: -24 },
  banner: { marginTop: 12, marginBottom: 4 },
  body: { flex: 1, flexDirection: 'row', gap: 16, marginTop: 12, minHeight: 480 },
  menuArea: { flex: 1, minWidth: 0, flexDirection: 'column' },
  categoryBar: { flexShrink: 0 },
  menuGridWrap: { flex: 1, minHeight: 0 },
});
