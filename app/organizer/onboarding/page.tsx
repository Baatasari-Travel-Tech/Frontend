"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, CalendarIcon, Landmark, ShieldCheck, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/app/providers"
import { apiRequest } from "@/lib/api/client"
import { uploadOrganizerAvatarImage } from "@/lib/api/uploads"
import { DEFAULT_AVATAR_IMAGE, getAvatarImageUrl } from "@/lib/avatar"
import {
  getDobDateBounds,
  isDobWithinBounds,
  isPredefinedProfession,
  ORGANIZER_MIN_AGE,
  OTHER_PROFESSION_VALUE,
  PROFESSION_OPTIONS,
} from "@/lib/profile-validation"

const DRAFT_STORAGE_KEY = "organizer-onboarding-draft-v2"
const GST_CHOICE_STORAGE_KEY = "organizer-onboarding-gst-choice"
const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]
const DOB_BOUNDS = getDobDateBounds(new Date(), ORGANIZER_MIN_AGE)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TEN_DIGIT_PHONE_PATTERN = /^\d{10}$/
const PINCODE_PATTERN = /^\d{6}$/
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/

const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
  "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
  "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
  "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
  "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "25": "Daman and Diu", "26": "Dadra and Nagar Haveli", "27": "Maharashtra", "28": "Andhra Pradesh",
  "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
  "34": "Puducherry", "35": "Andaman and Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh (Amaravati)",
  "38": "Ladakh", "97": "Other Territory", "99": "Centre"
}

const INDIAN_STATES = Array.from(new Set(Object.values(GST_STATE_CODES)))
  .filter((name) => !/[()]/.test(name) && name !== "Centre" && name !== "Other Territory")
  .sort((a, b) => a.localeCompare(b))

const stateFromGstin = (gstin: string): string => GST_STATE_CODES[gstin.slice(0, 2)] ?? ""

const GSTN_CODEPOINT_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

// Validates the GSTIN check digit (15th char) so fabricated-but-well-formatted
// GSTINs are rejected before/independent of the server verification call.
const isValidGstinChecksum = (gstin: string): boolean => {
  if (gstin.length !== 15) return false
  const body = gstin.slice(0, 14)
  const providedCheck = gstin[14]
  const mod = GSTN_CODEPOINT_CHARS.length
  let factor = 2
  let sum = 0

  for (let i = body.length - 1; i >= 0; i -= 1) {
    const codePoint = GSTN_CODEPOINT_CHARS.indexOf(body[i])
    if (codePoint < 0) return false
    let digit = factor * codePoint
    factor = factor === 2 ? 1 : 2
    digit = Math.floor(digit / mod) + (digit % mod)
    sum += digit
  }

  const checkCodePoint = (mod - (sum % mod)) % mod
  return GSTN_CODEPOINT_CHARS[checkCodePoint] === providedCheck
}

type GstinVerifyResult = {
  valid: boolean
  embeddedPan: string
  legalName?: string
  status?: string
  registrationDate?: string
  address?: string
  taxpayerType?: string
}

type GstinRow = {
  gstin: string
  state: string
  verified: boolean
  verifying: boolean
  error: string | null
  legalName?: string | null
}

const makeGstinRow = (gstin = "", state = "", verified = false): GstinRow => ({
  gstin,
  state,
  verified,
  verifying: false,
  error: null,
})

const getProfessionFormValues = (profession: string | null | undefined) => {
  const trimmedProfession = (profession ?? "").trim()
  if (!trimmedProfession) {
    return {
      profession: "",
      otherProfession: "",
    }
  }

  if (isPredefinedProfession(trimmedProfession)) {
    return {
      profession: trimmedProfession,
      otherProfession: "",
    }
  }

  return {
    profession: OTHER_PROFESSION_VALUE,
    otherProfession: trimmedProfession,
  }
}

const schema = z
  .object({
    entityType: z.enum(["ORGANIZATION", "INDIVIDUAL"]).default("ORGANIZATION"),
    fullName: z.string().min(2, "Enter your full name"),
    personalPhone: z.string().regex(/^\d{10}$/, "Enter a valid 10 digit phone number"),
    dob: z.string().min(1, "Select your date of birth"),
    location: z.string().min(2, "Enter your location"),
    gender: z.string().min(1, "Select your gender"),
    profession: z.string().min(1, "Select your profession"),
    otherProfession: z.string().optional(),
    orgName: z.string().optional(),
    description: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
    primaryContactName: z.string().optional(),
    secondaryContactPhone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    websiteUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
    instagramUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
    linkedinUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
    panNumber: z.string().min(1, "Enter your PAN number").refine(
      (v) => PAN_RE.test(v.toUpperCase()),
      { message: "Invalid PAN format (e.g. ABCDE1234F)" }
    ),
    bankAccountName: z.string().min(2, "Enter the beneficiary name"),
    bankName: z.string().min(1, "Select your bank"),
    bankAccountType: z.string().min(1, "Select the account type"),
    bankAccountNumber: z.string().min(6, "Enter a valid account number"),
    confirmBankAccountNumber: z.string().optional(),
    bankIfsc: z.string().min(4, "Enter a valid IFSC code").refine(
      (v) => IFSC_RE.test(v.toUpperCase()),
      { message: "Invalid IFSC format (e.g. SBIN0000001)" }
    ),
    itrFiledLastTwoYears: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.dob && !isDobWithinBounds(value.dob, DOB_BOUNDS)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dob"],
        message: `Event organizers must be at least ${DOB_BOUNDS.minAge} years old.`,
      })
    }

    if (value.profession === OTHER_PROFESSION_VALUE && (!value.otherProfession || value.otherProfession.trim().length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["otherProfession"],
        message: "Enter your profession",
      })
    }

    if (value.entityType === "INDIVIDUAL") return
    const requiredFields: Array<keyof Omit<typeof value, "entityType">> = [
      "orgName",
      "description",
      "contactEmail",
      "contactPhone",
      "address",
      "city",
      "state",
      "pincode",
    ]
    for (const field of requiredFields) {
      const fieldValue = value[field]
      if (!fieldValue || !String(fieldValue).trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: "This field is required.",
        })
      }
    }

    if (value.contactEmail && !EMAIL_PATTERN.test(value.contactEmail.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contactEmail"],
        message: "Enter a valid contact email",
      })
    }

    if (value.contactPhone && !TEN_DIGIT_PHONE_PATTERN.test(value.contactPhone.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contactPhone"],
        message: "Contact phone must be 10 digits",
      })
    }

    if (value.secondaryContactPhone && value.secondaryContactPhone.trim() && !TEN_DIGIT_PHONE_PATTERN.test(value.secondaryContactPhone.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["secondaryContactPhone"],
        message: "Secondary phone must be 10 digits",
      })
    }

    if (value.primaryContactName && value.primaryContactName.trim() && value.primaryContactName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["primaryContactName"],
        message: "Enter a valid primary contact name",
      })
    }

    if (value.pincode && !PINCODE_PATTERN.test(value.pincode.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pincode"],
        message: "Pincode must be 6 digits",
      })
    }

    if (value.confirmBankAccountNumber && value.confirmBankAccountNumber !== value.bankAccountNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmBankAccountNumber"],
        message: "Account numbers do not match",
      })
    }

    // ITR is only asked (and only required) when the organizer has a GSTIN —
    // that branch is validated in onSubmit since it depends on UI state.
  })

type Values = z.infer<typeof schema>

const steps = [
  {
    id: 0,
    title: "Personal Details",
  },
  {
    id: 1,
    title: "Organization Details",
  },
  {
    id: 2,
    title: "Bank & Compliance",
  },
]

const individualSteps = [steps[0], steps[2]]

const stepOneFields: Array<keyof Values> = [
  "entityType",
  "fullName",
  "personalPhone",
  "dob",
  "location",
  "gender",
  "profession",
  "otherProfession",
]

const stepTwoFields: Array<keyof Values> = [
  "orgName",
  "description",
  "contactEmail",
  "contactPhone",
  "primaryContactName",
  "secondaryContactPhone",
  "address",
  "city",
  "state",
  "pincode",
  "websiteUrl",
  "instagramUrl",
  "linkedinUrl",
]

const stepThreeFields: Array<keyof Values> = [
  "panNumber",
  "bankAccountName",
  "bankName",
  "bankAccountType",
  "bankAccountNumber",
  "confirmBankAccountNumber",
  "bankIfsc",
]

const ACCOUNT_TYPE_OPTIONS = ["Savings account", "Current account"]

const BANK_NAME_OPTIONS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "Indian Bank",
  "Bank of India",
  "Central Bank of India",
  "Indian Overseas Bank",
  "IDBI Bank",
  "Yes Bank",
  "IndusInd Bank",
  "Federal Bank",
  "RBL Bank",
  "Bandhan Bank",
  "AU Small Finance Bank",
  "IDFC FIRST Bank",
  "Other",
]

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10"

const readOnlyInputClassName =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-700 shadow-sm"

const textareaClassName =
  "mt-2 min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10"

const getDraft = () => {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { step?: number; values?: Partial<Values> }
  } catch {
    return null
  }
}

const persistDraft = (step: number, values: Partial<Values>) => {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ step, values }))
}

const clearDraft = () => {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(DRAFT_STORAGE_KEY)
}

const stripIndianCode = (value: string | null | undefined) => (value ?? "").replace(/^\+91/, "")

export default function OrganizerOnboardingPage() {
  const router = useRouter()
  const { session, user, profile, organizerProfile, updateProfile, refreshOrganizerStatus, completeRoleOnboarding } = useAuth()

  const [step, setStep] = useState(0)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(DEFAULT_AVATAR_IMAGE)
  const [cropSource, setCropSource] = useState<string | null>(null)
  const [isCropOpen, setIsCropOpen] = useState(false)
  const [cropZoom, setCropZoom] = useState(1)
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [offsetStart, setOffsetStart] = useState({ x: 0, y: 0 })
  const [cropImage, setCropImage] = useState<HTMLImageElement | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSavingStepOne, setIsSavingStepOne] = useState(false)
  const [isSavingStepTwo, setIsSavingStepTwo] = useState(false)
  const [ifscLoading, setIfscLoading] = useState(false)
  const [ifscBranch, setIfscBranch] = useState<string | null>(null)
  const [dobOpen, setDobOpen] = useState(false)
  const [hasGstin, setHasGstin] = useState<"yes" | "no">("yes")
  const [gstDeclarationAccepted, setGstDeclarationAccepted] = useState(false)
  const [showGstModal, setShowGstModal] = useState(false)
  const [gstinRows, setGstinRows] = useState<GstinRow[]>([makeGstinRow()])
  const [gstinError, setGstinError] = useState<string | null>(null)
  const [noGstinStateError, setNoGstinStateError] = useState<string | null>(null)
  const [itrError, setItrError] = useState<string | null>(null)

  const cropContainerRef = useRef<HTMLDivElement>(null)
  const previewUrlRef = useRef<string | null>(null)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      entityType: "ORGANIZATION",
      fullName: "",
      personalPhone: "",
      dob: "",
      location: "",
      gender: "",
      profession: "",
      otherProfession: "",
      orgName: "",
      description: "",
      contactEmail: "",
      contactPhone: "",
      primaryContactName: "",
      secondaryContactPhone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      websiteUrl: "",
      instagramUrl: "",
      linkedinUrl: "",
      panNumber: "",
      bankAccountName: "",
      bankName: "",
      bankAccountType: "",
      bankAccountNumber: "",
      confirmBankAccountNumber: "",
      bankIfsc: "",
      itrFiledLastTwoYears: "",
    },
  })

  const entityType = form.watch("entityType")
  const selectedProfession = form.watch("profession")
  const panValue = form.watch("panNumber")
  const showOrganizationStep = entityType !== "INDIVIDUAL"
  const activeSteps = showOrganizationStep ? steps : individualSteps

  useEffect(() => {
    if (!showOrganizationStep && step === 1) {
      setStep(2)
    }
  }, [showOrganizationStep, step])

  useEffect(() => {
    const profileProfession = getProfessionFormValues(profile?.profession)
    const baseValues: Values = {
      entityType: organizerProfile?.entityType ?? "ORGANIZATION",
      fullName: profile?.full_name ?? "",
      personalPhone: stripIndianCode(profile?.phone),
      dob: profile?.dob ?? "",
      location: profile?.location ?? "",
      gender: profile?.gender ?? "",
      profession: profileProfession.profession,
      otherProfession: profileProfession.otherProfession,
      orgName: organizerProfile?.orgName ?? "",
      description: organizerProfile?.description ?? "",
      contactEmail: organizerProfile?.contactEmail ?? session?.user?.email ?? "",
      contactPhone: organizerProfile?.contactPhone ?? stripIndianCode(profile?.phone),
      primaryContactName: organizerProfile?.primaryContactName ?? "",
      secondaryContactPhone: organizerProfile?.secondaryContactPhone ?? "",
      address: organizerProfile?.address ?? "",
      city: organizerProfile?.city ?? "",
      state: organizerProfile?.state ?? "",
      pincode: organizerProfile?.pincode ?? "",
      websiteUrl: organizerProfile?.websiteUrl ?? "",
      instagramUrl: organizerProfile?.instagramUrl ?? "",
      linkedinUrl: organizerProfile?.linkedinUrl ?? "",
      panNumber: organizerProfile?.panNumber ?? "",
      bankAccountName: organizerProfile?.bankAccountName ?? "",
      bankName: organizerProfile?.bankName ?? "",
      bankAccountType: organizerProfile?.bankAccountType ?? "",
      bankAccountNumber: organizerProfile?.bankAccountNumber ?? "",
      bankIfsc: organizerProfile?.bankIfsc ?? "",
      itrFiledLastTwoYears:
        organizerProfile?.itrFiledLastTwoYears === true
          ? "yes"
          : organizerProfile?.itrFiledLastTwoYears === false
            ? "no"
            : "",
    }

    const draft = getDraft()
    form.reset({
      ...baseValues,
      ...(draft?.values ?? {}),
    })
    const normalizedDraftStep = typeof draft?.step === "number" && draft.step >= 0 && draft.step <= 2 ? draft.step : 0
    const draftEntityType =
      (draft?.values?.entityType as Values["entityType"] | undefined) ?? baseValues.entityType
    if (draftEntityType === "INDIVIDUAL" && normalizedDraftStep === 1) {
      setStep(2)
    } else {
      setStep(normalizedDraftStep)
    }
    setAvatarPreview(profile?.avatar_url ?? DEFAULT_AVATAR_IMAGE)
  }, [
    form,
    organizerProfile?.address,
    organizerProfile?.bankAccountName,
    organizerProfile?.bankAccountNumber,
    organizerProfile?.bankIfsc,
    organizerProfile?.city,
    organizerProfile?.contactEmail,
    organizerProfile?.contactPhone,
    organizerProfile?.description,
    organizerProfile?.entityType,
    organizerProfile?.bankName,
    organizerProfile?.bankAccountType,
    organizerProfile?.itrFiledLastTwoYears,
    organizerProfile?.instagramUrl,
    organizerProfile?.linkedinUrl,
    organizerProfile?.orgName,
    organizerProfile?.panNumber,
    organizerProfile?.pincode,
    organizerProfile?.primaryContactName,
    organizerProfile?.secondaryContactPhone,
    organizerProfile?.state,
    organizerProfile?.websiteUrl,
    profile?.avatar_url,
    profile?.dob,
    profile?.full_name,
    profile?.gender,
    profile?.location,
    profile?.phone,
    profile?.profession,
    session?.user?.email,
  ])

  // Seed the GSTIN choice + rows: the saved profile is the base, and an
  // in-progress local choice (if the user already picked one) overrides it.
  useEffect(() => {
    const profileRows = (organizerProfile?.gstDetails ?? [])
      .map((row) => makeGstinRow(row?.gstin ?? "", row?.state ?? "", true))
      .filter((row) => row.gstin || row.state)

    let next: { hasGstin: "yes" | "no"; accepted: boolean; rows: GstinRow[] } =
      organizerProfile?.gstDeclarationMode === "NO_GSTIN"
        ? { hasGstin: "no", accepted: !!organizerProfile?.undertakingAccepted, rows: [makeGstinRow()] }
        : { hasGstin: "yes", accepted: false, rows: profileRows.length ? profileRows : [makeGstinRow()] }

    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(GST_CHOICE_STORAGE_KEY) : null
      if (raw) {
        const parsed = JSON.parse(raw) as {
          hasGstin?: "yes" | "no"
          accepted?: boolean
          rows?: Array<{ gstin?: string; state?: string; verified?: boolean }>
        }
        if (parsed?.hasGstin === "yes" || parsed?.hasGstin === "no") {
          const storedRows = Array.isArray(parsed.rows)
            ? parsed.rows.map((row) => makeGstinRow(String(row?.gstin ?? ""), String(row?.state ?? ""), !!row?.verified))
            : []
          next = {
            hasGstin: parsed.hasGstin,
            accepted: parsed.hasGstin === "no" ? !!parsed.accepted : false,
            rows: storedRows.length ? storedRows : next.rows,
          }
        }
      }
    } catch {
      // ignore malformed choice
    }

    setHasGstin(next.hasGstin)
    setGstDeclarationAccepted(next.accepted)
    setGstinRows(next.rows.length ? next.rows : [makeGstinRow()])
  }, [
    organizerProfile?.gstDeclarationMode,
    organizerProfile?.undertakingAccepted,
    organizerProfile?.gstDetails,
  ])

  const persistGstChoice = (choice: "yes" | "no", accepted: boolean, rows: GstinRow[]) => {
    if (typeof window === "undefined") return
    const slimRows = rows.map((row) => ({ gstin: row.gstin, state: row.state, verified: row.verified }))
    window.localStorage.setItem(
      GST_CHOICE_STORAGE_KEY,
      JSON.stringify({ hasGstin: choice, accepted, rows: slimRows })
    )
  }

  useEffect(() => {
    const subscription = form.watch((value) => {
      persistDraft(step, value as Partial<Values>)
    })

    return () => subscription.unsubscribe()
  }, [form, step])

  useEffect(() => {
    persistDraft(step, form.getValues())
  }, [form, step])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const getCropMetrics = (zoom: number = cropZoom) => {
    if (!cropImage) return null

    const containerSize = 240
    const baseScale = Math.max(containerSize / cropImage.naturalWidth, containerSize / cropImage.naturalHeight)
    const scaledWidth = cropImage.naturalWidth * baseScale * zoom
    const scaledHeight = cropImage.naturalHeight * baseScale * zoom
    const maxX = Math.max(0, (scaledWidth - containerSize) / 2)
    const maxY = Math.max(0, (scaledHeight - containerSize) / 2)

    return { containerSize, baseScale, scaledWidth, scaledHeight, maxX, maxY }
  }

  const clampOffset = (offset: { x: number; y: number }, zoom: number = cropZoom) => {
    const metrics = getCropMetrics(zoom)
    if (!metrics) return { x: 0, y: 0 }

    return {
      x: Math.min(metrics.maxX, Math.max(-metrics.maxX, offset.x)),
      y: Math.min(metrics.maxY, Math.max(-metrics.maxY, offset.y)),
    }
  }

  const handleAvatarChange = (file: File | null) => {
    setError(null)
    if (!file) return

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError("Only PNG, JPG, GIF, or WEBP images are allowed.")
      return
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setError("Image must be 5MB or less.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      if (!result) return

      const image = new Image()
      image.onload = () => {
        setCropImage(image)
        setCropSource(result)
        setCropZoom(1)
        setCropOffset({ x: 0, y: 0 })
        setIsCropOpen(true)
      }
      image.src = result
    }
    reader.readAsDataURL(file)
  }

  const closeCrop = () => {
    setIsCropOpen(false)
    setCropSource(null)
    setCropImage(null)
  }

  const applyCrop = async () => {
    if (!cropImage) return
    const metrics = getCropMetrics()
    if (!metrics) return

    const scale = metrics.baseScale * cropZoom
    const sourceSize = metrics.containerSize / scale
    const sourceX = (cropImage.naturalWidth - sourceSize) / 2 - cropOffset.x / scale
    const sourceY = (cropImage.naturalHeight - sourceSize) / 2 - cropOffset.y / scale

    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 512

    const context = canvas.getContext("2d")
    if (!context) return

    context.drawImage(
      cropImage,
      Math.max(0, sourceX),
      Math.max(0, sourceY),
      Math.min(sourceSize, cropImage.naturalWidth),
      Math.min(sourceSize, cropImage.naturalHeight),
      0,
      0,
      canvas.width,
      canvas.height,
    )

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85))

    if (!blob || blob.size > MAX_AVATAR_FILE_SIZE) {
      setError("Cropped image is too large. Try zooming out.")
      return
    }

    const croppedFile = new File([blob], "avatar.webp", { type: "image/webp" })
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
    const previewUrl = URL.createObjectURL(croppedFile)
    previewUrlRef.current = previewUrl

    setAvatarPreview(previewUrl)
    setAvatarFile(croppedFile)
    setIsCropOpen(false)
  }

  const uploadAvatarIfNeeded = async () => {
    if (!avatarFile) {
      return
    }

    if (!user?.id) {
      throw new Error("Authentication required.")
    }

    const upload = await uploadOrganizerAvatarImage(avatarFile)
    setAvatarFile(null)
    setAvatarPreview(getAvatarImageUrl("organizers", user.id, upload.version))
  }

  const resolveProfession = (values: Values) =>
    values.profession === OTHER_PROFESSION_VALUE ? values.otherProfession?.trim() ?? "" : values.profession.trim()

  const buildOrganizerPayload = (values: Values) => {
    const validGstinRows = gstinRows
      .map((row) => ({ gstin: row.gstin.trim().toUpperCase(), state: row.state.trim() }))
      .filter((row) => row.gstin)

    return {
      entityType: values.entityType,
      orgName: values.entityType === "INDIVIDUAL" ? null : values.orgName?.trim() || null,
      description: values.entityType === "INDIVIDUAL" ? null : values.description?.trim() || null,
      contactEmail: values.entityType === "INDIVIDUAL" ? null : values.contactEmail?.trim() || null,
      contactPhone: values.entityType === "INDIVIDUAL" ? null : values.contactPhone?.trim() || null,
      address: values.entityType === "INDIVIDUAL" ? null : values.address?.trim() || null,
      city: values.entityType === "INDIVIDUAL" ? null : values.city?.trim() || null,
      state: values.entityType === "INDIVIDUAL" ? null : values.state?.trim() || null,
      pincode: values.entityType === "INDIVIDUAL" ? null : values.pincode?.trim() || null,
      panNumber: values.panNumber.trim().toUpperCase() || null,
      gstNumber: hasGstin === "no" ? null : validGstinRows[0]?.gstin ?? null,
      gstDeclarationMode: hasGstin === "no" ? "NO_GSTIN" : "HAS_GSTIN",
      gstDetails: hasGstin === "no" ? [] : validGstinRows,
      undertakingAccepted: hasGstin === "no" ? gstDeclarationAccepted : false,
      undertakingState: hasGstin === "no" ? (values.state?.trim() || null) : null,
      itrFiledLastTwoYears:
        hasGstin === "no"
          ? null
          : values.itrFiledLastTwoYears === "yes"
            ? true
            : values.itrFiledLastTwoYears === "no"
              ? false
              : null,
      bankAccountName: values.bankAccountName.trim() || null,
      bankName: values.bankName?.trim() || null,
      bankAccountType: values.bankAccountType?.trim() || null,
      bankAccountNumber: values.bankAccountNumber.trim() || null,
      bankIfsc: values.bankIfsc.trim().toUpperCase() || null,
      websiteUrl: values.websiteUrl?.trim() || null,
      instagramUrl: values.instagramUrl?.trim() || null,
      linkedinUrl: values.linkedinUrl?.trim() || null,
      primaryContactName: values.primaryContactName?.trim() || null,
      secondaryContactPhone: values.secondaryContactPhone?.trim() || null,
      logoUrl: organizerProfile?.logoUrl ?? null,
      logoPublicId: organizerProfile?.logoPublicId ?? null,
      kycDocUrl: organizerProfile?.kycDocUrl ?? null,
      kycDocPublicId: organizerProfile?.kycDocPublicId ?? null,
    }
  }

  const selectGstinYes = () => {
    setHasGstin("yes")
    setGstDeclarationAccepted(false)
    setShowGstModal(false)
    setGstinError(null)
    persistGstChoice("yes", false, gstinRows)
  }

  const selectGstinNo = () => {
    setHasGstin("no")
    setGstinError(null)
    persistGstChoice("no", gstDeclarationAccepted, gstinRows)
    if (!gstDeclarationAccepted) setShowGstModal(true)
  }

  const acceptGstDeclaration = () => {
    setGstDeclarationAccepted(true)
    setShowGstModal(false)
    persistGstChoice("no", true, gstinRows)
  }

  const closeGstModal = () => {
    // The "No" radio already reflects the choice; closing just dismisses the
    // undertaking. Acceptance is gated separately at submit time.
    setShowGstModal(false)
  }

  const updateGstinRow = (index: number, field: "gstin" | "state", value: string) => {
    setGstinError(null)
    setGstinRows((prev) => {
      const nextRows = prev.map((row, i) => {
        if (i !== index) return row
        if (field === "gstin") {
          const gstin = value.toUpperCase()
          // Editing the GSTIN invalidates any prior verification.
          return {
            ...row,
            gstin,
            // Auto-fill the state from the GSTIN's state code only when still blank.
            state: row.state.trim() ? row.state : stateFromGstin(gstin),
            verified: false,
            error: null,
            legalName: null,
          }
        }
        return { ...row, state: value }
      })
      persistGstChoice("yes", false, nextRows)
      return nextRows
    })
  }

  const addGstinRow = () => {
    setGstinRows((prev) => {
      const nextRows = [...prev, makeGstinRow()]
      persistGstChoice("yes", false, nextRows)
      return nextRows
    })
  }

  const removeGstinRow = (index: number) => {
    setGstinRows((prev) => {
      const filtered = prev.filter((_, i) => i !== index)
      const nextRows = filtered.length ? filtered : [makeGstinRow()]
      persistGstChoice("yes", false, nextRows)
      return nextRows
    })
  }

  const verifyGstinRow = async (index: number) => {
    const row = gstinRows[index]
    if (!row) return
    const gstin = row.gstin.trim().toUpperCase()
    const pan = (panValue ?? "").trim().toUpperCase()

    const setRow = (patch: Partial<GstinRow>) =>
      setGstinRows((prev) => prev.map((current, i) => (i === index ? { ...current, ...patch } : current)))

    if (!GSTIN_RE.test(gstin)) {
      setRow({ verified: false, error: "Enter a valid 15-character GSTIN." })
      return
    }
    if (!isValidGstinChecksum(gstin)) {
      setRow({ verified: false, error: "This GSTIN is not valid — its check digit does not match." })
      return
    }
    if (!pan) {
      setRow({ verified: false, error: "Enter your PAN above before verifying GSTIN." })
      return
    }
    if (gstin.slice(2, 12) !== pan) {
      setRow({ verified: false, error: "This GSTIN does not match your PAN." })
      return
    }

    setRow({ verifying: true, error: null })
    try {
      const res = await apiRequest<{ data: GstinVerifyResult }>("/organizer/verify/gstin", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ gstin }),
      })
      const result = res.data
      if (result.status && result.status !== "Active") {
        setGstinRows((prev) =>
          prev.map((current, i) =>
            i === index ? { ...current, verifying: false, verified: false, error: `GSTIN is ${result.status}. Only active GSTINs are accepted.` } : current
          )
        )
        return
      }
      if (result.embeddedPan && result.embeddedPan.toUpperCase() !== pan) {
        setGstinRows((prev) =>
          prev.map((current, i) =>
            i === index ? { ...current, verifying: false, verified: false, error: "This GSTIN is registered under a different PAN." } : current
          )
        )
        return
      }
      setGstinRows((prev) => {
        const nextRows = prev.map((current, i) =>
          i === index
            ? {
                ...current,
                verifying: false,
                verified: true,
                error: null,
                legalName: result.legalName ?? null,
                state: current.state.trim() ? current.state : stateFromGstin(gstin),
              }
            : current
        )
        persistGstChoice("yes", false, nextRows)
        return nextRows
      })
    } catch (err) {
      setGstinRows((prev) =>
        prev.map((current, i) =>
          i === index
            ? { ...current, verifying: false, verified: false, error: err instanceof Error ? err.message : "GSTIN verification failed." }
            : current
        )
      )
    }
  }

  const handleIfscBlur = async (code: string) => {
    const upper = code.toUpperCase().trim()
    if (!IFSC_RE.test(upper)) {
      setIfscBranch(null)
      return
    }
    setIfscLoading(true)
    try {
      const res = await apiRequest<{ data: { bank: string; branch: string } }>(
        `/organizer/verify/ifsc/${upper}`,
        { auth: true }
      )
      setIfscBranch(`${res.data.bank} — ${res.data.branch}`)
    } catch {
      setIfscBranch(null)
    } finally {
      setIfscLoading(false)
    }
  }

  const saveStepOne = async () => {
    setNotice(null)
    setError(null)

    const isValid = await form.trigger(stepOneFields)
    if (!isValid) return

    setIsSavingStepOne(true)

    try {
      const values = form.getValues()
      await uploadAvatarIfNeeded()

      await updateProfile({
        fullName: values.fullName.trim(),
        phone: `+91${values.personalPhone.trim()}`,
        dob: values.dob,
        location: values.location.trim(),
        gender: values.gender,
        profession: resolveProfession(values),
      })
      if (values.entityType === "INDIVIDUAL") {
        persistDraft(2, values)
        setStep(2)
        setNotice("Personal details saved. Organization step skipped for individual onboarding.")
      } else {
        persistDraft(1, values)
        setStep(1)
        setNotice("Personal details saved. You can continue now or return later.")
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your progress.")
    } finally {
      setIsSavingStepOne(false)
    }
  }

  const saveStepTwo = async () => {
    setNotice(null)
    setError(null)

    const isValid = await form.trigger(stepTwoFields)
    if (!isValid) return

    setIsSavingStepTwo(true)

    try {
      const values = form.getValues()

      await apiRequest("/organizer/profile", {
        method: "PUT",
        auth: true,
        body: JSON.stringify(buildOrganizerPayload(values)),
      })

      await refreshOrganizerStatus()
      persistDraft(2, values)
      setStep(2)
      setNotice("Organization details saved. You can continue now or return later.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your organization details.")
    } finally {
      setIsSavingStepTwo(false)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setNotice(null)
    setError(null)

    try {
      const isValid = await form.trigger(stepThreeFields)
      if (!isValid) return

      if (hasGstin === "no") {
        if (!gstDeclarationAccepted) {
          setError("Please review and accept the GST declaration to continue without a GSTIN.")
          setShowGstModal(true)
          return
        }
        if (!values.state?.trim()) {
          setNoGstinStateError("Please select your state.")
          setError("Please select your state.")
          return
        }
        setNoGstinStateError(null)
      } else {
        const pan = values.panNumber.trim().toUpperCase()
        const filled = gstinRows.filter((row) => row.gstin.trim() || row.state.trim())

        if (filled.length === 0) {
          setGstinError('Add and verify at least one GSTIN, or select "No" if you don\'t have one.')
          setError('Add and verify at least one GSTIN number, or select "No" above.')
          return
        }
        for (const row of filled) {
          const gstin = row.gstin.trim().toUpperCase()
          if (!GSTIN_RE.test(gstin) || !isValidGstinChecksum(gstin)) {
            setGstinError("Enter a valid GSTIN for each row.")
            setError("One of your GSTIN numbers is not a valid GSTIN.")
            return
          }
          if (pan && gstin.slice(2, 12) !== pan) {
            setGstinError("Each GSTIN must match your PAN (characters 3–12).")
            setError("A GSTIN you entered does not match your PAN.")
            return
          }
          if (!row.state.trim()) {
            setGstinError("Select the state for each GSTIN.")
            setError("Select the state for each GSTIN number.")
            return
          }
          if (!row.verified) {
            setGstinError("Verify each GSTIN before submitting.")
            setError("Please verify each GSTIN number before submitting.")
            return
          }
        }
        setGstinError(null)

        if (values.itrFiledLastTwoYears !== "yes" && values.itrFiledLastTwoYears !== "no") {
          setItrError("Please tell us if you have filed the last 2 years' ITR.")
          setError("Please answer the ITR filing question.")
          return
        }
        setItrError(null)
      }

      await uploadAvatarIfNeeded()

      await updateProfile({
        fullName: values.fullName.trim(),
        phone: `+91${values.personalPhone.trim()}`,
        dob: values.dob,
        location: values.location.trim(),
        gender: values.gender,
        profession: resolveProfession(values),
      })

      await completeRoleOnboarding("EVENT_ORGANIZER", buildOrganizerPayload(values))
      clearDraft()
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(GST_CHOICE_STORAGE_KEY)
      }

      if (user?.emailVerified) {
        if (user.organizerDocumentsSubmitted) {
          router.replace("/organizer/pending")
          return
        }
        router.replace("/organizer/document-upload")
        return
      }

      router.replace("/organizer/email-verification")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit organizer onboarding.")
    }
  })

  return (
    <ProtectedRoute requireOnboarding={false}>
      <main className="mx-auto w-full max-w-7xl px-2 py-3 sm:px-3 sm:py-4 lg:px-4">
        <div className="rounded-[2rem] border border-white/60 bg-white/90 p-4 shadow-[0_25px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-5">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Organizer Onboarding</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-500">
              Complete your personal details and bank details. Organization details are required only for organization onboarding.
            </p>
            <p className="max-w-3xl text-sm leading-6 text-slate-500">
              Your progress is saved as you move through the flow, so you can come back and continue later.
            </p>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200/80 bg-slate-50/70 p-4">
            <div className={`grid gap-3 ${activeSteps.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
              {activeSteps.map((item, index) => {
                const isActive = step === item.id
                const isDone = step > item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id <= step) {
                        setStep(item.id)
                      }
                    }}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-brand-900 bg-brand-900/5 shadow-sm"
                        : isDone
                          ? "border-emerald-200 bg-emerald-50/70"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                          isActive
                            ? "bg-brand-900 text-white"
                            : isDone
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Step {index + 1}</p>
                        <p className="mt-1 text-base font-semibold text-slate-950">{item.title}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <form className="mt-6 grid gap-6" onSubmit={onSubmit}>
            {step === 0 ? (
              <section className="grid gap-4 rounded-3xl border border-slate-200/80 bg-slate-50/60 p-5 md:grid-cols-[36%_64%]">
                <div className="flex h-full flex-col items-center justify-between gap-5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                  <div className="w-full">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Profile picture</p>
                  </div>

                  <div className="relative h-52 w-52 overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-[0_12px_22px_rgba(15,23,42,0.08)]">
                    <img
                      src={avatarPreview || DEFAULT_AVATAR_IMAGE}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = DEFAULT_AVATAR_IMAGE
                      }}
                    />
                  </div>

                  <label className="w-full text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Upload image
                    <input
                      className="mt-2 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-900/10 file:px-3 file:py-1.5 file:text-[10px] file:font-semibold file:text-brand-800 hover:file:bg-brand-900/20"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(event) => handleAvatarChange(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  <p className="text-center text-xs text-slate-400">PNG, JPG, GIF, or WEBP up to 5MB (optional)</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 md:pr-1">
                  <label className="block text-sm font-semibold text-slate-700">
                    Full name *
                    <input className={inputClassName} placeholder="Your full name" {...form.register("fullName")} />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.fullName?.message ?? ""}</p>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    Account email
                    <input className={readOnlyInputClassName} type="email" value={session?.user?.email ?? ""} readOnly disabled />
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    Personal phone number *
                    <div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-brand-900 focus-within:ring-4 focus-within:ring-brand-900/10">
                      <span className="text-sm font-semibold text-slate-500">+91</span>
                      <input
                        className="ml-2 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder="10 digit number"
                        inputMode="numeric"
                        maxLength={10}
                        {...form.register("personalPhone")}
                        onChange={(event) => form.setValue("personalPhone", event.target.value.replace(/\D/g, "").slice(0, 10), { shouldValidate: true })}
                      />
                    </div>
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.personalPhone?.message ?? ""}</p>
                  </label>

                  <div className="block text-sm font-semibold text-slate-700">
                    Date of birth *
                    <Popover open={dobOpen} onOpenChange={setDobOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={`${inputClassName} flex items-center justify-between`}
                        >
                          <span className={form.watch("dob") ? "text-slate-900" : "text-slate-400"}>
                            {form.watch("dob") && !Number.isNaN(new Date(form.watch("dob") + "T00:00:00").getTime())
                              ? format(new Date(form.watch("dob") + "T00:00:00"), "dd/MM/yyyy")
                              : "Select date of birth"}
                          </span>
                          <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            form.watch("dob") && !Number.isNaN(new Date(form.watch("dob") + "T00:00:00").getTime())
                              ? new Date(form.watch("dob") + "T00:00:00")
                              : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              form.setValue("dob", format(date, "yyyy-MM-dd"), { shouldValidate: true })
                              setDobOpen(false)
                            }
                          }}
                          captionLayout="dropdown"
                          startMonth={new Date(new Date().getFullYear() - 100, 0)}
                          endMonth={new Date(new Date().getFullYear() - DOB_BOUNDS.minAge, 11)}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.dob?.message ?? ""}</p>
                  </div>

                  <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                    Location *
                    <input className={inputClassName} placeholder="City, State" {...form.register("location")} />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.location?.message ?? ""}</p>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    Gender *
                    <select className={inputClassName} {...form.register("gender")}>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.gender?.message ?? ""}</p>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    Profession *
                    <select className={inputClassName} {...form.register("profession")}>
                      <option value="">Select</option>
                      {PROFESSION_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.profession?.message ?? ""}</p>
                  </label>

                  {selectedProfession === OTHER_PROFESSION_VALUE ? (
                    <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                      Other profession *
                      <input className={inputClassName} placeholder="Enter your profession" {...form.register("otherProfession")} />
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.otherProfession?.message ?? ""}</p>
                    </label>
                  ) : null}

                  <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-slate-700">Onboarding type</p>
                    <div className="mt-2 inline-flex rounded-full border border-slate-200 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => form.setValue("entityType", "ORGANIZATION", { shouldValidate: true })}
                        className={`rounded-full px-4 py-2 text-xs font-semibold ${
                          entityType === "ORGANIZATION" ? "bg-brand-900 text-white" : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Organization
                      </button>
                      <button
                        type="button"
                        onClick={() => form.setValue("entityType", "INDIVIDUAL", { shouldValidate: true })}
                        className={`rounded-full px-4 py-2 text-xs font-semibold ${
                          entityType === "INDIVIDUAL" ? "bg-brand-900 text-white" : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Individual
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {step === 1 && showOrganizationStep ? (
              <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-brand-900/10 p-3 text-brand-900">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-950">Organization details</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                    Organization name *
                    <input className={inputClassName} placeholder="Organization name" {...form.register("orgName")} />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.orgName?.message ?? ""}</p>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                    Organization description *
                    <textarea className={textareaClassName} placeholder="Tell us about your organization" {...form.register("description")} />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.description?.message ?? ""}</p>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    Contact email *
                    <input className={inputClassName} placeholder="contact@organization.com" {...form.register("contactEmail")} />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.contactEmail?.message ?? ""}</p>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    Contact phone *
                    <input
                      className={inputClassName}
                      placeholder="Organizer contact number"
                      inputMode="numeric"
                      maxLength={10}
                      {...form.register("contactPhone")}
                      onChange={(event) =>
                        form.setValue("contactPhone", event.target.value.replace(/\D/g, "").slice(0, 10), { shouldValidate: true })
                      }
                    />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.contactPhone?.message ?? ""}</p>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    Primary contact name
                    <input className={inputClassName} placeholder="Primary contact person" {...form.register("primaryContactName")} />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.primaryContactName?.message ?? ""}</p>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    Secondary contact phone
                    <input
                      className={inputClassName}
                      placeholder="Optional backup number"
                      inputMode="numeric"
                      maxLength={10}
                      {...form.register("secondaryContactPhone")}
                      onChange={(event) =>
                        form.setValue("secondaryContactPhone", event.target.value.replace(/\D/g, "").slice(0, 10), { shouldValidate: true })
                      }
                    />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.secondaryContactPhone?.message ?? ""}</p>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                    Address *
                    <input className={inputClassName} placeholder="Street address" {...form.register("address")} />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.address?.message ?? ""}</p>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    City *
                    <input className={inputClassName} placeholder="City" {...form.register("city")} />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.city?.message ?? ""}</p>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    State *
                    <input className={inputClassName} placeholder="State" {...form.register("state")} />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.state?.message ?? ""}</p>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    Pincode *
                    <input
                      className={inputClassName}
                      placeholder="Pincode"
                      inputMode="numeric"
                      maxLength={6}
                      {...form.register("pincode")}
                      onChange={(event) => form.setValue("pincode", event.target.value.replace(/\D/g, "").slice(0, 6), { shouldValidate: true })}
                    />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.pincode?.message ?? ""}</p>
                  </label>

                  <div className="hidden md:block" />

                  <label className="block text-sm font-semibold text-slate-700">
                    Website
                    <input className={inputClassName} placeholder="https://your-website.com" {...form.register("websiteUrl")} />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.websiteUrl?.message ?? ""}</p>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    Instagram
                    <input className={inputClassName} placeholder="https://instagram.com/your-handle" {...form.register("instagramUrl")} />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.instagramUrl?.message ?? ""}</p>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    LinkedIn
                    <input className={inputClassName} placeholder="https://linkedin.com/company/your-page" {...form.register("linkedinUrl")} />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.linkedinUrl?.message ?? ""}</p>
                  </label>
                </div>
              </section>
            ) : null}

            {step === 2 ? (
              <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                <div className="flex items-start gap-3 mb-5">
                  <div className="rounded-2xl bg-brand-900/10 p-3 text-brand-900">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-950">Bank &amp; Compliance</p>
                    <p className="text-sm text-slate-500">Bank details, PAN, and GSTIN verification</p>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  {/* Left: PAN + GSTIN */}
                  <div className="grid gap-4 content-start">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">Tax Identity</p>

                      {/* PAN */}
                      <div className="mb-3">
                        <label className="block text-sm font-semibold text-slate-700">
                          PAN number *
                        </label>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            className={inputClassName}
                            placeholder="ABCDE1234F"
                            style={{ textTransform: "uppercase" }}
                            {...form.register("panNumber")}
                            onChange={(e) => {
                              form.setValue("panNumber", e.target.value.toUpperCase(), { shouldValidate: true })
                            }}
                          />
                          {panValue && PAN_RE.test((panValue ?? "").toUpperCase()) ? (
                            <span className="shrink-0 text-xs font-semibold text-emerald-600">✓ Valid</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-rose-600">{form.formState.errors.panNumber?.message ?? ""}</p>
                      </div>

                      {/* GSTIN */}
                      <div>
                        <p className="block text-sm font-semibold text-slate-700">Do you have a GSTIN number?</p>
                        <div className="mt-2 flex items-center gap-6">
                          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                            <input
                              type="radio"
                              name="hasGstin"
                              className="h-4 w-4 accent-brand-900"
                              checked={hasGstin === "yes"}
                              onChange={selectGstinYes}
                            />
                            Yes
                          </label>
                          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                            <input
                              type="radio"
                              name="hasGstin"
                              className="h-4 w-4 accent-brand-900"
                              checked={hasGstin === "no"}
                              onChange={selectGstinNo}
                            />
                            No
                          </label>
                        </div>

                        {hasGstin === "yes" ? (
                          <div className="mt-4 space-y-3">
                            {gstinRows.map((row, index) => (
                              <div key={index} className="rounded-2xl border border-slate-200 bg-white p-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-600">GSTIN Number</label>
                                    <input
                                      className={`${inputClassName} mt-1`}
                                      placeholder="Enter your GSTIN Number"
                                      style={{ textTransform: "uppercase" }}
                                      value={row.gstin}
                                      onChange={(e) => updateGstinRow(index, "gstin", e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-600">State</label>
                                    <select
                                      className={`${inputClassName} mt-1`}
                                      value={row.state}
                                      onChange={(e) => updateGstinRow(index, "state", e.target.value)}
                                    >
                                      <option value="">State</option>
                                      {INDIAN_STATES.map((stateName) => (
                                        <option key={stateName} value={stateName}>{stateName}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <div className="text-xs">
                                    {row.verifying ? (
                                      <span className="text-slate-400">Verifying…</span>
                                    ) : row.verified ? (
                                      <span className="font-medium text-emerald-700">✓ Verified{row.legalName ? ` · ${row.legalName}` : ""}</span>
                                    ) : row.error ? (
                                      <span className="text-rose-600">{row.error}</span>
                                    ) : (
                                      <span className="text-slate-400">Verify this GSTIN to continue.</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={row.verifying || !GSTIN_RE.test(row.gstin.trim().toUpperCase())}
                                      onClick={() => void verifyGstinRow(index)}
                                      className="shrink-0 rounded-full bg-brand-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                                    >
                                      {row.verifying ? "Checking..." : row.verified ? "Re-verify" : "Verify"}
                                    </button>
                                    {gstinRows.length > 1 ? (
                                      <button
                                        type="button"
                                        onClick={() => removeGstinRow(index)}
                                        className="shrink-0 rounded-full border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                                        aria-label={`Remove GSTIN ${index + 1}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={addGstinRow}
                              className="text-sm font-semibold text-brand-800 hover:underline"
                            >
                              +Add another GSTIN number
                            </button>

                            {gstinError ? <p className="text-xs text-rose-600">{gstinError}</p> : null}

                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                              Note: You can add multiple GSTIN numbers and certificates for different states later through the profile section.
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4">
                            <label className="flex items-start gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 accent-brand-900"
                                checked={gstDeclarationAccepted}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setShowGstModal(true)
                                  } else {
                                    setGstDeclarationAccepted(false)
                                    persistGstChoice("no", false, gstinRows)
                                  }
                                }}
                              />
                              <span>
                                I have read and accept the{" "}
                                <button
                                  type="button"
                                  onClick={() => setShowGstModal(true)}
                                  className="font-semibold text-brand-800 underline underline-offset-2"
                                >
                                  undertaking
                                </button>
                              </span>
                            </label>
                            {gstinError ? <p className="mt-2 text-xs text-rose-600">{gstinError}</p> : null}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ITR filing — only relevant when the organizer has a GSTIN */}
                    {hasGstin === "yes" ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                        <p className="block text-sm font-semibold text-slate-700">Have you filed last 2 years ITR return?</p>
                        <div className="mt-2 flex items-center gap-6">
                          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                            <input
                              type="radio"
                              name="itr"
                              className="h-4 w-4 accent-brand-900"
                              checked={form.watch("itrFiledLastTwoYears") === "yes"}
                              onChange={() => {
                                form.setValue("itrFiledLastTwoYears", "yes")
                                setItrError(null)
                              }}
                            />
                            Yes
                          </label>
                          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                            <input
                              type="radio"
                              name="itr"
                              className="h-4 w-4 accent-brand-900"
                              checked={form.watch("itrFiledLastTwoYears") === "no"}
                              onChange={() => {
                                form.setValue("itrFiledLastTwoYears", "no")
                                setItrError(null)
                              }}
                            />
                            No
                          </label>
                        </div>
                        {itrError ? <p className="mt-1 text-xs text-rose-600">{itrError}</p> : null}
                      </div>
                    ) : null}

                    {/* State — required for the declaration when there is no GSTIN */}
                    {hasGstin === "no" ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                        <label className="block text-sm font-semibold text-slate-700">
                          State *
                          <select
                            className={inputClassName}
                            value={form.watch("state") ?? ""}
                            onChange={(e) => {
                              form.setValue("state", e.target.value, { shouldValidate: true })
                              if (e.target.value.trim()) setNoGstinStateError(null)
                            }}
                          >
                            <option value="">Select state</option>
                            {INDIAN_STATES.map((stateName) => (
                              <option key={stateName} value={stateName}>{stateName}</option>
                            ))}
                          </select>
                        </label>
                        {noGstinStateError ? (
                          <p className="mt-1 text-xs text-rose-600">{noGstinStateError}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {/* Right: Bank details */}
                  <div className="grid gap-4 content-start">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">Bank Account</p>

                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Beneficiary Name *
                        <input className={inputClassName} placeholder="Name as per bank account" {...form.register("bankAccountName")} />
                        <p className="mt-1 text-xs text-rose-600">{form.formState.errors.bankAccountName?.message ?? ""}</p>
                      </label>

                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Account Type *
                        <select className={inputClassName} {...form.register("bankAccountType")}>
                          <option value="">Select account type</option>
                          {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-rose-600">{form.formState.errors.bankAccountType?.message ?? ""}</p>
                      </label>

                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Bank Name *
                        <select className={inputClassName} {...form.register("bankName")}>
                          <option value="">Select your bank</option>
                          {BANK_NAME_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-rose-600">{form.formState.errors.bankName?.message ?? ""}</p>
                      </label>

                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Account number *
                        <input className={inputClassName} placeholder="Bank account number" {...form.register("bankAccountNumber")} />
                        <p className="mt-1 text-xs text-rose-600">{form.formState.errors.bankAccountNumber?.message ?? ""}</p>
                      </label>

                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Confirm account number *
                        <input className={inputClassName} placeholder="Re-enter account number" {...form.register("confirmBankAccountNumber")} />
                        <p className="mt-1 text-xs text-rose-600">{form.formState.errors.confirmBankAccountNumber?.message ?? ""}</p>
                      </label>

                      <label className="block text-sm font-semibold text-slate-700">
                        IFSC code *
                        <input
                          className={inputClassName}
                          placeholder="SBIN0000001"
                          style={{ textTransform: "uppercase" }}
                          {...form.register("bankIfsc")}
                          onChange={(e) => {
                            form.setValue("bankIfsc", e.target.value.toUpperCase(), { shouldValidate: true })
                          }}
                          onBlur={(e) => void handleIfscBlur(e.target.value)}
                        />
                        <p className="mt-1 text-xs text-rose-600">{form.formState.errors.bankIfsc?.message ?? ""}</p>
                        {ifscLoading ? (
                          <p className="mt-1 text-xs text-slate-400">Looking up branch...</p>
                        ) : ifscBranch ? (
                          <p className="mt-1 text-xs text-emerald-700 font-medium">{ifscBranch}</p>
                        ) : null}
                      </label>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <p className="text-xs leading-5 text-slate-500">
                          Keep your PAN, GSTIN, and bank details ready. These are verified during the approval process to confirm your identity and enable payouts.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
            ) : null}
            {notice ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-2">
              <div className="flex items-center">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setStep((current) => {
                        if (!showOrganizationStep && current === 2) return 0
                        return Math.max(current - 1, 0)
                      })
                    }
                    className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Back
                  </button>
                ) : null}
              </div>

              <div className="ml-auto flex items-center">
                {step === 0 ? (
                  <button
                    type="button"
                    onClick={() => void saveStepOne()}
                    disabled={isSavingStepOne}
                    className="rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
                  >
                    {isSavingStepOne ? "Saving..." : "Save & Continue"}
                  </button>
                ) : step === 1 ? (
                  <button
                    type="button"
                    onClick={() => void saveStepTwo()}
                    disabled={isSavingStepTwo}
                    className="rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
                  >
                    {isSavingStepTwo ? "Saving..." : "Save & Continue"}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={form.formState.isSubmitting || (hasGstin === "no" && !gstDeclarationAccepted)}
                    className="rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
                  >
                    {form.formState.isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {isCropOpen ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4">
            <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-white p-5 shadow-[0_30px_70px_rgba(15,23,42,0.3)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Adjust image</p>
                  <h2 className="text-xl font-semibold text-slate-900">Set your profile crop</h2>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-50"
                  onClick={closeCrop}
                >
                  Cancel
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_190px]">
                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div
                    ref={cropContainerRef}
                    className="relative h-60 w-60 overflow-hidden rounded-full border border-slate-200 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId)
                      setDragStart({ x: event.clientX, y: event.clientY })
                      setOffsetStart(cropOffset)
                    }}
                    onPointerMove={(event) => {
                      if (!dragStart) return
                      const next = {
                        x: offsetStart.x + (event.clientX - dragStart.x),
                        y: offsetStart.y + (event.clientY - dragStart.y),
                      }
                      setCropOffset(clampOffset(next))
                    }}
                    onPointerUp={() => setDragStart(null)}
                    onPointerLeave={() => setDragStart(null)}
                  >
                    {cropSource ? (
                      <div
                        className="absolute inset-0 bg-cover bg-no-repeat bg-center"
                        style={{
                          backgroundImage: `url(${cropSource})`,
                          backgroundSize: `${getCropMetrics()?.scaledWidth ?? 240}px ${getCropMetrics()?.scaledHeight ?? 240}px`,
                          backgroundPosition: `calc(50% + ${cropOffset.x}px) calc(50% + ${cropOffset.y}px)`,
                        }}
                      />
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-6">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Zoom</p>
                    <input
                      className="mt-3 w-full accent-brand-900"
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={cropZoom}
                      onChange={(event) => {
                        const nextZoom = Number(event.target.value)
                        setCropZoom(nextZoom)
                        setCropOffset((previous) => clampOffset(previous, nextZoom))
                      }}
                    />
                    <p className="mt-2 text-xs text-slate-500">Drag to reposition.</p>
                  </div>

                  <button
                    type="button"
                    className="w-full rounded-full bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
                    onClick={() => void applyCrop()}
                  >
                    Use this image
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {showGstModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_30px_70px_rgba(15,23,42,0.3)]">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">GST Undertaking / Declaration</h2>
                  <p className="text-sm text-slate-500">(For Organizers without GSTIN)</p>
                </div>
                <button
                  type="button"
                  onClick={closeGstModal}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto px-6 py-5 text-sm leading-6 text-slate-700">
                <p>
                  I/We, Organizer, do confirm and acknowledge that I am/We are a supplier providing services
                  through an e-commerce platform as per Section 24(ix) of the Central Goods and Services Tax Act,
                  2017 under the prevalent GST regime (&quot;GST Laws&quot;) and confirm that I/We are not registered
                  under the GST Act, since our annual turnover is below the threshold limit of Rs. 20 Lakhs
                  (supplier supplying only services).
                </p>
                <p>
                  I/We confirm that any applicable taxes collected on the Tickets / Bookings / Experiences booked
                  through Baatasari platform i.e. www.baatasari.com and/or its mobile application and/or other sales
                  channels is our liability and the same shall be duly discharged by us.
                </p>
                <p>
                  I/We acknowledge that information furnished above is true to the best of my/our knowledge and that
                  we shall be bound by the acts of duly constituted attorney.
                </p>
                <p>
                  In case any of the above information is found to be incorrect at a later date, my membership with
                  your platform shall stand cancelled and any payment or unprocessed settlement shall be withheld by
                  you on the basis of the statements given herein above.
                </p>
                <p>I/We request you to permit and allow our event(s) to be listed on your platform.</p>
                <p>
                  I/We shall indemnify and hold harmless Baatasari, its owners, directors, officers, representatives,
                  affiliates, successors and assigns, against all costs, penalties, damages, or losses or any other
                  charges, penalties, or liabilities incurred in relation to any claim raised pursuant to the
                  following:
                </p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>Breach, violation or non-compliance of any of the provisions contained in this declaration.</li>
                  <li>Any act of omission or commission pursuant to which any of the representations given become untrue.</li>
                  <li>Violation of any applicable law including GST laws.</li>
                  <li>Non-compliance with GST laws.</li>
                  <li>Any investigations, inquiries, summons or inspections conducted by any authority.</li>
                </ul>
                <p>
                  I/We also undertake the responsibility to inform all subsequent changes in the constitution or
                  working of my/our business entity having membership with your platform, affecting the accuracy of
                  the answers given and will be promptly communicated to you.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeGstModal}
                  className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={acceptGstDeclaration}
                  className="rounded-full bg-brand-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </ProtectedRoute>
  )
}
