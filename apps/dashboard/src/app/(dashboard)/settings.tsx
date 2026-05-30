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
  useToast,
} from '@odyssey/ui';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { useMounted } from '@/hooks/useMounted';
import { unwrap } from '@/utils/api';

export default function SettingsPage() {
  const toast = useToast();
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

  useEffect(() => {
    if (!data) return;
    setRestaurantName(data.restaurant_name);
    setPrepTime(String(data.prep_time_minutes));
    setAutoAccept(data.auto_accept);
    setServiceAvailable(data.service_available);
    setDeliveryAvailable(data.delivery_available);
  }, [data]);

  if (!mounted || isLoading) return <SkeletonCard />;
  if (isError || !data) return <ErrorState message="Failed to load settings" onRetry={() => refetch()} />;

  const save = async () => {
    try {
      await updateSettings.mutateAsync({
        data: {
          restaurant_name: restaurantName,
          prep_time_minutes: Number(prepTime),
          auto_accept: autoAccept,
          service_available: serviceAvailable,
          delivery_available: deliveryAvailable,
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
        <Text style={{ marginTop: 8, color: '#655f57' }}>Opening hours configured in backend seed (JSON).</Text>
        <View style={{ marginTop: 16 }}>
          <Button loading={updateSettings.isPending} onPress={save}>
            Save Settings
          </Button>
        </View>
      </Card>
    </View>
  );
}
