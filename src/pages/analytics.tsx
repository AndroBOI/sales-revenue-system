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
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CORPORATE_TAX_RATE = 0.25;

const CHART_COLORS = {
  chart1: "var(--color-chart-1)",
  chart2: "var(--color-chart-2)",
  chart3: "var(--color-chart-3)",
  chart4: "var(--color-chart-4)",
  chart5: "var(--color-chart-5)",
};

// ─── Types ────────────────────────────────────────────
interface AnalyticsRow {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
}

declare global {
  interface Window {
    api?: {
      getAnalytics: () => Promise<AnalyticsRow[]>;
    };
  }
}


const peso = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`;

const pct = (current: number, previous: number) => {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
};


const ChartTooltip = ({ active, payload, label, labelFormatter }: any) => {
  if (!active || !payload?.length) return null;
  const displayLabel = labelFormatter ? labelFormatter(label, payload) : label;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-md px-3 py-2 text-xs flex flex-col gap-1 min-w-[160px]">
      <span className="font-semibold text-foreground mb-1">{displayLabel}</span>
      {payload.map((p: any) => (
        <div
          key={p.dataKey}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full inline-block"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-muted-foreground">{p.dataKey}</span>
          </div>
          <span className="font-medium text-foreground">{peso(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Custom Legend ────────────────────────────────────
const ChartLegend = ({ payload }: any) => {
  if (!payload?.length) return null;
  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      {payload.map((p: any) => (
        <div
          key={p.value}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span
            className="size-2 rounded-full inline-block"
            style={{ backgroundColor: p.color }}
          />
          {p.value}
        </div>
      ))}
    </div>
  );
};

// ─── Trend Badge ──────────────────────────────────────
const TrendBadge = ({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) => {
  const diff = pct(current, previous);
  if (diff === null) return null;
  if (diff > 0)
    return (
      <Badge variant="outline" className="gap-1 w-fit">
        <TrendingUp className="size-3" />
        {diff.toFixed(1)}%
      </Badge>
    );
  if (diff < 0)
    return (
      <Badge variant="outline" className="gap-1 w-fit">
        <TrendingDown className="size-3" />
        {Math.abs(diff).toFixed(1)}%
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1 w-fit">
      <Minus className="size-3" />
      0%
    </Badge>
  );
};

// ─── KPI Card ─────────────────────────────────────────
const KpiCard = ({
  title,
  value,
  sub,
  trend,
}: {
  title: string;
  value: string;
  sub?: string;
  trend?: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="pb-1">
      <CardDescription>{title}</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-1">
      <span className="text-2xl font-bold tracking-tight">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      {trend}
    </CardContent>
  </Card>
);

// ─── Shared Axis Props ────────────────────────────────
const xAxisProps = {
  tick: { fontSize: 12, fill: "var(--color-muted-foreground)" },
  axisLine: false,
  tickLine: false,
};

const yAxisProps = {
  tick: { fontSize: 12, fill: "var(--color-muted-foreground)" },
  axisLine: false,
  tickLine: false,
  tickFormatter: (v: number) => `₱${(v / 1000).toFixed(0)}k`,
};

// ─── Nav Button ───────────────────────────────────────
const NavBtn = ({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed px-1"
  >
    {children}
  </button>
);

// ─── Main Component ───────────────────────────────────
const Analytics = () => {
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [yearOffset, setYearOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    window.api?.getAnalytics().then(setRows);
  }, []);

  // ─── Date bounds from data ───────────────────────────
  const allDates = rows.map((r) => new Date(r.date));
  const minDate = allDates.length
    ? new Date(Math.min(...allDates.map((d) => d.getTime())))
    : new Date();

  const minYear = minDate.getFullYear();
  const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const maxMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // ─── Lookup helpers ──────────────────────────────────
  const byDate = Object.fromEntries(rows.map((r) => [r.date, r]));

  const get = (date: Date): AnalyticsRow =>
    byDate[format(date, "yyyy-MM-dd")] ?? {
      date: format(date, "yyyy-MM-dd"),
      revenue: 0,
      expenses: 0,
      profit: 0,
    };

  const sumRange = (dates: Date[]) =>
    dates.reduce(
      (acc, d) => {
        const r = get(d);
        return {
          revenue: acc.revenue + r.revenue,
          expenses: acc.expenses + r.expenses,
          profit: acc.profit + r.profit,
        };
      },
      { revenue: 0, expenses: 0, profit: 0 },
    );

  // ─── Daily ───────────────────────────────────────────
  const today = get(new Date());
  const yesterday = get(subDays(new Date(), 1));

  const dailyChart = [
    {
      name: "Revenue",
      label: format(new Date(), "MMMM d, yyyy"),
      Today: today.revenue,
      Yesterday: yesterday.revenue,
    },
    {
      name: "Expenses",
      label: format(subDays(new Date(), 1), "MMMM d, yyyy"),
      Today: today.expenses,
      Yesterday: yesterday.expenses,
    },
    {
      name: "Profit",
      label: format(new Date(), "MMMM d, yyyy"),
      Today: today.profit,
      Yesterday: yesterday.profit,
    },
  ];

  // ─── Weekly ──────────────────────────────────────────
  const thisWeekDays = eachDayOfInterval({
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date()),
  });
  const lastWeekDays = eachDayOfInterval({
    start: startOfWeek(subWeeks(new Date(), 1)),
    end: endOfWeek(subWeeks(new Date(), 1)),
  });
  const thisWeek = sumRange(thisWeekDays);
  const lastWeek = sumRange(lastWeekDays);

  const weeklyChart = thisWeekDays.map((d, i) => ({
    name: format(d, "EEE"),
    label: `${format(d, "MMMM d, yyyy")} vs ${format(lastWeekDays[i], "MMMM d, yyyy")}`,
    "This Week": get(d).revenue,
    "Last Week": get(lastWeekDays[i]).revenue,
  }));
  // ─── Monthly ─────────────────────────────────────────
  const monthRef = subMonths(new Date(), monthOffset);
  const monthDays = eachDayOfInterval({
    start: startOfMonth(monthRef),
    end: endOfMonth(monthRef),
  });
  const monthTotal = sumRange(monthDays);

  const monthlyChart = monthDays.map((d) => ({
    name: format(d, "d"),
    label: format(d, "MMMM d, yyyy"),
    Revenue: get(d).revenue,
    Expenses: get(d).expenses,
    Profit: get(d).profit,
  }));

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
    const s = sumRange(days);
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

  const corpTax = yearTotal.profit * CORPORATE_TAX_RATE;
  const realEarnings = yearTotal.profit - corpTax;

  const canGoBackYear = new Date().getFullYear() - yearOffset - 1 >= minYear;
  const canGoForwardYear = yearOffset > 0;

  // ─── Render ───────────────────────────────────────────
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

        {/* ── DAILY ── */}
        <TabsContent value="daily" className="flex flex-col gap-6 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <KpiCard
              title="Today's Revenue"
              value={peso(today.revenue)}
              trend={
                <TrendBadge
                  current={today.revenue}
                  previous={yesterday.revenue}
                />
              }
            />
            <KpiCard
              title="Today's Expenses"
              value={peso(today.expenses)}
              trend={
                <TrendBadge
                  current={today.expenses}
                  previous={yesterday.expenses}
                />
              }
            />
            <KpiCard
              title="Today's Profit"
              value={peso(today.profit)}
              trend={
                <TrendBadge
                  current={today.profit}
                  previous={yesterday.profit}
                />
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today vs Yesterday</CardTitle>
              <CardDescription>
                {format(new Date(), "MMMM d")} compared to{" "}
                {format(subDays(new Date(), 1), "MMMM d")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailyChart} barCategoryGap="30%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border)"
                  />
                  <XAxis dataKey="name" {...xAxisProps} />
                  <YAxis {...yAxisProps} />
                  <Tooltip
                    content={
                      <ChartTooltip
                        labelFormatter={(_: any, payload: any) =>
                          payload?.[0]?.payload?.label ?? ""
                        }
                      />
                    }
                  />
                  <Legend content={<ChartLegend />} />
                  <Bar
                    dataKey="Today"
                    fill={CHART_COLORS.chart1}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Yesterday"
                    fill={CHART_COLORS.chart3}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── WEEKLY ── */}
        <TabsContent value="weekly" className="flex flex-col gap-6 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <KpiCard
              title="This Week Revenue"
              value={peso(thisWeek.revenue)}
              trend={
                <TrendBadge
                  current={thisWeek.revenue}
                  previous={lastWeek.revenue}
                />
              }
            />
            <KpiCard
              title="This Week Expenses"
              value={peso(thisWeek.expenses)}
              trend={
                <TrendBadge
                  current={thisWeek.expenses}
                  previous={lastWeek.expenses}
                />
              }
            />
            <KpiCard
              title="This Week Profit"
              value={peso(thisWeek.profit)}
              trend={
                <TrendBadge
                  current={thisWeek.profit}
                  previous={lastWeek.profit}
                />
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                This Week vs Last Week
              </CardTitle>
              <CardDescription>Daily revenue comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyChart} barCategoryGap="30%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border)"
                  />
                  <XAxis dataKey="name" {...xAxisProps} />
                  <YAxis {...yAxisProps} />
                  <Tooltip
                    content={
                      <ChartTooltip
                        labelFormatter={(_: any, payload: any) =>
                          payload?.[0]?.payload?.label ?? ""
                        }
                      />
                    }
                  />
                  <Legend content={<ChartLegend />} />
                  <Bar
                    dataKey="This Week"
                    fill={CHART_COLORS.chart1}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Last Week"
                    fill={CHART_COLORS.chart3}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── MONTHLY ── */}
        <TabsContent value="monthly" className="flex flex-col gap-6 mt-4">
          <div className="flex items-center gap-2">
            <NavBtn
              onClick={() => setMonthOffset((p) => p + 1)}
              disabled={!canGoBackMonth}
            >
              ←
            </NavBtn>
            <span className="text-sm font-medium w-32 text-center">
              {format(monthRef, "MMMM yyyy")}
            </span>
            <NavBtn
              onClick={() => setMonthOffset((p) => p - 1)}
              disabled={!canGoForwardMonth}
            >
              →
            </NavBtn>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <KpiCard title="Total Revenue" value={peso(monthTotal.revenue)} />
            <KpiCard title="Total Expenses" value={peso(monthTotal.expenses)} />
            <KpiCard title="Net Profit" value={peso(monthTotal.profit)} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daily Trend</CardTitle>
              <CardDescription>
                {format(monthRef, "MMMM yyyy")} — Revenue, Expenses and Profit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={monthlyChart}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border)"
                  />
                  <XAxis dataKey="name" {...xAxisProps} interval={4} />
                  <YAxis {...yAxisProps} />
                  <Tooltip
                    content={
                      <ChartTooltip
                        labelFormatter={(_: any, payload: any) =>
                          payload?.[0]?.payload?.label ?? ""
                        }
                      />
                    }
                  />
                  <Legend content={<ChartLegend />} />
                  <Line
                    dataKey="Revenue"
                    type="monotone"
                    stroke={CHART_COLORS.chart1}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                  <Line
                    dataKey="Expenses"
                    type="monotone"
                    stroke={CHART_COLORS.chart3}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                  <Line
                    dataKey="Profit"
                    type="monotone"
                    stroke={CHART_COLORS.chart5}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── YEARLY ── */}
        <TabsContent value="yearly" className="flex flex-col gap-6 mt-4">
          <div className="flex items-center gap-2">
            <NavBtn
              onClick={() => setYearOffset((p) => p + 1)}
              disabled={!canGoBackYear}
            >
              ←
            </NavBtn>
            <span className="text-sm font-medium w-16 text-center">
              {format(yearRef, "yyyy")}
            </span>
            <NavBtn
              onClick={() => setYearOffset((p) => p - 1)}
              disabled={!canGoForwardYear}
            >
              →
            </NavBtn>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <KpiCard title="Annual Revenue" value={peso(yearTotal.revenue)} />
            <KpiCard title="Annual Expenses" value={peso(yearTotal.expenses)} />
            <KpiCard title="Net Profit" value={peso(yearTotal.profit)} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Breakdown</CardTitle>
              <CardDescription>
                {format(yearRef, "yyyy")} — Revenue vs Expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={yearlyData} barCategoryGap="30%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border)"
                  />
                  <XAxis dataKey="name" {...xAxisProps} />
                  <YAxis {...yAxisProps} />
                  <Tooltip
                    content={
                      <ChartTooltip
                        labelFormatter={(_: any, payload: any) =>
                          payload?.[0]?.payload?.label ?? ""
                        }
                      />
                    }
                  />
                  <Legend content={<ChartLegend />} />
                  <Bar
                    dataKey="Revenue"
                    fill={CHART_COLORS.chart1}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Expenses"
                    fill={CHART_COLORS.chart3}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Profit"
                    fill={CHART_COLORS.chart5}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Corporate Tax Summary</CardTitle>
              <CardDescription>
                Estimated annual tax — for your accountant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Profit</span>
                  <span className="font-medium">{peso(yearTotal.profit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Corporate Tax (25%)
                  </span>
                  <span className="font-medium">− {peso(corpTax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Estimated Real Earnings</span>
                  <span>{peso(realEarnings)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
