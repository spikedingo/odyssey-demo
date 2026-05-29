import type { ListMenuItems200Item } from '@odyssey/api-client';
import { EmptyState } from '@odyssey/ui';
import { ScrollView, StyleSheet } from 'react-native';

import { MenuTile } from '@/components/pos/MenuTile';

type MenuGridProps = {
  items: ListMenuItems200Item[];
  quantities: Record<number, number>;
  catalogEmpty?: boolean;
  onAddItem: (id: number) => void;
};

export function MenuGrid({ items, quantities, catalogEmpty = false, onAddItem }: MenuGridProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        heading={catalogEmpty ? 'No menu yet' : 'Empty category'}
        subtext={
          catalogEmpty
            ? 'Add categories and items in Menu, or run pnpm seed to load demo data.'
            : 'No available items in this category. Try another tab.'
        }
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.grid} style={styles.scroll}>
      {items.map((item) => (
        <MenuTile
          key={item.id}
          item={item}
          quantity={quantities[item.id] ?? 0}
          onAdd={() => onAddItem(item.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 24,
  },
});
