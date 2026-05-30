import { ORDER_STATUS_LABELS, type OrderStatus } from '@odyssey/types';
import {
  Badge,
  Button,
  Card,
  DataTable,
  DensityProvider,
  Drawer,
  EmptyState,
  ErrorState,
  Input,
  KPICard,
  Modal,
  ResponsiveProvider,
  Select,
  Switch,
  TextArea,
  ThemeProvider,
  ToastProvider,
  WarningBanner,
  primary,
  neutral,
  spacing,
  useBreakpoint,
  useDensity,
  useTheme,
  useToast,
  breakpoints,
  shadow,
  radius,
} from '@odyssey/ui';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type DemoRow = { id: number; name: string; status: string };

const DEMO_ROWS: DemoRow[] = [
  { id: 101, name: 'Alice Chen', status: 'completed' },
  { id: 102, name: 'Bob Martinez', status: 'pending' },
];

function UILibraryContent() {
  const { theme, toggleMode, mode } = useTheme();
  const { density, setDensity } = useDensity();
  const { width, breakpoint, isPhone, isTablet, isDesktop, contentPadding } = useBreakpoint();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectValue, setSelectValue] = useState<'dine_in' | 'takeout' | 'delivery' | null>('dine_in');

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

      <Section title="Surfaces">
        <View style={styles.surfaceRow}>
          <Card elevation="none" padding={3}>
            <Text style={{ color: theme.colors.text }}>Card (no elevation)</Text>
          </Card>
          <Card elevation="sm" padding={3}>
            <Text style={{ color: theme.colors.text }}>Card sm shadow</Text>
          </Card>
          <Card elevation="md" padding={3}>
            <Text style={{ color: theme.colors.text }}>Card md shadow</Text>
          </Card>
        </View>
        <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
          Radius lg: {radius.lg}px · shadow.md elevation: {shadow.md.elevation}
        </Text>
      </Section>

      <Section title="Breakpoints">
        <Text style={{ color: theme.colors.text }}>Width: {Math.round(width)}px</Text>
        <Text style={{ color: theme.colors.text }}>Active: {breakpoint}</Text>
        <Text style={{ color: theme.colors.textSecondary }}>
          phone &lt; {breakpoints.tablet}px · tablet &lt; {breakpoints.desktop}px · desktop ≥
          {breakpoints.desktop}px
        </Text>
        <Text style={{ color: theme.colors.textSecondary }}>
          isPhone={String(isPhone)} isTablet={String(isTablet)} isDesktop={String(isDesktop)} · contentPadding=
          {contentPadding}px
        </Text>
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
        <Select
          label="Order type"
          value={selectValue}
          options={[
            { label: 'Dine In', value: 'dine_in' },
            { label: 'Takeout', value: 'takeout' },
            { label: 'Delivery', value: 'delivery' },
          ]}
          onChange={setSelectValue}
        />
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

      <Section title="Modal, Drawer & DataTable">
        <View style={styles.row}>
          <Button variant="secondary" onPress={() => setModalOpen(true)}>Open Modal</Button>
          <Button variant="secondary" onPress={() => setDrawerOpen(true)}>Open Drawer</Button>
        </View>
        <DataTable<DemoRow>
          variant="auto"
          data={DEMO_ROWS}
          emptyHeading="No rows"
          columns={[
            { key: 'id', header: '#', render: (row) => <Text>#{row.id}</Text> },
            { key: 'name', header: 'Name', render: (row) => <Text>{row.name}</Text> },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <Badge
                  label={ORDER_STATUS_LABELS[row.status as OrderStatus]}
                  orderStatus={row.status as OrderStatus}
                  variant="order-status"
                />
              ),
            },
          ]}
          cardRender={(row) => (
            <View style={{ gap: 4 }}>
              <Text style={{ fontWeight: '600' }}>{row.name}</Text>
              <Text style={{ color: theme.colors.textSecondary }}>Order #{row.id}</Text>
            </View>
          )}
        />
        <Modal open={modalOpen} title="Example Modal" onClose={() => setModalOpen(false)}>
          <Text style={{ color: theme.colors.text }}>Modal body with scrollable content area.</Text>
        </Modal>
        <Drawer open={drawerOpen} title="Example Drawer" onClose={() => setDrawerOpen(false)}>
          <Text style={{ color: theme.colors.text }}>Drawer panel for filters, forms, or navigation.</Text>
        </Drawer>
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
      <ResponsiveProvider>
        <DensityProvider>
          <ToastProvider>
            <UILibraryContent />
          </ToastProvider>
        </DensityProvider>
      </ResponsiveProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' },
  surfaceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: { width: 64, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  swatchLabel: { fontSize: 10, color: neutral[0] },
});
