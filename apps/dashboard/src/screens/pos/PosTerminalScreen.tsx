import {
  useGetSettings,
  useListCategories,
  useListMenuItems,
} from '@odyssey/api-client';
import type { GetSettings200, ListCategories200Item, ListMenuItems200Item } from '@odyssey/api-client';
import type { OrderType } from '@odyssey/types';
import { formatCents } from '@odyssey/shared';
import { Drawer, ErrorState, SkeletonCard, useBreakpoint } from '@odyssey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const { isPhone, isTablet, isDesktop, contentPadding } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const [cartOpen, setCartOpen] = useState(false);

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

  const menuColumns = isPhone ? 2 : isTablet ? 3 : 4;

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
    setCartOpen(false);
  };

  const isLoading =
    !mounted || settingsQuery.isLoading || categoriesQuery.isLoading || menuQuery.isLoading;
  const isError = settingsQuery.isError || categoriesQuery.isError || menuQuery.isError;
  const serviceOpen = settings?.service_available ?? true;

  const cartPanelProps = {
    isSubmitting,
    itemCount: cart.itemCount,
    lines: cart.lines,
    notes,
    orderType,
    pickupName,
    serviceOpen,
    subtotalCents: cart.subtotalCents,
    tableNumber,
    onCheckout: () => void handleCheckout(),
    onClear: cart.clearCart,
    onDecrement: cart.decrement,
    onIncrement: cart.increment,
    onNotesChange: setNotes,
    onPickupNameChange: setPickupName,
    onRemove: cart.removeItem,
    onTableNumberChange: setTableNumber,
  };

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
    <View
      style={[
        styles.screen,
        standalone ? styles.screenStandalone : styles.screenEmbedded,
        {
          padding: contentPadding,
          paddingTop: contentPadding + (standalone ? insets.top : 0),
          paddingBottom: isPhone ? 88 + insets.bottom : contentPadding,
          minHeight: Platform.OS === 'web' ? ('100dvh' as never) : '100%',
        },
      ]}
    >
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

      <View style={[styles.body, isPhone && styles.bodyPhone, isTablet && !isDesktop && styles.bodyTablet]}>
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
              columns={menuColumns}
              items={categoryItems}
              quantities={quantities}
              onAddItem={cart.addItem}
            />
          </View>
        </View>

        {!isPhone ? (
          <CartPanel layout={isTablet ? 'tablet' : 'desktop'} {...cartPanelProps} />
        ) : null}
      </View>

      {isPhone ? (
        <>
          <Pressable
            style={[
              styles.fab,
              {
                bottom: 16 + insets.bottom,
                right: 16 + insets.right,
              },
            ]}
            onPress={() => setCartOpen(true)}
          >
            <Text style={styles.fabText}>
              Cart ({cart.itemCount}) · {formatCents(cart.subtotalCents)}
            </Text>
          </Pressable>
          <Drawer open={cartOpen} title={`Cart (${cart.itemCount})`} onClose={() => setCartOpen(false)}>
            <CartPanel layout="sheet" {...cartPanelProps} />
          </Drawer>
        </>
      ) : null}

      <OrderSuccessOverlay orderId={successOrderId} onDismiss={handleSuccessDismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#faf9f7',
  },
  screenStandalone: {},
  screenEmbedded: { margin: -24 },
  banner: { marginTop: 12, marginBottom: 4 },
  body: { flex: 1, flexDirection: 'row', gap: 16, marginTop: 12, minHeight: 480 },
  bodyPhone: { flexDirection: 'column', minHeight: 0 },
  bodyTablet: { minHeight: 400 },
  menuArea: { flex: 1, minWidth: 0, flexDirection: 'column' },
  categoryBar: { flexShrink: 0 },
  menuGridWrap: { flex: 1, minHeight: 0 },
  fab: {
    position: 'absolute',
    backgroundColor: '#2d4a3e',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    minHeight: 48,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
