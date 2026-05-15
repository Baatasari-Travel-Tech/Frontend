"use client"

import { motion, AnimatePresence } from "framer-motion"
import { HandpickedEventCard } from "@/components/events/handpicked-card"
import Link from "next/link"
import type { EventData } from "@/lib/events-data"

interface PersonalizedEventSectionProps {
  title: string
  events: EventData[]
  isLoading?: boolean
  showExploreOnEmpty?: boolean
}

export function PersonalizedEventSection({
  title,
  events,
  isLoading = false,
  showExploreOnEmpty = false,
}: PersonalizedEventSectionProps) {
  return (
    <section
      className="py-6 font-switzer"
      style={{ backgroundColor: "var(--event-section-bg)" }}
    >
      <div className="flex items-center justify-between px-6 md:px-10 mb-4">
        <h2
          className="text-2xl md:text-3xl font-medium tracking-tight"
          style={{ color: "var(--event-section-title)" }}
        >
          {title}
        </h2>
        <Link
          href="/events"
          className="inline-flex min-w-22 items-center justify-center rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
        >
          View all
        </Link>
      </div>

      <div className="overflow-x-auto px-6 md:px-10 no-scrollbar">
        {isLoading ? (
          <div
            className="py-10 text-center w-full"
            style={{ color: "var(--event-section-empty)" }}
          >
            <p className="text-lg font-medium">Loading events...</p>
          </div>
        ) : events.length > 0 ? (
          <motion.div layout className="flex gap-8 md:gap-10 min-w-max pb-6">
            <AnimatePresence mode="popLayout">
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <HandpickedEventCard {...event} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div
            className="py-10 text-center w-full"
            style={{ color: "var(--event-section-empty)" }}
          >
            {showExploreOnEmpty ? (
              <p className="text-lg font-medium">
                Explore{" "}
                <Link
                  href="/events"
                  className="underline hover:opacity-80"
                  style={{ color: "var(--brand-blue)" }}
                >
                  other events
                </Link>
              </p>
            ) : (
              <p className="text-lg font-medium">No events available right now</p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
