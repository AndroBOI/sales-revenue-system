import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  revenue:         number;
  dailyDeductions: number;
  durationTotal:   number;
  dailyProfit:     number;
}

const ProfitSummary = ({ revenue, dailyDeductions, durationTotal, dailyProfit }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Profit Summary</CardTitle>
      <CardDescription>Based on today's revenue minus everyday and one-time expenses.</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Revenue</span>
          <span className="font-medium">₱{revenue.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Daily Expenses</span>
          <span className="font-medium">− ₱{dailyDeductions.toLocaleString()}</span>
        </div>
        {durationTotal > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              Duration Expenses
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Not deducted here. Applied in monthly analytics.</p>
                </TooltipContent>
              </Tooltip>
            </span>
            <span className="text-muted-foreground">₱{durationTotal.toLocaleString()} (ref)</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between text-base font-semibold">
          <span>Daily Profit</span>
          <span>₱{dailyProfit.toLocaleString()}</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default ProfitSummary;