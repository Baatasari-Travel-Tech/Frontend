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
    { title: "Holi Sundowner Fest", location: "Hauz Khas, Delhi", price: "₹999", date: "25 Mar 2026", image: "/images/e3.png", category: "Festival", numericPrice: 999 },
    { title: "Live Music Night", location: "Hyderabad", price: "₹499", date: "26 Mar 2026", image: "/images/event1.png", category: "Music", numericPrice: 499 },
    { title: "Standup Comedy", location: "Bangalore", price: "₹699", date: "28 Mar 2026", image: "/images/e2.png", category: "Comedy", numericPrice: 699 },
    { title: "Tech Workshop", location: "Visakhapatnam", price: "Free", date: "05 Apr 2026", image: "/images/e3.png", category: "Education", numericPrice: 0 },
  ];

  // Logic to filter by Category AND Price (if maxPrice is provided)
  const filteredEvents = experiences.filter((event) => {
    const categoryMatch = activeCategory === "All" || event.category === activeCategory;
    const priceMatch = !maxPrice || event.numericPrice <= maxPrice;
    return categoryMatch && priceMatch;
  });

  return (
    <section className="py-12 bg-white" style={{ fontFamily: "'Switzer', sans-serif" }}>
      <div className="flex items-center justify-between px-6 md:px-10 mb-8">
        <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-black">{title}</h2>
        <Link href="/experiences" className="text-sm font-semibold text-[#3a5f94] hover:text-[#122848] transition-colors">
          View all experiences →
        </Link>
      </div>

      <div className="overflow-x-auto px-6 md:px-10 no-scrollbar">
        <motion.div layout className="flex gap-6 min-w-max pb-6">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((exp) => (
              <motion.div
                key={exp.title}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <EventCard {...exp} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        
        {filteredEvents.length === 0 && (
          <div className="py-10 text-center text-gray-400 w-full">
            No events found for &quot;{activeCategory}&quot; in this section.
          </div>
        )}
      </div>
    </section>
  );
}