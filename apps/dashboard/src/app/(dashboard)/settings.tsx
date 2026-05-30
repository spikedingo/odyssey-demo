import { useGetSettings, useUpdateSettings } from '@odyssey/api-client';
import type { GetSettings200 } from '@odyssey/api-client';
import {
  Button,
  Card,
  ErrorState,
  Input,
  PageHeader,
  SkeletonCard,
  Switch,
  useBreakpoint,
  useTheme,
  useToast,
} from '@odyssey/ui';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useMounted } from '@/hooks/useMounted';
import { unwrap } from '@/utils/api';

type OpeningHours = GetSettings200['opening_hours'];

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS: Record<(typeof DAY_ORDER)[number], string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

const DEFAULT_OPENING_HOURS = Object.fromEntries(
  DAY_ORDER.map((day) => [day, { open: '09:00', close: '22:00' }]),
) as OpeningHours;

function cloneOpeningHours(hours: OpeningHours): OpeningHours {
  return Object.fromEntries(
    DAY_ORDER.map((day) => [day, { ...hours[day] }]),
  ) as OpeningHours;
}

export default function SettingsPage() {
  const toast = useToast();
  const { theme } = useTheme();
  const { contentPadding } = useBreakpoint();
  const mounted = useMounted();
  const { data: response, isLoading, isError, refetch } = useGetSettings({
    query: { enabled: mounted },
  });
  const updateSettings = useUpdateSettings();
  const data = unwrap<GetSettings200>(response);

  const [restaurantName, setRestaurantName] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [autoAccept, setAutoAccept] = useState(false);
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(DEFAULT_OPENING_HOURS);

  useEffect(() => {
    if (!data) return;
    setRestaurantName(data.restaurant_name);
    setPrepTime(String(data.prep_time_minutes));
    setAutoAccept(data.auto_accept);
    setServiceAvailable(data.service_available);
    setDeliveryAvailable(data.delivery_available);
    setOpeningHours(cloneOpeningHours(data.opening_hours));
  }, [data]);

  if (!mounted || isLoading) return <SkeletonCard />;
  if (isError || !data) return <ErrorState message="Failed to load settings" onRetry={() => refetch()} />;

  const updateDayHours = (day: (typeof DAY_ORDER)[number], field: 'open' | 'close', value: string) => {
    setOpeningHours((prev) => {
      const slot = prev[day] ?? { open: '09:00', close: '22:00' };
      return {
        ...prev,
        [day]: {
          open: field === 'open' ? value : slot.open,
          close: field === 'close' ? value : slot.close,
        },
      };
    });
  };

  const save = async () => {
    try {
      await updateSettings.mutateAsync({
        data: {
          restaurant_name: restaurantName,
          prep_time_minutes: Number(prepTime),
          auto_accept: autoAccept,
          service_available: serviceAvailable,
          delivery_available: deliveryAvailable,
          opening_hours: openingHours,
        },
      });
      toast.success('Settings saved');
      refetch();
    } catch {
      toast.error('Failed to save settings');
    }
  };

  return (
    <View style={{ paddingBottom: contentPadding }}>
      <PageHeader title="Settings" subtitle="Restaurant configuration" />
      <Card>
        <Input label="Restaurant Name" value={restaurantName} onChangeText={setRestaurantName} />
        <Input label="Prep Time (minutes)" value={prepTime} onChangeText={setPrepTime} />
        <Switch label="Auto Accept Orders" value={autoAccept} onValueChange={setAutoAccept} />
        <Switch label="Service Available" value={serviceAvailable} onValueChange={setServiceAvailable} />
        <Switch label="Delivery Available" value={deliveryAvailable} onValueChange={setDeliveryAvailable} />
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Opening Hours</Text>
        <Text style={[styles.sectionHint, { color: theme.colors.textSecondary }]}>
          Use 24-hour format (e.g. 09:00, 22:00).
        </Text>
        {DAY_ORDER.map((day) => {
          const slot = openingHours[day];
          if (!slot) return null;
          return (
            <View key={day} style={styles.hoursRow}>
              <Text style={[styles.dayLabel, { color: theme.colors.text }]}>{DAY_LABELS[day]}</Text>
              <View style={styles.hoursInputs}>
                <View style={styles.hourInput}>
                  <Input
                    label="Open"
                    value={slot.open}
                    onChangeText={(v) => updateDayHours(day, 'open', v)}
                  />
                </View>
                <View style={styles.hourInput}>
                  <Input
                    label="Close"
                    value={slot.close}
                    onChangeText={(v) => updateDayHours(day, 'close', v)}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </Card>

      <View style={{ marginTop: 16 }}>
        <Button loading={updateSettings.isPending} onPress={save}>
          Save Settings
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  sectionHint: { fontSize: 14, marginBottom: 16 },
  hoursRow: { marginBottom: 12 },
  dayLabel: { fontWeight: '600', marginBottom: 8 },
  hoursInputs: { flexDirection: 'row', gap: 12 },
  hourInput: { flex: 1, minWidth: 0 },
});
