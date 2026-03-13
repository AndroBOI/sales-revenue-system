import { useEffect, useState } from "react";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarDays,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Types ────────────────────────────────────────────
interface EntryRow {
  id: number;
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
  notes?: string;
}

declare global {
  interface Window {
    api?: {
      getEntries: () => Promise<EntryRow[]>;
    };
  }
}

const peso = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`;

const pct = (current: number, previous: number) => {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

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

const KpiCard = ({
  title,
  value,
  trend,
}: {
  title: string;
  value: string;
  trend?: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="pb-1">
      <CardDescription>{title}</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-1">
      <span className="text-2xl font-bold tracking-tight">{value}</span>
      {trend}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [entries, setEntries] = useState<EntryRow[]>([]);

  useEffect(() => {
    window.api?.getEntries().then(setEntries);
  }, []);

  const byDate = Object.fromEntries(entries.map((e) => [e.date, e]));

  const getRow = (date: Date): EntryRow =>
    byDate[format(date, "yyyy-MM-dd")] ?? {
      id: 0,
      date: format(date, "yyyy-MM-dd"),
      revenue: 0,
      expenses: 0,
      profit: 0,
    };

  // ─── Today & Yesterday ───────────────────────────────
  const today = getRow(new Date());
  const yesterday = getRow(subDays(new Date(), 1));

  // ─── This Month ──────────────────────────────────────
  const now = new Date();
  const monthDays = eachDayOfInterval({
    start: startOfMonth(now),
    end: endOfMonth(now),
  });

  const monthRows = monthDays
    .map((d) => getRow(d))
    .filter((r) => r.revenue > 0); // only days with actual entries

  const monthTotal = monthRows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      expenses: acc.expenses + r.expenses,
      profit: acc.profit + r.profit,
    }),
    { revenue: 0, expenses: 0, profit: 0 },
  );

  // ─── Peak & Slow Days ────────────────────────────────
  const peakDay = monthRows.length
    ? monthRows.reduce(
        (best, r) => (r.profit > best.profit ? r : best),
        monthRows[0],
      )
    : null;

  const slowDay = monthRows.length
    ? monthRows.reduce(
        (worst, r) => (r.profit < worst.profit ? r : worst),
        monthRows[0],
      )
    : null;

  // ─── Recent Entries (latest 5) ───────────────────────
  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col gap-6">
      {/* Header */}
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

      {/* ── This Month Summary ── */}
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
        {/* Peak Day */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ArrowUp className="size-4 text-primary" />
              <CardTitle className="text-base">Best Day This Month</CardTitle>
            </div>
            <CardDescription>
              Highest profit recorded in {format(now, "MMMM")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {peakDay ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {format(
                      new Date(peakDay.date + "T00:00:00"),
                      "MMMM d, yyyy",
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="font-medium">{peso(peakDay.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expenses</span>
                    <span className="font-medium">
                      − {peso(peakDay.expenses)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Profit</span>
                    <span>{peso(peakDay.profit)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No entries this month yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Slow Day */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ArrowDown className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">
                Slowest Day This Month
              </CardTitle>
            </div>
            <CardDescription>
              Lowest profit recorded in {format(now, "MMMM")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {slowDay ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {format(
                      new Date(slowDay.date + "T00:00:00"),
                      "MMMM d, yyyy",
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="font-medium">{peso(slowDay.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expenses</span>
                    <span className="font-medium">
                      − {peso(slowDay.expenses)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Profit</span>
                    <span>{peso(slowDay.profit)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No entries this month yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Entries ── */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Recent Entries
        </p>
        <Card>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No entries yet. Start by adding one in the Entry page.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Expenses</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell className="font-medium">
                        {format(
                          new Date(row.date + "T00:00:00"),
                          "MMMM d, yyyy",
                        )}
                      </TableCell>
                      <TableCell>{peso(row.revenue)}</TableCell>
                      <TableCell>{peso(row.expenses)}</TableCell>
                      <TableCell className="font-semibold">
                        {peso(row.profit)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {row.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <button
          className="text-xs text-muted-foreground underline"
          onClick={async () => {
            const entries = await window.api?.debugGetDurationExpenses();
            console.log("Duration expenses:", entries);
          }}
        >
          Debug Duration
        </button>
        <button
          onClick={async () => {
            const result = await window.api?.fixDuration();
            console.log("Fixed:", result);
          }}
        >
          Fix Duration Data
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
