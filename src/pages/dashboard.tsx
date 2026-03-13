import { useEffect, useState } from "react";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import {
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

import { getEntries, type EntryRow } from "@/lib/api";
import {
  peso,
  buildDateMap,
  getEntryRow,
  peakDay,
  slowDay,
} from "@/lib/helpers";
import DayCard from "@/components/dashboard/day-card";
import KpiCard from "@/components/dashboard/kpi-card";
import TrendBadge from "@/components/dashboard/trend-badge";

const Dashboard = () => {
  const [entries, setEntries] = useState<EntryRow[]>([]);

  useEffect(() => {
    getEntries().then(setEntries);
  }, []);

  const byDate = buildDateMap(entries); // ← helper
  const getRow = (date: Date) => getEntryRow(byDate, date); // ← helper

  const today = getRow(new Date());
  const yesterday = getRow(subDays(new Date(), 1));

  const now = new Date();
  const monthDays = eachDayOfInterval({
    start: startOfMonth(now),
    end: endOfMonth(now),
  });
  const monthRows = monthDays
    .map((d) => getRow(d))
    .filter((r) => r.revenue > 0);

  const monthTotal = monthRows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      expenses: acc.expenses + r.expenses,
      profit: acc.profit + r.profit,
    }),
    { revenue: 0, expenses: 0, profit: 0 },
  );

  const best = peakDay(monthRows); // ← called with monthRows
  const slow = slowDay(monthRows); // ← called with monthRows

  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <Separator />

      {/* ── Today ── */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Today
        </p>
        <div className="grid grid-cols-3 gap-4">
          <KpiCard
            title="Revenue"
            value={peso(today.revenue)}
            trend={
              <TrendBadge
                current={today.revenue}
                previous={yesterday.revenue}
              />
            }
          />
          <KpiCard
            title="Expenses"
            value={peso(today.expenses)}
            trend={
              <TrendBadge
                current={today.expenses}
                previous={yesterday.expenses}
              />
            }
          />
          <KpiCard
            title="Profit"
            value={peso(today.profit)}
            trend={
              <TrendBadge current={today.profit} previous={yesterday.profit} />
            }
          />
        </div>
      </div>

      {/* ── This Month ── */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          {format(now, "MMMM yyyy")}
        </p>
        <div className="grid grid-cols-3 gap-4">
          <KpiCard title="Total Revenue" value={peso(monthTotal.revenue)} />
          <KpiCard title="Total Expenses" value={peso(monthTotal.expenses)} />
          <KpiCard title="Net Profit" value={peso(monthTotal.profit)} />
        </div>
      </div>

      {/* ── Peak & Slow Days ── */}
      <div className="grid grid-cols-2 gap-4">
        <DayCard
          title="Best Day This Month"
          icon={<ArrowUp className="size-4 text-primary" />}
          desc={`Highest profit recorded in ${format(now, "MMMM")}`}
          row={best}
        />
        <DayCard
          title="Slowest Day This Month"
          icon={<ArrowDown className="size-4 text-muted-foreground" />}
          desc={`Lowest profit recorded in ${format(now, "MMMM")}`}
          row={slow}
        />
      </div>
    </div>
  );
};

export default Dashboard;
