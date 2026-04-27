import { useMemo } from "react"
import { CalendarDays, IndianRupee, Star, Users } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import type { EventDetail, OrganizerAnalytics } from "@/types/api"
import { STATS_DATA } from "./data/dashboard-data"
import { StatCard } from "./stat-card"

type StatsGridProps = {
  analytics?: OrganizerAnalytics | null
  events?: EventDetail[]
  isLoading?: boolean
}

const toSafeNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function StatsGrid({ analytics = null, events = [], isLoading = false }: StatsGridProps) {
  const metrics = useMemo(() => {
    const soldTickets = events.reduce(
      (eventTotal, event) =>
        eventTotal +
        (event.ticketTiers ?? []).reduce(
          (tierTotal, tier) => tierTotal + toSafeNumber(tier.soldCount),
          0
        ),
      0
    )

    const utilization =
      analytics?.totalCapacity && analytics.totalCapacity > 0
        ? (soldTickets / analytics.totalCapacity) * 100
        : 0

    const nextEventLabel = analytics?.nextEventDate
      ? new Date(analytics.nextEventDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "No upcoming event"

    return [
      {
        icon: Users,
        iconBgColor: "bg-orange-100",
        iconColor: "text-orange-600",
        value: soldTickets.toLocaleString("en-IN"),
        label: "Total Tickets Sold",
        context: `${toSafeNumber(analytics?.paidOrders)} paid orders`,
      },
      {
        icon: CalendarDays,
        iconBgColor: "bg-purple-100",
        iconColor: "text-purple-600",
        value: toSafeNumber(analytics?.totalEvents).toLocaleString("en-IN"),
        label: "Total Events",
        context: `Next event: ${nextEventLabel}`,
      },
      {
        icon: IndianRupee,
        iconBgColor: "bg-blue-100",
        iconColor: "text-blue-600",
        value: formatCurrency(toSafeNumber(analytics?.grossRevenue)),
        label: "Total Revenue",
        context: "From paid orders",
      },
      {
        icon: Star,
        iconBgColor: "bg-yellow-100",
        iconColor: "text-yellow-600",
        value: `${Math.round(utilization)}%`,
        label: "Capacity Utilization",
        context: `${toSafeNumber(analytics?.totalCapacity).toLocaleString("en-IN")} total capacity`,
      },
    ]
  }, [analytics, events])

  const fallbackStats = !analytics && events.length === 0

  return (
    <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
      {isLoading
        ? STATS_DATA.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              iconBgColor={stat.iconBgColor}
              iconColor={stat.iconColor}
              value="--"
              label={stat.label}
              context="Loading..."
            />
          ))
        : fallbackStats
          ? STATS_DATA.map((stat, index) => (
              <StatCard
                key={index}
                icon={stat.icon}
                iconBgColor={stat.iconBgColor}
                iconColor={stat.iconColor}
                value={stat.value}
                label={stat.label}
                trend={stat.trend}
              />
            ))
          : metrics.map((stat) => (
              <StatCard
                key={stat.label}
                icon={stat.icon}
                iconBgColor={stat.iconBgColor}
                iconColor={stat.iconColor}
                value={stat.value}
                label={stat.label}
                context={stat.context}
              />
            ))}
    </div>
  )
}
