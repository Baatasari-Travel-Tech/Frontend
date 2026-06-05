"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Pencil, RefreshCw, X, XCircle } from "lucide-react"
import {
  bulkDeleteAdminUsers,
  deleteAdminUser,
  fetchPublicSiteConfig,
  getAdminDashboard,
  getAdminOrganizerDetails,
  getAdminSiteConfig,
  getAdminUserDetails,
  isAdminAuthFailure,
  listAdminUsers,
  listPendingOrganizers,
  reviveAdminUser,
  updateAdminOrganizerProfile,
  updateAdminSiteConfig,
  updateAdminUser,
  updateAdminUserProfile,
  verifyAdminOrganizerGstin,
  verifyAdminOrganizerPan,
} from "@/lib/api/admin"
import { ADMIN_ROUTES } from "@/lib/admin/routes"
import { clearAdminToken, getAdminToken } from "@/lib/admin/session"
import type {
  AdminDashboardResponse,
  AdminPendingOrganizerUser,
  BackendRole,
  GstinVerifyResult,
  OnboardingStatus,
  OrganizerProfile,
  PanVerifyResult,
  SafeUser,
  SiteConfig,
  UserProfile,
} from "@/types/api"

type AdminListTab = "USERS" | "ORGANIZERS"
type AdminDashboardUser = SafeUser & { organizationName: string | null }

type EditDrawerState =
  | { status: "closed" }
  | { status: "loading"; id: string; email: string; isOrganizer: boolean }
  | {
      status: "open"
      id: string
      isOrganizer: boolean
      entityType: "ORGANIZATION" | "INDIVIDUAL" | ""
      // account fields
      role: BackendRole
      onboardingStatus: OnboardingStatus
      organizerApproved: boolean
      // user profile
      fullName: string
      phone: string
      dob: string
      location: string
      gender: string
      profession: string
      // organizer profile
      orgName: string
      contactEmail: string
      contactPhone: string
      address: string
      city: string
      state: string
      pincode: string
      websiteUrl: string
      instagramUrl: string
      linkedinUrl: string
      primaryContactName: string
      secondaryContactPhone: string
      description: string
      // bank + compliance
      panNumber: string
      gstNumber: string
      bankAccountName: string
      bankAccountNumber: string
      bankIfsc: string
    }

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

const str = (v: string | null | undefined) => v ?? ""

const getPendingOrganizationName = (pending: AdminPendingOrganizerUser | undefined) => {
  const profile = pending?.profile
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return "N/A"
  const orgName = (profile as Record<string, unknown>).org_name
  return typeof orgName === "string" && orgName.trim().length > 0 ? orgName : "N/A"
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  disabled,
  mono,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  type?: string
  disabled?: boolean
  mono?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60 ${mono ? "font-mono tracking-widest" : ""}`}
      />
    </div>
  )
}

function SelectField({
  label,
  id,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string
  id: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 disabled:opacity-60"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function VerifyBadge({ result, type }: { result: GstinVerifyResult | PanVerifyResult | "error" | null; type: "gstin" | "pan" }) {
  if (!result) return null
  if (result === "error") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
      <XCircle className="h-3 w-3" /> Invalid
    </span>
  )
  if (type === "pan") {
    const r = result as PanVerifyResult
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
        <CheckCircle className="h-3 w-3" /> Valid — {r.pan}
      </span>
    )
  }
  const r = result as GstinVerifyResult
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
      <CheckCircle className="h-3 w-3" /> {r.legalName ?? "Valid"}{r.status ? ` · ${r.status}` : ""}
    </span>
  )
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null)
  const [users, setUsers] = useState<AdminDashboardUser[]>([])
  const [pendingOrganizers, setPendingOrganizers] = useState<AdminPendingOrganizerUser[]>([])
  const [tab, setTab] = useState<AdminListTab>("USERS")
  const [search, setSearch] = useState("")
  const [organizerSearch, setOrganizerSearch] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  // Multi-select for bulk soft-delete. Two independent sets so a USERS
  // selection isn't lost when the admin flips to the ORGANIZERS tab to
  // queue up a separate batch. Both clear on every refresh below to
  // avoid stale IDs lingering after rows disappear.
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [selectedOrganizerIds, setSelectedOrganizerIds] = useState<Set<string>>(new Set())

  const [drawer, setDrawer] = useState<EditDrawerState>({ status: "closed" })
  const [saveBusy, setSaveBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Verify state (reset when drawer closes)
  const [panVerify, setPanVerify] = useState<{ busy: boolean; result: PanVerifyResult | "error" | null }>({ busy: false, result: null })
  const [gstinVerify, setGstinVerify] = useState<{ busy: boolean; result: GstinVerifyResult | "error" | null }>({ busy: false, result: null })

  // Site config
  const [siteConfigDraft, setSiteConfigDraft] = useState<SiteConfig>({ instagram: "#", linkedin: "#", twitter: "#", contactEmail: "contact-us@baatasari.com" })
  const [siteConfigBusy, setSiteConfigBusy] = useState(false)
  const [siteConfigMsg, setSiteConfigMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const refresh = useCallback(async (logoutOnFailure = true) => {
    try {
      const [dashboardData, usersData, pendingData, configData] = await Promise.all([
        getAdminDashboard(),
        listAdminUsers({ page: 1, limit: 100 }),
        listPendingOrganizers(),
        getAdminSiteConfig(),
      ])
      setDashboard(dashboardData)
      setUsers(usersData.users)
      setPendingOrganizers(pendingData)
      setSiteConfigDraft(configData)
      setError(null)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to load admin data"
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
    if (!token) { router.replace(ADMIN_ROUTES.login); return }
    void refresh()
  }, [refresh, router])

  const handleLogout = () => { clearAdminToken(); router.replace("/") }

  const handleRefresh = async () => {
    setRefreshing(true)
    try { await refresh() } finally { setRefreshing(false) }
  }

  const pendingById = useMemo(
    () => new Map(pendingOrganizers.map((o) => [o.id, o])),
    [pendingOrganizers]
  )

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    const source = users.filter((u) => u.role === "USER")
    return q ? source.filter((u) => u.email.toLowerCase().includes(q)) : source
  }, [search, users])

  const filteredOrganizers = useMemo(() => {
    const q = search.trim().toLowerCase()
    const source = users.filter((u) => u.role === "ORGANIZER")
    return q ? source.filter((u) => u.email.toLowerCase().includes(q)) : source
  }, [search, users])

  const pendingOrganizersEligibleForApproval = useMemo(
    () => pendingOrganizers.filter(
      (u) => u.onboardingStatus === "COMPLETED" && u.emailVerified && u.organizerDocumentsSubmitted
    ),
    [pendingOrganizers]
  )

  const filteredPendingOrganizers = useMemo(() => {
    const q = organizerSearch.trim().toLowerCase()
    return q
      ? pendingOrganizersEligibleForApproval.filter((u) => u.email.toLowerCase().includes(q))
      : pendingOrganizersEligibleForApproval
  }, [organizerSearch, pendingOrganizersEligibleForApproval])

  const cards = useMemo(() => {
    if (!dashboard) return []
    return [
      { label: "Total users", value: dashboard.stats.totalUsers },
      { label: "Organizers", value: dashboard.stats.organizerCount },
      { label: "Pending approvals", value: pendingOrganizersEligibleForApproval.length },
    ]
  }, [dashboard, pendingOrganizersEligibleForApproval.length])

  const handleDeleteUser = async (id: string, email: string) => {
    if (
      !window.confirm(
        `Delete user ${email}? They'll be revivable for 24 hours, then permanently removed.`,
      )
    )
      return
    setBusyKey(`delete:${id}`)
    try {
      await deleteAdminUser(id)
      await refresh(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete user")
    } finally {
      setBusyKey(null)
    }
  }

  const handleReviveUser = async (id: string, email: string) => {
    if (!window.confirm(`Revive ${email}? This restores the account and all its data.`))
      return
    setBusyKey(`revive:${id}`)
    try {
      await reviveAdminUser(id)
      await refresh(false)
    } catch (e) {
      // Most likely reason for failure: the 24h grace window has passed
      // and the cron has already (or is about to) hard-delete. The
      // backend returns a 400 with that exact reason.
      setError(e instanceof Error ? e.message : "Failed to revive user")
    } finally {
      setBusyKey(null)
    }
  }

  // Toggle one row's checkbox. Wrapped in a small helper so the user
  // and organizer tables share identical behaviour without repeating the
  // immutable-Set dance inline.
  const toggleSelectionId = (set: Set<string>, id: string): Set<string> => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  // "Select all" header checkbox — switches every visible (filtered) row.
  // We deliberately operate on the filtered list, not the underlying
  // users[]; selecting "all" after a search filter should only target
  // what the admin can actually see.
  const setSelectionForVisible = (
    visibleIds: string[],
    current: Set<string>,
  ): Set<string> => {
    const allSelected = visibleIds.every((id) => current.has(id))
    if (allSelected) {
      const next = new Set(current)
      visibleIds.forEach((id) => next.delete(id))
      return next
    }
    const next = new Set(current)
    visibleIds.forEach((id) => next.add(id))
    return next
  }

  const handleBulkDelete = async (scope: AdminListTab) => {
    const ids = scope === "USERS" ? Array.from(selectedUserIds) : Array.from(selectedOrganizerIds)
    if (ids.length === 0) return
    if (
      !window.confirm(
        `Delete ${ids.length} ${scope === "USERS" ? "user" : "organizer"}${ids.length === 1 ? "" : "s"}? They'll be revivable for 24 hours, then permanently removed.`,
      )
    )
      return

    setBusyKey(`bulk:${scope}`)
    try {
      const result = await bulkDeleteAdminUsers(ids)
      if (result.failed.length > 0) {
        setError(
          `Deleted ${result.deleted.length}, failed ${result.failed.length}: ${result.failed
            .map((f) => `${f.id} (${f.reason})`)
            .join(", ")}`,
        )
      }
      // Clear the selection set we just acted on.
      if (scope === "USERS") setSelectedUserIds(new Set())
      else setSelectedOrganizerIds(new Set())
      await refresh(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk delete failed")
    } finally {
      setBusyKey(null)
    }
  }

  const handleOpenEdit = async (user: AdminDashboardUser, isOrganizer: boolean) => {
    setDrawer({ status: "loading", id: user.id, email: user.email, isOrganizer })
    setSaveError(null)
    setPanVerify({ busy: false, result: null })
    setGstinVerify({ busy: false, result: null })

    try {
      if (isOrganizer) {
        const details = await getAdminOrganizerDetails(user.id)
        const up: UserProfile = details.userProfile ?? {} as UserProfile
        const op: OrganizerProfile = details.organizerProfile ?? {} as OrganizerProfile
        setDrawer({
          status: "open",
          id: user.id,
          isOrganizer: true,
          entityType: op.entityType ?? "",
          role: user.role,
          onboardingStatus: user.onboardingStatus,
          organizerApproved: user.organizerApproved,
          fullName: str(up.fullName),
          phone: str(up.phone),
          dob: str(up.dob),
          location: str(up.location),
          gender: str(up.gender),
          profession: str(up.profession),
          orgName: str(op.orgName),
          contactEmail: str(op.contactEmail),
          contactPhone: str(op.contactPhone),
          address: str(op.address),
          city: str(op.city),
          state: str(op.state),
          pincode: str(op.pincode),
          websiteUrl: str(op.websiteUrl),
          instagramUrl: str(op.instagramUrl),
          linkedinUrl: str(op.linkedinUrl),
          primaryContactName: str(op.primaryContactName),
          secondaryContactPhone: str(op.secondaryContactPhone),
          description: str(op.description),
          panNumber: str(op.panNumber),
          gstNumber: str(op.gstNumber),
          bankAccountName: str(op.bankAccountName),
          bankAccountNumber: str(op.bankAccountNumber),
          bankIfsc: str(op.bankIfsc),
        })
      } else {
        const details = await getAdminUserDetails(user.id)
        const up: UserProfile = details.userProfile ?? {} as UserProfile
        setDrawer({
          status: "open",
          id: user.id,
          isOrganizer: false,
          entityType: "",
          role: user.role,
          onboardingStatus: user.onboardingStatus,
          organizerApproved: user.organizerApproved,
          fullName: str(up.fullName),
          phone: str(up.phone),
          dob: str(up.dob),
          location: str(up.location),
          gender: str(up.gender),
          profession: str(up.profession),
          orgName: "",
          contactEmail: "",
          contactPhone: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          websiteUrl: "",
          instagramUrl: "",
          linkedinUrl: "",
          primaryContactName: "",
          secondaryContactPhone: "",
          description: "",
          panNumber: "",
          gstNumber: "",
          bankAccountName: "",
          bankAccountNumber: "",
          bankIfsc: "",
        })
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to load profile")
      setDrawer({ status: "closed" })
    }
  }

  const patchDrawer = (patch: Partial<Exclude<EditDrawerState, { status: "closed" } | { status: "loading" }>>) => {
    setDrawer((prev) => prev.status === "open" ? { ...prev, ...patch } : prev)
  }

  const handleSaveEdit = async () => {
    if (drawer.status !== "open") return
    setSaveBusy(true)
    setSaveError(null)
    try {
      const calls: Promise<unknown>[] = [
        updateAdminUser(drawer.id, {
          role: drawer.role,
          onboardingStatus: drawer.onboardingStatus,
          organizerApproved: drawer.organizerApproved,
        }),
        updateAdminUserProfile(drawer.id, {
          fullName: drawer.fullName || null,
          phone: drawer.phone || null,
          dob: drawer.dob || null,
          location: drawer.location || null,
          gender: drawer.gender || null,
          profession: drawer.profession || null,
        }),
      ]
      if (drawer.isOrganizer) {
        calls.push(
          updateAdminOrganizerProfile(drawer.id, {
            orgName: drawer.orgName || null,
            contactEmail: drawer.contactEmail || null,
            contactPhone: drawer.contactPhone || null,
            address: drawer.address || null,
            city: drawer.city || null,
            state: drawer.state || null,
            pincode: drawer.pincode || null,
            websiteUrl: drawer.websiteUrl || null,
            instagramUrl: drawer.instagramUrl || null,
            linkedinUrl: drawer.linkedinUrl || null,
            primaryContactName: drawer.primaryContactName || null,
            secondaryContactPhone: drawer.secondaryContactPhone || null,
            description: drawer.description || null,
            panNumber: drawer.panNumber || null,
            gstNumber: drawer.gstNumber || null,
            bankAccountName: drawer.bankAccountName || null,
            bankAccountNumber: drawer.bankAccountNumber || null,
            bankIfsc: drawer.bankIfsc || null,
          })
        )
      }
      await Promise.all(calls)
      setDrawer({ status: "closed" })
      await refresh(false)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save changes")
    } finally {
      setSaveBusy(false)
    }
  }

  const handleVerifyPan = async () => {
    if (drawer.status !== "open") return
    setPanVerify({ busy: true, result: null })
    try {
      const result = await verifyAdminOrganizerPan(drawer.id, drawer.panNumber)
      setPanVerify({ busy: false, result })
    } catch {
      setPanVerify({ busy: false, result: "error" })
    }
  }

  const handleVerifyGstin = async () => {
    if (drawer.status !== "open") return
    setGstinVerify({ busy: true, result: null })
    try {
      const result = await verifyAdminOrganizerGstin(drawer.id, drawer.gstNumber)
      setGstinVerify({ busy: false, result })
    } catch {
      setGstinVerify({ busy: false, result: "error" })
    }
  }

  const handleSaveSiteConfig = async () => {
    setSiteConfigBusy(true)
    setSiteConfigMsg(null)
    try {
      const updated = await updateAdminSiteConfig(siteConfigDraft)
      setSiteConfigDraft(updated)
      setSiteConfigMsg({ type: "success", text: "Site config saved." })
    } catch (e) {
      setSiteConfigMsg({ type: "error", text: e instanceof Error ? e.message : "Failed to save" })
    } finally {
      setSiteConfigBusy(false)
    }
  }

  const closeDrawer = () => {
    if (!saveBusy) {
      setDrawer({ status: "closed" })
      setPanVerify({ busy: false, result: null })
      setGstinVerify({ busy: false, result: null })
    }
  }

  if (loading) {
    return <div className="p-10 text-slate-700">Loading admin dashboard...</div>
  }

  const drawerOpen = drawer.status === "open" || drawer.status === "loading"

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-600">{dashboard?.message ?? "Manage users and organizer approvals."}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={ADMIN_ROUTES.support}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Support messages
            </Link>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              aria-label="Refresh"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-70"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Pending organizers */}
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">Pending organizer approvals</h2>
            <input
              value={organizerSearch}
              onChange={(e) => setOrganizerSearch(e.target.value)}
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
                      <td className="px-3 py-3">{formatDate(user.createdAt)}</td>
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

        {/* Users / Organizers table */}
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              {(["USERS", "ORGANIZERS"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                    tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t === "USERS" ? "Users" : "Organizers"}
                </button>
              ))}
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === "USERS" ? "Search users by email" : "Search organizers by email"}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-72"
            />
          </div>

          {tab === "USERS" ? (
            <div className="max-h-128 overflow-auto">
              {selectedUserIds.size > 0 && (
                <div className="sticky top-0 z-10 -mx-3 mb-2 flex items-center justify-between gap-3 border-b border-slate-200 bg-rose-50 px-3 py-2 text-sm">
                  <span className="font-medium text-rose-700">
                    {selectedUserIds.size} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedUserIds(new Set())}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleBulkDelete("USERS")}
                      disabled={busyKey === "bulk:USERS"}
                      className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-70"
                    >
                      {busyKey === "bulk:USERS"
                        ? "Deleting..."
                        : `Delete selected (${selectedUserIds.size})`}
                    </button>
                  </div>
                </div>
              )}
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-2 w-8">
                      {(() => {
                        // Only non-deleted rows participate in bulk delete.
                        // A deleted row's checkbox is already disabled, so
                        // "select all" must mirror that or the header tick
                        // would never go fully-checked.
                        const eligible = filteredUsers.filter((u) => !u.deletedAt).map((u) => u.id)
                        return (
                          <input
                            type="checkbox"
                            aria-label="Select all visible users"
                            disabled={eligible.length === 0}
                            checked={
                              eligible.length > 0 &&
                              eligible.every((id) => selectedUserIds.has(id))
                            }
                            onChange={() =>
                              setSelectedUserIds((prev) =>
                                setSelectionForVisible(eligible, prev),
                              )
                            }
                          />
                        )
                      })()}
                    </th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">User ID</th>
                    <th className="px-3 py-2 font-medium">Onboarding</th>
                    <th className="px-3 py-2 font-medium">Joined On</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isDeleted = user.deletedAt !== null
                    return (
                    <tr
                      key={user.id}
                      className={`border-b border-slate-100 ${
                        isDeleted ? "bg-rose-50/40 text-slate-500" : "text-slate-700"
                      }`}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${user.email}`}
                          checked={!isDeleted && selectedUserIds.has(user.id)}
                          disabled={isDeleted}
                          onChange={() =>
                            setSelectedUserIds((prev) => toggleSelectionId(prev, user.id))
                          }
                        />
                      </td>
                      <td className="px-3 py-3">
                        <span className={isDeleted ? "line-through" : ""}>{user.email}</span>
                        {isDeleted && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                            Pending deletion
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs font-mono text-slate-500">{user.id}</td>
                      <td className="px-3 py-3">{user.onboardingStatus}</td>
                      <td className="px-3 py-3">{formatDate(user.createdAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleOpenEdit(user, false)}
                            disabled={drawer.status === "loading" && drawer.id === user.id}
                            aria-label={`Edit ${user.email}`}
                            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {isDeleted ? (
                            <button
                              onClick={() => void handleReviveUser(user.id, user.email)}
                              disabled={busyKey === `revive:${user.id}`}
                              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
                            >
                              {busyKey === `revive:${user.id}` ? "Reviving..." : "Revive"}
                            </button>
                          ) : (
                            <button
                              onClick={() => void handleDeleteUser(user.id, user.email)}
                              disabled={busyKey === `delete:${user.id}`}
                              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-70"
                            >
                              {busyKey === `delete:${user.id}` ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                  {filteredUsers.length === 0 && (
                    <tr><td className="px-3 py-6 text-center text-slate-500" colSpan={6}>No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="max-h-128 overflow-auto">
              {selectedOrganizerIds.size > 0 && (
                <div className="sticky top-0 z-10 -mx-3 mb-2 flex items-center justify-between gap-3 border-b border-slate-200 bg-rose-50 px-3 py-2 text-sm">
                  <span className="font-medium text-rose-700">
                    {selectedOrganizerIds.size} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrganizerIds(new Set())}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleBulkDelete("ORGANIZERS")}
                      disabled={busyKey === "bulk:ORGANIZERS"}
                      className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-70"
                    >
                      {busyKey === "bulk:ORGANIZERS"
                        ? "Deleting..."
                        : `Delete selected (${selectedOrganizerIds.size})`}
                    </button>
                  </div>
                </div>
              )}
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-2 w-8">
                      {(() => {
                        const eligible = filteredOrganizers
                          .filter((o) => !o.deletedAt)
                          .map((o) => o.id)
                        return (
                          <input
                            type="checkbox"
                            aria-label="Select all visible organizers"
                            disabled={eligible.length === 0}
                            checked={
                              eligible.length > 0 &&
                              eligible.every((id) => selectedOrganizerIds.has(id))
                            }
                            onChange={() =>
                              setSelectedOrganizerIds((prev) =>
                                setSelectionForVisible(eligible, prev),
                              )
                            }
                          />
                        )
                      })()}
                    </th>
                    <th className="px-3 py-2 font-medium">Organization</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">User ID</th>
                    <th className="px-3 py-2 font-medium">Onboarding</th>
                    <th className="px-3 py-2 font-medium">Approved</th>
                    <th className="px-3 py-2 font-medium">Joined On</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrganizers.map((organizer) => {
                    const isDeleted = organizer.deletedAt !== null
                    return (
                    <tr
                      key={organizer.id}
                      className={`border-b border-slate-100 ${
                        isDeleted ? "bg-rose-50/40 text-slate-500" : "text-slate-700"
                      }`}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${organizer.email}`}
                          checked={!isDeleted && selectedOrganizerIds.has(organizer.id)}
                          disabled={isDeleted}
                          onChange={() =>
                            setSelectedOrganizerIds((prev) => toggleSelectionId(prev, organizer.id))
                          }
                        />
                      </td>
                      <td className={`px-3 py-3 font-semibold ${isDeleted ? "" : "text-slate-900"}`}>
                        <span className={isDeleted ? "line-through" : ""}>
                          {organizer.organizationName?.trim() || getPendingOrganizationName(pendingById.get(organizer.id))}
                        </span>
                        {isDeleted && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                            Pending deletion
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">{organizer.email}</td>
                      <td className="px-3 py-3 text-xs font-mono text-slate-500">{organizer.id}</td>
                      <td className="px-3 py-3">{organizer.onboardingStatus}</td>
                      <td className="px-3 py-3">{organizer.organizerApproved ? "Yes" : "No"}</td>
                      <td className="px-3 py-3">{formatDate(organizer.createdAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleOpenEdit(organizer, true)}
                            disabled={drawer.status === "loading" && drawer.id === organizer.id}
                            aria-label={`Edit ${organizer.email}`}
                            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {isDeleted ? (
                            <button
                              onClick={() => void handleReviveUser(organizer.id, organizer.email)}
                              disabled={busyKey === `revive:${organizer.id}`}
                              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
                            >
                              {busyKey === `revive:${organizer.id}` ? "Reviving..." : "Revive"}
                            </button>
                          ) : (
                            <button
                              onClick={() => void handleDeleteUser(organizer.id, organizer.email)}
                              disabled={busyKey === `delete:${organizer.id}`}
                              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-70"
                            >
                              {busyKey === `delete:${organizer.id}` ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                  {filteredOrganizers.length === 0 && (
                    <tr><td className="px-3 py-6 text-center text-slate-500" colSpan={8}>No organizers found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Site Settings */}
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Site Settings</h2>
          <p className="mb-5 text-sm text-slate-500">
            Configure footer social links and contact details. These appear on the events page footer and contact-us page.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(["instagram", "linkedin", "twitter"] as const).map((platform) => (
              <div key={platform}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 capitalize">
                  {platform} URL
                </label>
                <input
                  type="url"
                  value={siteConfigDraft[platform]}
                  onChange={(e) => setSiteConfigDraft((prev) => ({ ...prev, [platform]: e.target.value }))}
                  disabled={siteConfigBusy}
                  placeholder={`https://${platform}.com/baatasari`}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={siteConfigDraft.contactEmail}
                onChange={(e) => setSiteConfigDraft((prev) => ({ ...prev, contactEmail: e.target.value }))}
                disabled={siteConfigBusy}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSaveSiteConfig()}
              disabled={siteConfigBusy}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70 transition"
            >
              {siteConfigBusy ? "Saving..." : "Save settings"}
            </button>
            {siteConfigMsg && (
              <span className={`text-sm font-medium ${siteConfigMsg.type === "success" ? "text-green-700" : "text-red-700"}`}>
                {siteConfigMsg.text}
              </span>
            )}
          </div>
        </section>
      </div>

      {/* Edit slide-over drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 transition-opacity"
            onClick={closeDrawer}
            aria-hidden
          />

          <aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Edit user"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Edit {drawer.isOrganizer ? "Organizer" : "User"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 font-mono">
                  {drawer.status === "open" ? drawer.id : drawer.email}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                disabled={saveBusy}
                aria-label="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {drawer.status === "loading" ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                Loading profile...
              </div>
            ) : drawer.status === "open" ? (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">

                  {/* — Account — */}
                  <section>
                    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Account</p>
                    <div className="grid grid-cols-2 gap-4">
                      <SelectField
                        label="Role"
                        id="edit-role"
                        value={drawer.role}
                        options={[
                          { value: "USER", label: "USER" },
                          { value: "ORGANIZER", label: "ORGANIZER" },
                        ]}
                        onChange={(v) => patchDrawer({ role: v as BackendRole })}
                        disabled={saveBusy}
                      />
                      <SelectField
                        label="Onboarding Status"
                        id="edit-onboarding"
                        value={drawer.onboardingStatus}
                        options={[
                          { value: "PENDING", label: "PENDING" },
                          { value: "COMPLETED", label: "COMPLETED" },
                        ]}
                        onChange={(v) => patchDrawer({ onboardingStatus: v as OnboardingStatus })}
                        disabled={saveBusy}
                      />
                    </div>
                    {drawer.isOrganizer && (
                      <div className="mt-4 flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="edit-approved"
                          checked={drawer.organizerApproved}
                          onChange={(e) => patchDrawer({ organizerApproved: e.target.checked })}
                          disabled={saveBusy}
                          className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                        />
                        <label htmlFor="edit-approved" className="text-sm font-medium text-slate-700">
                          Organizer Approved
                        </label>
                      </div>
                    )}
                  </section>

                  {/* — Personal Profile — */}
                  <section>
                    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Personal Profile</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Full Name" id="edit-fullName" value={drawer.fullName} onChange={(v) => patchDrawer({ fullName: v })} disabled={saveBusy} />
                      <Field label="Phone" id="edit-phone" value={drawer.phone} onChange={(v) => patchDrawer({ phone: v })} disabled={saveBusy} />
                      <Field label="Date of Birth" id="edit-dob" value={drawer.dob} onChange={(v) => patchDrawer({ dob: v })} type="date" disabled={saveBusy} />
                      <Field label="Location" id="edit-location" value={drawer.location} onChange={(v) => patchDrawer({ location: v })} disabled={saveBusy} />
                      <SelectField
                        label="Gender"
                        id="edit-gender"
                        value={drawer.gender}
                        options={[
                          { value: "", label: "Not specified" },
                          { value: "Male", label: "Male" },
                          { value: "Female", label: "Female" },
                          { value: "Non-binary", label: "Non-binary" },
                          { value: "Prefer not to say", label: "Prefer not to say" },
                        ]}
                        onChange={(v) => patchDrawer({ gender: v })}
                        disabled={saveBusy}
                      />
                      <Field label="Profession" id="edit-profession" value={drawer.profession} onChange={(v) => patchDrawer({ profession: v })} disabled={saveBusy} />
                    </div>
                  </section>

                  {/* — Organizer Profile — */}
                  {drawer.isOrganizer && (
                    <section>
                      <div className="mb-3 flex items-center gap-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Organizer Profile</p>
                        {drawer.entityType && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${drawer.entityType === "INDIVIDUAL" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700"}`}>
                            {drawer.entityType}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">

                        {/* Org fields — hidden for INDIVIDUAL */}
                        {drawer.entityType !== "INDIVIDUAL" && (
                          <>
                            <Field label="Organization Name" id="edit-orgName" value={drawer.orgName} onChange={(v) => patchDrawer({ orgName: v })} disabled={saveBusy} />
                            <div className="col-span-2">
                              <Field label="Description" id="edit-description" value={drawer.description} onChange={(v) => patchDrawer({ description: v })} disabled={saveBusy} />
                            </div>
                          </>
                        )}

                        <Field label="Primary Contact Name" id="edit-primaryContact" value={drawer.primaryContactName} onChange={(v) => patchDrawer({ primaryContactName: v })} disabled={saveBusy} />
                        <Field label="Contact Email" id="edit-contactEmail" value={drawer.contactEmail} onChange={(v) => patchDrawer({ contactEmail: v })} type="email" disabled={saveBusy} />
                        <Field label="Contact Phone" id="edit-contactPhone" value={drawer.contactPhone} onChange={(v) => patchDrawer({ contactPhone: v })} disabled={saveBusy} />
                        <Field label="Secondary Phone" id="edit-secondaryPhone" value={drawer.secondaryContactPhone} onChange={(v) => patchDrawer({ secondaryContactPhone: v })} disabled={saveBusy} />
                        <Field label="City" id="edit-city" value={drawer.city} onChange={(v) => patchDrawer({ city: v })} disabled={saveBusy} />
                        <Field label="State" id="edit-state" value={drawer.state} onChange={(v) => patchDrawer({ state: v })} disabled={saveBusy} />
                        <Field label="Pincode" id="edit-pincode" value={drawer.pincode} onChange={(v) => patchDrawer({ pincode: v })} disabled={saveBusy} />
                        <div className="col-span-2">
                          <Field label="Address" id="edit-address" value={drawer.address} onChange={(v) => patchDrawer({ address: v })} disabled={saveBusy} />
                        </div>
                        <Field label="Website URL" id="edit-website" value={drawer.websiteUrl} onChange={(v) => patchDrawer({ websiteUrl: v })} type="url" disabled={saveBusy} />
                        <Field label="Instagram URL" id="edit-instagram" value={drawer.instagramUrl} onChange={(v) => patchDrawer({ instagramUrl: v })} type="url" disabled={saveBusy} />
                        <Field label="LinkedIn URL" id="edit-linkedin" value={drawer.linkedinUrl} onChange={(v) => patchDrawer({ linkedinUrl: v })} type="url" disabled={saveBusy} />
                      </div>

                      {/* — PAN — */}
                      <div className="mt-5">
                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">PAN</p>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Field
                              label="PAN Number"
                              id="edit-pan"
                              value={drawer.panNumber}
                              onChange={(v) => { patchDrawer({ panNumber: v.toUpperCase() }); setPanVerify({ busy: false, result: null }) }}
                              disabled={saveBusy}
                              mono
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleVerifyPan()}
                            disabled={panVerify.busy || !drawer.panNumber || saveBusy}
                            className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
                          >
                            {panVerify.busy ? "Verifying..." : "Verify"}
                          </button>
                        </div>
                        {panVerify.result !== null && (
                          <div className="mt-1.5">
                            <VerifyBadge result={panVerify.result} type="pan" />
                          </div>
                        )}
                      </div>

                      {/* — GSTIN — */}
                      <div className="mt-5">
                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">GSTIN</p>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Field
                              label="GSTIN"
                              id="edit-gstin"
                              value={drawer.gstNumber}
                              onChange={(v) => { patchDrawer({ gstNumber: v.toUpperCase() }); setGstinVerify({ busy: false, result: null }) }}
                              disabled={saveBusy}
                              mono
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleVerifyGstin()}
                            disabled={gstinVerify.busy || !drawer.gstNumber || saveBusy}
                            className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
                          >
                            {gstinVerify.busy ? "Verifying..." : "Verify"}
                          </button>
                        </div>
                        {gstinVerify.result !== null && (
                          <div className="mt-1.5">
                            <VerifyBadge result={gstinVerify.result} type="gstin" />
                          </div>
                        )}
                      </div>

                      {/* — Bank Details — */}
                      <div className="mt-5">
                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Bank Details</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Field label="Account Holder Name" id="edit-bankName" value={drawer.bankAccountName} onChange={(v) => patchDrawer({ bankAccountName: v })} disabled={saveBusy} />
                          </div>
                          <Field label="Account Number" id="edit-bankAccNum" value={drawer.bankAccountNumber} onChange={(v) => patchDrawer({ bankAccountNumber: v })} disabled={saveBusy} mono />
                          <Field label="IFSC Code" id="edit-ifsc" value={drawer.bankIfsc} onChange={(v) => patchDrawer({ bankIfsc: v.toUpperCase() })} disabled={saveBusy} mono />
                        </div>
                      </div>
                    </section>
                  )}
                </div>

                {/* Drawer footer */}
                <div className="border-t border-slate-200 px-6 py-4">
                  {saveError && (
                    <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {saveError}
                    </p>
                  )}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeDrawer}
                      disabled={saveBusy}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveEdit()}
                      disabled={saveBusy}
                      className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70 transition"
                    >
                      {saveBusy ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </aside>
        </>
      )}
    </div>
  )
}
