import { format } from "date-fns";
import { PlusCircle, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ExpenseType = "everyday" | "one-time" | "duration";

export interface Expense {
  id:        number;
  category:  string;
  amount:    number;
  type:      ExpenseType;
  startDate?: string;
  endDate?:   string;
  notes?:     string;
}

const TYPE_LABELS: Record<ExpenseType, string> = {
  everyday:   "Everyday",
  "one-time": "One-time",
  duration:   "Duration",
};

interface Props {
  expenses:    Expense[];
  onAdd:       () => void;
  onEdit:      (exp: Expense) => void;
  onDelete:    (id: number) => void;
}

const ExpensesTable = ({ expenses, onAdd, onEdit, onDelete }: Props) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <div>
        <CardTitle className="text-base">Expenses</CardTitle>
        <CardDescription>Everyday and one-time expenses are deducted from daily profit.</CardDescription>
      </div>
      <Button size="sm" variant="outline" className="gap-2" onClick={onAdd}>
        <PlusCircle className="size-4" />
        Add Expense
      </Button>
    </CardHeader>
    <CardContent>
      {expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No expenses yet. Add one above.</p>
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
                className={exp.type === "duration" ? "opacity-60 cursor-pointer" : "cursor-pointer"}
                onClick={() => onEdit(exp)}
              >
                <TableCell className="font-medium">{exp.category}</TableCell>
                <TableCell>₱{exp.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={exp.type === "duration" ? "secondary" : "outline"}>
                      {TYPE_LABELS[exp.type]}
                    </Badge>
                    {exp.type === "duration" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="size-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Not deducted from daily profit.<br />Applied in monthly analytics only.</p>
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
                <TableCell className="text-sm text-muted-foreground">{exp.notes || "—"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); onDelete(exp.id); }}
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
);

export default ExpensesTable;