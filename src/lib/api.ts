// ─── Types ────────────────────────────────────────────

export interface EntryRow {
  id: number;
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
  notes?: string;
}

export interface AnalyticsRow {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface SaveEntryPayload {
  date: string;
  revenue: number;
  notes: string;
  expenses: {
    category: string;
    amount: number;
    type: string;
    startDate: string | null;
    endDate: string | null;
    notes: string | null;
  }[];
}

export interface FixedExpense {
  id: number;
  name: string;
  category: string;
  amount: number;
  start_date: string;
  end_date: string;
  notes?: string;
}

// ─── Entries ──────────────────────────────────────────

export const getEntries = (): Promise<EntryRow[]> => window.api!.getEntries();
export const saveEntry = (
  data: SaveEntryPayload,
): Promise<{ success: boolean }> => window.api!.saveEntry(data);
export const deleteEntry = (date: string): Promise<{ success: boolean }> =>
  window.api!.deleteEntry(date);

// ─── Analytics ────────────────────────────────────────

export const getAnalytics = (): Promise<AnalyticsRow[]> =>
  window.api!.getAnalytics();

// ─── Fixed Expenses ───────────────────────────────────

export const getFixedExpenses = (): Promise<FixedExpense[]> =>
  window.api!.getFixedExpenses();
export const addFixedExpense = (
  data: Omit<FixedExpense, "id">,
): Promise<{ success: boolean }> => window.api!.addFixedExpense(data);
export const updateFixedExpense = (
  data: FixedExpense & { notes?: string | null },
): Promise<{ success: boolean }> => window.api!.updateFixedExpense(data);
export const deleteFixedExpense = (id: number): Promise<{ success: boolean }> =>
  window.api!.deleteFixedExpense(id);
