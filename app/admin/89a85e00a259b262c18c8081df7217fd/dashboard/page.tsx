"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  approveOrganizer,
  getAdminDashboard,
  listAdminUsers,
  listPendingOrganizers,
  updateAdminUserRole,
} from "@/lib/api/admin"
import { ADMIN_ROUTES } from "@/lib/admin/routes"
import { clearAdminToken, getAdminToken } from "@/lib/admin/session"
import type { AdminDashboardResponse, BackendRole, SafeUser } from "@/types/api"

const ROLE_OPTIONS: BackendRole[] = ["USER", "ORGANIZER", "ADMIN"]

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null)
  const [users, setUsers] = useState<SafeUser[]>([])
  const [pendingOrganizers, setPendingOrganizers] = useState<SafeUser[]>([])
  const [roleDrafts, setRoleDrafts] = useState<Record<string, BackendRole>>({})

  const refresh = useCallback(async (logoutOnFailure = true) => {
    try {
      const [dashboardData, usersData, pendingData] = await Promise.all([
        getAdminDashboard(),
        listAdminUsers({ page: 1, limit: 25 }),
        listPendingOrganizers(),
      ])

      setDashboard(dashboardData)
      setUsers(usersData.users)
      setPendingOrganizers(pendingData)
      setRoleDrafts(
        usersData.users.reduce<Record<string, BackendRole>>((acc, user) => {
          acc[user.id] = user.role
          return acc
        }, {})
      )
      setError(null)
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Failed to load admin data"
      setError(message)
      if (logoutOnFailure) {
        clearAdminToken()
        router.replace(ADMIN_ROUTES.login)
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    const token = getAdminToken()
    if (!token) {
      router.replace(ADMIN_ROUTES.login)
      return
    }

    void refresh()
  }, [refresh, router])

  const cards = useMemo(() => {
    if (!dashboard) return []

    return [
      { label: "Total users", value: dashboard.stats.totalUsers },
      { label: "Organizers", value: dashboard.stats.organizerCount },
      { label: "Pending approvals", value: dashboard.stats.pendingOrganizerCount },
    ]
  }, [dashboard])

  const handleLogout = () => {
    clearAdminToken()
    router.replace(ADMIN_ROUTES.login)
  }

  const handleUpdateRole = async (id: string) => {
    const nextRole = roleDrafts[id]
    if (!nextRole) return

    setBusyKey(`role:${id}`)
    try {
      await updateAdminUserRole(id, nextRole)
      await refresh(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update role")
    } finally {
      setBusyKey(null)
    }
  }

  if (loading) {
    return <div className="p-10 text-slate-700">Loading admin dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-600">
              {dashboard?.message ?? "Manage users and organizer approvals."}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Logout
          </button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Pending organizer approvals</h2>
          {pendingOrganizers.length === 0 ? (
            <p className="text-sm text-slate-500">No pending organizers.</p>
          ) : (
            <ol className="w-full divide-y divide-slate-100 border-t border-slate-100">
              {pendingOrganizers.map((user, index) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between py-4 gap-6"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-sm font-mono text-slate-400 w-6">
                      {String(index + 1).padStart(2, '0')}.
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Organization</p>
                        <p className="font-semibold text-slate-900">
                          {(user as any).profile?.org_name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Email & ID</p>
                        <p className="text-sm text-slate-700">{user.email}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-37.5">{user.id}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Requested On</p>
                        <p className="text-sm text-slate-700">
                          {new Date(user.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Link
                      href={`/admin/89a85e00a259b262c18c8081df7217fd/organizer/${user.id}`}
                      className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-2 text-sm font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      View Profile
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Users</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Onboarding</th>
                  <th className="px-3 py-2 font-medium">Organizer Approved</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 text-slate-700">
                    <td className="px-3 py-3">
                      <p>{user.email}</p>
                      <p className="text-xs text-slate-400">{user.id}</p>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={roleDrafts[user.id] ?? user.role}
                        onChange={(event) =>
                          setRoleDrafts((prev) => ({
                            ...prev,
                            [user.id]: event.target.value as BackendRole,
                          }))
                        }
                        className="rounded-md border border-slate-300 px-2 py-1"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">{user.onboardingStatus}</td>
                    <td className="px-3 py-3">{user.organizerApproved ? "Yes" : "No"}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => void handleUpdateRole(user.id)}
                        disabled={busyKey === `role:${user.id}`}
                        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {busyKey === `role:${user.id}` ? "Saving..." : "Update role"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}