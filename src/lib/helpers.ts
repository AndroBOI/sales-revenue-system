import { format } from "date-fns";
import type { EntryRow, AnalyticsRow } from "@/lib/api";


export const peso = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`;


export const pct = (current: number, previous: number): number | null => {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

export const toLocalDateStr = (date: Date): string =>
  format(date, "yyyy-MM-dd");

export const safeDate = (dateStr: string): Date =>
  new Date(dateStr + "T00:00:00");


export const buildDateMap = (rows: EntryRow[]): Record<string, EntryRow> =>
  Object.fromEntries(rows.map((r) => [r.date, r]));

export const getEntryRow = (
  byDate: Record<string, EntryRow>,
  date: Date,
): EntryRow =>
  byDate[toLocalDateStr(date)] ?? {
    id:       0,
    date:     toLocalDateStr(date),
    revenue:  0,
    expenses: 0,
    profit:   0,
  };

export const buildAnalyticsMap = (rows: AnalyticsRow[]): Record<string, AnalyticsRow> =>
  Object.fromEntries(rows.map((r) => [r.date, r]));

export const getAnalyticsRow = (
  byDate: Record<string, AnalyticsRow>,
  date: Date,
): AnalyticsRow =>
  byDate[toLocalDateStr(date)] ?? {
    date:     toLocalDateStr(date),
    revenue:  0,
    expenses: 0,
    profit:   0,
  };


export const sumRange = (
  byDate: Record<string, AnalyticsRow>,
  dates: Date[],
): { revenue: number; expenses: number; profit: number } =>
  dates.reduce(
    (acc, d) => {
      const r = getAnalyticsRow(byDate, d);
      return {
        revenue:  acc.revenue  + r.revenue,
        expenses: acc.expenses + r.expenses,
        profit:   acc.profit   + r.profit,
      };
    },
    { revenue: 0, expenses: 0, profit: 0 },
  );


export const peakDay = (rows: EntryRow[]): EntryRow | null =>
  rows.length ? rows.reduce((best, r) => (r.profit > best.profit ? r : best), rows[0]) : null;

export const slowDay = (rows: EntryRow[]): EntryRow | null =>
  rows.length ? rows.reduce((worst, r) => (r.profit < worst.profit ? r : worst), rows[0]) : null;