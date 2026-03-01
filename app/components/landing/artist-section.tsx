"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function ArtistSection() {
  const artists = [
    { name: "Anirudh", image: "/images/a1.png" },
    { name: "Arijit Troop", image: "/images/a2.png" },
    { name: "Shreya Ghoshal", image: "/images/a3.png" },
    { name: "Sid Sriram", image: "/images/a4.png" },
  ];

  return (
    <section className="bg-white py-8" style={{ fontFamily: "'Switzer', sans-serif" }}>
      <div className="px-6 md:px-10 mb-8">
        <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-black">
          Trending Artists
        </h2>
        <p className="text-sm text-gray-500 mt-1 font-normal">
          Catch your favorite performers live in action.
        </p>
      </div>

      <div className="overflow-x-auto px-6 md:px-10 no-scrollbar">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="flex gap-8 md:gap-12 min-w-max pb-4"
        >
          {artists.map((artist, i) => (
            <motion.div 
              key={i}
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                visible: { opacity: 1, scale: 1 }
              }}
              className="flex flex-col items-center group cursor-pointer"
            >
              {/* Image Circle with Palette Border */}
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-linear-to-tr from-[#3a5f94] to-[#122848] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-[2px]" />
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-gray-100 bg-white overflow-hidden p-1 shadow-sm transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src={artist.image}
                    alt={artist.name}
                    width={128}
                    height={128}
                    sizes="(min-width: 768px) 128px, 96px"
                    className="h-full w-full rounded-full object-cover grayscale-20 group-hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Artist Name */}
              <p className="mt-4 text-sm font-semibold text-gray-700 group-hover:text-black transition-colors">
                {artist.name}
              </p>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#3a5f94] opacity-0 group-hover:opacity-100 transition-all">
                Artist
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
