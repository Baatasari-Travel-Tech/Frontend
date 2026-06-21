"use client";

import { motion, useReducedMotion } from "framer-motion";

const ITEMS = [
  "Music",
  "Comedy",
  "Food & Dining",
  "Workshops",
  "Sports",
  "Art & Culture",
  "Tech Meetups",
  "Nightlife",
  "Theatre",
  "Markets",
  "Festivals",
  "Wellness",
];

/**
 * Infinite category marquee — a band of constant motion that sits under the
 * hero and signals breadth of what's on the platform. Two copies of the track
 * scroll by -50% so the loop is seamless. Reduced-motion users get a static row.
 */
export default function Marquee() {
  const reduce = useReducedMotion();
  const track = [...ITEMS, ...ITEMS];

  return (
    <div className="relative overflow-hidden border-y border-(--gold-bar-border) bg-(--gold-bar-bg) py-5">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-(--gold-bar-bg) to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-(--gold-bar-bg) to-transparent" />

      <motion.div
        className="flex w-max items-center gap-8 whitespace-nowrap"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={
          reduce
            ? undefined
            : { duration: 32, repeat: Infinity, ease: "linear" }
        }
      >
        {track.map((item, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="font-bricolage text-xl font-semibold text-(--brand-navy)/80 md:text-2xl">
              {item}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-(--gold)" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}
