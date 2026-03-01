"use client";

import { Menu, User, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("For you"); // Match first link name

  const navLinks = [
    { name: "For you", href: "/" },
    { name: "Events", href: "/events" },
    { name: "Dining", href: "/dining" },
    { name: "Talents", href: "/talent" },
    { name: "Activities", href: "/activities" },
  ];

  return (
    // bg-white/70 + backdrop-blur-xl creates the premium frosted glass effect
    <header className="sticky top-0 z-[100] w-full border-b border-gray-200/50 bg-white/70 backdrop-blur-xl transition-all duration-300">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6">
        
        {/* LEFT: LOGO */}
        <div className="flex items-center">
          <Link href="/" className="relative h-10 w-10 transition-transform hover:scale-105 active:scale-95">
            <Image
              src="/Logo.svg"
              alt="Baatasari"
              fill
              className="object-contain object-left absolute"
              priority
            />
          </Link>
          {/* Vertical Separator - District Style */}
          <div className="ml-15 hidden h-8 w-[1px] bg-gray-300 md:block" />
        </div>

        {/* CENTER: PILL NAV (The Unique Glass Pill) */}
        <nav className="hidden items-center rounded-full bg-gray-200/30 p-1.5 shadow-inner md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setActiveTab(link.name)}
              className={`relative px-5 py-2 text-sm font-semibold transition-colors duration-300 ${
                activeTab === link.name ? "text-white" : "text-gray-600 hover:text-black"
              }`}
            >
              {activeTab === link.name && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 z-0 rounded-full bg-black shadow-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{link.name}</span>
            </Link>
          ))}
        </nav>

        {/* RIGHT: SEARCH & USER */}
        <div className="flex items-center gap-4">
          <button className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-all hover:bg-gray-200/50 hover:text-black active:scale-90">
            <Search className="h-5 w-5" />
          </button>
          
          <div className="h-8 w-[1px] bg-gray-300" />

          <button className="group flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/50 p-1 pr-4 transition-all hover:bg-white hover:shadow-md active:scale-95">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors group-hover:bg-black group-hover:text-white">
              <User className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-700">Account</span>
          </button>

          {/* Mobile Toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors active:bg-gray-200 md:hidden"
          >
            {open ? <X className="h-5 w-5 text-black" /> : <Menu className="h-5 w-5 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU with Animation */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 top-full w-full border-t border-gray-100 bg-white/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-4 p-6 shadow-2xl">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-lg font-bold text-gray-800 transition-colors hover:text-black"
                  onClick={() => setOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-[1px] w-full bg-gray-100" />
              <button className="w-full rounded-2xl bg-black py-4 font-bold text-white shadow-lg transition-transform active:scale-[0.98]">
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
