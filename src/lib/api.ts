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

export interface Settings {
  id: number;
  business_name: string;
  currency: string;
  corporate_tax: number;
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

// ─── Entries ──────────────────────────────────────────

export const getEntries = (): Promise<EntryRow[]> => window.api!.getEntries();

export const saveEntry = (
  data: SaveEntryPayload,
): Promise<{ success: boolean }> => window.api!.saveEntry(data);

export const deleteEntry = (date: string): Promise<{ success: boolean }> =>
  window.api!.deleteEntry(date);

// ─── Analytics ───────────────────────────────────────

export const getAnalytics = (): Promise<AnalyticsRow[]> =>
  window.api!.getAnalytics();

// ─── Settings ────────────────────────────────────────

export const getSettings = (): Promise<Settings> => window.api!.getSettings();

export const saveSettings = (
  data: Omit<Settings, "id">,
): Promise<{ success: boolean }> => window.api!.saveSettings(data);
