import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Separator } from "../ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import type { EntryRow } from "@/lib/api";

const peso = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`;


const DayCard = ({
  title,
  icon,
  desc,
  row,
}: {
  title: string;
  icon: React.ReactNode;
  desc: string;
  row: EntryRow | null;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2">
        {icon}
        <CardTitle className="text-base">{title}</CardTitle>
      </div>
      <CardDescription>{desc}</CardDescription>
    </CardHeader>
    <CardContent>
      {row ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {format(new Date(row.date + "T00:00:00"), "MMMM d, yyyy")}
            </span>
          </div>
          <Separator />
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Revenue</span>
              <span className="font-medium">{peso(row.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expenses</span>
              <span className="font-medium">− {peso(row.expenses)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Profit</span>
              <span>{peso(row.profit)}</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No entries this month yet.
        </p>
      )}
    </CardContent>
  </Card>
);

export default DayCard;
