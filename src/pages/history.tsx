import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { getEntries, type EntryRow } from "@/lib/api";
import EntriesTable from "@/components/history/entries-table";

const PAGE_SIZE = 15;

const History = () => {
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getEntries().then(setRows);
  }, []);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginated = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-5xl mx-auto p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground text-sm">
          All recorded entries — {rows.length} total
        </p>
      </div>

      <Separator />

      <EntriesTable
        rows={paginated}
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => p - 1)}
        onNext={() => setPage((p) => p + 1)}
      />
    </div>
  );
};

export default History;
