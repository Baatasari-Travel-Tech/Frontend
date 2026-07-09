"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import QRCode from "qrcode"
import { Share2, Copy, Check, X, Loader2 } from "lucide-react"

const LOGO_SRC = "/qr_logo.png"

// Brand-theme presets for the QR foreground (mirrors globals.css brand tokens:
// navy, blue, deep-blue) plus plain black; any other color via the custom picker.
const QR_FG_PRESETS = ["#0c1d37", "#2b4570", "#122848", "#000000"]
const DEFAULT_QR_FG = QR_FG_PRESETS[0]
const DEFAULT_QR_BG = "#ffffff"

// WCAG relative luminance → contrast ratio, to warn when a chosen color
// combination is too low-contrast for scanners to read reliably.
function contrastRatio(hexA: string, hexB: string): number {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16)
    const chan = (v: number) => {
      const c = v / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * chan((n >> 16) & 255) + 0.7152 * chan((n >> 8) & 255) + 0.0722 * chan(n & 255)
  }
  const [la, lb] = [lum(hexA), lum(hexB)]
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a")
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// Load the logo and return a self-contained data URI + its aspect ratio,
// so it can be embedded into the SVG (no external reference needed).
function loadLogoDataUri(): Promise<{ dataUri: string; aspect: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("no-2d-context"))
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve({ dataUri: canvas.toDataURL("image/png"), aspect: img.naturalWidth / img.naturalHeight })
    }
    img.onerror = () => reject(new Error("logo-load-failed"))
    img.src = LOGO_SRC
  })
}

interface ShareEventButtonProps {
  eventId: string
  slug?: string | null
  title?: string
  /** Override the trigger button styling. */
  className?: string
  /** Show only the icon on the trigger (no "Share" label). */
  iconOnly?: boolean
}

export function ShareEventButton({ eventId, slug, title, className, iconOnly = false }: ShareEventButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [link, setLink] = useState("")
  const [qrReady, setQrReady] = useState(false)
  const [qrFg, setQrFg] = useState(DEFAULT_QR_FG)
  const [qrBg, setQrBg] = useState(DEFAULT_QR_BG)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const lowContrast = contrastRatio(qrFg, qrBg) < 3

  useEffect(() => {
    if (typeof window === "undefined") return
    setLink(`${window.location.origin}/events/${slug || eventId}`)
  }, [eventId, slug])

  // Render the QR (high error-correction so it stays scannable) and stamp the
  // logo in the centre on a white rounded backdrop.
  useEffect(() => {
    if (!open || !link) return
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    setQrReady(false)

    // Render at higher internal resolution (shown at 232px via CSS) so the
    // centre logo stays sharp instead of looking pixelated/blurry.
    QRCode.toCanvas(canvas, link, {
      width: 464,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: qrFg, light: qrBg },
    })
      .then(() => {
        if (cancelled) return
        // qrcode stamps an inline 464px style on the canvas; constrain the
        // displayed size so it fits the modal frame (internal res stays 464).
        canvas.style.width = "100%"
        canvas.style.height = "auto"
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const logo = new Image()
        logo.onload = () => {
          if (cancelled) return
          // Draw the real brand wordmark at its true aspect ratio (no squashing,
          // no upscaling blur), on a clean white rounded backdrop sized to it.
          const aspect = (logo.naturalWidth || 1) / (logo.naturalHeight || 1)
          const w = canvas.width * 0.28
          const h = w / aspect
          const x = (canvas.width - w) / 2
          const y = (canvas.height - h) / 2
          const pad = canvas.width * 0.032
          const bx = x - pad
          const by = y - pad
          const bw = w + pad * 2
          const bh = h + pad * 2
          const r = Math.min(bw, bh) * 0.3

          ctx.fillStyle = qrBg
          ctx.beginPath()
          ctx.moveTo(bx + r, by)
          ctx.arcTo(bx + bw, by, bx + bw, by + bh, r)
          ctx.arcTo(bx + bw, by + bh, bx, by + bh, r)
          ctx.arcTo(bx, by + bh, bx, by, r)
          ctx.arcTo(bx, by, bx + bw, by, r)
          ctx.closePath()
          ctx.fill()

          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"
          ctx.drawImage(logo, x, y, w, h)
          setQrReady(true)
        }
        // If the logo can't load, still reveal the QR rather than spin forever.
        logo.onerror = () => {
          if (!cancelled) setQrReady(true)
        }
        logo.src = LOGO_SRC
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [open, link, qrFg, qrBg])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard may be unavailable; the link is shown for manual copy.
    }
  }

  const fileBase = `baatasari-event-qr-${slug || eventId}`

  // PNG / JPG: export the rendered canvas (QR + centre logo) directly.
  const downloadRaster = (type: "image/png" | "image/jpeg", ext: "png" | "jpg") => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL(type, type === "image/jpeg" ? 0.92 : undefined)
    triggerDownload(dataUrl, `${fileBase}.${ext}`)
  }

  // SVG: a crisp vector QR with the logo embedded as a centred <image>.
  const downloadSvg = async () => {
    try {
      const svg = await QRCode.toString(link, {
        type: "svg",
        errorCorrectionLevel: "H",
        margin: 1,
        color: { dark: qrFg, light: qrBg },
      })
      const { dataUri, aspect } = await loadLogoDataUri()
      const viewBoxMatch = svg.match(/viewBox="0 0 ([\d.]+) /)
      const unit = viewBoxMatch ? Number(viewBoxMatch[1]) : 33
      const w = unit * 0.28
      const h = w / aspect
      const x = (unit - w) / 2
      const y = (unit - h) / 2
      const pad = unit * 0.032
      const bx = x - pad
      const by = y - pad
      const bw = w + pad * 2
      const bh = h + pad * 2
      const r = Math.min(bw, bh) * 0.3
      const overlay =
        `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${r}" fill="${qrBg}"/>` +
        `<image x="${x}" y="${y}" width="${w}" height="${h}" href="${dataUri}" preserveAspectRatio="xMidYMid meet"/>`
      const finalSvg = svg.replace("</svg>", `${overlay}</svg>`)
      const blob = new Blob([finalSvg], { type: "image/svg+xml" })
      const url = URL.createObjectURL(blob)
      triggerDownload(url, `${fileBase}.svg`)
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch {
      // ignore — raster downloads remain available
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen(true)
        }}
        className={
          className ??
          "inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        }
        aria-label="Share event"
      >
        <Share2 className="h-4 w-4" />
        {iconOnly ? null : <span>Share</span>}
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 px-4"
          onClick={(event) => {
            event.stopPropagation()
            setOpen(false)
          }}
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Share event</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {title ? <p className="mb-3 line-clamp-2 text-xs text-slate-500">{title}</p> : null}

            <div className="relative flex min-h-[210px] items-center justify-center rounded-xl border border-slate-100 bg-white p-3">
              {!qrReady ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                </div>
              ) : null}
              <canvas
                ref={canvasRef}
                className={`block h-auto w-full max-w-[232px] rounded-lg transition-opacity duration-200 ${
                  qrReady ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-xs text-slate-400">QR color</span>
                {QR_FG_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setQrFg(c)}
                    style={{ backgroundColor: c }}
                    className={`h-6 w-6 rounded-full transition ${
                      qrFg === c ? "ring-2 ring-slate-400 ring-offset-1" : "border border-slate-200"
                    }`}
                    aria-label={`QR color ${c}`}
                  />
                ))}
                <label
                  className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border border-slate-300"
                  title="Custom color"
                >
                  <span
                    className="absolute inset-0"
                    style={{ background: "conic-gradient(#ef4444, #f59e0b, #22c55e, #06b6d4, #3b82f6, #a855f7, #ef4444)" }}
                  />
                  <input
                    type="color"
                    value={qrFg}
                    onChange={(e) => setQrFg(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Custom QR color"
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-xs text-slate-400">Backdrop</span>
                <button
                  type="button"
                  onClick={() => setQrBg(DEFAULT_QR_BG)}
                  className={`h-6 w-6 rounded-full bg-white transition ${
                    qrBg === DEFAULT_QR_BG ? "ring-2 ring-slate-400 ring-offset-1" : "border border-slate-300"
                  }`}
                  aria-label="White backdrop"
                />
                <label
                  className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border border-slate-300"
                  title="Custom backdrop"
                >
                  <span
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(135deg, #ffffff 50%, #e2e8f0 50%)" }}
                  />
                  <input
                    type="color"
                    value={qrBg}
                    onChange={(e) => setQrBg(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Custom backdrop color"
                  />
                </label>
              </div>
              {lowContrast ? (
                <p className="text-[11px] font-medium text-amber-600">
                  Low contrast — this QR may not scan reliably. Pick a darker QR color or lighter backdrop.
                </p>
              ) : null}
            </div>

            <div className="mt-4">
              <p
                className="truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                title={link}
              >
                {link}
              </p>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy link
                  </>
                )}
              </button>

              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-xs text-slate-400">Download</span>
                <button
                  type="button"
                  onClick={() => downloadRaster("image/png", "png")}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  PNG
                </button>
                <button
                  type="button"
                  onClick={() => downloadRaster("image/jpeg", "jpg")}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  JPG
                </button>
                <button
                  type="button"
                  onClick={() => void downloadSvg()}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  SVG
                </button>
              </div>
            </div>
          </div>
        </div>,
            document.body,
          )
        : null}
    </>
  )
}

export default ShareEventButton
