import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Trash2, PlusCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { getSettings, saveSettings, type Settings } from "@/lib/api";

// ─── Types ────────────────────────────────────────────
interface FixedExpense {
  id: number;
  name: string;
  category: string;
  amount: number;
  start_date: string;
  end_date: string;
  notes?: string;
}

const peso = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`;

const emptyExpense = () => ({
  name: "",
  category: "",
  amount: "",
  start_date: format(new Date(), "yyyy-MM-dd"),
  end_date: "",
  notes: "",
});

// ─── Component ────────────────────────────────────────
const SettingsPage = () => {
  // ─── Business settings ──────────────────────────────
  const [settings, setSettings] = useState<Settings | null>(null);
  const [bizName, setBizName] = useState("");
  const [currency, setCurrency] = useState("PHP");
  const [bizSaved, setBizSaved] = useState(false);

  // ─── Fixed expenses ──────────────────────────────────
  const [fixed, setFixed] = useState<FixedExpense[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyExpense());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setBizName(s.business_name);
      setCurrency(s.currency);
    });

    // Load fixed expenses directly via window.api
    window.api!.getFixedExpenses().then(setFixed);
  }, []);

  // ─── Save business info ───────────────────────────────
  const handleSaveBiz = async () => {
    await saveSettings({
      business_name: bizName,
      currency,
      corporate_tax: settings?.corporate_tax ?? 0.25,
    });
    setBizSaved(true);
    setTimeout(() => setBizSaved(false), 3000);
  };

  // ─── Add fixed expense ────────────────────────────────
  const handleAddFixed = async () => {
    const errors: Record<string, string> = {};
    if (!form.name) errors.name = "Name is required";
    if (!form.category) errors.category = "Category is required";
    if (!form.amount || isNaN(parseFloat(form.amount)))
      errors.amount = "Valid amount required";
    if (!form.start_date) errors.start_date = "Start date required";
    if (!form.end_date) errors.end_date = "End date required";
    if (form.start_date && form.end_date && form.start_date >= form.end_date)
      errors.end_date = "End date must be after start date";

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    await window.api!.addFixedExpense({
      name: form.name,
      category: form.category,
      amount: parseFloat(form.amount),
      start_date: form.start_date,
      end_date: form.end_date,
      notes: form.notes || null,
    });

    window.api!.getFixedExpenses().then(setFixed);
    setDialogOpen(false);
    setForm(emptyExpense());
  };

  // ─── Delete fixed expense ─────────────────────────────
  const handleDelete = async (id: number) => {
    await window.api!.deleteFixedExpense(id);
    setFixed((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your business info and fixed expenses.
        </p>
      </div>

      <Separator />

      {/* ── Business Info ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Info</CardTitle>
          <CardDescription>Displayed across the app.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Business Name</Label>
            <Input
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
              placeholder="My Business"
              className="max-w-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Currency</Label>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="PHP"
              className="max-w-xs"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSaveBiz}>Save</Button>
            {bizSaved && <span className="text-sm text-green-600">Saved!</span>}
          </div>
        </CardContent>
      </Card>

      {/* ── Fixed Expenses ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Fixed Expenses</CardTitle>
            <CardDescription>
              Duration expenses pro-rated across their date range in Analytics.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => {
              setForm(emptyExpense());
              setFormErrors({});
              setDialogOpen(true);
            }}
          >
            <PlusCircle className="size-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {fixed.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No fixed expenses yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fixed.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell>{f.category}</TableCell>
                    <TableCell className="text-right">
                      {peso(f.amount)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(
                        new Date(f.start_date + "T00:00:00"),
                        "MMM d, yyyy",
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(
                        new Date(f.end_date + "T00:00:00"),
                        "MMM d, yyyy",
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(f.id)}
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

      {/* ── Add Fixed Expense Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Fixed Expense</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  setForm((p) => ({ ...p, name: e.target.value }));
                  setFormErrors((p) => ({ ...p, name: "" }));
                }}
                placeholder="e.g. Monthly Rent"
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && (
                <p className="text-xs text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(e) => {
                  setForm((p) => ({ ...p, category: e.target.value }));
                  setFormErrors((p) => ({ ...p, category: "" }));
                }}
                placeholder="e.g. Rent"
                className={formErrors.category ? "border-destructive" : ""}
              />
              {formErrors.category && (
                <p className="text-xs text-destructive">
                  {formErrors.category}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Amount (PHP)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  ₱
                </span>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, amount: e.target.value }));
                    setFormErrors((p) => ({ ...p, amount: "" }));
                  }}
                  className={`pl-7 ${formErrors.amount ? "border-destructive" : ""}`}
                  placeholder="0.00"
                />
              </div>
              {formErrors.amount && (
                <p className="text-xs text-destructive">{formErrors.amount}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, start_date: e.target.value }));
                    setFormErrors((p) => ({ ...p, start_date: "" }));
                  }}
                  className={formErrors.start_date ? "border-destructive" : ""}
                />
                {formErrors.start_date && (
                  <p className="text-xs text-destructive">
                    {formErrors.start_date}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, end_date: e.target.value }));
                    setFormErrors((p) => ({ ...p, end_date: "" }));
                  }}
                  className={formErrors.end_date ? "border-destructive" : ""}
                />
                {formErrors.end_date && (
                  <p className="text-xs text-destructive">
                    {formErrors.end_date}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Notes <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFixed}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
