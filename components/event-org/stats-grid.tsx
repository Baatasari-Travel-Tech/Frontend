import { StatCard } from "./stat-card"
import { STATS_DATA } from "./data/dashboard-data"

export function StatsGrid() {
  return (
    <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
      {STATS_DATA.map((stat, index) => (
        <StatCard
          key={index}
          icon={stat.icon}
          iconBgColor={stat.iconBgColor}
          iconColor={stat.iconColor}
          value={stat.value}
          label={stat.label}
          trend={stat.trend}
        />
      ))}
    </div>
  )
}
