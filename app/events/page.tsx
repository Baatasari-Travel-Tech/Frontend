export default function EventsPage() {
  return (
    <div className="page-x py-12 md:py-16">
      <div className="w-full rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-900">Events</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">Public events</h2>
        </div>
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          Events will appear here soon.
        </div>
      </div>
    </div>
  )
}


