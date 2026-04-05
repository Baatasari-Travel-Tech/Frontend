"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  approveOrganizer,
  getAdminOrganizerDetails,
  isAdminAuthFailure,
  listPendingOrganizers,
} from "@/lib/api/admin"
import { ADMIN_ROUTES } from "@/lib/admin/routes"
import { clearAdminToken, getAdminToken } from "@/lib/admin/session"
import type { AdminOrganizerDetailsResponse, OrganizerProfile } from "@/types/api"

type DetailItem = {
  label: string
  value: string | null
  isLink?: boolean
}

const formatValue = (value: string | null | undefined) => {
  if (!value || !value.trim()) return "-"
  return value
}

const formatBoolean = (value: boolean) => (value ? "Yes" : "No")

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "-"

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "-"

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const readString = (value: unknown) => (typeof value === "string" && value.trim() ? value : null)

const mapPendingProfileToOrganizerProfile = (profile: Record<string, unknown>): OrganizerProfile => ({
  orgName: readString(profile.org_name),
  description: readString(profile.description),
  contactEmail: readString(profile.contact_email),
  contactPhone: readString(profile.contact_phone),
  address: readString(profile.address),
  city: readString(profile.city),
  state: readString(profile.state),
  pincode: readString(profile.pincode),
  panNumber: readString(profile.pan_number),
  gstNumber: readString(profile.gst_number),
  bankAccountName: readString(profile.bank_account_name),
  bankAccountNumber: readString(profile.bank_account_number),
  bankIfsc: readString(profile.bank_ifsc),
  websiteUrl: readString(profile.website_url),
  instagramUrl: readString(profile.instagram_url),
  linkedinUrl: readString(profile.linkedin_url),
  primaryContactName: readString(profile.primary_contact_name),
  secondaryContactPhone: readString(profile.secondary_contact_phone),
  logoUrl: readString(profile.logo_url),
  logoPublicId: readString(profile.logo_public_id),
  kycDocUrl: readString(profile.kyc_doc_url),
  kycDocPublicId: readString(profile.kyc_doc_public_id),
  createdAt: readString(profile.created_at),
  updatedAt: readString(profile.updated_at),
})

function DetailGrid({ title, items }: { title: string; items: DetailItem[] }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</dt>
            <dd className="mt-2 text-sm text-slate-800 wrap-break-word">
              {item.isLink && item.value ? (
                <a
                  href={item.value}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-slate-900 underline decoration-slate-400 underline-offset-4 hover:text-slate-700"
                >
                  {item.value}
                </a>
              ) : (
                formatValue(item.value)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default function OrganizerProfilePage() {
  const router = useRouter()
  const params = useParams<{ organizerId: string }>()
  const organizerId = useMemo(
    () => (Array.isArray(params.organizerId) ? params.organizerId[0] : params.organizerId),
    [params.organizerId]
  )

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [details, setDetails] = useState<AdminOrganizerDetailsResponse | null>(null)

  const refresh = useCallback(
    async (logoutOnFailure = true) => {
      if (!organizerId) {
        setError("Organizer id is missing in route.")
        setLoading(false)
        return
      }

      try {
        const response = await getAdminOrganizerDetails(organizerId)
        setDetails(response)
        setError(null)
      } catch (requestError) {
        const status =
          typeof requestError === "object" && requestError && "status" in requestError
            ? Number((requestError as { status?: number }).status)
            : undefined
        const message = requestError instanceof Error ? requestError.message : "Failed to load organizer details"

        if (status === 404) {
          try {
            const pendingOrganizers = await listPendingOrganizers()
            const matchedOrganizer = pendingOrganizers.find((organizer) => organizer.id === organizerId)
            if (matchedOrganizer) {
              const pendingProfile =
                matchedOrganizer.profile && typeof matchedOrganizer.profile === "object"
                  ? mapPendingProfileToOrganizerProfile(matchedOrganizer.profile)
                  : null
              const safeUser = {
                id: matchedOrganizer.id,
                email: matchedOrganizer.email,
                role: matchedOrganizer.role,
                onboardingStatus: matchedOrganizer.onboardingStatus,
                emailVerified: matchedOrganizer.emailVerified,
                organizerApproved: matchedOrganizer.organizerApproved,
                createdAt: matchedOrganizer.createdAt,
                updatedAt: matchedOrganizer.updatedAt,
              }
              setDetails({
                user: safeUser,
                userProfile: null,
                organizerProfile: pendingProfile,
              })
              setError(
                "Detailed organizer endpoint is unavailable on this backend deployment. Showing available pending organizer data."
              )
              return
            }
          } catch {
            // Ignore fallback failure and show original request error.
          }
        }

        setError(message)
        if (logoutOnFailure && isAdminAuthFailure(requestError)) {
          clearAdminToken()
          router.replace(ADMIN_ROUTES.login)
        }
      } finally {
        setLoading(false)
      }
    },
    [organizerId, router]
  )

  useEffect(() => {
    const token = getAdminToken()
    if (!token) {
      router.replace(ADMIN_ROUTES.login)
      return
    }

    void refresh()
  }, [refresh, router])

  const handleApprove = async () => {
    if (!organizerId) return

    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      await approveOrganizer(organizerId)
      setSuccess("Organizer approved successfully.")
      await refresh(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to approve organizer")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="p-10 text-slate-700">Loading organizer details...</div>
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Organizer details are not available."}
        </div>
      </div>
    )
  }

  const { user, userProfile, organizerProfile } = details
  const kycDocUrl = organizerProfile?.kycDocUrl
  const inlinePdfUrl = kycDocUrl ? (kycDocUrl.includes("#") ? kycDocUrl : `${kycDocUrl}#toolbar=1`) : null

  const accountItems: DetailItem[] = [
    { label: "Email", value: user.email },
    { label: "Role", value: user.role },
    { label: "Onboarding status", value: user.onboardingStatus },
    { label: "Email verified", value: formatBoolean(user.emailVerified) },
    { label: "Organizer approved", value: formatBoolean(user.organizerApproved) },
    { label: "Account created", value: formatDateTime(user.createdAt) },
    { label: "Last updated", value: formatDateTime(user.updatedAt) },
    { label: "User ID", value: user.id },
  ]

  const personalItems: DetailItem[] = [
    { label: "Full name", value: userProfile?.fullName ?? null },
    { label: "Phone", value: userProfile?.phone ?? null },
    { label: "Date of birth", value: formatDate(userProfile?.dob) },
    { label: "Location", value: userProfile?.location ?? null },
    { label: "Avatar URL", value: userProfile?.avatarUrl ?? null, isLink: true },
    { label: "Company name", value: userProfile?.companyName ?? null },
    { label: "Company website", value: userProfile?.companyWebsite ?? null, isLink: true },
    { label: "Profile updated", value: formatDateTime(userProfile?.updatedAt) },
  ]

  const organizerItems: DetailItem[] = [
    { label: "Organization name", value: organizerProfile?.orgName ?? null },
    { label: "Organization description", value: organizerProfile?.description ?? null },
    { label: "Contact email", value: organizerProfile?.contactEmail ?? null },
    { label: "Contact phone", value: organizerProfile?.contactPhone ?? null },
    { label: "Primary contact name", value: organizerProfile?.primaryContactName ?? null },
    { label: "Secondary contact phone", value: organizerProfile?.secondaryContactPhone ?? null },
    { label: "Address", value: organizerProfile?.address ?? null },
    { label: "City", value: organizerProfile?.city ?? null },
    { label: "State", value: organizerProfile?.state ?? null },
    { label: "Pincode", value: organizerProfile?.pincode ?? null },
    { label: "Website", value: organizerProfile?.websiteUrl ?? null, isLink: true },
    { label: "Instagram", value: organizerProfile?.instagramUrl ?? null, isLink: true },
    { label: "LinkedIn", value: organizerProfile?.linkedinUrl ?? null, isLink: true },
  ]

  const complianceItems: DetailItem[] = [
    { label: "PAN number", value: organizerProfile?.panNumber ?? null },
    { label: "GST number", value: organizerProfile?.gstNumber ?? null },
    { label: "Bank account name", value: organizerProfile?.bankAccountName ?? null },
    { label: "Bank account number", value: organizerProfile?.bankAccountNumber ?? null },
    { label: "Bank IFSC", value: organizerProfile?.bankIfsc ?? null },
    { label: "Logo URL", value: organizerProfile?.logoUrl ?? null, isLink: true },
    { label: "KYC document URL", value: organizerProfile?.kycDocUrl ?? null, isLink: true },
    { label: "Organizer profile updated", value: formatDateTime(organizerProfile?.updatedAt) },
  ]

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href={ADMIN_ROUTES.dashboard} className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Back to dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Organizer Onboarding Details</h1>
            <p className="text-sm text-slate-600">Review submitted profile details and KYC document before approval.</p>
          </div>
          <button
            onClick={() => void handleApprove()}
            disabled={busy || user.organizerApproved}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {user.organizerApproved ? "Already approved" : busy ? "Approving..." : "Approve organizer"}
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
        ) : null}

        <DetailGrid title="Account Summary" items={accountItems} />
        <DetailGrid title="Personal Onboarding Details" items={personalItems} />
        <DetailGrid title="Organizer Business Details" items={organizerItems} />
        <DetailGrid title="Compliance and Bank Details" items={complianceItems} />

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">KYC PDF Preview</h2>
          {!inlinePdfUrl ? (
            <p className="mt-3 text-sm text-slate-600">No KYC PDF has been uploaded yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-slate-600">
                The PDF is embedded below so it can be reviewed directly in the browser without downloading.
              </p>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <iframe title="Organizer KYC PDF" src={inlinePdfUrl} className="h-170 w-full bg-slate-50" />
              </div>
              <a
                href={kycDocUrl ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Open KYC PDF in new tab
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
