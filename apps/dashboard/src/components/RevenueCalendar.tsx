import { formatCents } from '@odyssey/shared';
import { Card, useBreakpoint, useTheme } from '@odyssey/ui';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type DailyRevenue = {
  date: string;
  revenue_cents: number;
};

type RevenueCalendarProps = {
  dailyRevenue: DailyRevenue[];
};

function formatCompactCents(cents: number): string {
  if (cents === 0) return '—';
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}k`;
  return formatCents(cents);
}

function formatMonthTitle(firstDate: string): string {
  const [year, month] = firstDate.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function buildCalendarWeeks(dailyRevenue: DailyRevenue[]): (DailyRevenue | null)[][] {
  if (dailyRevenue.length === 0) return [];

  const [year, month] = dailyRevenue[0]!.date.split('-').map(Number);
  const firstWeekday = new Date(Date.UTC(year!, month! - 1, 1)).getUTCDay();
  const cells: (DailyRevenue | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...dailyRevenue,
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (DailyRevenue | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function RevenueCalendar({ dailyRevenue }: RevenueCalendarProps) {
  const { theme } = useTheme();
  const { isPhone } = useBreakpoint();
  const todayKey = new Date().toISOString().slice(0, 10);
  const weeks = buildCalendarWeeks(dailyRevenue);
  const maxRevenue = Math.max(...dailyRevenue.map((day) => day.revenue_cents), 1);
  const monthTitle = dailyRevenue[0] ? formatMonthTitle(dailyRevenue[0].date) : '';

  const calendarBody = (
    <>
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={styles.weekdayCell}>
            <Text style={[styles.weekdayLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            if (!day) {
              return <View key={`empty-${weekIndex}-${dayIndex}`} style={styles.dayCell} />;
            }

            const dayNumber = Number(day.date.slice(8, 10));
            const isToday = day.date === todayKey;
            const heat =
              day.revenue_cents > 0 ? 0.08 + (day.revenue_cents / maxRevenue) * 0.32 : 0;

            return (
              <View
                key={day.date}
                style={[
                  styles.dayCell,
                  isPhone && styles.dayCellPhone,
                  {
                    backgroundColor: heat > 0 ? `rgba(34, 139, 90, ${heat})` : theme.colors.background,
                    borderColor: isToday ? theme.colors.primary : theme.colors.border,
                    borderWidth: isToday ? 2 : StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <Text style={[styles.dayNumber, { color: theme.colors.text }]}>{dayNumber}</Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.revenueLabel,
                    {
                      color: day.revenue_cents > 0 ? theme.colors.text : theme.colors.textSecondary,
                      fontWeight: day.revenue_cents > 0 ? '600' : '400',
                    },
                  ]}
                >
                  {formatCompactCents(day.revenue_cents)}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </>
  );

  return (
    <Card style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Revenue Calendar</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{monthTitle}</Text>

      {isPhone ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.calendarScrollInner}>{calendarBody}</View>
        </ScrollView>
      ) : (
        calendarBody
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  calendarScrollInner: { minWidth: 560 },
  dayCell: {
    flex: 1,
    minHeight: 72,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-between',
  },
  dayCellPhone: { minWidth: 72, flex: 0 },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  revenueLabel: {
    fontSize: 11,
  },
});
