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
        visible: { opacity: 1, y: 0 }
      }}
      className="group w-70 shrink-0 cursor-pointer"
    >
      {/* Poster Image Container with Soft Shadow */}
      <div className="relative aspect-3/4 w-full overflow-hidden rounded-4xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
        <Image 
          src={image} 
          alt={title} 
          fill
          sizes="(min-width: 1024px) 280px, (min-width: 768px) 240px, 70vw"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
        />
        
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Category Badge */}
        <div className="absolute top-5 left-5">
          <span className="rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black shadow-sm">
            {category || "Event"}
          </span>
        </div>

        {/* Favorite Button */}
        <button className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-red-500 transition-all duration-300">
          <Heart size={18} />
        </button>
      </div>

      {/* Details with refined Switzer spacing */}
      <div className="mt-5 px-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#3a5f94] uppercase tracking-widest mb-1.5">
          <Calendar size={12} strokeWidth={2.5} />
          {date}
        </div>

        <h3 className="text-lg font-medium text-black leading-tight mb-3 group-hover:text-[#122848] transition-colors">
          {title}
        </h3>

        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
          <div className="flex items-center gap-1 text-sm text-gray-500 font-normal">
            <MapPin size={14} className="text-gray-400" />
            {location}
          </div>
          <p className="text-lg font-bold text-black tracking-tight">{price}</p>
        </div>
      </div>
    </motion.div>
  );
}
