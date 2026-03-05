"use client";

import { motion } from "framer-motion";
import { ARTISTS_DATA } from "@/lib/landing-data";

export function ArtistSection() {
  return (
    <section
      className="bg-background py-6 font-switzer"
    >
      <div className="px-6 md:px-10 mb-6">
        <h2
          className="text-2xl md:text-3xl font-medium tracking-tight"
          style={{ color: "var(--brand-deep-blue)" }}
        >
          Trending Artists
        </h2>

        <p className="text-sm text-muted-foreground mt-2 font-normal max-w-lg">
          Discover the top-performing artists and catch them live in action across the city.
        </p>
      </div>

      <div className="overflow-x-auto px-6 md:px-10 no-scrollbar">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.08 } }
          }}
          className="flex gap-10 md:gap-14 min-w-max pb-6"
        >
          {ARTISTS_DATA.map((artist, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -5 }}
              className="flex flex-col items-center group cursor-pointer transition-all duration-300"
            >
              <div className="relative">
                <div
                  className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-[3px]"
                  style={{
                    background:
                      "linear-gradient(to top right, color-mix(in srgb, var(--blue-soft) 40%, transparent), color-mix(in srgb, var(--brand-deep-blue) 40%, transparent))"
                  }}
                />

                <div
                  className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden p-1.5 shadow-sm transition-all duration-300 group-hover:shadow-md"
                  style={{
                    border: "1px solid var(--artist-card-border)",
                    backgroundColor: "var(--artist-card-bg)"
                  }}
                >
                  <img
                    src={artist.image}
                    className="w-full h-full rounded-full object-cover transition-all duration-500 group-hover:scale-110"
                    alt={artist.name}
                  />
                </div>
              </div>

              <div className="mt-5 text-center">
                <p
                  className="text-sm font-bold transition-colors tracking-tight"
                  style={{
                    color: "var(--brand-deep-blue)"
                  }}
                >
                  {artist.name}
                </p>

                <div className="mt-1 flex flex-col items-center">
                  <div
                    className="h-0.5 w-0 group-hover:w-full transition-all duration-300 rounded-full mb-1"
                    style={{
                      backgroundColor: "var(--blue-soft)"
                    }}
                  />
                  <span
                    className="text-[9px] font-black uppercase tracking-[0.2em]"
                    style={{
                      color: "color-mix(in srgb, var(--blue-soft) 60%, transparent)"
                    }}
                  >
                    Artist
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}