"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  deleteAdminUser,
  getAdminDashboard,
  isAdminAuthFailure,
  listAdminUsers,
  listPendingOrganizers,
} from "@/lib/api/admin"
import { ADMIN_ROUTES } from "@/lib/admin/routes"
import { clearAdminToken, getAdminToken } from "@/lib/admin/session"
import type { AdminDashboardResponse, AdminPendingOrganizerUser, SafeUser } from "@/types/api"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null)
  const [users, setUsers] = useState<SafeUser[]>([])
  const [pendingOrganizers, setPendingOrganizers] = useState<AdminPendingOrganizerUser[]>([])
  const [emailSearch, setEmailSearch] = useState("")
  const [organizerSearch, setOrganizerSearch] = useState("")

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
      setError(null)
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Failed to load admin data"
      setError(message)
      if (logoutOnFailure && isAdminAuthFailure(requestError)) {
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

  const handleLogout = () => {
    clearAdminToken()
    router.replace("/")
  }

  const filteredUsers = useMemo(() => {
    const search = emailSearch.trim().toLowerCase()
    if (!search) return users
    return users.filter((user) => user.email.toLowerCase().includes(search))
  }, [emailSearch, users])

  const pendingOrganizersWithCompletedOnboarding = useMemo(
    () => pendingOrganizers.filter((user) => user.onboardingStatus === "COMPLETED"),
    [pendingOrganizers]
  )

  const filteredPendingOrganizers = useMemo(() => {
    const search = organizerSearch.trim().toLowerCase()
    if (!search) return pendingOrganizersWithCompletedOnboarding
    return pendingOrganizersWithCompletedOnboarding.filter((user) =>
      user.email.toLowerCase().includes(search)
    )
  }, [organizerSearch, pendingOrganizersWithCompletedOnboarding])

  const cards = useMemo(() => {
    if (!dashboard) return []

    return [
      { label: "Total users", value: dashboard.stats.totalUsers },
      { label: "Organizers", value: dashboard.stats.organizerCount },
      { label: "Pending approvals", value: pendingOrganizersWithCompletedOnboarding.length },
    ]
  }, [dashboard, pendingOrganizersWithCompletedOnboarding.length])

  const handleDeleteUser = async (id: string, email: string) => {
    const isConfirmed = window.confirm(`Delete user ${email}? This action cannot be undone.`)
    if (!isConfirmed) return

    setBusyKey(`delete:${id}`)
    try {
      await deleteAdminUser(id)
      await refresh(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete user")
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">Pending organizer approvals</h2>
            <input
              value={organizerSearch}
              onChange={(event) => setOrganizerSearch(event.target.value)}
              placeholder="Search by organizer email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-72"
            />
          </div>
          {filteredPendingOrganizers.length === 0 ? (
            <p className="text-sm text-slate-500">No pending organizers.</p>
          ) : (
            <div className="max-h-56 overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">Organization</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">User ID</th>
                    <th className="px-3 py-2 font-medium">Requested On</th>
                    <th className="px-3 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingOrganizers.map((user, index) => (
                    <tr key={user.id} className="border-b border-slate-100 text-slate-700">
                      <td className="px-3 py-3 text-xs font-mono text-slate-400">
                        {String(index + 1).padStart(2, "0")}
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        {(typeof user.profile?.org_name === "string" ? user.profile.org_name : null) || "N/A"}
                      </td>
                      <td className="px-3 py-3">{user.email}</td>
                      <td className="px-3 py-3 text-xs font-mono text-slate-500">{user.id}</td>
                      <td className="px-3 py-3">
                        {new Date(user.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/admin/89a85e00a259b262c18c8081df7217fd/organizer/${user.id}`}
                          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">Users</h2>
            <input
              value={emailSearch}
              onChange={(event) => setEmailSearch(event.target.value)}
              placeholder="Search by email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-72"
            />
          </div>
          <div className="mt-4 max-h-56 overflow-auto">
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
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 text-slate-700">
                    <td className="px-3 py-3">
                      <p>{user.email}</p>
                      <p className="text-xs text-slate-400">{user.id}</p>
                    </td>
                    <td className="px-3 py-3">{user.role}</td>
                    <td className="px-3 py-3">{user.onboardingStatus}</td>
                    <td className="px-3 py-3">{user.organizerApproved ? "Yes" : "No"}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => void handleDeleteUser(user.id, user.email)}
                        disabled={busyKey === `delete:${user.id}`}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {busyKey === `delete:${user.id}` ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-slate-500" colSpan={5}>
                      No users found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
