import { useCreateOrder } from '@odyssey/api-client';
import type { CreateOrder201 } from '@odyssey/api-client';
import type { OrderType } from '@odyssey/types';
import { useToast } from '@odyssey/ui';
import { useCallback } from 'react';

import type { CartLine } from '@/hooks/usePosCart';
import { formatPosNotes } from '@/utils/formatPosNotes';
import { unwrap } from '@/utils/api';

type SubmitParams = {
  lines: CartLine[];
  subtotalCents: number;
  orderType: OrderType;
  customerId: number | null;
  tableNumber: string;
  pickupName: string;
  notes: string;
};

export function usePosOrderSubmit() {
  const toast = useToast();
  const createOrder = useCreateOrder();

  const submitOrder = useCallback(
    async (params: SubmitParams): Promise<CreateOrder201 | null> => {
      const { lines, subtotalCents, orderType, customerId, tableNumber, pickupName, notes } =
        params;

      if (lines.length === 0) {
        toast.error('Add at least one item to the cart');
        return null;
      }

      try {
        const result = await createOrder.mutateAsync({
          data: {
            ...(customerId ? { customer_id: customerId } : {}),
            order_type: orderType,
            items: lines.map((line) => ({
              menu_item_id: line.menuItem.id,
              quantity: line.quantity,
            })),
            total_cents: subtotalCents,
            ...(formatPosNotes(orderType, tableNumber, pickupName, notes)
              ? { notes: formatPosNotes(orderType, tableNumber, pickupName, notes) }
              : {}),
          },
        });

        const order = unwrap<CreateOrder201>(result);
        if (!order) {
          toast.error('Failed to create order');
          return null;
        }

        return order;
      } catch {
        toast.error('Failed to create order');
        return null;
      }
    },
    [createOrder, toast],
  );

  return {
    submitOrder,
    isSubmitting: createOrder.isPending,
  };
}
