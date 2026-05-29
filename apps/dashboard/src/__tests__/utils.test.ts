import { formatCents } from '@odyssey/shared';
import { getAvailableActions, VALID_TRANSITIONS } from '@odyssey/types';

describe('formatCents', () => {
  test('formats integer cents as USD', () => {
    expect(formatCents(1250)).toBe('$12.50');
  });

  test('formats zero', () => {
    expect(formatCents(0)).toBe('$0.00');
  });
});

describe('getAvailableActions', () => {
  test('returns valid transitions for pending', () => {
    expect(getAvailableActions('pending')).toEqual(VALID_TRANSITIONS.pending);
  });

  test('returns empty for terminal completed', () => {
    expect(getAvailableActions('completed')).toEqual([]);
  });
});
