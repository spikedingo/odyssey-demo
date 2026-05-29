import type { ListCategories200Item } from '@odyssey/api-client';
import { fontFamily } from '@odyssey/ui';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

type CategoryTabsProps = {
  categories: ListCategories200Item[];
  activeId: number | null;
  onSelect: (id: number) => void;
};

export function CategoryTabs({ categories, activeId, onSelect }: CategoryTabsProps) {
  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.row}
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
    >
      {categories.map((category) => {
        const active = category.id === activeId;
        return (
          <Pressable
            key={category.id}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onSelect(category.id)}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{category.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginBottom: 12,
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 52,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  tab: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#f5f3f0',
    borderWidth: 1,
    borderColor: '#e8e4df',
  },
  tabActive: { backgroundColor: '#2d4a3e', borderColor: '#2d4a3e' },
  tabText: { fontFamily: fontFamily.sansMedium, fontSize: 16, color: '#1a1816' },
  tabTextActive: { color: '#fff' },
});
