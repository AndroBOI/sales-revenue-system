import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { peso } from "@/lib/helpers";
import type { EntryRow } from "@/lib/api";

interface Props {
  rows: EntryRow[];
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

const EntriesTable = ({ rows, page, totalPages, onPrev, onNext }: Props) => (
  <Card>
    <CardContent className="p-0">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          No entries yet. Start by adding one in the Entry page.
        </p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {format(new Date(row.date + "T00:00:00"), "MMMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    {peso(row.revenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {peso(row.expenses)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {peso(row.profit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={onPrev}
                disabled={page === 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={onNext}
                disabled={page === totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </CardContent>
  </Card>
);

export default EntriesTable;
