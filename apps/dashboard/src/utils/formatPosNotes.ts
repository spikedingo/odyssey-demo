import type { OrderType } from '@odyssey/types';

export function formatPosNotes(
  orderType: OrderType,
  tableNumber: string,
  pickupName: string,
  notes: string,
): string | undefined {
  const parts: string[] = [];

  if (orderType === 'dine_in' && tableNumber.trim()) {
    parts.push(`[Table: ${tableNumber.trim()}]`);
  } else if ((orderType === 'takeout' || orderType === 'delivery') && pickupName.trim()) {
    parts.push(`[Pickup: ${pickupName.trim()}]`);
  }

  if (notes.trim()) {
    parts.push(notes.trim());
  }

  return parts.length > 0 ? parts.join(' ') : undefined;
}
