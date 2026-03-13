import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { pct } from "@/lib/helpers";

const TrendBadge = ({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) => {
  const diff = pct(current, previous);
  if (diff === null) return null;
  if (diff > 0)
    return (
      <Badge variant="outline" className="gap-1 w-fit">
        <TrendingUp className="size-3" />
        {diff.toFixed(1)}%
      </Badge>
    );
  if (diff < 0)
    return (
      <Badge variant="outline" className="gap-1 w-fit">
        <TrendingDown className="size-3" />
        {Math.abs(diff).toFixed(1)}%
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1 w-fit">
      <Minus className="size-3" />
      0%
    </Badge>
  );
};

export default TrendBadge;
