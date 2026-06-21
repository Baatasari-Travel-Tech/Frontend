"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/**
 * Dark closing band before the footer. Breaks the all-cream rhythm of the
 * marketing sections with a single high-contrast moment and a clear final CTA.
 */
export default function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-(--brand-navy) py-20 md:py-28">
      {/* Ambient brand glow */}
      <div
        aria-hidden
        className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[70vw] max-w-3xl aspect-square rounded-full opacity-40 blur-[120px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--gold) 60%, transparent) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true }}
        className="relative z-10 mx-auto w-full max-w-3xl px-6 text-center"
      >
        <h2 className="font-bricolage font-bold text-4xl md:text-6xl tracking-tight text-(--white) leading-[1.05]">
          Your next experience is{" "}
          <span className="bg-gradient-to-r from-(--gold) to-(--white) bg-clip-text text-transparent">
            one tap away
          </span>
        </h2>

        <p className="font-poppins text-lg md:text-xl text-(--white)/70 mt-6 max-w-xl mx-auto">
          Events, food, workshops, and the people who make them. Discover what&apos;s
          happening around you tonight.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/events"
            className="font-poppins font-bold text-lg px-12 py-4 rounded-full bg-(--gold) text-(--brand-navy) transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl"
          >
            Start exploring
          </Link>
          <Link
            href="/?auth=register&role=organizer"
            className="font-poppins font-semibold text-lg px-8 py-4 rounded-full border border-(--white)/25 text-(--white) transition-all duration-300 hover:border-(--white)/60 hover:bg-(--white)/[0.06]"
          >
            List your event
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
