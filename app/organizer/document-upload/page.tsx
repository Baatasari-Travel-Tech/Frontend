"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard } from "@/components/platform/page-shell"
import { useAuth } from "@/app/providers"
import { INDIA_STATES } from "@/lib/india-states"
import {
  completeOrganizerDocuments,
  uploadOrganizerDocument,
} from "@/lib/api/organizer-documents"

type GstEntry = {
  id: string
  gstin: string
  state: string
}

type SignatureTab = "upload" | "draw"

const makeGstEntry = (): GstEntry => ({
  id: crypto.randomUUID(),
  gstin: "",
  state: "",
})

const todayLabel = new Date().toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "long",
  year: "numeric",
})

const isPdfFile = (file: File) =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")

const BAATASARI_ADDRESS_LINES = [
  "Ground Floor, Wajeda House",
  "Gulmohar Cross Road No. 7, Juhu Scheme",
  "Mumbai - 400049",
]

const formatValue = (value: string | null | undefined, fallback = "Not provided") => {
  const nextValue = value?.trim()
  return nextValue && nextValue.length > 0 ? nextValue : fallback
}

export default function OrganizerDocumentUploadPage() {
  const router = useRouter()
  const { user, profile, organizerProfile, organizerVerificationStatus, refreshOrganizerStatus } = useAuth()

  const [gstAnswer, setGstAnswer] = useState<"YES" | "NO">("NO")
  const [gstEntries, setGstEntries] = useState<GstEntry[]>([makeGstEntry()])
  const [undertakingAccepted, setUndertakingAccepted] = useState(false)
  const [undertakingState, setUndertakingState] = useState("")
  const [isDeclarationOpen, setIsDeclarationOpen] = useState(false)
  const [panFileName, setPanFileName] = useState<string | null>(null)
  const [isUploadingPan, setIsUploadingPan] = useState(false)
  const [panUploaded, setPanUploaded] = useState(false)
  const [agreementDownloaded, setAgreementDownloaded] = useState(false)
  const [isBuildingAgreement, setIsBuildingAgreement] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [signatureModalOpen, setSignatureModalOpen] = useState(false)
  const [signatureTab, setSignatureTab] = useState<SignatureTab>("upload")
  const [uploadScale, setUploadScale] = useState(1)
  const [uploadRotation, setUploadRotation] = useState(0)
  const [uploadImage, setUploadImage] = useState<HTMLImageElement | null>(null)

  const agreementRef = useRef<HTMLDivElement>(null)
  const uploadPreviewRef = useRef<HTMLCanvasElement>(null)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const drawPointRef = useRef<{ x: number; y: number } | null>(null)
  const uploadObjectUrlRef = useRef<string | null>(null)

  const organizerDisplayName = useMemo(() => {
    const fullName = profile?.full_name?.trim()
    if (fullName) return fullName
    const orgName = organizerProfile?.orgName?.trim()
    if (orgName) return orgName
    return user?.email ?? "Organizer"
  }, [organizerProfile?.orgName, profile?.full_name, user?.email])

  const organizerAddress = useMemo(() => {
    const parts = [
      organizerProfile?.address,
      organizerProfile?.city,
      organizerProfile?.state,
      organizerProfile?.pincode ? `PIN ${organizerProfile.pincode}` : null,
    ]
      .map((part) => part?.trim() ?? "")
      .filter((part) => part.length > 0)
    if (parts.length === 0) return "Not provided"
    return parts.join(", ")
  }, [organizerProfile?.address, organizerProfile?.city, organizerProfile?.pincode, organizerProfile?.state])

  const organizerEntityTypeLabel =
    organizerProfile?.entityType === "INDIVIDUAL" ? "Individual" : "Organization"

  useEffect(() => {
    if (!user) return
    if (user.role !== "ORGANIZER") {
      router.replace("/403")
      return
    }
    if (user.onboardingStatus !== "COMPLETED") {
      router.replace("/organizer/onboarding")
      return
    }
    if (organizerVerificationStatus === "EMAIL_NOT_VERIFIED") {
      router.replace("/organizer/email-verification")
      return
    }
    if (organizerVerificationStatus === "PENDING") {
      router.replace("/organizer/pending")
      return
    }
    if (organizerVerificationStatus === "APPROVED") {
      router.replace("/organizer/dashboard")
    }
  }, [organizerVerificationStatus, router, user])

  useEffect(() => {
    if (!organizerProfile) return
    if (organizerProfile.gstDeclarationMode === "HAS_GSTIN") {
      setGstAnswer("YES")
    } else if (organizerProfile.gstDeclarationMode === "NO_GSTIN") {
      setGstAnswer("NO")
    }
    if (organizerProfile.gstDetails.length > 0) {
      setGstEntries(
        organizerProfile.gstDetails.map((entry) => ({
          id: crypto.randomUUID(),
          gstin: entry.gstin,
          state: entry.state,
        }))
      )
    }
    setUndertakingAccepted(organizerProfile.undertakingAccepted)
    setUndertakingState(organizerProfile.undertakingState ?? "")
    setPanUploaded(Boolean(organizerProfile.panDocumentKey))
    setAgreementDownloaded(Boolean(organizerProfile.agreementDownloadedAt))
  }, [organizerProfile])

  useEffect(() => {
    return () => {
      if (uploadObjectUrlRef.current) {
        URL.revokeObjectURL(uploadObjectUrlRef.current)
      }
    }
  }, [])

  const renderUploadPreview = useCallback(() => {
    const canvas = uploadPreviewRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = "#f8fafc"
    context.fillRect(0, 0, canvas.width, canvas.height)

    if (!uploadImage) return
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const baseScale = Math.min((canvas.width * 0.75) / uploadImage.width, (canvas.height * 0.75) / uploadImage.height)
    const width = uploadImage.width * baseScale * uploadScale
    const height = uploadImage.height * baseScale * uploadScale

    context.save()
    context.translate(centerX, centerY)
    context.rotate((uploadRotation * Math.PI) / 180)
    context.drawImage(uploadImage, -width / 2, -height / 2, width, height)
    context.restore()
  }, [uploadImage, uploadRotation, uploadScale])

  useEffect(() => {
    renderUploadPreview()
  }, [renderUploadPreview])

  const handleUploadSignatureFile = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Signature upload must be an image file.")
      return
    }
    if (uploadObjectUrlRef.current) {
      URL.revokeObjectURL(uploadObjectUrlRef.current)
    }
    const objectUrl = URL.createObjectURL(file)
    uploadObjectUrlRef.current = objectUrl
    const image = new Image()
    image.onload = () => {
      setUploadImage(image)
      setUploadScale(1)
      setUploadRotation(0)
      setError(null)
    }
    image.src = objectUrl
  }

  const saveUploadedSignature = () => {
    if (!uploadImage) {
      setError("Upload a signature image first.")
      return
    }
    const canvas = document.createElement("canvas")
    canvas.width = 700
    canvas.height = 250
    const context = canvas.getContext("2d")
    if (!context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const baseScale = Math.min((canvas.width * 0.75) / uploadImage.width, (canvas.height * 0.75) / uploadImage.height)
    const width = uploadImage.width * baseScale * uploadScale
    const height = uploadImage.height * baseScale * uploadScale
    context.save()
    context.translate(centerX, centerY)
    context.rotate((uploadRotation * Math.PI) / 180)
    context.drawImage(uploadImage, -width / 2, -height / 2, width, height)
    context.restore()

    setSignatureDataUrl(canvas.toDataURL("image/png"))
    setSignatureModalOpen(false)
    setSuccess("Organizer signature captured.")
  }

  const clearDrawCanvas = () => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    setError(null)
  }

  const drawAtPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    }
  }

  const beginDraw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return
    const point = drawAtPoint(event)
    if (!point) return
    drawingRef.current = true
    drawPointRef.current = point
    context.lineWidth = 3
    context.lineCap = "round"
    context.strokeStyle = "#0f172a"
  }

  const continueDraw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const canvas = drawCanvasRef.current
    const context = canvas?.getContext("2d")
    const point = drawAtPoint(event)
    if (!canvas || !context || !point || !drawPointRef.current) return
    context.beginPath()
    context.moveTo(drawPointRef.current.x, drawPointRef.current.y)
    context.lineTo(point.x, point.y)
    context.stroke()
    drawPointRef.current = point
  }

  const endDraw = () => {
    drawingRef.current = false
    drawPointRef.current = null
  }

  const saveDrawnSignature = () => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    setSignatureDataUrl(canvas.toDataURL("image/png"))
    setSignatureModalOpen(false)
    setSuccess("Organizer signature captured.")
  }

  const getSanitizedGstEntries = () =>
    gstEntries
      .map((entry) => ({
        gstin: entry.gstin.trim(),
        state: entry.state.trim(),
      }))
      .filter((entry) => entry.gstin.length > 0 && entry.state.length > 0)

  const validateDeclaration = () => {
    if (gstAnswer === "YES") {
      if (getSanitizedGstEntries().length === 0) {
        throw new Error("Add at least one GSTIN and state entry.")
      }
      return
    }
    if (!undertakingAccepted) {
      throw new Error("Accept the undertaking declaration to continue.")
    }
    if (!undertakingState.trim()) {
      throw new Error("Select your state for the undertaking declaration.")
    }
  }

  const handlePanUpload = async (file: File) => {
    try {
      setError(null)
      setSuccess(null)
      if (!isPdfFile(file)) {
        throw new Error("PAN file must be a PDF.")
      }
      validateDeclaration()
      setIsUploadingPan(true)
      await uploadOrganizerDocument("pan", file)
      setPanUploaded(true)
      setPanFileName(file.name)
      await refreshOrganizerStatus()
      setSuccess("PAN PDF selected and uploaded securely.")
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "PAN upload failed.")
    } finally {
      setIsUploadingPan(false)
    }
  }

  const buildAgreementPdf = async () => {
    if (!agreementRef.current) {
      throw new Error("Agreement view is not ready yet.")
    }
    const canvas = await html2canvas(agreementRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: agreementRef.current.scrollWidth,
      windowHeight: agreementRef.current.scrollHeight,
    })
    const imageData = canvas.toDataURL("image/png")
    const pdf = new jsPDF("p", "pt", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 24
    const renderWidth = pageWidth - margin * 2
    const renderHeight = (canvas.height * renderWidth) / canvas.width

    let heightLeft = renderHeight
    let y = margin
    pdf.addImage(imageData, "PNG", margin, y, renderWidth, renderHeight)
    heightLeft -= pageHeight - margin * 2

    while (heightLeft > 0) {
      y = margin - (renderHeight - heightLeft)
      pdf.addPage()
      pdf.addImage(imageData, "PNG", margin, y, renderWidth, renderHeight)
      heightLeft -= pageHeight - margin * 2
    }

    return pdf.output("blob")
  }

  const handleDownloadAgreement = async () => {
    try {
      setError(null)
      setSuccess(null)
      validateDeclaration()
      if (!panUploaded) {
        throw new Error("Upload PAN PDF before downloading agreement.")
      }
      if (!signatureDataUrl) {
        throw new Error("Add organizer signature before downloading agreement.")
      }
      setIsBuildingAgreement(true)
      const agreementBlob = await buildAgreementPdf()
      await uploadOrganizerDocument("agreement", agreementBlob)
      const downloadUrl = URL.createObjectURL(agreementBlob)
      const anchor = document.createElement("a")
      anchor.href = downloadUrl
      anchor.download = `baatasari-organizer-agreement-${user?.id ?? "signed"}.pdf`
      anchor.click()
      URL.revokeObjectURL(downloadUrl)
      setAgreementDownloaded(true)
      await refreshOrganizerStatus()
      setSuccess("Agreement downloaded and stored securely.")
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Agreement generation failed.")
    } finally {
      setIsBuildingAgreement(false)
    }
  }

  const handleSubmitDocuments = async () => {
    try {
      setError(null)
      setSuccess(null)
      validateDeclaration()
      if (!panUploaded || !agreementDownloaded) {
        throw new Error("Upload PAN and download signed agreement before submitting.")
      }
      setIsSubmitting(true)
      const mode = gstAnswer === "YES" ? "HAS_GSTIN" : "NO_GSTIN"
      const gstDetails = mode === "HAS_GSTIN" ? getSanitizedGstEntries() : []
      await completeOrganizerDocuments({
        gstDeclarationMode: mode,
        gstDetails,
        undertakingAccepted: mode === "NO_GSTIN" ? undertakingAccepted : undefined,
        undertakingState: mode === "NO_GSTIN" ? undertakingState : null,
      })
      await refreshOrganizerStatus()
      router.replace("/organizer/pending")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit documents.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute requireOnboarding={false}>
      <PageShell
        eyebrow="Organizer document upload"
        title="Upload Compliance Documents"
        description="Email verification is complete. Upload PAN and signed agreement to move into final approval review."
      >
        <div className="grid gap-6">
          <SectionCard title="GST Declaration">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-800">Do you have GSTIN number?</p>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="gst-answer"
                    checked={gstAnswer === "YES"}
                    onChange={() => setGstAnswer("YES")}
                  />
                  Yes
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="gst-answer"
                    checked={gstAnswer === "NO"}
                    onChange={() => {
                      setGstAnswer("NO")
                      setIsDeclarationOpen(true)
                    }}
                  />
                  No
                </label>
              </div>

              {gstAnswer === "YES" ? (
                <div className="space-y-3">
                  {gstEntries.map((entry, index) => (
                    <div key={entry.id} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[1fr_1fr_auto]">
                      <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder={`GSTIN #${index + 1}`}
                        value={entry.gstin}
                        onChange={(event) =>
                          setGstEntries((current) =>
                            current.map((item) =>
                              item.id === entry.id ? { ...item, gstin: event.target.value.toUpperCase() } : item
                            )
                          )
                        }
                      />
                      <select
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={entry.state}
                        onChange={(event) =>
                          setGstEntries((current) =>
                            current.map((item) =>
                              item.id === entry.id ? { ...item, state: event.target.value } : item
                            )
                          )
                        }
                      >
                        <option value="">Select state</option>
                        {INDIA_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          setGstEntries((current) => (current.length > 1 ? current.filter((item) => item.id !== entry.id) : current))
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setGstEntries((current) => [...current, makeGstEntry()])}
                    className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    + Add more
                  </button>
                </div>
              ) : (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={undertakingAccepted}
                      onChange={(event) => setUndertakingAccepted(event.target.checked)}
                    />
                    I have read and accept the{" "}
                    <button
                      type="button"
                      className="font-semibold text-brand-900 underline"
                      onClick={() => setIsDeclarationOpen(true)}
                    >
                      undertaking
                    </button>
                  </label>
                  <div className="grid gap-2 sm:max-w-sm">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">State</label>
                    <select
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={undertakingState}
                      onChange={(event) => setUndertakingState(event.target.value)}
                    >
                      <option value="">Select state</option>
                      {INDIA_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="PAN Card Upload" description="Upload PAN card as PDF. Upload starts immediately after file selection.">
            <div className="grid gap-3">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                PAN card PDF
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] ?? null
                    if (!nextFile) return
                    void handlePanUpload(nextFile)
                  }}
                  disabled={isUploadingPan}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
            </div>
            {isUploadingPan ? <p className="mt-2 text-sm text-amber-700">Uploading PAN PDF...</p> : null}
            {!isUploadingPan && panUploaded ? (
              <p className="mt-2 text-sm text-emerald-700">
                PAN document uploaded{panFileName ? `: ${panFileName}` : ""}.
              </p>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Agreement"
            description="Review this agreement container, sign in the organizer signatory section, then use Download and Submit."
          >
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 sm:p-3">
                <div
                  ref={agreementRef}
                  style={{
                    width: "100%",
                    minWidth: "780px",
                    backgroundColor: "#ffffff",
                    color: "#111827",
                    border: "1px solid #cbd5e1",
                    borderRadius: "14px",
                    padding: "24px",
                    fontFamily: "Times New Roman, Georgia, serif",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6b7280" }}>
                    Privileged and Confidential
                  </p>
                  <h3 style={{ margin: "10px 0 4px", fontSize: "28px", lineHeight: 1.2 }}>AGREEMENT</h3>
                  <p style={{ margin: 0 }}>
                    This agreement is made on <strong>{todayLabel}</strong> between <strong>Baatasari</strong> and{" "}
                    <strong>{organizerDisplayName}</strong>.
                  </p>

                  <div style={{ marginTop: "16px", border: "1px solid #d1d5db", borderRadius: "10px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td style={{ width: "28%", borderRight: "1px solid #d1d5db", borderBottom: "1px solid #d1d5db", padding: "10px", fontWeight: 700 }}>
                            First Party
                          </td>
                          <td style={{ borderBottom: "1px solid #d1d5db", padding: "10px" }}>
                            Baatasari (baatasari.com)
                            <br />
                            {BAATASARI_ADDRESS_LINES.join(", ")}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ width: "28%", borderRight: "1px solid #d1d5db", padding: "10px", fontWeight: 700 }}>
                            Second Party
                          </td>
                          <td style={{ padding: "10px" }}>
                            {organizerDisplayName} ({organizerEntityTypeLabel})
                            <br />
                            Address: {organizerAddress}
                            <br />
                            Email: {formatValue(organizerProfile?.contactEmail, user?.email ?? "Not provided")}
                            <br />
                            Phone: {formatValue(organizerProfile?.contactPhone)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: "18px" }}>
                    <p style={{ margin: "0 0 8px" }}>
                      <strong>Recitals</strong>
                    </p>
                    <p style={{ margin: "0 0 8px" }}>
                      A) Baatasari provides event discovery and ticketing services through its platform.
                    </p>
                    <p style={{ margin: "0 0 8px" }}>
                      B) The Organizer appoints Baatasari to facilitate event listing and ticket bookings on the platform.
                    </p>
                    <p style={{ margin: 0 }}>
                      C) The Parties agree to the commercial and legal terms below, modeled on the BookMyShow-style agreement format.
                    </p>
                  </div>

                  <div style={{ marginTop: "18px" }}>
                    <p style={{ margin: "0 0 8px" }}>
                      <strong>Key Terms</strong>
                    </p>
                    <ol style={{ margin: "0 0 0 18px", padding: 0 }}>
                      <li>Baatasari will provide platform listing and online ticketing support.</li>
                      <li>The Organizer is solely responsible for event execution, safety, licenses, and legal compliance.</li>
                      <li>Payment terms and commission structure are as communicated for each event listing.</li>
                      <li>Cancellation, refund handling, and chargebacks follow the agreed event policy and applicable laws.</li>
                      <li>Both parties shall maintain confidentiality and comply with applicable tax and data-protection laws.</li>
                    </ol>
                  </div>

                  <div style={{ marginTop: "18px", border: "1px solid #d1d5db", borderRadius: "10px", padding: "12px" }}>
                    <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Schedule 1 - Organizer Particulars</p>
                    <p style={{ margin: "0 0 4px" }}>Name: {organizerDisplayName}</p>
                    <p style={{ margin: "0 0 4px" }}>PAN: {formatValue(organizerProfile?.panNumber, "Pending")}</p>
                    <p style={{ margin: "0 0 4px" }}>
                      GST Status:{" "}
                      {gstAnswer === "YES"
                        ? getSanitizedGstEntries()
                            .map((entry) => `${entry.gstin} (${entry.state})`)
                            .join(", ") || formatValue(organizerProfile?.gstNumber, "GST details pending")
                        : `Not registered under GST (Undertaking accepted: ${undertakingAccepted ? "Yes" : "No"})`}
                    </p>
                    <p style={{ margin: 0 }}>
                      Registered Address: <strong>{organizerAddress}</strong>
                    </p>
                  </div>

                  <div style={{ marginTop: "18px", border: "1px solid #d1d5db", borderRadius: "10px", padding: "12px" }}>
                    <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Schedule 2 - Notices</p>
                    <p style={{ margin: "0 0 6px" }}>
                      <strong>To Baatasari:</strong> Contact Team, contact-us@baatasari.com
                    </p>
                    <p style={{ margin: "0 0 6px" }}>
                      Address: <strong>{BAATASARI_ADDRESS_LINES.join(", ")}</strong>
                    </p>
                    <p style={{ margin: "0 0 6px" }}>
                      <strong>To Organizer:</strong> {organizerDisplayName}
                    </p>
                    <p style={{ margin: "0 0 6px" }}>
                      Email: {formatValue(organizerProfile?.contactEmail, user?.email ?? "Not provided")}
                    </p>
                    <p style={{ margin: 0 }}>
                      Address: <strong>{organizerAddress}</strong>
                    </p>
                  </div>

                  <div style={{ marginTop: "20px", paddingTop: "12px", borderTop: "1px solid #d1d5db", display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr" }}>
                    <div style={{ border: "1px solid #d1d5db", borderRadius: "10px", padding: "12px" }}>
                      <p style={{ margin: 0, fontWeight: 700 }}>For Baatasari</p>
                      <p style={{ margin: "4px 0 10px", fontSize: "12px", color: "#4b5563" }}>Authorized Signatory</p>
                      <div style={{ minHeight: "76px", display: "flex", alignItems: "center" }}>
                        <img
                          src="/Signature.png"
                          alt="Baatasari authorized signature"
                          style={{ maxHeight: "64px", width: "auto", objectFit: "contain" }}
                        />
                      </div>
                      <p style={{ margin: "8px 0 0" }}>Date: {todayLabel}</p>
                    </div>
                    <div style={{ border: "1px solid #d1d5db", borderRadius: "10px", padding: "12px" }}>
                      <p style={{ margin: 0, fontWeight: 700 }}>For Organizer</p>
                      <p style={{ margin: "4px 0 10px", fontSize: "12px", color: "#4b5563" }}>Authorized Signatory</p>
                      <div style={{ minHeight: "76px", border: "1px dashed #94a3b8", borderRadius: "8px", padding: "8px", display: "flex", alignItems: "center" }}>
                        {signatureDataUrl ? (
                          <button
                            type="button"
                            onClick={() => setSignatureModalOpen(true)}
                            style={{ width: "100%", border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
                          >
                            <img
                              src={signatureDataUrl}
                              alt="Organizer signature"
                              style={{ maxHeight: "58px", width: "100%", objectFit: "contain" }}
                            />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSignatureModalOpen(true)}
                            style={{
                              border: "1px solid #111827",
                              borderRadius: "999px",
                              padding: "8px 14px",
                              background: "#ffffff",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Click to sign
                          </button>
                        )}
                      </div>
                      <p style={{ margin: "8px 0 0" }}>Name: {organizerDisplayName}</p>
                      <p style={{ margin: "2px 0 0" }}>Date: {todayLabel}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => void handleDownloadAgreement()}
                  disabled={isBuildingAgreement || !panUploaded || !signatureDataUrl}
                  className="rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
                >
                  {isBuildingAgreement ? "Preparing agreement..." : "Download"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmitDocuments()}
                  disabled={isSubmitting || !panUploaded || !agreementDownloaded}
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>

              {agreementDownloaded ? (
                <p className="text-right text-sm text-emerald-700">Agreement downloaded. You can submit now.</p>
              ) : (
                <p className="text-right text-sm text-slate-500">
                  Download gets enabled after PAN upload and organizer signature. Submit unlocks after download.
                </p>
              )}
            </div>
          </SectionCard>

          {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          {success ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}
        </div>
      </PageShell>

      {isDeclarationOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/50 px-4 py-6">
          <div
            tabIndex={-1}
            className="absolute left-1/2 top-1/2 max-h-[95vh] w-full max-w-[605px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 outline-none"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-semibold text-slate-900">GST Declaration</h3>
              <button
                type="button"
                onClick={() => setIsDeclarationOpen(false)}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <p>
                I/We, Organizer, confirm that we are a supplier providing services through an e-commerce platform as per the
                applicable GST laws and that we are not registered under GST because annual turnover is below threshold limits.
              </p>
              <p>
                I/We confirm that applicable taxes collected on tickets booked through Baatasari (baatasari.com) are our
                liability and will be duly discharged by us.
              </p>
              <p>
                I/We acknowledge that information furnished is true to the best of our knowledge. If information is found
                incorrect later, membership may be cancelled and pending payments may be withheld.
              </p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>Breach, violation, or non-compliance with this declaration.</li>
                <li>Any act by which the representations become untrue.</li>
                <li>Violation of applicable laws including GST laws.</li>
                <li>Non-compliance with GST laws.</li>
                <li>Investigations, inquiries, summons, or inspections by authorities.</li>
              </ol>
              <p>
                We undertake to inform Baatasari of subsequent changes in constitution or business operations affecting this declaration.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setUndertakingAccepted(true)
                  setIsDeclarationOpen(false)
                }}
                className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {signatureModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Organizer Signature</h3>
              <button
                type="button"
                onClick={() => setSignatureModalOpen(false)}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                Close
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSignatureTab("upload")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  signatureTab === "upload" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700"
                }`}
              >
                Upload image
              </button>
              <button
                type="button"
                onClick={() => setSignatureTab("draw")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  signatureTab === "draw" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700"
                }`}
              >
                Draw signature
              </button>
            </div>

            {signatureTab === "upload" ? (
              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleUploadSignatureFile(event.target.files?.[0] ?? null)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <canvas ref={uploadPreviewRef} width={620} height={180} className="w-full rounded-lg border border-slate-200 bg-slate-50" />
                </div>
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Scale
                    <input
                      type="range"
                      min={0.4}
                      max={2.2}
                      step={0.05}
                      value={uploadScale}
                      onChange={(event) => setUploadScale(Number(event.target.value))}
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Rotation
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={uploadRotation}
                      onChange={(event) => setUploadRotation(Number(event.target.value))}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={saveUploadedSignature}
                    className="mt-2 w-full rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Use uploaded signature
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <canvas
                  ref={drawCanvasRef}
                  width={900}
                  height={280}
                  className="w-full rounded-lg border border-slate-200 bg-white"
                  onPointerDown={beginDraw}
                  onPointerMove={continueDraw}
                  onPointerUp={endDraw}
                  onPointerLeave={endDraw}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={clearDrawCanvas}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={saveDrawnSignature}
                    className="rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Use drawn signature
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </ProtectedRoute>
  )
}
