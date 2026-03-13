import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { peso } from "@/lib/helpers";
import type { AnalyticsRow } from "@/lib/api";
import ChartTooltip from "./chart-tooltip";
import ChartLegend from "./chart-legend";
import KpiCard from "@/components/dashboard/kpi-card";
import TrendBadge from "../dashboard/trend-badge";

const CHART_COLORS = {
  chart1: "var(--color-chart-1)",
  chart3: "var(--color-chart-3)",
};
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
const labelFromPayload = (_: unknown, payload: any) =>
  payload?.[0]?.payload?.label ?? "";

interface Props {
  thisWeek: { revenue: number; expenses: number; profit: number };
  lastWeek: { revenue: number; expenses: number; profit: number };
  thisWeekDays: Date[];
  lastWeekDays: Date[];
  get: (date: Date) => AnalyticsRow;
}

const WeeklyTab = ({
  thisWeek,
  lastWeek,
  thisWeekDays,
  lastWeekDays,
  get,
}: Props) => {
  const weeklyChart = thisWeekDays.map((d, i) => ({
    name: format(d, "EEE"),
    label: `${format(d, "MMMM d, yyyy")} vs ${format(lastWeekDays[i], "MMMM d, yyyy")}`,
    "This Week": get(d).revenue,
    "Last Week": get(lastWeekDays[i]).revenue,
  }));

  return (
    <div className="flex flex-col gap-6">
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
            <TrendBadge current={thisWeek.profit} previous={lastWeek.profit} />
          }
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">This Week vs Last Week</CardTitle>
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
                content={<ChartTooltip labelFormatter={labelFromPayload} />}
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
    </div>
  );
};

export default WeeklyTab;
