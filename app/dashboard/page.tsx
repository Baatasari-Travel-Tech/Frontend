"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard, StatGrid } from "@/components/platform/page-shell"
import { SkeletonGrid, StateBlock } from "@/components/platform/state-block"
import { apiRequest } from "@/lib/api/client"
import { useAuth } from "@/app/providers"

type DashboardResponse = {
  user: {
    onboardingStatus: string
    role: string
  }
  stats: {
    onboardingStatus: string
    organizerEvents: number
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const dashboardQuery = useQuery({
    queryKey: ["user-dashboard"],
    queryFn: async () => {
      const response = await apiRequest<{ data: DashboardResponse }>("/user/dashboard", { auth: true })
      return response.data
    },
  })

  return (
    <ProtectedRoute>
      <PageShell
        eyebrow="User workspace"
        title="Your dashboard"
        description="A backend-sourced overview of your account state, ticketing journey, and next useful actions."
      >
        {dashboardQuery.isLoading ? (
          <SkeletonGrid />
        ) : dashboardQuery.isError ? (
          <StateBlock
            tone="error"
            title="Dashboard data isn’t available"
            description="We couldn’t load your current account summary from the API."
          />
        ) : (
          <>
            <StatGrid
              items={[
                {
                  label: "Role",
                  value: user?.role ?? "-",
                  hint: "Primary backend role on your account.",
                },
                {
                  label: "Onboarding",
                  value: dashboardQuery.data?.stats.onboardingStatus ?? "-",
                  hint: "Protected routes depend on this status.",
                },
                {
                  label: "Organizer events",
                  value: String(dashboardQuery.data?.stats.organizerEvents ?? 0),
                  hint: "Only relevant for organizer accounts.",
                },
                {
                  label: "Next stop",
                  value: "History",
                  hint: "Review purchases and issued tickets.",
                },
              ]}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title="Continue your journey">
                <div className="grid gap-3">
                  {[
                    { href: "/events", label: "Browse events", copy: "Find new events and complete ticket purchases." },
                    { href: "/history", label: "Open history", copy: "Review tickets, purchase actions, and account activity." },
                    { href: "/profile", label: "Update profile", copy: "Keep checkout details and contact information current." },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <p className="font-semibold text-slate-950">{item.label}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.copy}</p>
                    </Link>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Role-aware account notes">
                <div className="grid gap-3 text-sm leading-6 text-slate-600">
                  <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                    Organizer accounts can switch between user and organizer mode without changing their database role.
                  </div>
                  <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                    Protected organizer routes still require email verification and manual admin approval.
                  </div>
                  <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                    Talent onboarding is a separate paid capability layered on top of the user experience.
                  </div>
                </div>
              </SectionCard>
            </div>
          </>
        )}
      </PageShell>
    </ProtectedRoute>
  )
}
