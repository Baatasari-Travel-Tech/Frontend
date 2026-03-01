"use client";

import { motion } from "framer-motion";
import { 
  Flame, 
  Music, 
  Mic2, 
  Laptop, 
  Sparkles, 
  Ticket 
} from "lucide-react";

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
    <div 
      className="w-full sticky top-20 z-40 px-4 md:px-10 py-4"
      style={{ fontFamily: "'Switzer', sans-serif" }}
    >
      {/* Big Rounded Glossy Pill Container */}
      <div className="mx-auto max-w-7xl bg-white/70 backdrop-blur-lg border border-white/40 shadow-xl rounded-[2.5rem] px-6 py-3 no-scrollbar overflow-x-auto">
        <div className="flex items-center gap-6">
          
          {/* Hyper-local Vizag Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-white/50 rounded-full border border-white shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#122848]">
              Visakhapatnam
            </span>
          </div>

          <div className="hidden lg:block h-8 w-px bg-gray-200/50" />

          {/* Category Pills */}
          <div className="flex gap-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.name;
              
              return (
                <button
                  key={cat.name}
                  onClick={() => onCategoryChange && onCategoryChange(cat.name)}
                  className={`relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                    isActive ? "text-white" : "text-gray-600 hover:text-black hover:bg-white/80"
                  }`}
                >
                  {/* Sliding Active Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 z-0 rounded-full bg-[#122848] shadow-lg shadow-[#122848]/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  <span className="relative z-10">{cat.icon}</span>
                  <span className="relative z-10">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}