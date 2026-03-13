import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export interface FixedExpenseForm {
  name: string;
  category: string;
  amount: string;
  start_date: string;
  end_date: string;
  notes: string;
}

interface Props {
  open: boolean;
  editingId: number | null;
  form: FixedExpenseForm;
  errors: Record<string, string>;
  onClose: () => void;
  onSave: () => void;
  onChange: (form: FixedExpenseForm) => void;
  onClear: (field: string) => void;
}

const FixedExpenseDialog = ({
  open,
  editingId,
  form,
  errors,
  onClose,
  onSave,
  onChange,
  onClear,
}: Props) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {editingId !== null ? "Edit Fixed Expense" : "Add Fixed Expense"}
        </DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(e) => {
              onChange({ ...form, name: e.target.value });
              onClear("name");
            }}
            placeholder="e.g. Monthly Rent"
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Input
            value={form.category}
            onChange={(e) => {
              onChange({ ...form, category: e.target.value });
              onClear("category");
            }}
            placeholder="e.g. Rent"
            className={errors.category ? "border-destructive" : ""}
          />
          {errors.category && (
            <p className="text-xs text-destructive">{errors.category}</p>
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
                onChange({ ...form, amount: e.target.value });
                onClear("amount");
              }}
              className={`pl-7 ${errors.amount ? "border-destructive" : ""}`}
              placeholder="0.00"
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-destructive">{errors.amount}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(e) => {
                onChange({ ...form, start_date: e.target.value });
                onClear("start_date");
              }}
              className={errors.start_date ? "border-destructive" : ""}
            />
            {errors.start_date && (
              <p className="text-xs text-destructive">{errors.start_date}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>End Date</Label>
            <Input
              type="date"
              value={form.end_date}
              onChange={(e) => {
                onChange({ ...form, end_date: e.target.value });
                onClear("end_date");
              }}
              className={errors.end_date ? "border-destructive" : ""}
            />
            {errors.end_date && (
              <p className="text-xs text-destructive">{errors.end_date}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>
            Notes <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            value={form.notes}
            onChange={(e) => onChange({ ...form, notes: e.target.value })}
            placeholder="Optional notes..."
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onSave}>{editingId !== null ? "Save" : "Add"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default FixedExpenseDialog;
