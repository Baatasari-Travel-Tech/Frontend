"use client"

/**
 * DEMO-ONLY organizer shell — the redesigned dark sidebar (desktop) and bottom
 * tab bar (mobile) from the design screenshots. The real Sidebar/DashboardLayout
 * are untouched; this exists so organizer demos share one navigation frame.
 * The Baatasari logo is the current branding, kept as-is.
 */

import Image from "next/image"
import Link from "next/link"
import {
  BarChart3,
  CalendarDays,
  HandHeart,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  MoreHorizontal,
  Plus,
  Settings,
  Users,
  Wallet,
} from "lucide-react"

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/demo/organizer-dashboard" },
  { key: "create", label: "Create Event", icon: Plus, href: "#" },
  { key: "events", label: "Events", icon: CalendarDays, href: "#" },
  { key: "analytics", label: "Analytics", icon: BarChart3, href: "/demo/organizer-analytics" },
  { key: "talents", label: "Talents", icon: Users, href: "#" },
  { key: "venues", label: "Venues", icon: MapPin, href: "#" },
  { key: "sponsors", label: "Sponsors", icon: HandHeart, href: "#" },
  { key: "wallet", label: "Wallet", icon: Wallet, href: "#" },
]

const NAV_FOOTER = [
  { key: "settings", label: "Settings", icon: Settings },
  { key: "help", label: "Help", icon: HelpCircle },
]

const BOTTOM_TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/demo/organizer-dashboard" },
  { key: "events", label: "Events", icon: CalendarDays, href: "#" },
  { key: "create", label: "Create", icon: Plus, href: "#" },
  { key: "analytics", label: "Analytics", icon: BarChart3, href: "/demo/organizer-analytics" },
  { key: "more", label: "More", icon: MoreHorizontal, href: "#" },
]

export function DemoOrganizerShell({
  active,
  children,
}: {
  active: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#faf9f7] md:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-[#0b1020] text-white md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <Image src="/logo.png" alt="Baatasari" width={30} height={30} style={{ width: "auto", height: "auto" }} />
          <span className="text-lg font-semibold tracking-tight">Baatasari</span>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ key, label, icon: Icon, href }) => (
            <Link
              key={key}
              href={href}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                active === key
                  ? "bg-white/10 font-semibold text-(--gold)"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mb-4 space-y-1 border-t border-white/10 px-3 pt-4">
          {NAV_FOOTER.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </button>
          ))}
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-white/10 bg-[#0b1020] pb-[max(env(safe-area-inset-bottom),0.4rem)] pt-2 md:hidden">
        {BOTTOM_TABS.map(({ key, label, icon: Icon, href }) => (
          <Link
            key={key}
            href={href}
            className={`flex flex-col items-center gap-1 px-3 text-[11px] font-medium ${
              active === key ? "text-(--gold)" : "text-white/65"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 pb-24 sm:px-6 md:pb-10 lg:px-8">
        {children}
      </div>
    </div>
  )
}
