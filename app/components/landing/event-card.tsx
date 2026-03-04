"use client";

import { MapPin, Calendar, Heart } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

interface EventCardProps {
  title: string;
  location: string;
  price: string;
  date: string;
  image: string;
  category?: string;
}

export function EventCard({ title, location, price, date, image, category }: EventCardProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className="group w-72 shrink-0"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:shadow-xl">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(min-width: 1024px) 300px, (min-width: 768px) 260px, 70vw"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

        <div className="absolute left-4 top-4">
          <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-800 shadow-sm">
            {category || "Event"}
          </span>
        </div>

        <button
          type="button"
          aria-label="Add to favorites"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white hover:text-rose-500"
        >
          <Heart size={18} />
        </button>
      </div>

      <div className="mt-4 px-2">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-800">
          <Calendar size={12} strokeWidth={2.5} />
          {date}
        </div>

        <h3 className="text-lg font-semibold text-slate-900 transition group-hover:text-brand-800">
          {title}
        </h3>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <MapPin size={14} className="text-slate-400" />
            {location}
          </div>
          <p className="text-lg font-semibold text-slate-900">{price}</p>
        </div>
      </div>
    </motion.div>
  );
}

