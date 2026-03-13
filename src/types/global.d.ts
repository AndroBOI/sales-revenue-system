import type {
  EntryRow,
  AnalyticsRow,
  Settings,
  SaveEntryPayload,
} from "@/lib/api";

export {};

interface FixedExpense {
  id: number;
  name: string;
  category: string;
  amount: number;
  start_date: string;
  end_date: string;
  notes?: string;
}

declare global {
  interface Window {
    api?: {
      getEntries: () => Promise<EntryRow[]>;
      saveEntry: (data: SaveEntryPayload) => Promise<{ success: boolean }>;
      deleteEntry: (date: string) => Promise<{ success: boolean }>;
      getAnalytics: () => Promise<AnalyticsRow[]>;
      getSettings: () => Promise<Settings>;
      saveSettings: (
        data: Omit<Settings, "id">,
      ) => Promise<{ success: boolean }>;
      getFixedExpenses: () => Promise<FixedExpense[]>;
      addFixedExpense: (
        data: Omit<FixedExpense, "id">,
      ) => Promise<{ success: boolean }>;
      deleteFixedExpense: (id: number) => Promise<{ success: boolean }>;
    };
  }
}
