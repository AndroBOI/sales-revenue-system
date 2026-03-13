import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Props {
  revenue:       string;
  revenueNotes:  string;
  revenueError?: string;
  onRevenueChange:      (v: string) => void;
  onRevenueNotesChange: (v: string) => void;
}

const RevenueCard = ({ revenue, revenueNotes, revenueError, onRevenueChange, onRevenueNotesChange }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">End-of-Day Revenue</CardTitle>
      <CardDescription>Enter total revenue earned today.</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
            <Input
              type="number"
              value={revenue}
              onChange={(e) => onRevenueChange(e.target.value)}
              className={`pl-7 ${revenueError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              placeholder="0.00"
            />
          </div>
          <span className="text-sm text-muted-foreground">PHP</span>
        </div>
        {revenueError && <p className="text-xs text-destructive">{revenueError}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
        <Textarea
          value={revenueNotes}
          onChange={(e) => onRevenueNotesChange(e.target.value)}
          placeholder="Any notes about today's revenue..."
          className="resize-none h-16 text-sm"
        />
      </div>
    </CardContent>
  </Card>
);

export default RevenueCard;