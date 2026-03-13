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
import { Separator } from "@/components/ui/separator";
import { peso } from "@/lib/helpers";
import ChartTooltip from "./chart-tooltip";
import ChartLegend from "./chart-legend";
import NavBtn from "./nav-btn";
import KpiCard from "@/components/dashboard/kpi-card";

const CHART_COLORS = {
  chart1: "var(--color-chart-1)",
  chart3: "var(--color-chart-3)",
  chart5: "var(--color-chart-5)",
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

const CORPORATE_TAX_RATE = 0.25;

interface Props {
  yearRef: Date;
  yearlyData: {
    name: string;
    label: string;
    Revenue: number;
    Expenses: number;
    Profit: number;
  }[];
  yearTotal: { revenue: number; expenses: number; profit: number };
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
}

const YearlyTab = ({
  yearRef,
  yearlyData,
  yearTotal,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
}: Props) => {
  const corpTax = yearTotal.profit * CORPORATE_TAX_RATE;
  const realEarnings = yearTotal.profit - corpTax;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <NavBtn onClick={onBack} disabled={!canGoBack}>
          ←
        </NavBtn>
        <span className="text-sm font-medium w-16 text-center">
          {format(yearRef, "yyyy")}
        </span>
        <NavBtn onClick={onForward} disabled={!canGoForward}>
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
                content={<ChartTooltip labelFormatter={labelFromPayload} />}
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
              <span className="text-muted-foreground">Corporate Tax (25%)</span>
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
    </div>
  );
};

export default YearlyTab;
