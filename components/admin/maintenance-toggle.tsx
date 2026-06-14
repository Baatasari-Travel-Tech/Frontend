"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, Loader2, Globe, Power } from "lucide-react"
import { getAdminSiteConfig, updateAdminSiteConfig } from "@/lib/api/admin"

// Admin control to put the entire public site into "Under Maintenance" mode.
// While ON, the frontend middleware rewrites every public route to /maintenance;
// admin routes stay reachable so this can always be switched back OFF.
export default function MaintenanceToggle() {
  const [on, setOn] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const cfg = await getAdminSiteConfig()
      setOn(Boolean(cfg.maintenanceMode))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load maintenance status")
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const toggle = async () => {
    if (on === null || busy) return
    const next = !on
    const confirmMsg = next
      ? "Turn ON maintenance mode? The entire public site will be replaced by an \"Under Maintenance\" page. Admin stays accessible."
      : "Turn OFF maintenance mode and bring the site back live?"
    if (!window.confirm(confirmMsg)) return

    setBusy(true)
    setError(null)
    try {
      const cfg = await updateAdminSiteConfig({ maintenanceMode: next })
      setOn(Boolean(cfg.maintenanceMode))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update maintenance mode")
    } finally {
      setBusy(false)
    }
  }

  const active = on === true

  return (
    <section
      className={`rounded-xl border p-5 shadow-sm transition-colors ${
        active ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              active ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {active ? <AlertTriangle className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Maintenance mode
              <span
                className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                  active ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"
                }`}
              >
                {on === null ? "…" : active ? "ON" : "LIVE"}
              </span>
            </p>
            <p className="mt-0.5 max-w-md text-xs text-slate-600">
              {active
                ? "The public site is showing the \"Under Maintenance\" page. Visitors can't reach any pages."
                : "The site is live and fully accessible to everyone."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void toggle()}
          disabled={on === null || busy}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
            active ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
          }`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
          {active ? "Bring site live" : "Enable maintenance"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      ) : null}
    </section>
  )
}
