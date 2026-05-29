import { ORDER_STATUS_LABELS, type OrderStatus } from '@odyssey/types';
import {
  Badge,
  Button,
  Card,
  DensityProvider,
  EmptyState,
  ErrorState,
  Input,
  KPICard,
  Switch,
  TextArea,
  ThemeProvider,
  ToastProvider,
  WarningBanner,
  primary,
  neutral,
  spacing,
  useDensity,
  useTheme,
  useToast,
} from '@odyssey/ui';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

function UILibraryContent() {
  const { theme, toggleMode, mode } = useTheme();
  const { density, setDensity } = useDensity();
  const toast = useToast();

  return (
    <ScrollView style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>UI Library</Text>
      <View style={styles.row}>
        <Button onPress={toggleMode}>{`Theme: ${mode}`}</Button>
        <Button variant="secondary" onPress={() => setDensity('comfortable')}>Comfortable</Button>
        <Button variant="secondary" onPress={() => setDensity('balanced')}>Balanced</Button>
        <Button variant="secondary" onPress={() => setDensity('compact')}>Compact</Button>
        <Text style={{ color: theme.colors.textSecondary }}>Density: {density}</Text>
      </View>

      <Section title="Colors">
        <View style={styles.swatches}>
          {Object.entries(primary).slice(0, 6).map(([k, v]) => (
            <View key={k} style={[styles.swatch, { backgroundColor: v }]}>
              <Text style={styles.swatchLabel}>{k}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Typography">
        <Text style={{ fontSize: 30, color: theme.colors.text }}>Heading 3xl</Text>
        <Text style={{ fontSize: 24, color: theme.colors.text }}>Heading 2xl</Text>
        <Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>Body md secondary</Text>
      </Section>

      <Section title="Spacing">
        {([1, 2, 4, 6, 8] as const).map((key) => (
          <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <View style={{ width: spacing[key], height: 12, backgroundColor: theme.colors.primary }} />
            <Text style={{ color: theme.colors.text }}>{key} → {spacing[key]}px</Text>
          </View>
        ))}
      </Section>

      <Section title="Components">
        <View style={styles.row}>
          <Button onPress={() => undefined}>Primary</Button>
          <Button variant="secondary" onPress={() => undefined}>Secondary</Button>
          <Button variant="ghost" onPress={() => undefined}>Ghost</Button>
          <Button variant="danger" onPress={() => undefined}>Danger</Button>
          <Button loading onPress={() => undefined}>Loading</Button>
          <Button disabled onPress={() => undefined}>Disabled</Button>
        </View>
        <Input label="Input" placeholder="Type here" value="" onChangeText={() => undefined} />
        <TextArea label="TextArea" placeholder="Notes" value="" onChangeText={() => undefined} />
        <Switch label="Switch on" value onValueChange={() => undefined} />
        <Switch disabled label="Switch off" value={false} onValueChange={() => undefined} />
        <WarningBanner message="Inventory running low on salmon." actionLabel="Review" onAction={() => undefined} />
        <View style={styles.row}>
          {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => (
            <Badge
              key={status}
              label={ORDER_STATUS_LABELS[status]}
              orderStatus={status}
              variant="order-status"
            />
          ))}
        </View>
        <KPICard label="Orders Today" trend="up" trendLabel="12% vs yesterday" value="42" />
        <EmptyState heading="No orders yet" subtext="Create your first order to get started." />
        <ErrorState message="Example error state" onRetry={() => undefined} />
        <Button onPress={() => toast.success('Saved successfully')}>Show Toast</Button>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <Card style={{ marginBottom: 16 }}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      {children}
    </Card>
  );
}

export default function UILibraryPage() {
  return (
    <ThemeProvider>
      <DensityProvider>
        <ToastProvider>
          <UILibraryContent />
        </ToastProvider>
      </DensityProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: { width: 64, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  swatchLabel: { fontSize: 10, color: neutral[0] },
});
