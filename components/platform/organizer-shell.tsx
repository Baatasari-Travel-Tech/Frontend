"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Building2, CalendarPlus2, ClipboardList, PanelRightClose, UserCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const organizerNav = [
  { href: "/organizer/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/organizer/dashboard", label: "Dashboard", icon: Building2 },
  { href: "/organizer/create-event", label: "Create Event", icon: CalendarPlus2 },
  { href: "/organizer/manage-events", label: "Manage Events", icon: ClipboardList },
  { href: "/organizer/profile", label: "Profile", icon: UserCircle2 },
]

export function OrganizerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="page-x grid min-h-[calc(100dvh-96px)] gap-6 py-6 lg:grid-cols-[280px_1fr]">
      <aside className="self-start rounded-[2rem] border border-slate-200 bg-background p-5 shadow-[0_20px_60px_rgba(12,29,55,0.05)] lg:sticky lg:top-28">
        <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,_rgba(12,29,55,0.96),_rgba(59,95,143,0.86))] p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Organizer space</p>
          <h2 className="mt-3 font-bricolage text-3xl">Operate events with clarity.</h2>
        </div>
        <nav className="mt-5 grid gap-2">
          {organizerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[1.25rem] px-4 py-3 text-sm font-medium transition",
                pathname === item.href
                  ? "bg-brand-900 text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/events"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <PanelRightClose className="h-4 w-4" />
          Switch to user screens
        </Link>
      </aside>
      <div>{children}</div>
    </div>
  )
}
