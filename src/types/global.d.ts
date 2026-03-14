import type {
  EntryRow,
  AnalyticsRow,
  SaveEntryPayload,
  FixedExpense,
} from "@/lib/api";

export {};

declare global {
  interface Window {
    api?: {
      generatePdf: (
        html: string,
        filename: string,
      ) => Promise<{ success: boolean; filePath: string }>;
      getEntries: () => Promise<EntryRow[]>;
      saveEntry: (data: SaveEntryPayload) => Promise<{ success: boolean }>;
      deleteEntry: (date: string) => Promise<{ success: boolean }>;
      getAnalytics: () => Promise<AnalyticsRow[]>;
      getFixedExpenses: () => Promise<FixedExpense[]>;
      addFixedExpense: (
        data: Omit<FixedExpense, "id">,
      ) => Promise<{ success: boolean }>;
      updateFixedExpense: (
        data: FixedExpense & { notes?: string | null },
      ) => Promise<{ success: boolean }>;
      deleteFixedExpense: (id: number) => Promise<{ success: boolean }>;
    };
  }
}
