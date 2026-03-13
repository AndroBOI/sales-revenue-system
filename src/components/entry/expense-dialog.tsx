import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Expense } from "./expenses-table";

type ExpenseType = "everyday" | "one-time" | "duration";
type ExpenseErrors = Partial<Record<keyof Omit<Expense, "id">, string>>;

const CATEGORIES = ["Supplies", "Rent", "Transport", "Utilities", "Labor", "Other"];

interface Props {
  open:        boolean;
  editingId:   number | null;
  form:        Omit<Expense, "id">;
  formErrors:  ExpenseErrors;
  onClose:     () => void;
  onSave:      () => void;
  onFormChange:(updated: Omit<Expense, "id">) => void;
  onErrorClear:(field: keyof ExpenseErrors) => void;
}

const ExpenseDialog = ({ open, editingId, form, formErrors, onClose, onSave, onFormChange, onErrorClear }: Props) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{editingId !== null ? "Edit Expense" : "Add Expense"}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-2">

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Select
            value={form.category}
            onValueChange={(v) => { onFormChange({ ...form, category: v }); onErrorClear("category"); }}
          >
            <SelectTrigger className={formErrors.category ? "border-destructive" : ""}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {formErrors.category && <p className="text-xs text-destructive">{formErrors.category}</p>}
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <Label>Amount (PHP)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
            <Input
              type="number"
              value={form.amount || ""}
              onChange={(e) => { onFormChange({ ...form, amount: parseFloat(e.target.value) || 0 }); onErrorClear("amount"); }}
              className={`pl-7 ${formErrors.amount ? "border-destructive focus-visible:ring-destructive" : ""}`}
              placeholder="0.00"
            />
          </div>
          {formErrors.amount && <p className="text-xs text-destructive">{formErrors.amount}</p>}
        </div>

        {/* Type */}
        <div className="flex flex-col gap-1.5">
          <Label>Type</Label>
          <Select
            value={form.type}
            onValueChange={(v) => { onFormChange({ ...form, type: v as ExpenseType }); onErrorClear("type"); }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
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
                onChange={(e) => { onFormChange({ ...form, startDate: e.target.value }); onErrorClear("startDate"); }}
                className={formErrors.startDate ? "border-destructive" : ""}
              />
              {formErrors.startDate && <p className="text-xs text-destructive">{formErrors.startDate}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>End Date</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => { onFormChange({ ...form, endDate: e.target.value }); onErrorClear("endDate"); }}
                className={formErrors.endDate ? "border-destructive" : ""}
              />
              {formErrors.endDate && <p className="text-xs text-destructive">{formErrors.endDate}</p>}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
          <Textarea
            value={form.notes}
            onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
            className="resize-none h-16 text-sm"
            placeholder="Optional notes..."
          />
        </div>

      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onSave}>{editingId !== null ? "Save Changes" : "Add Expense"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ExpenseDialog;