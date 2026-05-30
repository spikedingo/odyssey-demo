import type { ListMenuItems200Item } from '@odyssey/api-client';
import { EmptyState, useBreakpoint } from '@odyssey/ui';
import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

import { MenuTile } from '@/components/pos/MenuTile';

type MenuGridProps = {
  items: ListMenuItems200Item[];
  quantities: Record<number, number>;
  catalogEmpty?: boolean;
  columns?: number;
  onAddItem: (id: number) => void;
};

const GRID_GAP = 12;
const GRID_PADDING = 0;

export function MenuGrid({
  items,
  quantities,
  catalogEmpty = false,
  columns: columnsProp,
  onAddItem,
}: MenuGridProps) {
  const { width } = useWindowDimensions();
  const { isPhone, isTablet } = useBreakpoint();
  const columns = columnsProp ?? (isPhone ? 2 : isTablet ? 3 : 4);
  const tileWidth = Math.floor((width - GRID_PADDING - GRID_GAP * (columns - 1)) / columns) - (isPhone ? 32 : 48);

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
    <ScrollView contentContainerStyle={styles.grid} style={styles.scroll} keyboardShouldPersistTaps="handled">
      {items.map((item) => (
        <MenuTile
          key={item.id}
          item={item}
          quantity={quantities[item.id] ?? 0}
          width={Math.max(140, tileWidth)}
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
    gap: GRID_GAP,
    paddingBottom: 24,
  },
});
