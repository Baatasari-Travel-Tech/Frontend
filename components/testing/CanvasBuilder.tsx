"use client"

import { useState } from "react"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { Move, MoveDiagonal2 } from "lucide-react"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  BG_SWATCHES,
  BLOCK_LIBRARY,
  CANVAS_WIDTH,
  MIN_BLOCK_HEIGHT,
  MIN_BLOCK_WIDTH,
  TEXT_BLOCK_TYPES,
  TEXT_SWATCHES,
  clampX,
  newBlock,
  newImageBlock,
  nextFreeY,
  type Block,
  type BlockType,
} from "./blocks"

function useLocalImages() {
  return useQuery({
    queryKey: ["local-images"],
    queryFn: async () => {
      const res = await fetch("/api/local-images")
      const json = (await res.json()) as { images: string[] }
      return json.images
    },
  })
}

export function CanvasBuilder() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [canvasBg, setCanvasBg] = useState<string>("#ffffff")
  const imagesQuery = useLocalImages()
  const images = imagesQuery.data ?? []

  function appendBlock(type: Exclude<BlockType, "image">) {
    const y = blocks.length === 0 ? 24 : nextFreeY(blocks) + 20
    const b = newBlock(type, 40, y)
    setBlocks((prev) => [...prev, b])
    setSelectedId(b.id)
  }

  function appendImage(src: string) {
    const y = blocks.length === 0 ? 24 : nextFreeY(blocks) + 20
    const b = newImageBlock(src, 40, y)
    setBlocks((prev) => [...prev, b])
    setSelectedId(b.id)
  }

  function updateBlock(id: string, patch: Partial<Block>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }

  function deleteBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    setSelectedId((s) => (s === id ? null : s))
  }

  const canvasHeight = Math.max(600, nextFreeY(blocks) + 200)

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_1fr]" onClick={() => setSelectedId(null)}>
      <div className="space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Blocks</p>
          {BLOCK_LIBRARY.map((b) => (
            <button
              key={b.type}
              onClick={() => appendBlock(b.type)}
              className="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-semibold text-brand-900 transition-colors hover:border-(--royal-blue)/30 hover:bg-(--royal-blue)/5"
            >
              + {b.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Images</p>
          {imagesQuery.isLoading ? (
            <p className="px-1 text-xs text-slate-400">Loading…</p>
          ) : images.length === 0 ? (
            <p className="px-1 text-xs text-slate-400">No images found in /public.</p>
          ) : (
            <ImagePickerGrid images={images} onPick={appendImage} />
          )}
        </div>

        <p className="px-1 text-xs text-slate-400">
          Drag the top-left grip to move a block, drag the bottom-right corner to resize. Click a block for colors.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Board color</span>
          <div className="flex items-center gap-1.5">
            {["#ffffff", "#f5efe4", "#0c1D37", "#f8fafc"].map((c) => (
              <button
                key={c}
                onClick={() => setCanvasBg(c)}
                style={{ background: c }}
                className={`h-5 w-5 rounded-full border-2 ${canvasBg === c ? "border-(--royal-blue)" : "border-slate-200"}`}
              />
            ))}
            <input
              type="color"
              value={canvasBg}
              onChange={(e) => setCanvasBg(e.target.value)}
              className="h-5 w-5 cursor-pointer rounded-full border-2 border-slate-200 p-0"
            />
          </div>
        </div>

        {/* Fixed-width canvas — scrolls horizontally if the viewport is
            narrower, same model as a real design-tool canvas. Positions are
            plain pixels within this fixed frame, so they never depend on a
            measured/responsive container width. */}
        <div className="overflow-x-auto rounded-2xl border border-dashed border-slate-300">
          <div
            className="relative"
            style={{
              width: CANVAS_WIDTH,
              height: canvasHeight,
              backgroundColor: canvasBg,
              backgroundImage:
                "linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          >
            {blocks.length === 0 && (
              <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-slate-400">
                Add a block to get started.
              </p>
            )}
            {blocks.map((b) => (
              <CanvasBlock
                key={b.id}
                block={b}
                images={images}
                selected={selectedId === b.id}
                onSelect={() => setSelectedId(b.id)}
                onDeselect={() => setSelectedId(null)}
                onChange={(patch) => updateBlock(b.id, patch)}
                onDelete={() => deleteBlock(b.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ImagePickerGrid({ images, onPick }: { images: string[]; onPick: (src: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {images.map((src) => (
        <button
          key={src}
          onClick={() => onPick(src)}
          className="relative aspect-square overflow-hidden rounded-lg ring-1 ring-slate-200 transition hover:ring-2 hover:ring-(--royal-blue)"
          title={src}
        >
          <Image src={src} alt="" fill sizes="80px" className="object-cover" />
        </button>
      ))}
    </div>
  )
}

function textClassFor(type: BlockType): string {
  if (type === "heading") return "font-bricolage text-2xl font-bold leading-tight outline-none"
  if (type === "subheading") return "font-bricolage text-lg font-semibold leading-tight outline-none"
  if (type === "quote") return "border-l-4 border-(--gold) pl-3 text-sm italic leading-relaxed text-slate-700 outline-none"
  if (type === "button")
    return "grid h-full w-full place-items-center rounded-lg text-center text-sm font-semibold outline-none"
  if (type === "badge")
    return "grid h-full w-full place-items-center rounded-full px-2 text-center text-xs font-semibold outline-none"
  return "text-sm leading-relaxed outline-none"
}

function BlockContent({ block, onChange }: { block: Block; onChange: (patch: Partial<Block>) => void }) {
  if (block.type === "divider") {
    return (
      <div className="flex h-full w-full items-center">
        <div className="h-0.5 w-full rounded-full" style={{ background: block.bg ?? "#cbd5e1" }} />
      </div>
    )
  }
  if (block.type === "image") {
    return block.src ? (
      <Image src={block.src} alt="" fill sizes={`${block.width}px`} className="rounded-lg object-contain" />
    ) : null
  }
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onChange({ text: e.currentTarget.textContent ?? "" })}
      className={textClassFor(block.type)}
    >
      {block.text}
    </div>
  )
}

function CanvasBlock({
  block,
  images,
  selected,
  onSelect,
  onDeselect,
  onChange,
  onDelete,
}: {
  block: Block
  images: string[]
  selected: boolean
  onSelect: () => void
  onDeselect: () => void
  onChange: (patch: Partial<Block>) => void
  onDelete: () => void
}) {
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Plain pixel pointer events (not framer-motion drag, and not divided
  // through any grid-cell math) — the live offset is only ever a CSS
  // transform via React state; the block's real position is committed once,
  // on pointerup, so there's nothing left behind to conflict with the next
  // render.
  function handleMovePointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    e.preventDefault()
    const start = { x: e.clientX, y: e.clientY }
    setDragging(true)
    function onMove(ev: PointerEvent) {
      setDragOffset({ x: ev.clientX - start.x, y: ev.clientY - start.y })
    }
    function onUp(ev: PointerEvent) {
      const dx = ev.clientX - start.x
      const dy = ev.clientY - start.y
      onChange({ x: clampX(Math.round(block.x + dx), block.width), y: Math.max(0, Math.round(block.y + dy)) })
      setDragging(false)
      setDragOffset({ x: 0, y: 0 })
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  function handleResizePointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    e.preventDefault()
    const start = { x: e.clientX, y: e.clientY, width: block.width, height: block.height }
    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - start.x
      const dy = ev.clientY - start.y
      onChange({
        width: Math.min(Math.max(Math.round(start.width + dx), MIN_BLOCK_WIDTH), CANVAS_WIDTH - block.x),
        height: Math.max(Math.round(start.height + dy), MIN_BLOCK_HEIGHT),
      })
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  const bg = block.bg ?? (block.type === "card" ? "#ffffff" : "transparent")
  const noPadding = block.type === "image" || block.type === "divider"

  return (
    <Popover open={selected} onOpenChange={(open) => !open && onDeselect()}>
      <PopoverAnchor asChild>
        <div
          className="group absolute"
          style={{
            left: block.x,
            top: block.y,
            width: block.width,
            height: block.height,
            transform: dragging ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : undefined,
            zIndex: dragging || selected ? 30 : 1,
          }}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          <div
            className={`relative h-full w-full overflow-hidden rounded-xl shadow-sm transition-shadow ${noPadding ? "" : "p-3"} ${selected ? "ring-2 ring-(--royal-blue)" : "ring-1 ring-black/5"} ${block.type === "card" ? "shadow-md" : ""}`}
            style={{ background: bg, color: block.color ?? undefined }}
          >
            {/* Move handle — centered on the top-left border corner */}
            <div
              onPointerDown={handleMovePointerDown}
              className="absolute left-0 top-0 z-10 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-grab place-items-center rounded-full border-2 border-white bg-brand-900 text-white opacity-0 shadow-sm group-hover:opacity-100 active:cursor-grabbing"
              title="Drag to move"
            >
              <Move size={12} strokeWidth={2.5} />
            </div>

            {block.type === "card" ? (
              <CardContents block={block} images={images} onChange={onChange} />
            ) : (
              <BlockContent block={block} onChange={onChange} />
            )}

            {/* Resize handle — centered on the bottom-right border corner */}
            <div
              onPointerDown={handleResizePointerDown}
              className="absolute bottom-0 right-0 z-10 grid h-6 w-6 translate-x-1/2 translate-y-1/2 cursor-se-resize place-items-center rounded-full border-2 border-white bg-brand-900 text-white opacity-0 shadow-sm group-hover:opacity-100"
              title="Drag to resize"
            >
              <MoveDiagonal2 size={12} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-auto p-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onClick={(e) => e.stopPropagation()}
      >
        <ColorToolbar
          bg={block.bg}
          color={block.color}
          showTextColor={block.type !== "image" && block.type !== "divider"}
          onBg={(bg) => onChange({ bg })}
          onColor={(color) => onChange({ color })}
          onDelete={onDelete}
        />
      </PopoverContent>
    </Popover>
  )
}

function CardContents({
  block,
  images,
  onChange,
}: {
  block: Block
  images: string[]
  onChange: (patch: Partial<Block>) => void
}) {
  function addChild(type: (typeof TEXT_BLOCK_TYPES)[number] | "divider") {
    const child = newBlock(type, 0, 0)
    onChange({ children: [...block.children, child] })
  }
  function addImageChild(src: string) {
    const child = newImageBlock(src, 0, 0)
    onChange({ children: [...block.children, child] })
  }
  function updateChild(id: string, patch: Partial<Block>) {
    onChange({ children: block.children.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  }
  function removeChild(id: string) {
    onChange({ children: block.children.filter((c) => c.id !== id) })
  }

  return (
    <div className="flex h-full flex-col gap-2 overflow-auto" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap items-center gap-1.5">
        {[...TEXT_BLOCK_TYPES, "divider" as const].map((t) => (
          <button
            key={t}
            onClick={(e) => {
              e.stopPropagation()
              addChild(t)
            }}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-brand-900 hover:bg-slate-50"
          >
            + {t}
          </button>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-brand-900 hover:bg-slate-50"
            >
              + image
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" onClick={(e) => e.stopPropagation()}>
            {images.length === 0 ? (
              <p className="text-xs text-slate-400">No images found.</p>
            ) : (
              <ImagePickerGrid images={images} onPick={addImageChild} />
            )}
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex-1 space-y-2 overflow-auto">
        {block.children.length === 0 ? (
          <p className="text-xs text-slate-400">Empty card — add a block above.</p>
        ) : (
          block.children.map((child) => (
            <ChildBlock key={child.id} block={child} onChange={(p) => updateChild(child.id, p)} onDelete={() => removeChild(child.id)} />
          ))
        )}
      </div>
    </div>
  )
}

function ChildBlock({
  block,
  onChange,
  onDelete,
}: {
  block: Block
  onChange: (patch: Partial<Block>) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          className="relative overflow-hidden rounded-lg p-2 ring-1 ring-black/5"
          style={{ background: block.bg ?? "transparent", color: block.color ?? undefined }}
          onClick={(e) => {
            e.stopPropagation()
            setOpen(true)
          }}
        >
          {block.type === "image" ? (
            block.src ? (
              <div className="relative h-24 w-full overflow-hidden rounded-md">
                <Image src={block.src} alt="" fill sizes="240px" className="object-contain" />
              </div>
            ) : null
          ) : block.type === "divider" ? (
            <div className="h-0.5 w-full rounded-full" style={{ background: block.bg ?? "#cbd5e1" }} />
          ) : (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onChange({ text: e.currentTarget.textContent ?? "" })}
              className={textClassFor(block.type)}
            >
              {block.text}
            </div>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent className="w-auto p-3" onOpenAutoFocus={(e) => e.preventDefault()} onClick={(e) => e.stopPropagation()}>
        <ColorToolbar
          bg={block.bg}
          color={block.color}
          showTextColor={block.type !== "image" && block.type !== "divider"}
          onBg={(bg) => onChange({ bg })}
          onColor={(color) => onChange({ color })}
          onDelete={onDelete}
        />
      </PopoverContent>
    </Popover>
  )
}

function ColorToolbar({
  bg,
  color,
  showTextColor = true,
  onBg,
  onColor,
  onDelete,
}: {
  bg: string | null
  color: string | null
  showTextColor?: boolean
  onBg: (v: string | null) => void
  onColor: (v: string | null) => void
  onDelete: () => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-semibold text-slate-500">Background</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onBg(null)}
            className={`h-6 w-6 rounded-full border-2 bg-[repeating-conic-gradient(#e2e8f0_0_25%,white_0_50%)] bg-[length:8px_8px] ${bg === null ? "border-(--royal-blue)" : "border-transparent"}`}
            title="None"
          />
          {BG_SWATCHES.map((c) => (
            <button
              key={c}
              onClick={() => onBg(c)}
              style={{ background: c }}
              className={`h-6 w-6 rounded-full border-2 ${bg === c ? "border-(--royal-blue)" : "border-transparent"}`}
            />
          ))}
          <input
            type="color"
            value={bg ?? "#ffffff"}
            onChange={(e) => onBg(e.target.value)}
            className="h-6 w-6 cursor-pointer rounded-full border-2 border-transparent p-0"
          />
        </div>
      </div>
      {showTextColor && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-500">Text color</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onColor(null)}
              className={`h-6 w-6 rounded-full border-2 bg-[repeating-conic-gradient(#e2e8f0_0_25%,white_0_50%)] bg-[length:8px_8px] ${color === null ? "border-(--royal-blue)" : "border-transparent"}`}
              title="Default"
            />
            {TEXT_SWATCHES.map((c) => (
              <button
                key={c}
                onClick={() => onColor(c)}
                style={{ background: c }}
                className={`h-6 w-6 rounded-full border-2 ${color === c ? "border-(--royal-blue)" : "border-transparent"}`}
              />
            ))}
          </div>
        </div>
      )}
      <button onClick={onDelete} className="w-full rounded-lg border border-rose-200 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
        Delete block
      </button>
    </div>
  )
}
