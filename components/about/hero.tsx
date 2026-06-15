"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  const titleText = "Discover the Best Things to Do in Your City!";

  return (
    <section className="hero-section relative min-h-[calc(100dvh-72px)] flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
      {/* Background image — desktop/landscape */}
      <Image
        src="/hero-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="hidden md:block object-cover object-[center_30%] z-0 pointer-events-none"
      />

      {/* Background image — mobile/portrait */}
      <Image
        src="/hero-bg-mobile.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="md:hidden object-cover z-0 pointer-events-none"
      />

{/* Readability overlay */}
<div className="absolute inset-0 z-1 bg-background/70 pointer-events-none" />

      {/* Film Grain */}
      <div className="absolute inset-0 z-1 opacity-[0.02] pointer-events-none" />

      {/* Ambient Glow */}
      <motion.div
        animate={{
          rotate: [0, 180, 360],
          scale: [1, 1.06, 1],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute z-0 inset-0 -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-40 blur-[150px] pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 1.2,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative z-10 w-full max-w-7xl text-center"
      >

        {/* Badge */}

        {/* Title */}
        <h1 className="hero-title font-bricolage tracking-tight leading-[1.05] text-5xl md:text-7xl lg:text-8xl mb-10">

          {titleText.split("").map((char, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.06,
                delay: index * 0.045,
                ease: "easeOut",
              }}
            >
              {char}
            </motion.span>
          ))}

          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="inline-block w-1 h-10 md:h-16 lg:h-20 ml-2 align-middle"
            style={{ backgroundColor: "var(--border)" }}
          />

        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 2.2,
            duration: 1,
            ease: "easeOut",
          }}
          className="hero-description font-poppins font-medium text-lg md:text-2xl leading-relaxed mb-14 max-w-3xl mx-auto"
        >
           Your city has more to offer than you think.
          <br className="hidden md:block" />
          Start exploring today.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 2.8,
            duration: 0.6,
            ease: "easeOut",
          }}
        >

          <Link
            href="/events"
            className="hero-button group relative inline-flex items-center justify-center font-poppins font-bold text-lg px-15 py-5 rounded-full transition-all duration-500 hover:scale-[1.04] cursor-pointer overflow-hidden"
          >

            <span className="relative z-10 flex items-center gap-3">
              Explore your city
              <span className="group-hover:translate-x-2 transition-transform duration-300">
                »
              </span>
            </span>

            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-[120%] group-hover:translate-x-[120%] transition-transform duration-1400 ease-out" />

          </Link>

        </motion.div>

      </motion.div>
    </section>
  );
}
