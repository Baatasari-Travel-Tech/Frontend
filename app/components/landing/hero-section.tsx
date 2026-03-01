"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Users } from "lucide-react";
import { useState, useEffect } from "react";

export function HeroSection() {
  const [index, setIndex] = useState(0);
  const words = ["Interest", "Budget", "Vibe"];

  // Rotating text logic for the headline
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <section className="relative w-full bg-white px-4 pt-4 md:px-10 md:pt-5" style={{ fontFamily: "'Switzer', sans-serif" }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-120 w-full overflow-hidden rounded-[3.5rem] border border-gray-100 shadow-sm"
        style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)" }}
      >
        {/* Animated Mesh Shine */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div 
            animate={{ x: [0, 40, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -left-20 h-125 w-125 rounded-full bg-[#3a5f94]/15 blur-[120px]" 
          />
          <motion.div 
            animate={{ x: [0, -40, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-20 -right-20 h-125 w-125 rounded-full bg-[#122848]/10 blur-[120px]" 
          />
        </div>

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          {/* Status Badge - Builds FOMO and Trust */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 border border-white shadow-sm backdrop-blur-md"
          >
            <Users size={14} className="text-[#3a5f94]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-600">
              150+ People exploring Vizag today
            </span>
          </motion.div>

          {/* Dynamic Headline */}
          <h1 className="mb-4 max-w-4xl text-5xl font-medium tracking-tight text-black md:text-7xl">
            Events for every <br />
            <span className="relative inline-block text-[#122848] min-w-50">
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

          <p className="mb-12 max-w-lg text-base font-normal text-gray-600 md:text-lg">
            Handpicked workshops and premium local experiences tailored to your lifestyle.
          </p>

          {/* Elevated Search Bar */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="w-full max-w-4xl"
          >
            <div className="flex flex-col gap-0 rounded-[2.5rem] bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 md:flex-row md:items-center md:rounded-full">
              
              <div className="flex-1 px-8 py-3 text-left md:border-r border-gray-100 group transition-colors hover:bg-gray-50 rounded-l-full">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#3a5f94] mb-0.5">Where</p>
                <input type="text" placeholder="Visakhapatnam" className="w-full bg-transparent text-sm font-semibold text-black outline-none placeholder:text-gray-400" />
              </div>

              <div className="flex-1 px-8 py-3 text-left md:border-r border-gray-100 group transition-colors hover:bg-gray-50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#284878] mb-0.5">Activity</p>
                <input type="text" placeholder="Music, Art, Tech..." className="w-full bg-transparent text-sm font-semibold text-black outline-none" />
              </div>

              <div className="flex-1 px-8 py-3 text-left md:border-r border-gray-100 group transition-colors hover:bg-gray-50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#122848] mb-0.5">Budget</p>
                <select className="w-full bg-transparent text-sm font-semibold text-black outline-none appearance-none cursor-pointer">
                  <option>Any Price</option>
                  <option>Free</option>
                  <option>Pocket Friendly</option>
                </select>
              </div>

              <div className="p-1">
                <button className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0c1d37] px-10 font-bold text-white transition-all hover:bg-[#122848] hover:shadow-lg active:scale-95 md:rounded-full md:w-auto">
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