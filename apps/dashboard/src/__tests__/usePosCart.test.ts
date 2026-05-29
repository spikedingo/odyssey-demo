import {
  buildCartLines,
  cartAddItem,
  cartDecrement,
  cartIncrement,
  computeCartItemCount,
  computeCartSubtotal,
} from '../utils/posCart';

const menuItems = [
  {
    id: 1,
    category_id: 1,
    name: 'Burger',
    description: null,
    price_cents: 1000,
    available: true,
    image_url: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    category_id: 1,
    name: 'Fries',
    description: null,
    price_cents: 500,
    available: true,
    image_url: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
];

describe('posCart utils', () => {
  test('adds items and computes subtotal', () => {
    let quantities = cartAddItem({}, 1);
    quantities = cartAddItem(quantities, 1);
    quantities = cartAddItem(quantities, 2);

    const lines = buildCartLines(menuItems, quantities);
    expect(computeCartItemCount(lines)).toBe(3);
    expect(computeCartSubtotal(lines)).toBe(2500);
    expect(lines).toHaveLength(2);
  });

  test('decrement removes item at zero', () => {
    let quantities = cartAddItem({}, 1);
    quantities = cartDecrement(quantities, 1);

    const lines = buildCartLines(menuItems, quantities);
    expect(lines).toHaveLength(0);
    expect(computeCartSubtotal(lines)).toBe(0);
  });

  test('clear cart resets state', () => {
    const quantities = cartAddItem({}, 1);
    expect(buildCartLines(menuItems, quantities)).toHaveLength(1);
    expect(buildCartLines(menuItems, {})).toHaveLength(0);
  });
});
