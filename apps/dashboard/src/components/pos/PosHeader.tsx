import type { OrderType } from '@odyssey/types';
import { ORDER_TYPE_LABELS } from '@odyssey/types';
import { fontFamily } from '@odyssey/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type PosHeaderProps = {
  restaurantName: string;
  orderType: OrderType;
  deliveryAvailable: boolean;
  onOrderTypeChange: (type: OrderType) => void;
};

const ORDER_TYPES: OrderType[] = ['dine_in', 'takeout', 'delivery'];

export function PosHeader({
  restaurantName,
  orderType,
  deliveryAvailable,
  onOrderTypeChange,
}: PosHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Text style={styles.title}>{restaurantName}</Text>
        <Text style={styles.subtitle}>Self-Service Ordering</Text>
      </View>

      <View style={styles.segmentGroup}>
        <Text style={styles.segmentLabel}>Type</Text>
        <View style={styles.segmentRow}>
          {ORDER_TYPES.map((type) => {
            const disabled = type === 'delivery' && !deliveryAvailable;
            return (
              <Pressable
                key={type}
                disabled={disabled}
                style={[
                  styles.segment,
                  orderType === type && styles.segmentActive,
                  disabled && styles.segmentDisabled,
                ]}
                onPress={() => onOrderTypeChange(type)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    orderType === type && styles.segmentTextActive,
                    disabled && styles.segmentTextDisabled,
                  ]}
                >
                  {ORDER_TYPE_LABELS[type]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e4df',
  },
  left: { flex: 1, minWidth: 140 },
  title: { fontFamily: fontFamily.sansBold, fontSize: 20, color: '#1a1816' },
  subtitle: { fontFamily: fontFamily.sans, fontSize: 13, color: '#6b6560', marginTop: 2 },
  segmentGroup: { gap: 4 },
  segmentLabel: { fontFamily: fontFamily.sansMedium, fontSize: 11, color: '#6b6560', textTransform: 'uppercase' },
  segmentRow: { flexDirection: 'row', gap: 6 },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d4cfc8',
    backgroundColor: '#fff',
  },
  segmentActive: { backgroundColor: '#2d4a3e', borderColor: '#2d4a3e' },
  segmentDisabled: { opacity: 0.4 },
  segmentText: { fontFamily: fontFamily.sansMedium, fontSize: 13, color: '#1a1816' },
  segmentTextActive: { color: '#fff' },
  segmentTextDisabled: { color: '#6b6560' },
});
