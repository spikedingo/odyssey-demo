import { useGetHomeSummary } from '@odyssey/api-client';
import type { GetHomeSummary200 } from '@odyssey/api-client';
import { formatCents } from '@odyssey/shared';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@odyssey/types';
import {
  Badge,
  Card,
  DataTable,
  ErrorState,
  KPICard,
  PageHeader,
  SkeletonCard,
  TableSkeleton,
  useBreakpoint,
  useTheme,
} from '@odyssey/ui';
import { StyleSheet, Text, View } from 'react-native';

import { MenuItemRow } from '@/components/MenuItemRow';
import { RevenueCalendar } from '@/components/RevenueCalendar';
import { useMounted } from '@/hooks/useMounted';
import { unwrap } from '@/utils/api';

function trend(current: number, previous: number): { trend: 'up' | 'down' | 'neutral'; label: string } {
  if (previous === 0) return { trend: 'neutral', label: 'No prior data' };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { trend: 'up', label: `${pct}% vs yesterday` };
  if (pct < 0) return { trend: 'down', label: `${Math.abs(pct)}% vs yesterday` };
  return { trend: 'neutral', label: 'Same as yesterday' };
}

export default function HomePage() {
  const { theme } = useTheme();
  const { isPhone } = useBreakpoint();
  const mounted = useMounted();
  const { data: response, isLoading, isError, refetch } = useGetHomeSummary({
    query: { enabled: mounted },
  });
  const summary = unwrap<GetHomeSummary200>(response);

  if (!mounted || isLoading) {
    return (
      <View>
        <PageHeader title="Home" subtitle="Today's overview" />
        <View style={styles.kpiGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.kpiItem}>
              <SkeletonCard />
            </View>
          ))}
        </View>
        <TableSkeleton rows={6} />
        <View style={styles.calendarSkeleton}>
          <SkeletonCard />
        </View>
      </View>
    );
  }

  if (isError || !summary) {
    return (
      <View>
        <PageHeader title="Home" />
        <ErrorState message="Failed to load dashboard summary." onRetry={() => refetch()} />
      </View>
    );
  }

  const ordersTrend = trend(summary.total_orders_today, summary.total_orders_yesterday);
  const revenueTrend = trend(summary.revenue_today_cents, summary.revenue_yesterday_cents);

  return (
    <View>
      <PageHeader title="Home" subtitle="Today's overview" />
      <View style={[styles.kpiGrid, isPhone && styles.kpiGridPhone]}>
        <View style={[styles.kpiItem, isPhone && styles.kpiItemPhone]}>
          <KPICard label="Orders Today" trend={ordersTrend.trend} trendLabel={ordersTrend.label} value={String(summary.total_orders_today)} />
        </View>
        <View style={[styles.kpiItem, isPhone && styles.kpiItemPhone]}>
          <KPICard label="Revenue Today" trend={revenueTrend.trend} trendLabel={revenueTrend.label} value={formatCents(summary.revenue_today_cents)} />
        </View>
        <View style={[styles.kpiItem, isPhone && styles.kpiItemPhone]}>
          <KPICard label="Pending Orders" style={styles.kpiCard} value={String(summary.pending_orders)} />
        </View>
        <View style={[styles.kpiItem, isPhone && styles.kpiItemPhone]}>
          {summary.popular_items[0] ? (
            <Card style={styles.kpiCard}>
              <Text style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}>Top Item</Text>
              <MenuItemRow name={summary.popular_items[0].name} size={48} style={{ marginTop: 8 }}>
                <Text style={[styles.kpiValue, { color: theme.colors.text }]}>{summary.popular_items[0].name}</Text>
                <Text style={{ color: theme.colors.textSecondary }}>
                  {summary.popular_items[0].quantity_sold} sold
                </Text>
              </MenuItemRow>
            </Card>
          ) : (
            <KPICard label="Top Item" style={styles.kpiCard} value="—" />
          )}
        </View>
      </View>

      <View style={styles.split}>
        <View style={styles.tableSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Orders</Text>
          <DataTable
              variant="auto"
              cardRender={(row) => (
                <View style={{ gap: 4 }}>
                  <Text style={{ fontWeight: '600' }}>#{row.id} · {row.customer_name ?? 'Walk-in'}</Text>
                  <Badge
                    label={ORDER_STATUS_LABELS[row.status as OrderStatus]}
                    orderStatus={row.status as OrderStatus}
                    variant="order-status"
                  />
                  <Text>{formatCents(row.total_cents)}</Text>
                </View>
              )}
              columns={[
                { key: 'id', header: '#', flex: 0.5, render: (row) => <Text>#{row.id}</Text> },
                { key: 'customer', header: 'Customer', render: (row) => <Text>{row.customer_name ?? 'Walk-in'}</Text> },
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
                { key: 'total', header: 'Total', render: (row) => <Text>{formatCents(row.total_cents)}</Text> },
              ]}
              data={summary.recent_orders}
            />
        </View>
        <View style={styles.sideSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Popular Items</Text>
          <Card>
            {summary.popular_items.map((item) => (
              <MenuItemRow
                key={item.name}
                name={item.name}
                style={styles.popularRow}
                trailing={
                  <Text style={{ color: theme.colors.textSecondary }}>{item.quantity_sold} sold</Text>
                }
              >
                <Text style={{ color: theme.colors.text }}>{item.name}</Text>
              </MenuItemRow>
            ))}
          </Card>
        </View>
      </View>

      <RevenueCalendar dailyRevenue={summary.daily_revenue} />
    </View>
  );
}

const styles = StyleSheet.create({
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', gap: 16, marginBottom: 24 },
  kpiGridPhone: { flexDirection: 'column' },
  kpiItem: { flexBasis: '48%', flexGrow: 1, flexDirection: 'column' },
  kpiItemPhone: { flexBasis: '100%', width: '100%' },
  kpiCard: { flex: 1 },
  split: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', width: '100%' },
  tableSection: { flex: 2, minWidth: 320, width: '100%' },
  sideSection: { flex: 1, minWidth: 280, width: '100%' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  kpiLabel: { fontSize: 14 },
  kpiValue: { fontSize: 20, fontWeight: '700' },
  popularRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e6e2dc',
  },
  calendarSkeleton: { marginTop: 24, minHeight: 320 },
});
