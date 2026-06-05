"use client"

import React, { useEffect, useState } from "react"

// The backend stores event covers at 1200×630 (fit: cover). Cropping to the
// exact same ratio here makes the upload WYSIWYG and consistent everywhere.
const TARGET_WIDTH = 1200
const TARGET_HEIGHT = 630
const ASPECT = TARGET_WIDTH / TARGET_HEIGHT
const BOX_WIDTH = 520
const BOX_HEIGHT = Math.round(BOX_WIDTH / ASPECT)

interface CoverImageCropperProps {
  source: string
  onCancel: () => void
  onApply: (file: File, previewUrl: string) => void
}

const CoverImageCropper: React.FC<CoverImageCropperProps> = ({ source, onCancel, onApply }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [offsetStart, setOffsetStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
    img.src = source
  }, [source])

  const getMetrics = (nextZoom = zoom) => {
    if (!image) return null
    const baseScale = Math.max(BOX_WIDTH / image.naturalWidth, BOX_HEIGHT / image.naturalHeight)
    const scaledWidth = image.naturalWidth * baseScale * nextZoom
    const scaledHeight = image.naturalHeight * baseScale * nextZoom
    const maxX = Math.max(0, (scaledWidth - BOX_WIDTH) / 2)
    const maxY = Math.max(0, (scaledHeight - BOX_HEIGHT) / 2)
    return { baseScale, scaledWidth, scaledHeight, maxX, maxY }
  }

  const clampOffset = (next: { x: number; y: number }, nextZoom = zoom) => {
    const metrics = getMetrics(nextZoom)
    if (!metrics) return { x: 0, y: 0 }
    return {
      x: Math.min(metrics.maxX, Math.max(-metrics.maxX, next.x)),
      y: Math.min(metrics.maxY, Math.max(-metrics.maxY, next.y)),
    }
  }

  const handleApply = async () => {
    if (!image) return
    const metrics = getMetrics()
    if (!metrics) return

    const scale = metrics.baseScale * zoom
    const sourceWidth = BOX_WIDTH / scale
    const sourceHeight = BOX_HEIGHT / scale
    const sourceX = (image.naturalWidth - sourceWidth) / 2 - offset.x / scale
    const sourceY = (image.naturalHeight - sourceHeight) / 2 - offset.y / scale

    const canvas = document.createElement("canvas")
    canvas.width = TARGET_WIDTH
    canvas.height = TARGET_HEIGHT
    const context = canvas.getContext("2d")
    if (!context) return

    context.drawImage(
      image,
      Math.max(0, sourceX),
      Math.max(0, sourceY),
      Math.min(sourceWidth, image.naturalWidth),
      Math.min(sourceHeight, image.naturalHeight),
      0,
      0,
      TARGET_WIDTH,
      TARGET_HEIGHT,
    )

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9))
    if (!blob) return

    const file = new File([blob], "event-cover.webp", { type: "image/webp" })
    onApply(file, URL.createObjectURL(file))
  }

  const metrics = getMetrics()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6">
      <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-white p-5 shadow-[0_30px_70px_rgba(15,23,42,0.3)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Adjust cover</p>
            <h2 className="text-xl font-semibold text-slate-900">Frame your event cover</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div
            className="relative max-w-full touch-none select-none overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner"
            style={{ width: BOX_WIDTH, height: BOX_HEIGHT }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              setDragStart({ x: event.clientX, y: event.clientY })
              setOffsetStart(offset)
            }}
            onPointerMove={(event) => {
              if (!dragStart) return
              setOffset(
                clampOffset({
                  x: offsetStart.x + (event.clientX - dragStart.x),
                  y: offsetStart.y + (event.clientY - dragStart.y),
                }),
              )
            }}
            onPointerUp={() => setDragStart(null)}
            onPointerLeave={() => setDragStart(null)}
          >
            {image ? (
              <div
                className="absolute inset-0 cursor-grab bg-cover bg-center bg-no-repeat active:cursor-grabbing"
                style={{
                  backgroundImage: `url(${source})`,
                  backgroundSize: `${metrics?.scaledWidth ?? BOX_WIDTH}px ${metrics?.scaledHeight ?? BOX_HEIGHT}px`,
                  backgroundPosition: `calc(50% + ${offset.x}px) calc(50% + ${offset.y}px)`,
                }}
              />
            ) : null}
          </div>

          <div className="w-full max-w-sm">
            <p className="text-sm font-semibold text-slate-700">Zoom</p>
            <input
              className="mt-2 w-full accent-slate-900"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => {
                const nextZoom = Number(event.target.value)
                setZoom(nextZoom)
                setOffset((previous) => clampOffset(previous, nextZoom))
              }}
            />
            <p className="mt-1 text-xs text-slate-500">Drag to reposition. The frame is exactly how the cover appears.</p>
          </div>

          <button
            type="button"
            onClick={() => void handleApply()}
            className="w-full max-w-sm rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Use this cover
          </button>
        </div>
      </div>
    </div>
  )
}

export default CoverImageCropper
