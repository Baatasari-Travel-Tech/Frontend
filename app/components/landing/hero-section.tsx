"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Users } from "lucide-react";
import { useState, useEffect } from "react";

export function HeroSection() {
  const [index, setIndex] = useState(0);
  const words = ["Interest", "Budget", "Vibe"];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <section className="relative px-4 pt-8 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-white via-stone-50 to-emerald-50 px-6 py-10 shadow-[0_30px_70px_rgba(15,23,42,0.08)] md:px-10 md:py-14"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-200/50 blur-[110px]" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-200/40 blur-[120px]" />
        </div>

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm backdrop-blur"
            >
              <Users size={14} className="text-emerald-600" />
              150+ people exploring Vizag today
            </motion.div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
              Experiences curated for every
              <span className="mt-2 block text-emerald-700">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={words[index]}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.5 }}
                    className="inline-block"
                  >
                    {words[index]}.
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base text-slate-600 md:text-lg">
              Book premium workshops, community events, and local experiences that
              match your mood, schedule, and budget.
            </p>
          </div>

          <motion.div
            whileHover={{ y: -4 }}
            className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur"
          >
            <div className="grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Where</p>
                <input
                  type="text"
                  placeholder="Visakhapatnam"
                  className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Activity</p>
                <input
                  type="text"
                  placeholder="Music, art, tech"
                  className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Budget</p>
                <select className="mt-2 w-full appearance-none bg-transparent text-sm font-semibold text-slate-900 outline-none">
                  <option>Any price</option>
                  <option>Free</option>
                  <option>Pocket friendly</option>
                </select>
              </div>

              <button className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                <Search size={18} />
                Explore
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
