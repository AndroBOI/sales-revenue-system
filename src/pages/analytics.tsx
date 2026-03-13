import { useEffect, useState } from "react";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  eachDayOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getAnalytics, type AnalyticsRow } from "@/lib/api";
import { buildAnalyticsMap, getAnalyticsRow, sumRange } from "@/lib/helpers";
import DailyTab from "@/components/analytics/daily-tab";
import WeeklyTab from "@/components/analytics/weekly-tab";
import MonthlyTab from "@/components/analytics/monthly-tab";
import YearlyTab from "@/components/analytics/yearly-tab";

const Analytics = () => {
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [yearOffset, setYearOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    getAnalytics().then(setRows);
  }, []);

  const allDates = rows.map((r) => new Date(r.date));
  const minDate = allDates.length
    ? new Date(Math.min(...allDates.map((d) => d.getTime())))
    : new Date();
  const minYear = minDate.getFullYear();
  const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);

  const byDate = buildAnalyticsMap(rows);
  const get = (date: Date): AnalyticsRow => getAnalyticsRow(byDate, date);
  const sum = (dates: Date[]) => sumRange(byDate, dates);

  // ─── Daily ───────────────────────────────────────────
  const today = get(new Date());
  const yesterday = get(subDays(new Date(), 1));

  // ─── Weekly ──────────────────────────────────────────
  const thisWeekDays = eachDayOfInterval({
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date()),
  });
  const lastWeekDays = eachDayOfInterval({
    start: startOfWeek(subWeeks(new Date(), 1)),
    end: endOfWeek(subWeeks(new Date(), 1)),
  });
  const thisWeek = sum(thisWeekDays);
  const lastWeek = sum(lastWeekDays);

  // ─── Monthly ─────────────────────────────────────────
  const monthRef = subMonths(new Date(), monthOffset);
  const monthDays = eachDayOfInterval({
    start: startOfMonth(monthRef),
    end: endOfMonth(monthRef),
  });
  const monthTotal = sum(monthDays);
  const canGoBackMonth = subMonths(new Date(), monthOffset + 1) >= minMonth;
  const canGoForwardMonth = monthOffset > 0;

  // ─── Yearly ──────────────────────────────────────────
  const yearRef = subYears(new Date(), yearOffset);
  const yearMonths = eachMonthOfInterval({
    start: startOfYear(yearRef),
    end: endOfYear(yearRef),
  });

  const yearlyData = yearMonths.map((m) => {
    const days = eachDayOfInterval({
      start: startOfMonth(m),
      end: endOfMonth(m),
    });
    const s = sum(days);
    return {
      name: format(m, "MMM"),
      label: format(m, "MMMM yyyy"),
      Revenue: s.revenue,
      Expenses: s.expenses,
      Profit: s.profit,
    };
  });

  const yearTotal = yearlyData.reduce(
    (a, m) => ({
      revenue: a.revenue + m.Revenue,
      expenses: a.expenses + m.Expenses,
      profit: a.profit + m.Profit,
    }),
    { revenue: 0, expenses: 0, profit: 0 },
  );

  const canGoBackYear = new Date().getFullYear() - yearOffset - 1 >= minYear;
  const canGoForwardYear = yearOffset > 0;

  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Revenue, expenses and profit breakdown.
        </p>
      </div>

      <Separator />

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4">
          <DailyTab today={today} yesterday={yesterday} />
        </TabsContent>
        <TabsContent value="weekly" className="mt-4">
          <WeeklyTab
            thisWeek={thisWeek}
            lastWeek={lastWeek}
            thisWeekDays={thisWeekDays}
            lastWeekDays={lastWeekDays}
            get={get}
          />
        </TabsContent>
        <TabsContent value="monthly" className="mt-4">
          <MonthlyTab
            monthRef={monthRef}
            monthDays={monthDays}
            monthTotal={monthTotal}
            canGoBack={canGoBackMonth}
            canGoForward={canGoForwardMonth}
            onBack={() => setMonthOffset((p) => p + 1)}
            onForward={() => setMonthOffset((p) => p - 1)}
            get={get}
          />
        </TabsContent>
        <TabsContent value="yearly" className="mt-4">
          <YearlyTab
            yearRef={yearRef}
            yearlyData={yearlyData}
            yearTotal={yearTotal}
            canGoBack={canGoBackYear}
            canGoForward={canGoForwardYear}
            onBack={() => setYearOffset((p) => p + 1)}
            onForward={() => setYearOffset((p) => p - 1)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
