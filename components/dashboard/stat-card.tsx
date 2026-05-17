import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "shadow-sm transition-all hover:-translate-y-0.5",
        className,
      )}
    >
      {/* Header của thẻ chỉ số gồm tiêu đề và icon */}
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={cn(
            "rounded-2xl p-2",
            iconClassName || "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>

      {/* Nội dung chính hiển thị số liệu */}
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>

        {/* Mô tả thêm và xu hướng thay đổi */}
        {(description || trend) && (
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
            {trend && (
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-xs font-semibold",
                  trend.isPositive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            )}
            {description && (
              <span className="text-xs text-muted-foreground">
                {description}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
