"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { MapPin } from "lucide-react"
import { searchAreas, type LocationResult } from "@/lib/api/locations"

interface AreaAutocompleteProps {
  /** Current display value (e.g. the saved "Area, City, State - Pincode"). */
  value?: string
  /** Called when the user picks a place. */
  onSelect: (loc: LocationResult) => void
  placeholder?: string
  className?: string
}

// Area/city-name-only picker (min 3 chars) — no pincode typing. Used for
// event creation, where the organizer names the venue's area by hand and
// precise geolocation is the separate Google Maps URL field's job, so the
// "type a pincode to page through every area under it" behaviour that
// LocationAutocomplete offers isn't needed here.
export function AreaAutocomplete({
  value,
  onSelect,
  placeholder = "Search area or city",
  className = "",
}: AreaAutocompleteProps) {
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
        setResults(await searchAreas(q))
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [text])

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
          name="baatasari-area-search"
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
