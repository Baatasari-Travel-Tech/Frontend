"use client"

import { useEffect, useRef, useState } from "react"
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

// Reusable place picker. Type an area or city (min 3 chars) → ranked dropdown
// of "Area, City, State - Pincode" → on select, the parent auto-fills its
// structured fields. Search matches area+city only (state never floods results).
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
  const boxRef = useRef<HTMLDivElement>(null)

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
        setResults(await searchLocations(q))
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [text])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div ref={boxRef} className={`relative ${className}`}>
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
          className="w-full bg-transparent py-2.5 text-sm text-slate-900 outline-none"
        />
      </div>
      {open && text.trim().length >= 3 ? (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <p className="px-3 py-2 text-xs text-slate-400">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">No matches — keep typing</p>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onSelect(r)
                  setText(r.label)
                  setOpen(false)
                }}
                className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                {r.label}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
