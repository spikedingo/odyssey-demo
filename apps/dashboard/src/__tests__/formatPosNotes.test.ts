import { formatPosNotes } from '../utils/formatPosNotes';

describe('formatPosNotes', () => {
  test('formats dine-in table number', () => {
    expect(formatPosNotes('dine_in', '12', '', 'No onions')).toBe('[Table: 12] No onions');
  });

  test('formats takeout pickup name', () => {
    expect(formatPosNotes('takeout', '', 'Alice', '')).toBe('[Pickup: Alice]');
  });

  test('formats delivery pickup name', () => {
    expect(formatPosNotes('delivery', '', 'Bob', 'Ring doorbell')).toBe('[Pickup: Bob] Ring doorbell');
  });

  test('returns undefined when empty', () => {
    expect(formatPosNotes('dine_in', '', '', '')).toBeUndefined();
  });

  test('ignores table for takeout', () => {
    expect(formatPosNotes('takeout', '5', 'Alice', '')).toBe('[Pickup: Alice]');
  });
});
