import type { ListMenuItems200Item } from '@odyssey/api-client';
import { useCallback, useMemo, useState } from 'react';

import {
  buildCartLines,
  cartAddItem,
  cartDecrement,
  cartIncrement,
  cartRemoveItem,
  computeCartItemCount,
  computeCartSubtotal,
  type CartLine,
} from '@/utils/posCart';

export type { CartLine };

export function usePosCart(menuItems: ListMenuItems200Item[]) {
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const lines = useMemo(() => buildCartLines(menuItems, quantities), [menuItems, quantities]);
  const itemCount = useMemo(() => computeCartItemCount(lines), [lines]);
  const subtotalCents = useMemo(() => computeCartSubtotal(lines), [lines]);

  const addItem = useCallback((menuItemId: number) => {
    setQuantities((prev) => cartAddItem(prev, menuItemId));
  }, []);

  const increment = useCallback((menuItemId: number) => {
    setQuantities((prev) => cartIncrement(prev, menuItemId));
  }, []);

  const decrement = useCallback((menuItemId: number) => {
    setQuantities((prev) => cartDecrement(prev, menuItemId));
  }, []);

  const removeItem = useCallback((menuItemId: number) => {
    setQuantities((prev) => cartRemoveItem(prev, menuItemId));
  }, []);

  const clearCart = useCallback(() => {
    setQuantities({});
  }, []);

  return {
    lines,
    itemCount,
    subtotalCents,
    addItem,
    increment,
    decrement,
    removeItem,
    clearCart,
  };
}
