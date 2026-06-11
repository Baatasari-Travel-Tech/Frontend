"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { animate, stagger } from "animejs";
import Image from "next/image";
import {
  Search,
  Sparkles,
  Music,
  Mic2,
  Laptop,
  Ticket,
  Flame,
  MapPin,
  Calendar as CalendarIcon,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROTATING_WORDS = ["Mood", "Crew", "Vibe", "Weekend"];

const formatGoing = (n: number): string => {
  const v = Math.floor(n);
  if (v >= 1000) {
    const k = v / 1000;
    return `${k.toFixed(k >= 10 ? 0 : 1).replace(/\.0$/, "")}K`;
  }
  return String(v);
};

const CATEGORIES = [
  { name: "All", icon: <Flame size={14} /> },
  { name: "Music", icon: <Music size={14} /> },
  { name: "Comedy", icon: <Mic2 size={14} /> },
  { name: "Workshops", icon: <Laptop size={14} /> },
  { name: "Festival", icon: <Sparkles size={14} /> },
  { name: "Movies", icon: <Ticket size={14} /> },
];

interface EventsSearchHeroProps {
  liveCount?: number;
  liveGoingCount?: number;
}

export function EventsSearchHero({ liveCount = 0, liveGoingCount = 0 }: EventsSearchHeroProps = {}) {
  const router = useRouter();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const liveCountRef = useRef<HTMLSpanElement>(null);
  const goingCountRef = useRef<HTMLSpanElement>(null);

  const [wordIndex, setWordIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((p) => (p + 1) % ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (titleRef.current) {
      animate(titleRef.current.querySelectorAll(".char"), {
        opacity: [0, 1],
        translateY: [40, 0],
        rotateX: [-90, 0],
        delay: stagger(35),
        duration: 900,
        ease: "outExpo",
      });
    }

    if (searchRef.current) {
      animate(searchRef.current, {
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.96, 1],
        duration: 1100,
        delay: 600,
        ease: "outExpo",
      });
    }

    if (pillsRef.current) {
      animate(pillsRef.current.querySelectorAll(".pill"), {
        opacity: [0, 1],
        translateY: [16, 0],
        scale: [0.9, 1],
        delay: stagger(60, { start: 1000 }),
        duration: 600,
        ease: "outBack",
      });
    }
  }, []);

  // anime.js count-up for stat numbers (re-runs when counts change, fires when stats card enters viewport)
  useEffect(() => {
    const node = statsRef.current;
    if (!node) return;

    let liveDone = false;
    let goingDone = false;

    const runCountUp = () => {
      if (liveCountRef.current && !liveDone) {
        liveDone = true;
        const target = { value: 0 };
        const el = liveCountRef.current;
        animate(target, {
          value: liveCount,
          duration: 1600,
          ease: "outExpo",
          onUpdate: () => {
            el.textContent = String(Math.floor(target.value));
          },
          onComplete: () => {
            el.textContent = String(liveCount);
          },
        });
      }
      if (goingCountRef.current && !goingDone) {
        goingDone = true;
        const target = { value: 0 };
        const el = goingCountRef.current;
        animate(target, {
          value: liveGoingCount,
          duration: 1800,
          ease: "outExpo",
          onUpdate: () => {
            el.textContent = formatGoing(target.value);
          },
          onComplete: () => {
            el.textContent = formatGoing(liveGoingCount);
          },
        });
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          runCountUp();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [liveCount, liveGoingCount]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (activeCategory && activeCategory !== "All")
      params.set("category", activeCategory);
    const qs = params.toString();
    router.push(qs ? `/events?${qs}` : "/events");
  };

  const titleText = "Find your perfect event";

  return (
    <section className="relative isolate flex min-h-[88vh] w-full flex-col justify-center overflow-hidden">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">

       {/* Background image */}
        <Image
          src="/events-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {/* Cream overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" />
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-4 pt-10 pb-6 md:px-6 md:pt-16 md:pb-10 lg:px-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto flex w-fit items-center gap-2 rounded-full border border-(--blue-100) bg-white/80 px-4 py-2 shadow-sm backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--blue-500) opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-(--blue-600)" />
          </span>
          <Users size={14} className="text-(--brand-blue)" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--brand-blue)">
            150+ exploring Vizag right now
          </span>
        </motion.div>

        {/* Title with anime.js stagger */}
        <h1
          ref={titleRef}
          className="mx-auto mt-6 max-w-4xl whitespace-nowrap text-center font-bricolage text-[clamp(1.4rem,7vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-(--brand-navy)"
          style={{ perspective: "1000px" }}
        >
          {titleText.split("").map((c, i) => (
            <span
              key={i}
              className="char inline-block"
              style={{ opacity: 0, whiteSpace: c === " " ? "pre" : undefined }}
            >
              {c}
            </span>
          ))}
        </h1>

        {/* Rotating subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.7, ease: "easeOut" }}
          className="mt-5 text-center font-poppins text-base text-(--gray-600) md:text-lg"
        >
          Tailored for every{" "}
          <span className="relative inline-block min-w-[5.5rem] text-left align-baseline">
            <AnimatePresence mode="wait">
              <motion.span
                key={ROTATING_WORDS[wordIndex]}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                className="inline-block bg-linear-to-r from-(--blue-600) to-(--royal-blue) bg-clip-text font-semibold text-transparent"
              >
                {ROTATING_WORDS[wordIndex]}.
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.p>

        {/* Search bar */}
        <div
          ref={searchRef}
          className="mx-auto mt-10 w-full max-w-5xl opacity-0"
        >
          <div className="flex flex-col gap-0 rounded-[2rem] border border-(--gray-200) bg-white/85 p-2 shadow-[0_20px_60px_-20px_rgba(12,29,55,0.18)] backdrop-blur-xl md:flex-row md:flex-wrap md:items-stretch md:rounded-3xl lg:flex-nowrap lg:rounded-full">
            {/* Search input */}
            <div className="group flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-4 py-3 transition-colors hover:bg-(--gray-50) md:basis-[calc(50%-1px)] md:gap-3 md:px-5 lg:basis-0 lg:rounded-l-full lg:rounded-r-none lg:border-r lg:border-(--gray-100)">
              <Search className="h-5 w-5 shrink-0 text-(--gray-400) transition-colors group-focus-within:text-(--blue-600)" />
              <div className="flex min-w-0 flex-1 flex-col text-left">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-(--gray-400)">
                  Search
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Concert, food fest, comedy..."
                  className="w-full min-w-0 bg-transparent text-sm font-semibold text-(--gray-800) outline-none placeholder:text-(--gray-400)"
                />
              </div>
            </div>

            {/* Location */}
            <div className="group flex min-w-0 flex-1 items-center gap-2 px-4 py-3 transition-colors hover:bg-(--gray-50) md:basis-[calc(50%-1px)] md:gap-3 md:border-l md:border-(--gray-100) md:px-5 lg:basis-0 lg:border-l-0 lg:border-r lg:border-(--gray-100)">
              <MapPin className="h-5 w-5 shrink-0 text-(--gray-400)" />
              <div className="flex min-w-0 flex-1 flex-col text-left">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-(--gray-400)">
                  Where
                </span>
                <Select defaultValue="vizag">
                  <SelectTrigger className="h-auto w-full border-0 bg-transparent p-0 text-sm font-semibold text-(--gray-800) shadow-none focus:ring-0">
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vizag">Visakhapatnam</SelectItem>
                    <SelectItem value="hyderabad">Hyderabad</SelectItem>
                    <SelectItem value="bangalore">Bangalore</SelectItem>
                    <SelectItem value="chennai">Chennai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* When */}
            <div className="group flex min-w-0 flex-1 items-center gap-2 px-4 py-3 transition-colors hover:bg-(--gray-50) md:basis-[calc(50%-1px)] md:gap-3 md:border-t md:border-(--gray-100) md:px-5 lg:basis-0 lg:border-t-0 lg:border-r lg:border-(--gray-100)">
              <CalendarIcon className="h-5 w-5 shrink-0 text-(--gray-400)" />
              <div className="flex min-w-0 flex-1 flex-col text-left">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-(--gray-400)">
                  When
                </span>
                <Select defaultValue="anytime">
                  <SelectTrigger className="h-auto w-full border-0 bg-transparent p-0 text-sm font-semibold text-(--gray-800) shadow-none focus:ring-0">
                    <SelectValue placeholder="Anytime" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anytime">Anytime</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="weekend">This weekend</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Budget */}
            <div className="group flex min-w-0 flex-1 items-center gap-2 px-4 py-3 transition-colors hover:bg-(--gray-50) md:basis-[calc(50%-1px)] md:gap-3 md:border-l md:border-t md:border-(--gray-100) md:px-5 lg:basis-0 lg:border-l-0 lg:border-t-0 lg:border-r lg:border-(--gray-100)">
              <span className="text-base font-bold text-(--gray-400)">₹</span>
              <div className="flex min-w-0 flex-1 flex-col text-left">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-(--gray-400)">
                  Budget
                </span>
                <Select defaultValue="any">
                  <SelectTrigger className="h-auto w-full border-0 bg-transparent p-0 text-sm font-semibold text-(--gray-800) shadow-none focus:ring-0">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Price</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pocket">Pocket Friendly</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Button */}
            <div className="w-full p-1 md:basis-full md:p-2 lg:w-auto lg:basis-auto lg:shrink-0">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleSearch}
                className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-(--brand-navy) px-6 font-poppins font-bold text-white shadow-lg shadow-(--brand-navy)/20 transition-all hover:shadow-xl sm:px-8 lg:w-auto lg:rounded-full lg:px-10"
              >
                <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <Search size={18} className="relative shrink-0" />
                <span className="relative">Discover</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Category pills */}
        <div
          ref={pillsRef}
          className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-2 md:gap-3"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <motion.button
                key={cat.name}
                whileHover={{ y: -3, scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat.name)}
                className={`pill flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-(--brand-navy) bg-(--brand-navy) text-white shadow-md"
                    : "border-(--gray-200) bg-white/80 text-(--gray-700) backdrop-blur-sm hover:border-(--blue-200) hover:text-(--brand-blue)"
                }`}
                style={{ opacity: 0 }}
              >
                {cat.icon}
                {cat.name}
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
