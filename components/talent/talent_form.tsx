"use client"

import {
  BadgeCheck,
  CircleDollarSign,
  Link2,
  UserPlus,
} from "lucide-react"
import Link from 'next/link'

const BENEFIT_CARDS = [
  {
    icon: UserPlus,
    title: "Register",
    description: "Create your profile with specific skills.",
    accent: false,
  },
  {
    icon: BadgeCheck,
    title: "No Subscriptions",
    description: "Access the network without any monthly fees.",
    accent: true,
  },
  {
    icon: Link2,
    title: "Showcase",
    description: "Upload links to your best performances.",
    accent: false,
  },
  {
    icon: CircleDollarSign,
    title: "No Hidden Charges",
    description: "Transparent platform with zero surprise costs.",
    accent: true,
  },
] as const

export function TalentInformationForm() {

  return (
    <section className="overflow-hidden rounded-[2rem] border border-(--talent-section-border) bg-(--talent-page-bg)">
      <div className="relative overflow-hidden border-b border-(--talent-section-border) bg-[linear-gradient(180deg,var(--talent-page-bg)_0%,var(--talent-surface-soft)_100%)] pt-8">
        <div className="absolute inset-0 opacity-60 bg-[linear-gradient(to_right,var(--talent-page-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--talent-page-grid)_1px,transparent_1px)] bg-size-[72px_72px]" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="mb-8 rounded-full border border-(--talent-pill-border) bg-(--talent-pill-bg) px-4 py-2 font-albert text-[10px] font-bold uppercase tracking-[0.15em] text-(--talent-pill-text)">
            Vizag&apos;s performer network
          </div>

          <h1 className="font-bricolage max-w-4xl text-5xl  leading-[0.96] tracking-[-0.02em] text-(--talent-title) sm:text-6xl lg:text-[5.4rem]">
            Turn Your Talent
            <br />
            Into{" "}
            <span className="text-(--talent-highlight-start)">
              Real Opportunities
            </span>
          </h1>

          <p className="font-albert mt-8 max-w-2xl text-base font-normal leading-8 tracking-[0.5px] text-(--talent-body) sm:text-[20px] sm:leading-6">
            Baatasari connects performers with cafes, restaurants, events, and venues
            across Vizag. Share your talent and start getting booked.
          </p>

          <div className="mt-12 grid w-full gap-4 md:grid-cols-2 xl:grid-cols-4">
            {BENEFIT_CARDS.map((card) => {
              const Icon = card.icon

              return (
                <article
                  key={card.title}
                  className={`rounded-[1.9rem] border px-5 py-6 text-left ${
                    card.accent
                      ? "border-(--talent-card-border-accent) bg-(--talent-card-bg-accent)"
                      : "border-(--talent-card-border) bg-(--talent-card-bg)"
                  }`}
                >
                  <div
                    className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl ${
                      card.accent
                        ? "bg-(--talent-card-icon-success-bg) text-(--talent-card-icon-success-fg)"
                        : "bg-(--talent-card-icon-bg) text-(--talent-card-icon-fg)"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-albert text-xl font-semibold text-(--talent-card-title)">
                    {card.title}
                  </h2>
                  <p className="font-albert mt-2 text-sm leading-7 text-(--talent-card-text)">
                    {card.description}
                  </p>
                </article>
              )
            })}
          </div>
          <div className="py-10">

          <Link
            type="button"
            href="/talent/onboarding"
            className="btn-primary mt-5 py-4 min-h-12 bg-brand-900 px-8 font-inter text-[16px] rounded-full leading-6 tracking-[0] text-(--white) shadow-(--talent-primary-btn-shadow) hover:bg-(--brand-navy)/90 hover:text-(--white)"
          >
            Register Talent
          </Link>
          </div>
        </div>
      </div>
    </section>
  )
}