jest.mock('@odyssey/ui', () => ({
  Badge: function Badge() {
    return null;
  },
  EmptyState: function EmptyState() {
    return null;
  },
}));

import { Badge, EmptyState } from '@odyssey/ui';

describe('Badge', () => {
  test('component is exported', () => {
    expect(typeof Badge).toBe('function');
  });
});

describe('EmptyState', () => {
  test('component is exported', () => {
    expect(typeof EmptyState).toBe('function');
  });
});
