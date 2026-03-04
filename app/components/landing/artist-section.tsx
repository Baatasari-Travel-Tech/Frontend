"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function ArtistSection() {
  const artists = [
    { name: "Anirudh", image: "/a1.png" },
    { name: "Arijit Troop", image: "/a2.png" },
    { name: "Shreya Ghoshal", image: "/a3.png" },
    { name: "Sid Sriram", image: "/a4.png" },
  ];

  return (
    <section className="w-full page-x">
      <div className="w-full rounded-[2rem] bg-white px-6 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Trending Artists
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Catch your favorite performers live in action.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-none">
          <div className="overflow-x-auto no-scrollbar responsive-scroll-x">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                visible: { transition: { staggerChildren: 0.1 } },
              }}
              className="flex w-max min-w-full items-start justify-center gap-6 pb-4"
            >
              {artists.map((artist, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, scale: 0.95 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                  className="group flex w-28 shrink-0 flex-col items-center gap-3 md:w-32"
                >
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-brand-900 to-brand-700 opacity-0 blur-sm transition group-hover:opacity-100" />
                    <div className="relative h-24 w-24 overflow-hidden rounded-full border border-slate-200 bg-white p-1 shadow-sm transition group-hover:scale-105 md:h-28 md:w-28">
                      <Image
                        src={artist.image}
                        alt={artist.name}
                        width={128}
                        height={128}
                        sizes="(min-width: 768px) 128px, 96px"
                        className="h-full w-full rounded-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-800">{artist.name}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-900">
                      Artist
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
