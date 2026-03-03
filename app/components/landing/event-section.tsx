"use client";

import { motion, AnimatePresence } from "framer-motion";
import { EventCard } from "./event-card";
import Link from "next/link";

interface EventSectionProps {
  title: string;
  activeCategory: string;
  maxPrice?: number;
}

export function EventSection({ title, activeCategory, maxPrice }: EventSectionProps) {
  const experiences = [
    { title: "Holi Sundowner Fest", location: "Hauz Khas, Delhi", price: "Rs 999", date: "25 Mar 2026", image: "/e3.png", category: "Festival", numericPrice: 999 },
    { title: "Live Music Night", location: "Hyderabad", price: "Rs 499", date: "26 Mar 2026", image: "/event1.png", category: "Music", numericPrice: 499 },
    { title: "Standup Comedy", location: "Bangalore", price: "Rs 699", date: "28 Mar 2026", image: "/e2.png", category: "Comedy", numericPrice: 699 },
    { title: "Tech Workshop", location: "Visakhapatnam", price: "Free", date: "05 Apr 2026", image: "/e3.png", category: "Education", numericPrice: 0 },
  ];

  const filteredEvents = experiences.filter((event) => {
    const categoryMatch = activeCategory === "All" || event.category === activeCategory;
    const priceMatch = !maxPrice || event.numericPrice <= maxPrice;
    return categoryMatch && priceMatch;
  });

  return (
    <section className="px-4 md:px-8">
      <div className="w-full rounded-4xl bg-white px-6 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            {title}
          </h2>
          <Link
            href="/experiences"
            className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            View all experiences -&gt;
          </Link>
        </div>

        <div className="mt-6 overflow-x-auto no-scrollbar">
          <motion.div layout className="flex min-w-max gap-6 pb-6">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((exp) => (
                <motion.div
                  key={exp.title}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <EventCard {...exp} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredEvents.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-500">
              No events found for &quot;{activeCategory}&quot; in this section.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
