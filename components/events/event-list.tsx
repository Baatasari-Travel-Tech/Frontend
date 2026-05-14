"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { HandpickedEventCard } from "@/components/events/handpicked-card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EventData } from "@/lib/events-data";
import Link from "next/link";

interface EventRowProps {
    title: string;
    events: EventData[];
}

interface EventListProps {
    rows?: EventRowProps[];
    showHero?: boolean;
}

function EventRow({ title, events }: EventRowProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [activeDirection, setActiveDirection] = React.useState<"left" | "right">("right");

    const scroll = (direction: "left" | "right") => {
        setActiveDirection(direction);
        if (scrollContainerRef.current) {
            const { scrollLeft, clientWidth } = scrollContainerRef.current;
            const scrollAmount = clientWidth * 0.8;
            const scrollTo = direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;

            scrollContainerRef.current.scrollTo({
                left: scrollTo,
                behavior: "smooth",
            });
        }
    };

    const hasEvents = events.length > 0;

    return (
        <div className="mb-12 last:mb-0">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-(--brand-blue) font-bricolage">{title}</h2>
                {hasEvents && (
                    <Link
                        href="/events/all"
                        className="bg-(--white) text-(--blue-600) hover:bg-(--white)/80 rounded-full px-4 py-1 font-poppins font-medium text-sm md:text-base transition-colors"
                    >
                        View All
                    </Link>
                )}
            </div>

            {hasEvents ? (
                <>
                    <div
                        ref={scrollContainerRef}
                        className="flex gap-8 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] snap-x snap-mandatory scroll-smooth"
                    >
                        {events.map((event, index) => (
                            <div key={index} className="snap-start shrink-0">
                                <HandpickedEventCard {...event} />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-4 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => scroll("left")}
                            className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors active:scale-95 duration-200 border p-0 ${
                                activeDirection === "left"
                                    ? "bg-brand-900 text-(--white) border-brand-900 hover:bg-(--brand-navy)/90 hover:text-(--white)"
                                    : "bg-(--white) text-(--gray-600) border-(--gray-300) hover:bg-(--gray-50)"
                            }`}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => scroll("right")}
                            className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors active:scale-95 duration-200 border p-0 ${
                                activeDirection === "right"
                                    ? "bg-brand-900 text-(--white) border-brand-900 hover:bg-(--brand-navy)/90 hover:text-(--white)"
                                    : "bg-(--white) text-(--gray-600) border-(--gray-300) hover:bg-(--gray-50)"
                            }`}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </div>
                </>
            ) : (
                <div className="py-12 text-center text-gray-500">
                    <p className="text-lg font-medium">No events available right now</p>
                    <p className="mt-2 text-sm">Check back later or explore other categories</p>
                </div>
            )}
        </div>
    );
}

export function EventList({ rows = [], showHero = false }: EventListProps) {
    const visibleRows = rows.filter((row) => row.events.length > 0);

    return (
        <section className="container mx-auto px-4 py-12">
            {showHero && (
                <div className="relative mb-12 overflow-hidden rounded-3xl bg-linear-to-br from-brand-900 via-[#1a3a6b] to-sky-800 px-8 py-14 text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(147,197,253,0.18),transparent_55%)]" />
                    <div className="relative">
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300/80">
                            Live Experiences
                        </p>
                        <h1 className="mt-2 font-bricolage text-4xl font-bold leading-tight md:text-5xl">
                            Discover What&apos;s Happening
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-7 text-white/75 md:text-base">
                            Curated events, live performances, and community experiences — sorted by what people love most.
                        </p>
                    </div>
                </div>
            )}

            {visibleRows.map((row) => (
                <EventRow key={row.title} title={row.title} events={row.events} />
            ))}
        </section>
    );
}
