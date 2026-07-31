// Types + helpers for the canvas builder playground. Purely client-side —
// no persistence, no backend. See lib/recruitment.ts for the sibling
// "schema + helpers" pattern this mirrors.

export type BlockType = "heading" | "subheading" | "paragraph" | "card"

export type Block = {
  id: string
  type: BlockType
  col: number // 0-based grid column, 0..COLS-1
  row: number // 0-based grid row (unbounded, canvas grows)
  colSpan: number
  rowSpan: number
  text: string
  bg: string | null
  color: string | null
  /** Only meaningful for "card" — nested blocks rendered inside it. */
  children: Block[]
}

export const COLS = 12
export const ROW_UNIT = 28 // px per grid row

export const BLOCK_LIBRARY: { type: BlockType; label: string; colSpan: number; rowSpan: number }[] = [
  { type: "heading", label: "Heading", colSpan: 6, rowSpan: 2 },
  { type: "subheading", label: "Subheading", colSpan: 6, rowSpan: 1 },
  { type: "paragraph", label: "Paragraph", colSpan: 6, rowSpan: 3 },
  { type: "card", label: "Card", colSpan: 6, rowSpan: 6 },
]

const DEFAULT_TEXT: Record<BlockType, string> = {
  heading: "Heading",
  subheading: "Subheading",
  paragraph: "Write something…",
  card: "",
}

// Curated swatches — brand palette first, then a few vivid extras so the
// canvas doesn't feel locked to one mood.
export const BG_SWATCHES = [
  "#0c1D37", // brand navy
  "#1f4fd8", // royal blue
  "#c2962e", // gold
  "#f5efe4", // cream
  "#ffffff",
  "#eee9ff", // soft purple
  "#dcfce7", // soft green
  "#ffe4e6", // soft rose
]

export const TEXT_SWATCHES = ["#0c1D37", "#ffffff", "#1f4fd8", "#c2962e", "#6b5ce7", "#334155"]

export function uid(prefix = "b"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export function newBlock(type: BlockType, col: number, row: number): Block {
  const meta = BLOCK_LIBRARY.find((b) => b.type === type)!
  return {
    id: uid(),
    type,
    col,
    row,
    colSpan: meta.colSpan,
    rowSpan: meta.rowSpan,
    text: DEFAULT_TEXT[type],
    bg: type === "card" ? "#ffffff" : null,
    color: null,
    children: [],
  }
}

/** Next free row at the bottom of a block list — used for click-to-append. */
export function nextFreeRow(blocks: Block[]): number {
  return blocks.reduce((max, b) => Math.max(max, b.row + b.rowSpan), 0)
}

export function clampCol(col: number, colSpan: number): number {
  return Math.min(Math.max(col, 0), COLS - colSpan)
}
