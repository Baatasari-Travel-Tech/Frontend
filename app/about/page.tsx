export default function AboutPage() {
  return (
    <div className="page-x py-12 md:py-16">
      <div className="w-full rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-900">About</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">About Baatasari</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            Baatasari helps people discover, connect, and experience events, dining, and local
            activities. We bring creators, venues, and communities together through a single
            destination that makes planning effortless.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Our Mission</p>
            <p className="mt-3 text-sm text-slate-600">
              Curate meaningful experiences and make them accessible to everyone.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Our Focus</p>
            <p className="mt-3 text-sm text-slate-600">
              Events, dining, and activities that are verified, personalized, and easy to book.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Our Promise</p>
            <p className="mt-3 text-sm text-slate-600">
              A trusted platform for hosts and guests, designed for real-world experiences.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
