"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users } from "lucide-react";
import { useState, useEffect } from "react";

export function HeroSection() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const words = ["Interest", "Budget", "Vibe"];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <section className="hero-section relative w-full px-4 pt-4 md:px-10 md:pt-5 font-switzer">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-container relative h-120 w-full overflow-hidden rounded-[3.5rem] shadow-sm"
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 40, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="hero-blob-1 absolute -top-20 -left-20 h-125 w-125 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ x: [0, -40, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="hero-blob-2 absolute -bottom-20 -right-20 h-125 w-125 rounded-full blur-[120px]"
          />
        </div>

        <div className="relative z-10 bg-(--bg-muted-strong) flex h-full flex-col items-center justify-center px-4 text-center">

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hero-badge mb-6 flex items-center gap-2 rounded-full px-4 py-2 shadow-sm backdrop-blur-md"
          >
            <Users size={14} className="hero-badge-icon" />
            <span className="hero-badge-text text-[10px] font-bold uppercase tracking-[0.15em]">
              150+ People exploring Vizag today
            </span>
          </motion.div>

          <h1 className="hero-title mb-4 max-w-4xl text-5xl font-medium tracking-tight md:text-7xl">
            Events for every <br />
            <span className="hero-title-highlight relative inline-block min-w-50">
              <AnimatePresence mode="wait">
                <motion.span
                  key={words[index]}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="block"
                >
                  {words[index]}.
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <p className="hero-description mb-12 max-w-lg text-base font-normal md:text-lg">
            Handpicked workshops and premium local experiences tailored to your lifestyle.
          </p>

          <motion.div whileHover={{ y: -5 }} className="w-full max-w-4xl">
            <div className="hero-search flex flex-col gap-0 rounded-[2.5rem] p-2 md:flex-row md:items-center md:rounded-full">

              <div className="hero-input-group flex-1 px-8 py-3 text-left group transition-colors rounded-l-full md:border-r">
                <p className="hero-label-where text-[10px] font-bold uppercase tracking-wider mb-0.5">
                  Where
                </p>
                <input
                  type="text"
                  placeholder="Visakhapatnam"
                  className="hero-input-text w-full bg-transparent text-sm font-semibold outline-none"
                />
              </div>

              <div className="hero-input-group flex-1 px-8 py-3 text-left group transition-colors md:border-r">
                <p className="hero-label-activity text-[10px] font-bold uppercase tracking-wider mb-0.5">
                  Activity
                </p>
                <input
                  type="text"
                  placeholder="Music, Art, Tech..."
                  className="hero-input-text w-full bg-transparent text-sm font-semibold outline-none"
                />
              </div>

              <div className="hero-input-group flex-1 px-8 py-3 text-left group transition-colors md:border-r">
                <p className="hero-label-budget text-[10px] font-bold uppercase tracking-wider mb-0.5">
                  Budget
                </p>
                <select className="hero-input-text w-full bg-transparent text-sm font-semibold outline-none appearance-none cursor-pointer">
                  <option>Any Price</option>
                  <option>Free</option>
                  <option>Pocket Friendly</option>
                </select>
              </div>

              <div className="p-1">
                <button
                  onClick={() => router.push("/experiences")}
                  className="hero-button flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-10 font-bold transition-all hover:shadow-lg active:scale-95 md:rounded-full md:w-auto"
                >
                  <Search size={18} />
                  <span>Explore</span>
                </button>
              </div>

            </div>
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
}