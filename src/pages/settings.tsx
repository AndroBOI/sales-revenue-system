import { useEffect, useState } from "react";
import { format } from "date-fns";
import { PlusCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getFixedExpenses,
  addFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  type FixedExpense,
} from "@/lib/api";
import FixedExpensesTable from "@/components/settings/fixed-expense-table";
import FixedExpenseDialog, {
  type FixedExpenseForm,
} from "@/components/settings/fixed-expense-dialog";

const emptyForm = (): FixedExpenseForm => ({
  name:       "",
  category:   "",
  amount:     "",
  start_date: format(new Date(), "yyyy-MM-dd"),
  end_date:   "",
  notes:      "",
});

const SettingsPage = () => {
  const [fixed, setFixed]           = useState<FixedExpense[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [form, setForm]             = useState<FixedExpenseForm>(emptyForm());
  const [errors, setErrors]         = useState<Record<string, string>>({});

  const reload = () => getFixedExpenses().then(setFixed);

  useEffect(() => { reload(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (f: FixedExpense) => {
    setEditingId(f.id);
    setForm({
      name:       f.name,
      category:   f.category,
      amount:     String(f.amount),
      start_date: f.start_date,
      end_date:   f.end_date,
      notes:      f.notes ?? "",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const e: Record<string, string> = {};
    if (!form.name)                                                           e.name       = "Name is required";
    if (!form.category)                                                       e.category   = "Category is required";
    if (!form.amount || isNaN(parseFloat(form.amount)))                       e.amount     = "Valid amount required";
    if (!form.start_date)                                                     e.start_date = "Start date required";
    if (!form.end_date)                                                       e.end_date   = "End date required";
    if (form.start_date && form.end_date && form.start_date >= form.end_date) e.end_date   = "End date must be after start date";
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});

    const payload = {
      name:       form.name,
      category:   form.category,
      amount:     parseFloat(form.amount),
      start_date: form.start_date,
      end_date:   form.end_date,
      notes:      form.notes || null,
    };

    if (editingId !== null) {
      await updateFixedExpense({ id: editingId, ...payload });
    } else {
      await addFixedExpense(payload);
    }

    await reload();
    setDialogOpen(false);
    setForm(emptyForm());
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    await deleteFixedExpense(id);
    setFixed((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Fixed Expenses</CardTitle>
            <CardDescription>
              Duration expenses pro-rated across their date range in Analytics.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={openAdd}>
            <PlusCircle className="size-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <FixedExpensesTable fixed={fixed} onEdit={openEdit} onDelete={handleDelete} />
        </CardContent>
      </Card>

      <FixedExpenseDialog
        open={dialogOpen}
        editingId={editingId}
        form={form}
        errors={errors}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        onChange={setForm}
        onClear={(field) => setErrors((p) => ({ ...p, [field]: "" }))}
      />
    </div>
  );
};

export default SettingsPage;