"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { MapPin } from "lucide-react"
import { searchLocations, type LocationResult } from "@/lib/api/locations"

interface LocationAutocompleteProps {
  /** Current display value (e.g. the saved "Area, City, State - Pincode"). */
  value?: string
  /** Called when the user picks a place — fill your Area/City/State/Pincode fields from this. */
  onSelect: (loc: LocationResult) => void
  placeholder?: string
  className?: string
}

// Reusable place picker. Type an area, city or pincode (min 3 chars) → ranked
// dropdown of "Area, City, State - Pincode" → on select the parent auto-fills
// its structured fields.
//
// The dropdown is rendered in a PORTAL (position: fixed, anchored to the input)
// so it can never be clipped by an ancestor with `overflow-hidden` (e.g. the
// rounded section cards) — every option is always fully visible.
export function LocationAutocomplete({
  value,
  onSelect,
  placeholder = "Search area or city",
  className = "",
}: LocationAutocompleteProps) {
  const [text, setText] = useState(value ?? "")
  const [results, setResults] = useState<LocationResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    setText(value ?? "")
  }, [value])

  // Debounced search.
  useEffect(() => {
    const q = text.trim()
    if (q.length < 3) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        setResults(await searchLocations(q))
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [text])

  // Keep the portal menu glued under the input through scroll/resize.
  useEffect(() => {
    if (!open) return
    const reposition = () => {
      const el = anchorRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setCoords({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    reposition()
    window.addEventListener("scroll", reposition, true)
    window.addEventListener("resize", reposition)
    return () => {
      window.removeEventListener("scroll", reposition, true)
      window.removeEventListener("resize", reposition)
    }
  }, [open])

  // Close on outside click — both the input box AND the portal menu count as "inside".
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (anchorRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  const showMenu = open && text.trim().length >= 3

  const menu = showMenu && coords ? (
    <div
      ref={menuRef}
      style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width }}
      className="z-[100] max-h-80 overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
    >
      {/* A busy pincode returns a lot of areas (791122 has 153). Say how many, and
          point at the way out: type the area name after the code to filter. */}
      {!loading && results.length > 12 ? (
        <p className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-3 py-2 text-[11px] font-medium text-slate-500 backdrop-blur">
          {results.length} areas. Type your area name after the pincode to narrow.
        </p>
      ) : null}
      {loading ? (
        <p className="px-3 py-2 text-xs text-slate-400">Searching…</p>
      ) : results.length === 0 ? (
        <p className="px-3 py-2 text-xs text-slate-400">No matches — keep typing</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onSelect(r)
                setText(r.label)
                setOpen(false)
              }}
              className="block w-full px-3 py-2.5 text-left text-sm leading-snug text-slate-700 hover:bg-slate-50"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  ) : null

  return (
    <div ref={anchorRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3">
        <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          // Suppress the browser's saved-address / autofill dropdown — we render
          // our own results. Covers Chrome/Safari/Firefox + common password managers.
          name="baatasari-place-search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
          className="w-full bg-transparent py-2.5 text-sm text-slate-900 outline-none"
        />
      </div>
      {mounted && menu ? createPortal(menu, document.body) : null}
    </div>
  )
}
