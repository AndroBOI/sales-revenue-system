import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { peso } from "@/lib/helpers";
import { type FixedExpense } from "@/lib/api";

interface Props {
  fixed: FixedExpense[];
  onEdit: (f: FixedExpense) => void;
  onDelete: (id: number) => void;
}

const FixedExpensesTable = ({ fixed, onEdit, onDelete }: Props) => {
  if (fixed.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No fixed expenses yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Start</TableHead>
          <TableHead>End</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="w-8"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fixed.map((f) => (
          <TableRow
            key={f.id}
            className="cursor-pointer"
            onClick={() => onEdit(f)}
          >
            <TableCell className="font-medium">{f.name}</TableCell>
            <TableCell>{f.category}</TableCell>
            <TableCell className="text-right">{peso(f.amount)}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {format(new Date(f.start_date + "T00:00:00"), "MMM d, yyyy")}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {format(new Date(f.end_date + "T00:00:00"), "MMM d, yyyy")}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {f.notes || "—"}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(f.id);
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default FixedExpensesTable;
