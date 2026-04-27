import { Card, CardContent } from "@/components/ui/card"
import { ArrowUp, ArrowDown, type LucideIcon } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  iconBgColor: string
  iconColor: string
  value: string
  label: string
  trend?: {
    direction: "up" | "down"
    percentage: string
    comparisonText: string
  }
  context?: string
}

export function StatCard({
  icon: Icon,
  iconBgColor,
  iconColor,
  value,
  label,
  trend,
  context,
}: StatCardProps) {
  const TrendIcon = trend ? (trend.direction === "up" ? ArrowUp : ArrowDown) : null
  const trendColor = trend?.direction === "down" ? "text-destructive" : "text-primary"

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`${iconBgColor} p-3 rounded-lg shrink-0`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold text-foreground leading-tight">
              {value}
            </p>
            <p className="text-sm text-muted-foreground truncate">{label}</p>

            {trend && TrendIcon ? (
              <div className="flex items-center gap-1 mt-2 min-w-0">
                <TrendIcon className={`h-3 w-3 ${trendColor} shrink-0`} />
                <span className={`text-xs ${trendColor} font-medium shrink-0`}>
                  {trend.percentage}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {trend.comparisonText}
                </span>
              </div>
            ) : context ? (
              <p className="mt-2 text-xs text-muted-foreground">{context}</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
