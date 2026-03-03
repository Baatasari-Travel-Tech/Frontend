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
    <section className="px-4 md:px-8">
      <div className="w-full rounded-4xl bg-white px-6 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Trending Artists
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Catch your favorite performers live in action.
          </p>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
            }}
            className="flex min-w-max gap-8 pb-4"
          >
            {artists.map((artist, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, scale: 0.95 },
                  visible: { opacity: 1, scale: 1 },
                }}
                className="group flex flex-col items-center gap-3"
              >
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-linear-to-tr from-emerald-400 to-amber-300 opacity-0 blur-sm transition group-hover:opacity-100" />
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
                  <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-600">
                    Artist
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
