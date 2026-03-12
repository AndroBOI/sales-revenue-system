import { useState } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  PlusCircle,
  Trash2,
  Info,
  CheckCircle2,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// ─── Window API ───────────────────────────────────────
declare global {
  interface Window {
    api?: {
      saveEntry: (data: {
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
      }) => Promise<{ success: boolean }>;
    };
  }
}

// ─── Types ────────────────────────────────────────────
type ExpenseType = "everyday" | "one-time" | "duration";

interface Expense {
  id: number;
  category: string;
  amount: number;
  type: ExpenseType;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

// ─── Zod Schemas ─────────────────────────────────────
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
      .number({ invalid_type_error: "Amount is required" })
      .positive("Amount must be greater than 0"),
    type: z.enum(["everyday", "one-time", "duration"]),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "duration") {
      if (!data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start date is required",
          path: ["startDate"],
        });
      }
      if (!data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date is required",
          path: ["endDate"],
        });
      }
      if (data.startDate && data.endDate && data.startDate >= data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date must be after start date",
          path: ["endDate"],
        });
      }
    }
  });

type RevenueErrors = Partial<Record<"revenue", string>>;
type ExpenseErrors = Partial<Record<keyof Omit<Expense, "id">, string>>;

// ─── Constants ────────────────────────────────────────
const CATEGORIES = [
  "Supplies",
  "Rent",
  "Transport",
  "Utilities",
  "Labor",
  "Other",
];

const TYPE_LABELS: Record<ExpenseType, string> = {
  everyday: "Everyday",
  "one-time": "One-time",
  duration: "Duration",
};

const emptyForm = (): Omit<Expense, "id"> => ({
  category: "",
  amount: 0,
  type: "one-time",
  startDate: format(new Date(), "yyyy-MM-dd"),
  endDate: format(new Date(Date.now() + 30 * 86400000), "yyyy-MM-dd"),
  notes: "",
});

// ─── Component ────────────────────────────────────────
const Entry = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [calOpen, setCalOpen] = useState(false);
  const [revenue, setRevenue] = useState<string>("");
  const [revenueNotes, setRevenueNotes] = useState("");
  const [revenueErrors, setRevenueErrors] = useState<RevenueErrors>({});
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<Expense, "id">>(emptyForm());
  const [formErrors, setFormErrors] = useState<ExpenseErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ─── Calculations ─────────────────────────────────
  const rev = parseFloat(revenue) || 0;
  const dailyDeductions = expenses
    .filter((e) => e.type !== "duration")
    .reduce((s, e) => s + e.amount, 0);
  const durationTotal = expenses
    .filter((e) => e.type === "duration")
    .reduce((s, e) => s + e.amount, 0);
  const dailyProfit = rev - dailyDeductions;

  // ─── Save Entry ───────────────────────────────────
  const handleSaveEntry = async () => {
    const result = revenueSchema.safeParse({ revenue });
    if (!result.success) {
      const errors: RevenueErrors = {};
      result.error.errors.forEach((e) => {
        errors[e.path[0] as "revenue"] = e.message;
      });
      setRevenueErrors(errors);
      return;
    }
    setRevenueErrors({});

    try {
      setSaving(true);
      await window.api?.saveEntry({
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

  // ─── Expense Dialog ───────────────────────────────
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
      result.error.errors.forEach((e) => {
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

  // ─── Render ───────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto p-6 flex flex-col gap-6">
        {/* Header */}
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

        {/* Revenue Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">End-of-Day Revenue</CardTitle>
            <CardDescription>Enter total revenue earned today.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    ₱
                  </span>
                  <Input
                    type="number"
                    value={revenue}
                    onChange={(e) => {
                      setRevenue(e.target.value);
                      setRevenueErrors({});
                    }}
                    className={`pl-7 ${revenueErrors.revenue ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    placeholder="0.00"
                  />
                </div>
                <span className="text-sm text-muted-foreground">PHP</span>
              </div>
              {revenueErrors.revenue && (
                <p className="text-xs text-destructive">
                  {revenueErrors.revenue}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Notes (optional)
              </Label>
              <Textarea
                value={revenueNotes}
                onChange={(e) => setRevenueNotes(e.target.value)}
                placeholder="Any notes about today's revenue..."
                className="resize-none h-16 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Expenses</CardTitle>
              <CardDescription>
                Everyday and one-time expenses are deducted from daily profit.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={openAdd}
            >
              <PlusCircle className="size-4" />
              Add Expense
            </Button>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No expenses yet. Add one above.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((exp) => (
                    <TableRow
                      key={exp.id}
                      className={
                        exp.type === "duration"
                          ? "opacity-60 cursor-pointer"
                          : "cursor-pointer"
                      }
                      onClick={() => openEdit(exp)}
                    >
                      <TableCell className="font-medium">
                        {exp.category}
                      </TableCell>
                      <TableCell>₱{exp.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={
                              exp.type === "duration" ? "secondary" : "outline"
                            }
                          >
                            {TYPE_LABELS[exp.type]}
                          </Badge>
                          {exp.type === "duration" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="size-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  Not deducted from daily profit.
                                  <br />
                                  Applied in monthly analytics only.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {exp.type === "duration" && exp.startDate && exp.endDate
                          ? `${format(new Date(exp.startDate), "MMM d")} – ${format(new Date(exp.endDate), "MMM d")}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {exp.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteExpense(exp.id);
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Profit Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profit Summary</CardTitle>
            <CardDescription>
              Based on today's revenue minus everyday and one-time expenses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-medium">₱{rev.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily Expenses</span>
                <span className="font-medium">
                  − ₱{dailyDeductions.toLocaleString()}
                </span>
              </div>
              {durationTotal > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    Duration Expenses
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="size-3.5 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          Not deducted here. Applied in monthly analytics.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span className="text-muted-foreground">
                    ₱{durationTotal.toLocaleString()} (ref)
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Daily Profit</span>
                <span>₱{dailyProfit.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
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

        {/* Expense Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId !== null ? "Edit Expense" : "Add Expense"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => {
                    setForm((p) => ({ ...p, category: v }));
                    setFormErrors((p) => ({ ...p, category: undefined }));
                  }}
                >
                  <SelectTrigger
                    className={formErrors.category ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && (
                  <p className="text-xs text-destructive">
                    {formErrors.category}
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-1.5">
                <Label>Amount (PHP)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    ₱
                  </span>
                  <Input
                    type="number"
                    value={form.amount || ""}
                    onChange={(e) => {
                      setForm((p) => ({
                        ...p,
                        amount: parseFloat(e.target.value) || 0,
                      }));
                      setFormErrors((p) => ({ ...p, amount: undefined }));
                    }}
                    className={`pl-7 ${formErrors.amount ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    placeholder="0.00"
                  />
                </div>
                {formErrors.amount && (
                  <p className="text-xs text-destructive">
                    {formErrors.amount}
                  </p>
                )}
              </div>

              {/* Type */}
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => {
                    setForm((p) => ({ ...p, type: v as ExpenseType }));
                    setFormErrors({});
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyday">Everyday</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration dates */}
              {form.type === "duration" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, startDate: e.target.value }));
                        setFormErrors((p) => ({ ...p, startDate: undefined }));
                      }}
                      className={
                        formErrors.startDate ? "border-destructive" : ""
                      }
                    />
                    {formErrors.startDate && (
                      <p className="text-xs text-destructive">
                        {formErrors.startDate}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, endDate: e.target.value }));
                        setFormErrors((p) => ({ ...p, endDate: undefined }));
                      }}
                      className={formErrors.endDate ? "border-destructive" : ""}
                    />
                    {formErrors.endDate && (
                      <p className="text-xs text-destructive">
                        {formErrors.endDate}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <Label>
                  Notes{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  className="resize-none h-16 text-sm"
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveExpense}>
                {editingId !== null ? "Save Changes" : "Add Expense"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default Entry;
