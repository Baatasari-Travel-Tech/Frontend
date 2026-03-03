"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export function MovieSection({ title }: { title: string }) {
  const router = useRouter();

  return (
    <section className="px-4 md:px-8">
      <div className="relative w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-900 px-6 py-10 shadow-[0_30px_70px_rgba(15,23,42,0.2)] md:px-10">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="/landing/Baatasari-pass-entertainment-banner.jpg"
            alt="Banner"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="relative z-10 flex flex-col gap-6 text-center">
          <span className="mx-auto inline-flex items-center rounded-full border border-white/30 bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
            Baatasari Pass
          </span>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">{title}</p>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              Unlimited access to events and movies
            </h2>
          </div>

          <p className="mx-auto max-w-2xl text-base text-white/80">
            Get exclusive discounts, early access to bookings, and VIP perks across the city.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => router.push("/")}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-100"
            >
              Explore
            </button>
            <button
              onClick={() => router.push("/register")}
              className="rounded-full border border-white/40 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Join the pass
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
