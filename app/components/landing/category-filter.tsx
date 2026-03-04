"use client";

import { motion } from "framer-motion";
import { Flame, Music, Mic2, Laptop, Sparkles, Ticket } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [thumb, setThumb] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const updateThumb = () => {
      const maxScroll = Math.max(1, el.scrollWidth - el.clientWidth);
      const trackWidth = el.clientWidth;
      const width = Math.max(36, Math.round((el.clientWidth / el.scrollWidth) * trackWidth));
      const left = Math.round((el.scrollLeft / maxScroll) * (trackWidth - width));
      setThumb({ left, width });
    };
    updateThumb();
    const onResize = () => updateThumb();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="sticky top-12 z-30 w-full page-x">
      <div className="relative mx-auto w-full max-w-full rounded-[2rem] border border-white/60 bg-white/80 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur md:w-fit">
        <div
          ref={scrollRef}
          onScroll={() => {
            const el = scrollRef.current;
            if (!el) return;
            const maxScroll = Math.max(1, el.scrollWidth - el.clientWidth);
            const trackWidth = el.clientWidth;
            const width = Math.max(36, Math.round((el.clientWidth / el.scrollWidth) * trackWidth));
            const left = Math.round((el.scrollLeft / maxScroll) * (trackWidth - width));
            setThumb({ left, width });
          }}
          className="flex items-center justify-start gap-4 overflow-x-scroll pb-3 no-scrollbar md:justify-center md:overflow-visible md:pb-0"
        >
          <div className="hidden items-center gap-2 rounded-full border border-brand-900/10 bg-brand-900/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-800 lg:flex">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
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
                      className="absolute inset-0 -z-10 rounded-full bg-brand-900 shadow-lg shadow-brand-900/20"
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
        <div className="mt-2 md:hidden" aria-hidden="true">
          <div className="h-1 w-full rounded-full bg-slate-200/70">
            <div
              className="h-1 rounded-full bg-slate-500/70 transition-[transform,width] duration-300 ease-out"
              style={{ width: `${thumb.width}px`, transform: `translateX(${thumb.left}px)` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

