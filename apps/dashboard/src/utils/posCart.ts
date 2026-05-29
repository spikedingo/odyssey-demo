import type { ListMenuItems200Item } from '@odyssey/api-client';

export type CartQuantities = Record<number, number>;

export type CartLine = {
  menuItem: ListMenuItems200Item;
  quantity: number;
};

export function cartAddItem(quantities: CartQuantities, menuItemId: number): CartQuantities {
  return {
    ...quantities,
    [menuItemId]: (quantities[menuItemId] ?? 0) + 1,
  };
}

export function cartIncrement(quantities: CartQuantities, menuItemId: number): CartQuantities {
  return cartAddItem(quantities, menuItemId);
}

export function cartDecrement(quantities: CartQuantities, menuItemId: number): CartQuantities {
  const next = (quantities[menuItemId] ?? 0) - 1;
  if (next <= 0) {
    const { [menuItemId]: _, ...rest } = quantities;
    return rest;
  }
  return { ...quantities, [menuItemId]: next };
}

export function cartRemoveItem(quantities: CartQuantities, menuItemId: number): CartQuantities {
  const { [menuItemId]: _, ...rest } = quantities;
  return rest;
}

export function buildCartLines(
  menuItems: ListMenuItems200Item[],
  quantities: CartQuantities,
): CartLine[] {
  return Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([id, quantity]) => {
      const menuItem = menuItems.find((item) => item.id === Number(id));
      if (!menuItem) return null;
      return { menuItem, quantity };
    })
    .filter((line): line is CartLine => line !== null);
}

export function computeCartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.menuItem.price_cents * line.quantity, 0);
}

export function computeCartItemCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}
