"use client";

import { motion, AnimatePresence } from "framer-motion";
import { EventCard } from "./event-card";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface EventSectionProps {
  title: string;
  activeCategory: string;
  maxPrice?: number;
}

export function EventSection({ title, activeCategory, maxPrice }: EventSectionProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
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

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < maxScroll - 1);
    };
    update();
    const onResize = () => update();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [filteredEvents.length]);

  const scrollByCard = (direction: "left" | "right") => {
    const scroller = scrollRef.current;
    const row = rowRef.current;
    if (!scroller || !row) return;
    const firstCard = row.firstElementChild as HTMLElement | null;
    if (!firstCard) return;
    const styles = window.getComputedStyle(row);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0");
    const cardWidth = firstCard.getBoundingClientRect().width;
    const step = cardWidth + gap;
    if (step <= 0) return;
    const currentIndex = Math.round(scroller.scrollLeft / step);
    const nextIndex = direction === "right" ? currentIndex + 1 : currentIndex - 1;
    const targetLeft = Math.max(0, nextIndex * step);
    scroller.scrollTo({ left: targetLeft, behavior: "smooth" });
  };

  return (
    <section className="w-full page-x">
      <div className="w-full rounded-[2rem] bg-white px-6 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            {title}
          </h2>
          <Link
            href="/experiences"
            className="text-sm font-semibold text-brand-800 transition hover:text-brand-800"
          >
            View all experiences -&gt;
          </Link>
        </div>

          <div className="relative mt-6">
          <div className="relative mx-auto w-full max-w-none">
            <div
              ref={scrollRef}
              onScroll={() => {
                const el = scrollRef.current;
                if (!el) return;
                const maxScroll = el.scrollWidth - el.clientWidth;
                setCanScrollLeft(el.scrollLeft > 0);
                setCanScrollRight(el.scrollLeft < maxScroll - 1);
              }}
            className="overflow-x-auto no-scrollbar responsive-scroll-x"
          >
              <motion.div
                ref={rowRef}
                layout
                className="flex w-max min-w-full items-stretch justify-center gap-6 pb-6 md:justify-start"
              >
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

            {canScrollLeft && (
              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => scrollByCard("left")}
                className="absolute -left-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-sm transition hover:bg-white"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {canScrollRight && (
              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => scrollByCard("right")}
                className="absolute -right-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-sm transition hover:bg-white"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
