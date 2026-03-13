import { format, subDays } from "date-fns";
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
  today: AnalyticsRow;
  yesterday: AnalyticsRow;
}

const DailyTab = ({ today, yesterday }: Props) => {
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

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          title="Today's Revenue"
          value={peso(today.revenue)}
          trend={
            <TrendBadge current={today.revenue} previous={yesterday.revenue} />
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
            <TrendBadge current={today.profit} previous={yesterday.profit} />
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
                content={<ChartTooltip labelFormatter={labelFromPayload} />}
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
    </div>
  );
};

export default DailyTab;
