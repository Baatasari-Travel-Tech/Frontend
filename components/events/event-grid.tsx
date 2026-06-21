"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { HandpickedEventCard } from "@/components/events/handpicked-card";
import type { EventData } from "@/lib/events-data";

interface EventGridProps {
    events: EventData[];
    title?: string;
    pageSize?: number;
    /** Skip the built-in title/count row (the page renders its own header). */
    hideHeader?: boolean;
}

export function EventGrid({ events, title = "Events", pageSize = 12, hideHeader = false }: EventGridProps) {
    const [visibleCount, setVisibleCount] = useState(Math.min(pageSize, events.length));
    const sentinelRef = useRef<HTMLDivElement>(null);

    const visibleEvents = useMemo(
        () => events.slice(0, visibleCount),
        [events, visibleCount]
    );

    const hasMore = visibleCount < events.length;

    useEffect(() => {
        if (!hasMore) return;

        const node = sentinelRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry?.isIntersecting) {
                    setVisibleCount((prev) => Math.min(prev + pageSize, events.length));
                }
            },
            { rootMargin: "400px 0px", threshold: 0 }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [hasMore, pageSize, events.length]);

    if (events.length === 0) {
        return (
            <section className="mx-auto w-full max-w-[1680px] px-4 py-16 text-center md:px-6 lg:px-10">
                <p className="text-lg font-semibold text-(--brand-blue)">
                    No events available right now
                </p>
                <p className="mt-2 text-sm text-gray-500">
                    Check back later or explore other categories
                </p>
            </section>
        );
    }

    return (
        <section className="mx-auto w-full max-w-[1680px] px-4 py-10 md:px-6 md:py-12 lg:px-10">
            {!hideHeader && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-8 flex items-end justify-between gap-4"
                >
                    <div>
                        <h2 className="font-bricolage text-3xl font-bold text-(--brand-blue) md:text-4xl">
                            {title}
                        </h2>
                        <p className="mt-1 text-sm text-(--gray-500)">
                            {events.length} event{events.length === 1 ? "" : "s"} to explore
                        </p>
                    </div>
                    <p className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-(--gray-400) md:block">
                        Showing {visibleEvents.length} / {events.length}
                    </p>
                </motion.div>
            )}

            <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
                {visibleEvents.map((event, index) => (
                    <motion.div
                        key={event.id ?? index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.4,
                            delay: Math.min((index % pageSize) * 0.04, 0.4),
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        whileHover={{ y: -4 }}
                        className="h-full"
                    >
                        <HandpickedEventCard {...event} gridMode compact />
                    </motion.div>
                ))}
            </div>

            <div
                ref={sentinelRef}
                className="flex h-20 items-center justify-center"
                aria-hidden={!hasMore}
            >
                {hasMore ? (
                    <div className="flex items-center gap-2 text-sm text-(--gray-500)">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading more events…
                    </div>
                ) : (
                    <p className="text-xs uppercase tracking-[0.2em] text-(--gray-400)">
                        You&apos;ve reached the end
                    </p>
                )}
            </div>
        </section>
    );
}
