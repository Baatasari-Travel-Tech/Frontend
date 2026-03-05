"use client";

import { motion, AnimatePresence } from "framer-motion";
import { HandpickedEventCard } from "@/components/events/handpicked-card";
import Link from "next/link";
import { getAllEvents } from "@/lib/events-data";

interface EventSectionProps {
  title: string;
  activeCategory: string;
  sectionCategory?: string;
  maxPrice?: number;
}

export function EventSection({
  title,
  activeCategory,
  sectionCategory,
  maxPrice
}: EventSectionProps) {
  const allEvents = getAllEvents();
  const filteredEvents = allEvents.filter((event) => {
    const effectiveCategory =
      activeCategory === "All" ? sectionCategory : activeCategory;

    const categoryMatch =
      !effectiveCategory || event.category === effectiveCategory;

    const priceMatch =
      !maxPrice || event.numericPrice <= maxPrice;

    return categoryMatch && priceMatch;
  });

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
          href="/experiences"
          className="text-sm font-semibold transition-colors"
          style={{ color: "var(--event-section-link)" }}
          onMouseEnter={(e) =>
          (e.currentTarget.style.color =
            "var(--event-section-link-hover)")
          }
          onMouseLeave={(e) =>
          (e.currentTarget.style.color =
            "var(--event-section-link)")
          }
        >
          View all experiences →
        </Link>
      </div>

      <div className="overflow-x-auto px-6 md:px-10 no-scrollbar">
        <motion.div
          layout
          className="flex gap-8 md:gap-10 min-w-max pb-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((exp) => (
              <motion.div
                key={exp.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <HandpickedEventCard {...exp} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredEvents.length === 0 && (
          <div
            className="py-10 text-center w-full"
            style={{ color: "var(--event-section-empty)" }}
          >
            No events found for &quot;{activeCategory}&quot; in this section.
          </div>
        )}
      </div>
    </section>
  );
}