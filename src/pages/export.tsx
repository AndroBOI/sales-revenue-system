import { useEffect, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  eachDayOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import { FileDown, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  getAnalytics,
  getFixedExpenses,
  type AnalyticsRow,
  type FixedExpense,
} from "@/lib/api";
import { buildAnalyticsMap, getAnalyticsRow, sumRange } from "@/lib/helpers";

const CORPORATE_TAX_RATE = 0.25;
const BUSINESS_NAME = "My Business";

const peso = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`;


const baseStyles = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 32px; }
    h1 { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
    h2 { font-size: 14px; font-weight: bold; margin: 24px 0 8px; }
    p.sub { font-size: 11px; color: #555; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f3f4f6; text-align: left; padding: 6px 8px; font-size: 11px; border-bottom: 1px solid #e5e7eb; }
    td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; font-size: 11px; }
    td.right, th.right { text-align: right; }
    .totals td { font-weight: bold; background: #f9fafb; border-top: 2px solid #e5e7eb; }
    .tax-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-top: 8px; }
    .tax-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
    .tax-row.total { font-weight: bold; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 8px; padding-top: 8px; }
    .footer { margin-top: 32px; font-size: 10px; color: #999; text-align: center; }
  </style>
`;

const buildMonthlyHtml = (
  monthRef: Date,
  fixed: FixedExpense[],
  byDate: Record<string, AnalyticsRow>,
): string => {
  const days = eachDayOfInterval({
    start: startOfMonth(monthRef),
    end: endOfMonth(monthRef),
  });
  const total = sumRange(byDate, days);
  const monthLabel = format(monthRef, "MMMM yyyy");

  const activeFixed = fixed.filter((f) => {
    const s = new Date(f.start_date + "T00:00:00");
    const e = new Date(f.end_date + "T00:00:00");
    return s <= endOfMonth(monthRef) && e >= startOfMonth(monthRef);
  });

  const dailyRows = days
    .map((d) => {
      const r = getAnalyticsRow(byDate, d);
      if (r.revenue === 0 && r.expenses === 0) return "";
      return `
      <tr>
        <td>${format(d, "MMM d, yyyy")}</td>
        <td class="right">${peso(r.revenue)}</td>
        <td class="right">${peso(r.expenses)}</td>
        <td class="right">${peso(r.profit)}</td>
      </tr>`;
    })
    .join("");

  const fixedRows = activeFixed
    .map(
      (f) => `
    <tr>
      <td>${f.name}</td>
      <td>${f.category}</td>
      <td class="right">${peso(f.amount)}</td>
      <td>${format(new Date(f.start_date + "T00:00:00"), "MMM d, yyyy")}</td>
      <td>${format(new Date(f.end_date + "T00:00:00"), "MMM d, yyyy")}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${baseStyles}</head><body>
    <h1>${BUSINESS_NAME}</h1>
    <p class="sub">Monthly Report — ${monthLabel}</p>
    <h2>Daily Entries</h2>
    <table>
      <thead><tr>
        <th>Date</th><th class="right">Revenue</th><th class="right">Expenses</th><th class="right">Profit</th>
      </tr></thead>
      <tbody>
        ${dailyRows || '<tr><td colspan="4" style="text-align:center;color:#999;padding:16px;">No entries this month</td></tr>'}
        <tr class="totals">
          <td>Total</td>
          <td class="right">${peso(total.revenue)}</td>
          <td class="right">${peso(total.expenses)}</td>
          <td class="right">${peso(total.profit)}</td>
        </tr>
      </tbody>
    </table>
    ${
      activeFixed.length
        ? `
      <h2>Fixed Expenses (active this month)</h2>
      <table>
        <thead><tr>
          <th>Name</th><th>Category</th><th class="right">Amount</th><th>Start</th><th>End</th>
        </tr></thead>
        <tbody>${fixedRows}</tbody>
      </table>`
        : ""
    }
    <div class="footer">Generated ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</div>
  </body></html>`;
};

const buildYearlyHtml = (
  yearRef: Date,
  byDate: Record<string, AnalyticsRow>,
): string => {
  const months = eachMonthOfInterval({
    start: startOfYear(yearRef),
    end: endOfYear(yearRef),
  });
  const yearLabel = format(yearRef, "yyyy");

  const monthlyData = months.map((m) => {
    const days = eachDayOfInterval({
      start: startOfMonth(m),
      end: endOfMonth(m),
    });
    const s = sumRange(byDate, days);
    return { label: format(m, "MMMM"), ...s };
  });

  const yearTotal = monthlyData.reduce(
    (a, m) => ({
      revenue: a.revenue + m.revenue,
      expenses: a.expenses + m.expenses,
      profit: a.profit + m.profit,
    }),
    { revenue: 0, expenses: 0, profit: 0 },
  );

  const corpTax = yearTotal.profit * CORPORATE_TAX_RATE;
  const realEarnings = yearTotal.profit - corpTax;

  const monthRows = monthlyData
    .map(
      (m) => `
    <tr>
      <td>${m.label}</td>
      <td class="right">${peso(m.revenue)}</td>
      <td class="right">${peso(m.expenses)}</td>
      <td class="right">${peso(m.profit)}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${baseStyles}</head><body>
    <h1>${BUSINESS_NAME}</h1>
    <p class="sub">Yearly Report — ${yearLabel}</p>
    <h2>Monthly Breakdown</h2>
    <table>
      <thead><tr>
        <th>Month</th><th class="right">Revenue</th><th class="right">Expenses</th><th class="right">Profit</th>
      </tr></thead>
      <tbody>
        ${monthRows}
        <tr class="totals">
          <td>Total</td>
          <td class="right">${peso(yearTotal.revenue)}</td>
          <td class="right">${peso(yearTotal.expenses)}</td>
          <td class="right">${peso(yearTotal.profit)}</td>
        </tr>
      </tbody>
    </table>
    <h2>Corporate Tax Summary</h2>
    <div class="tax-box">
      <div class="tax-row"><span>Net Profit</span><span>${peso(yearTotal.profit)}</span></div>
      <div class="tax-row"><span>Corporate Tax (25%)</span><span>− ${peso(corpTax)}</span></div>
      <div class="tax-row total"><span>Estimated Real Earnings</span><span>${peso(realEarnings)}</span></div>
    </div>
    <div class="footer">Generated ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</div>
  </body></html>`;
};


const ExportPage = () => {
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [fixed, setFixed] = useState<FixedExpense[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [yearOffset, setYearOffset] = useState(0);
  const [loadingM, setLoadingM] = useState(false);
  const [loadingY, setLoadingY] = useState(false);
  const [doneM, setDoneM] = useState(false);
  const [doneY, setDoneY] = useState(false);

  useEffect(() => {
    getAnalytics().then(setRows);
    getFixedExpenses().then(setFixed);
  }, []);

  const byDate = buildAnalyticsMap(rows);
  const monthRef = subMonths(new Date(), monthOffset);
  const yearRef = subYears(new Date(), yearOffset);

  const allDates = rows.map((r) => new Date(r.date));
  const minYear = allDates.length
    ? new Date(Math.min(...allDates.map((d) => d.getTime()))).getFullYear()
    : new Date().getFullYear();
  const minMonth = allDates.length
    ? new Date(Math.min(...allDates.map((d) => d.getTime())))
    : new Date();

  const canGoBackMonth =
    subMonths(new Date(), monthOffset + 1) >=
    new Date(minMonth.getFullYear(), minMonth.getMonth(), 1);
  const canGoForwardMonth = monthOffset > 0;
  const canGoBackYear = new Date().getFullYear() - yearOffset - 1 >= minYear;
  const canGoForwardYear = yearOffset > 0;

  const flash = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 3000);
  };

  const exportMonthly = async () => {
    setLoadingM(true);
    const html = buildMonthlyHtml(monthRef, fixed, byDate);
    const filename = `monthly-report-${format(monthRef, "yyyy-MM")}.pdf`;
    await window.api!.generatePdf(html, filename);
    setLoadingM(false);
    flash(setDoneM);
  };

  const exportYearly = async () => {
    setLoadingY(true);
    const html = buildYearlyHtml(yearRef, byDate);
    const filename = `yearly-report-${format(yearRef, "yyyy")}.pdf`;
    await window.api!.generatePdf(html, filename);
    setLoadingY(false);
    flash(setDoneY);
  };
  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Export</h1>
        <p className="text-muted-foreground text-sm">
          Download reports as PDF.
        </p>
      </div>

      <Separator />


      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Report</CardTitle>
          <CardDescription>
            Daily entries table + fixed expenses for the month.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setMonthOffset((p) => p + 1)}
              disabled={!canGoBackMonth}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium w-32 text-center">
              {format(monthRef, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setMonthOffset((p) => p - 1)}
              disabled={!canGoForwardMonth}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button onClick={exportMonthly} disabled={loadingM} className="gap-2">
            {loadingM ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            {doneM
              ? "Saved to Downloads!"
              : loadingM
                ? "Generating..."
                : "Download PDF"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yearly Report</CardTitle>
          <CardDescription>
            Monthly breakdown + corporate tax summary.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setYearOffset((p) => p + 1)}
              disabled={!canGoBackYear}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium w-16 text-center">
              {format(yearRef, "yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setYearOffset((p) => p - 1)}
              disabled={!canGoForwardYear}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button onClick={exportYearly} disabled={loadingY} className="gap-2">
            {loadingY ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            {doneY
              ? "Saved to Downloads!"
              : loadingY
                ? "Generating..."
                : "Download PDF"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportPage;
