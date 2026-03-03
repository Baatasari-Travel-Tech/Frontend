"use client";

import { motion } from "framer-motion";
import { Flame, Music, Mic2, Laptop, Sparkles, Ticket } from "lucide-react";

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  const categories = [
    { name: "All", icon: <Flame size={16} /> },
    { name: "Music", icon: <Music size={16} /> },
    { name: "Comedy", icon: <Mic2 size={16} /> },
    { name: "Education", icon: <Laptop size={16} /> },
    { name: "Festival", icon: <Sparkles size={16} /> },
    { name: "Movies", icon: <Ticket size={16} /> },
  ];

  return (
    <div className="sticky top-16 z-30 px-4 md:px-8">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/60 bg-white/80 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 lg:flex">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
            </span>
            Visakhapatnam
          </div>
          <div className="hidden h-8 w-px bg-slate-200 lg:block" />

          <div className="flex items-center gap-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.name;

              return (
                <button
                  key={cat.name}
                  onClick={() => onCategoryChange(cat.name)}
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "text-white"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-emerald-600 shadow-lg shadow-emerald-500/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
