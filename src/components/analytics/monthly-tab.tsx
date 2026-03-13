import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { peso } from "@/lib/helpers";
import type { AnalyticsRow } from "@/lib/api";
import ChartTooltip from "./chart-tooltip";
import ChartLegend  from "./chart-legend";
import NavBtn       from "./nav-btn";
import KpiCard      from "@/components/dashboard/kpi-card";

const CHART_COLORS = { chart1: "var(--color-chart-1)", chart3: "var(--color-chart-3)", chart5: "var(--color-chart-5)" };
const xAxisProps = { tick: { fontSize: 12, fill: "var(--color-muted-foreground)" }, axisLine: false, tickLine: false };
const yAxisProps = { tick: { fontSize: 12, fill: "var(--color-muted-foreground)" }, axisLine: false, tickLine: false, tickFormatter: (v: number) => `₱${(v / 1000).toFixed(0)}k` };
const labelFromPayload = (_: unknown, payload: any) => payload?.[0]?.payload?.label ?? "";

interface Props {
  monthRef:         Date;
  monthDays:        Date[];
  monthTotal:       { revenue: number; expenses: number; profit: number };
  canGoBack:        boolean;
  canGoForward:     boolean;
  onBack:           () => void;
  onForward:        () => void;
  get:              (date: Date) => AnalyticsRow;
}

const MonthlyTab = ({ monthRef, monthDays, monthTotal, canGoBack, canGoForward, onBack, onForward, get }: Props) => {
  const monthlyChart = monthDays.map((d) => ({
    name:     format(d, "d"),
    label:    format(d, "MMMM d, yyyy"),
    Revenue:  get(d).revenue,
    Expenses: get(d).expenses,
    Profit:   get(d).profit,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <NavBtn onClick={onBack}    disabled={!canGoBack}>←</NavBtn>
        <span className="text-sm font-medium w-32 text-center">{format(monthRef, "MMMM yyyy")}</span>
        <NavBtn onClick={onForward} disabled={!canGoForward}>→</NavBtn>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Total Revenue"  value={peso(monthTotal.revenue)}  />
        <KpiCard title="Total Expenses" value={peso(monthTotal.expenses)} />
        <KpiCard title="Net Profit"     value={peso(monthTotal.profit)}   />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Trend</CardTitle>
          <CardDescription>{format(monthRef, "MMMM yyyy")} — Revenue, Expenses and Profit</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="name" {...xAxisProps} interval={4} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<ChartTooltip labelFormatter={labelFromPayload} />} />
              <Legend content={<ChartLegend />} />
              <Line dataKey="Revenue"  type="monotone" stroke={CHART_COLORS.chart1} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Line dataKey="Expenses" type="monotone" stroke={CHART_COLORS.chart3} strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Line dataKey="Profit"   type="monotone" stroke={CHART_COLORS.chart5} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyTab;