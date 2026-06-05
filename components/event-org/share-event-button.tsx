"use client"

import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import { Share2, Copy, Check, X } from "lucide-react"

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
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

    // Render at higher internal resolution (shown at 232px via CSS) so the
    // centre logo stays sharp instead of looking pixelated/blurry.
    QRCode.toCanvas(canvas, link, {
      width: 464,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(() => {
        if (cancelled) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const logo = new Image()
        logo.onload = () => {
          if (cancelled) return
          const cx = canvas.width / 2
          const cy = canvas.height / 2
          const logoRadius = canvas.width * 0.13
          const ringRadius = logoRadius + canvas.width * 0.025

          // Round white backdrop (the logo is circular), with a soft ring.
          ctx.save()
          ctx.beginPath()
          ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2)
          ctx.closePath()
          ctx.fillStyle = "#ffffff"
          ctx.fill()
          ctx.lineWidth = canvas.width * 0.006
          ctx.strokeStyle = "#e2e8f0"
          ctx.stroke()
          ctx.restore()

          // Clip the logo into a circle and draw it crisply.
          ctx.save()
          ctx.beginPath()
          ctx.arc(cx, cy, logoRadius, 0, Math.PI * 2)
          ctx.closePath()
          ctx.clip()
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"
          ctx.drawImage(logo, cx - logoRadius, cy - logoRadius, logoRadius * 2, logoRadius * 2)
          ctx.restore()
        }
        logo.src = "/logo.png"
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [open, link])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard may be unavailable; the link is shown for manual copy.
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

      {open ? (
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

            <div className="flex justify-center rounded-xl border border-slate-100 bg-white p-3">
              <canvas ref={canvasRef} className="h-auto w-[232px] max-w-full rounded-lg" />
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
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default ShareEventButton
