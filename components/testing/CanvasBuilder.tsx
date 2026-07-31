"use client"

import { useEffect, useRef, useState } from "react"
import { motion, type PanInfo } from "framer-motion"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import {
  BG_SWATCHES,
  BLOCK_LIBRARY,
  COLS,
  ROW_UNIT,
  TEXT_SWATCHES,
  clampCol,
  newBlock,
  nextFreeRow,
  type Block,
  type BlockType,
} from "./blocks"

export function CanvasBuilder() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasWidth, setCanvasWidth] = useState(0)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => setCanvasWidth(entries[0].contentRect.width))
    observer.observe(el)
    setCanvasWidth(el.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [])

  const cellWidth = canvasWidth / COLS

  function appendBlock(type: BlockType) {
    const row = nextFreeRow(blocks)
    const b = newBlock(type, 0, row)
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

  const canvasHeight = Math.max(600, (nextFreeRow(blocks) + 4) * ROW_UNIT)

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_1fr]" onClick={() => setSelectedId(null)}>
      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
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
        <p className="px-1 pt-3 text-xs text-slate-400">
          Drag the grip to move a block, drag its bottom-right corner to resize. Click a block for colors.
        </p>
      </div>

      <div
        ref={canvasRef}
        className="relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)]"
        style={{ height: canvasHeight, backgroundSize: `${100 / COLS}% ${ROW_UNIT}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        {blocks.length === 0 && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-slate-400">
            Add a block to get started.
          </p>
        )}
        {cellWidth > 0 &&
          blocks.map((b) => (
            <CanvasBlock
              key={b.id}
              block={b}
              cellWidth={cellWidth}
              selected={selectedId === b.id}
              onSelect={() => setSelectedId(b.id)}
              onChange={(patch) => updateBlock(b.id, patch)}
              onDelete={() => deleteBlock(b.id)}
            />
          ))}
      </div>
    </div>
  )
}

function textClassFor(type: BlockType): string {
  if (type === "heading") return "font-bricolage text-2xl font-bold leading-tight outline-none"
  if (type === "subheading") return "font-bricolage text-lg font-semibold leading-tight outline-none"
  return "text-sm leading-relaxed outline-none"
}

function CanvasBlock({
  block,
  cellWidth,
  selected,
  onSelect,
  onChange,
  onDelete,
}: {
  block: Block
  cellWidth: number
  selected: boolean
  onSelect: () => void
  onChange: (patch: Partial<Block>) => void
  onDelete: () => void
}) {
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const left = block.col * cellWidth
  const top = block.row * ROW_UNIT
  const width = block.colSpan * cellWidth
  const height = block.rowSpan * ROW_UNIT

  function handleDrag(_: unknown, info: PanInfo) {
    setDragOffset({ x: info.offset.x, y: info.offset.y })
  }
  function handleDragEnd(_: unknown, info: PanInfo) {
    const dCol = Math.round(info.offset.x / cellWidth)
    const dRow = Math.round(info.offset.y / ROW_UNIT)
    onChange({ col: clampCol(block.col + dCol, block.colSpan), row: Math.max(0, block.row + dRow) })
    setDragging(false)
    setDragOffset({ x: 0, y: 0 })
  }

  function handleResizePointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    e.preventDefault()
    const start = { x: e.clientX, y: e.clientY, colSpan: block.colSpan, rowSpan: block.rowSpan }
    function onMove(ev: PointerEvent) {
      const dCol = Math.round((ev.clientX - start.x) / cellWidth)
      const dRow = Math.round((ev.clientY - start.y) / ROW_UNIT)
      onChange({
        colSpan: Math.min(Math.max(start.colSpan + dCol, 2), COLS - block.col),
        rowSpan: Math.max(start.rowSpan + dRow, 1),
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

  return (
    <Popover open={selected} onOpenChange={(open) => !open && onSelect()}>
      <PopoverAnchor asChild>
        <div
          className="group absolute"
          style={{
            left,
            top,
            width,
            height,
            transform: dragging ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : undefined,
            zIndex: dragging || selected ? 30 : 1,
          }}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          <div
            className={`relative h-full w-full overflow-auto rounded-xl p-3 shadow-sm transition-shadow ${selected ? "ring-2 ring-(--royal-blue)" : "ring-1 ring-black/5"} ${block.type === "card" ? "shadow-md" : ""}`}
            style={{ background: bg, color: block.color ?? undefined }}
          >
            <motion.div
              drag
              dragMomentum={false}
              dragElastic={0}
              onPointerDown={(e) => e.stopPropagation()}
              onDragStart={() => setDragging(true)}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              className="absolute -top-2 -left-2 z-10 grid h-6 w-6 cursor-grab place-items-center rounded-md bg-brand-900 text-xs text-white opacity-0 group-hover:opacity-100 active:cursor-grabbing"
              title="Drag to move"
            >
              ⠿
            </motion.div>

            {block.type === "card" ? (
              <CardContents block={block} onChange={onChange} />
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

            <div
              onPointerDown={handleResizePointerDown}
              className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize opacity-0 group-hover:opacity-100"
              title="Drag to resize"
            >
              <div className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-sm border-b-2 border-r-2 border-slate-400" />
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
          onBg={(bg) => onChange({ bg })}
          onColor={(color) => onChange({ color })}
          onDelete={onDelete}
        />
      </PopoverContent>
    </Popover>
  )
}

function CardContents({ block, onChange }: { block: Block; onChange: (patch: Partial<Block>) => void }) {
  function addChild(type: Exclude<BlockType, "card">) {
    const child = newBlock(type, 0, 0)
    onChange({ children: [...block.children, child] })
  }
  function updateChild(id: string, patch: Partial<Block>) {
    onChange({ children: block.children.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  }
  function removeChild(id: string) {
    onChange({ children: block.children.filter((c) => c.id !== id) })
  }

  return (
    <div className="flex h-full flex-col gap-2" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap gap-1.5">
        {(["heading", "subheading", "paragraph"] as const).map((t) => (
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
      </div>
      <div className="flex-1 space-y-2 overflow-auto">
        {block.children.length === 0 ? (
          <p className="text-xs text-slate-400">Empty card — add a heading, subheading, or paragraph.</p>
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
          className="rounded-lg p-2 ring-1 ring-black/5"
          style={{ background: block.bg ?? "transparent", color: block.color ?? undefined }}
          onClick={(e) => {
            e.stopPropagation()
            setOpen(true)
          }}
        >
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onChange({ text: e.currentTarget.textContent ?? "" })}
            className={textClassFor(block.type)}
          >
            {block.text}
          </div>
        </div>
      </PopoverAnchor>
      <PopoverContent className="w-auto p-3" onOpenAutoFocus={(e) => e.preventDefault()} onClick={(e) => e.stopPropagation()}>
        <ColorToolbar
          bg={block.bg}
          color={block.color}
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
  onBg,
  onColor,
  onDelete,
}: {
  bg: string | null
  color: string | null
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
      <button onClick={onDelete} className="w-full rounded-lg border border-rose-200 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
        Delete block
      </button>
    </div>
  )
}
