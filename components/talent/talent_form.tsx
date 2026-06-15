"use client"

import {
  ArrowRight,
  Handshake,
  Lock,
  ShieldCheck,
  Tag,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const FEATURES = [
  {
    icon: Tag,
    title: "No Subscription Fees",
    description: "Join and use the platform absolutely free.",
  },
  {
    icon: Handshake,
    title: "Direct Connections",
    description: "Connect directly with verified businesses and organizers.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Businesses",
    description: "All businesses are verified for your safety and trust.",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    description: "Get paid securely with clear transactions and reports.",
  },
] as const

export function TalentInformationForm() {
  return (
    <section className="relative isolate w-full overflow-hidden">
      {/* Full-bleed background image */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Image
          src="/talent-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-bottom"
        />
        {/* Cream overlay — strong on the left where text sits, fades right */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/55 to-background/20" />
      </div>

      {/* Hero */}
      <div className="mx-auto flex min-h-[70vh] max-w-[1400px] flex-col justify-center px-4 pt-4 pb-8 sm:px-6 lg:px-10 lg:pt-6">
        {/* Copy */}
        <div className="max-w-xl">
          {/* Title */}
          <h1 className="font-bricolage text-5xl leading-[1.02] tracking-[-0.02em] text-(--brand-navy) sm:text-6xl lg:text-7xl">
            Turn Your Talent
            <br />
            Into <span className="text-(--gold)">Opportunities</span>
          </h1>

          {/* Subtitle */}
          <p className="font-albert mt-8 max-w-md text-lg leading-9 text-(--gray-600)">
            Baatasari connects talented people with caf&eacute;s, events,
            venues and brands across Vizag.
            <br />
            Share your talent. Get discovered. Get booked.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/talent/onboarding"
              className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-(--brand-navy) px-8 font-albert text-base font-semibold text-white shadow-lg shadow-(--brand-navy)/20 transition hover:bg-(--brand-navy)/90"
            >
              Register as Talent
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Feature bar */}
      <div className="mx-auto max-w-[1400px] px-4 pb-10 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-8 rounded-[1.5rem] border border-(--gold-bar-border) bg-(--gold-bar-bg) px-8 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--gold-soft-bg) text-(--gold-icon)">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-albert text-base font-bold text-(--brand-navy)">
                    {f.title}
                  </h3>
                  <p className="font-albert mt-1 text-sm leading-6 text-(--gray-500)">
                    {f.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
