"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { HandpickedEventCard } from "@/components/events/handpicked-card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
    EventData,
    HANDPICKED_DATA,
    NEXT_UP_DATA,
    INTEREST_DATA,
    SOLO_DATA,
    SOLOPRENEUR_DATA,
} from "@/lib/events-data";

interface EventRowProps {
    title: string;
    events: EventData[];
}

interface EventListProps {
    rows?: EventRowProps[];
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
                    <a
                        href="#"
                        className="bg-(--white) text-(--blue-600) hover:bg-(--white)/80 rounded-full px-4 py-1 font-poppins font-medium text-sm md:text-base transition-colors"
                    >
                        View All
                    </a>
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

export function EventList({ rows }: EventListProps = {}) {
    const defaultRows: EventRowProps[] = [
        { title: "Handpicked For You", events: HANDPICKED_DATA },
        { title: "Next Up: Events You'll Love", events: NEXT_UP_DATA },
        { title: "Based on Your Interests", events: INTEREST_DATA },
        { title: "Solo Performers", events: SOLO_DATA },
        { title: "For Solopreneurs", events: SOLOPRENEUR_DATA },
    ]

    const sourceRows = rows ?? defaultRows
    const visibleRows = sourceRows.filter((row) => row.events.length > 0)

    return (
        <section className="container mx-auto px-4 py-12">
            {visibleRows.map((row) => (
                <EventRow key={row.title} title={row.title} events={row.events} />
            ))}
        </section>
    );
}
