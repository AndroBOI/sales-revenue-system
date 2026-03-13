import { Card, CardHeader, CardDescription, CardContent } from "../ui/card";

const KpiCard = ({
  title,
  value,
  trend,
}: {
  title: string;
  value: string;
  trend?: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="pb-1">
      <CardDescription>{title}</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-1">
      <span className="text-2xl font-bold tracking-tight">{value}</span>
      {trend}
    </CardContent>
  </Card>
);

export default KpiCard;
