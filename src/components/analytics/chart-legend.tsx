import { peso } from "@/lib/helpers";

const ChartTooltip = ({ active, payload, label, labelFormatter }: any) => {
  if (!active || !payload?.length) return null;
  const displayLabel = labelFormatter ? labelFormatter(label, payload) : label;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-md px-3 py-2 text-xs flex flex-col gap-1 min-w-[160px]">
      <span className="font-semibold text-foreground mb-1">{displayLabel}</span>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.dataKey}</span>
          </div>
          <span className="font-medium text-foreground">{peso(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default ChartTooltip;