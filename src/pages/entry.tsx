import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { saveEntry } from "@/lib/api";
import RevenueCard from "@/components/entry/revenue-card";
import ExpensesTable, { type Expense } from "@/components/entry/expenses-table";
import ProfitSummary from "@/components/entry/profit-summary";
import ExpenseDialog from "@/components/entry/expense-dialog";

type RevenueErrors = Partial<Record<"revenue", string>>;
type ExpenseErrors = Partial<Record<keyof Omit<Expense, "id">, string>>;

const revenueSchema = z.object({
  revenue: z
    .string()
    .min(1, "Revenue is required")
    .refine((v) => !isNaN(parseFloat(v)), "Must be a valid number")
    .refine((v) => parseFloat(v) > 0, "Revenue must be greater than 0"),
});

const expenseSchema = z
  .object({
    category: z.string().min(1, "Category is required"),
    amount: z
      .number({ message: "Amount is required" })
      .positive("Amount must be greater than 0"),
    type: z.enum(["everyday", "one-time", "duration"]),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "duration") {
      if (!data.startDate)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start date is required",
          path: ["startDate"],
        });
      if (!data.endDate)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date is required",
          path: ["endDate"],
        });
      if (data.startDate && data.endDate && data.startDate >= data.endDate)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date must be after start date",
          path: ["endDate"],
        });
    }
  });

const emptyForm = (): Omit<Expense, "id"> => ({
  category: "",
  amount: 0,
  type: "one-time",
  startDate: format(new Date(), "yyyy-MM-dd"),
  endDate: format(new Date(Date.now() + 30 * 86400000), "yyyy-MM-dd"),
  notes: "",
});

const Entry = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [calOpen, setCalOpen] = useState(false);
  const [revenue, setRevenue] = useState("");
  const [revenueNotes, setRevenueNotes] = useState("");
  const [revenueErrors, setRevenueErrors] = useState<RevenueErrors>({});
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<Expense, "id">>(emptyForm());
  const [formErrors, setFormErrors] = useState<ExpenseErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const rev = parseFloat(revenue) || 0;
  const dailyDeductions = expenses
    .filter((e) => e.type !== "duration")
    .reduce((s, e) => s + e.amount, 0);
  const durationTotal = expenses
    .filter((e) => e.type === "duration")
    .reduce((s, e) => s + e.amount, 0);
  const dailyProfit = rev - dailyDeductions;

  const handleSaveEntry = async () => {
    const result = revenueSchema.safeParse({ revenue });
    if (!result.success) {
      const errors: RevenueErrors = {};
      result.error.issues.forEach((e) => {
        errors[e.path[0] as "revenue"] = e.message;
      });
      setRevenueErrors(errors);
      return;
    }
    setRevenueErrors({});
    try {
      setSaving(true);
      await saveEntry({
        date: format(date, "yyyy-MM-dd"),
        revenue: parseFloat(revenue),
        notes: revenueNotes,
        expenses: expenses.map((e) => ({
          category: e.category,
          amount: e.amount,
          type: e.type,
          startDate: e.startDate ?? null,
          endDate: e.endDate ?? null,
          notes: e.notes ?? null,
        })),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("❌ Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setForm({
      category: exp.category,
      amount: exp.amount,
      type: exp.type,
      startDate: exp.startDate,
      endDate: exp.endDate,
      notes: exp.notes,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const saveExpense = () => {
    const result = expenseSchema.safeParse(form);
    if (!result.success) {
      const errors: ExpenseErrors = {};
      result.error.issues.forEach((e) => {
        errors[e.path[0] as keyof ExpenseErrors] = e.message;
      });
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    if (editingId !== null) {
      setExpenses((prev) =>
        prev.map((e) => (e.id === editingId ? { ...form, id: editingId } : e)),
      );
    } else {
      setExpenses((prev) => [...prev, { ...form, id: Date.now() }]);
    }
    setDialogOpen(false);
  };

  const deleteExpense = (id: number) =>
    setExpenses((prev) => prev.filter((e) => e.id !== id));

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Daily Entry</h1>
            <p className="text-muted-foreground text-sm">
              Record your end-of-day revenue and expenses.
            </p>
          </div>
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="size-4" />
                {format(date, "MMMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (d) {
                    setDate(d);
                    setCalOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Separator />

        <RevenueCard
          revenue={revenue}
          revenueNotes={revenueNotes}
          revenueError={revenueErrors.revenue}
          onRevenueChange={(v) => {
            setRevenue(v);
            setRevenueErrors({});
          }}
          onRevenueNotesChange={setRevenueNotes}
        />

        <ExpensesTable
          expenses={expenses}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={deleteExpense}
        />

        <ProfitSummary
          revenue={rev}
          dailyDeductions={dailyDeductions}
          durationTotal={durationTotal}
          dailyProfit={dailyProfit}
        />

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 className="size-4" />
              Entry saved
            </span>
          )}
          <Button
            size="lg"
            className="px-10"
            onClick={handleSaveEntry}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Entry"}
          </Button>
        </div>

        <ExpenseDialog
          open={dialogOpen}
          editingId={editingId}
          form={form}
          formErrors={formErrors}
          onClose={() => setDialogOpen(false)}
          onSave={saveExpense}
          onFormChange={setForm}
          onErrorClear={(field) =>
            setFormErrors((p) => ({ ...p, [field]: undefined }))
          }
        />
      </div>
    </TooltipProvider>
  );
};

export default Entry;
