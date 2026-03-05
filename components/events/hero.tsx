"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MapPin, Calendar, Info } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import Image from "next/image"
import {
    type HeroSlide,
    type FilterOption,
    HERO_SLIDES,
    LOCATION_FILTERS,
    PRICE_FILTERS,
    DATE_FILTERS,
    EVENT_TYPE_FILTERS,
} from "@/lib/events-hero-data"

export function EventsHero() {
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const slides = HERO_SLIDES

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = current.clientWidth;
            const currentScroll = current.scrollLeft;

            // Calculate current slide index based on scroll position
            const currentIndex = Math.round(currentScroll / scrollAmount);

            // Determine target index
            let targetIndex;
            if (direction === 'left') {
                targetIndex = Math.max(0, currentIndex - 1);
            } else {
                targetIndex = Math.min(slides.length - 1, currentIndex + 1);
            }

            // Scroll to specific position
            current.scrollTo({
                left: targetIndex * scrollAmount,
                behavior: 'smooth'
            });
        }
    }

    return (
        <div className="relative w-full flex flex-col items-center">
            {/* Carousel Section */}
            <div
                className="relative w-full rounded-3xl md:rounded-[40px] mt-7.5 overflow-hidden"
                style={{
                    maxWidth: '1080px',
                    height: '580px',
                }}
            >
                <div
                    ref={scrollContainerRef}
                    className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                >
                    {slides.map((slide: HeroSlide) => (
                        <div
                            key={slide.id}
                            className="min-w-full h-full relative snap-center"
                        >
                            {/* Dark gradient overlay at bottom for text contrast if needed */}
                            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent z-10" />

                            <Image
                                width={1080}
                                height={580}
                                src={slide.image}
                                alt={slide.alt}
                                className="w-full h-full object-cover opacity-80"
                            />
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => scroll('left')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 text-(--white)/70 hover:text-(--white) hover:bg-transparent transition-colors h-auto w-auto"
                >
                    <ChevronLeft className="h-10 w-10 md:h-12 md:w-12" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => scroll('right')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 text-(--white)/70 hover:text-(--white) hover:bg-transparent transition-colors h-auto w-auto"
                >
                    <ChevronRight className="h-10 w-10 md:h-12 md:w-12" />
                </Button>
            </div>

            {/* Filter Bar - Overlapping the bottom of carousel */}
            <div className="relative z-30 -mt-10 mb-8 container mx-auto px-4">
                <div className="bg-(--white) rounded-xl shadow-xl border border-(--gray-100) p-2 md:p-3 flex flex-col md:flex-row items-center gap-2 md:gap-4 max-w-5xl mx-auto">

                    {/* Location */}
                    <div className="flex-1 w-full md:w-auto relative border-b md:border-b-0 md:border-r border-(--gray-100) px-4 py-2">
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-(--gray-500)" />
                            <div className="flex flex-col w-full">
                                <span className="text-xs text-(--gray-400) font-medium uppercase tracking-wide">Location</span>
                                <Select defaultValue={LOCATION_FILTERS[0]?.value}>
                                    <SelectTrigger className="w-full bg-transparent font-medium text-(--gray-800) border-0 focus:ring-0 p-0 h-auto shadow-none">
                                        <SelectValue placeholder="Select Location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LOCATION_FILTERS.map((opt: FilterOption) => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Price */}
                    <div className="flex-1 w-full md:w-auto relative border-b md:border-b-0 md:border-r border-(--gray-100) px-4 py-2">
                        <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold text-(--gray-500)">₹</span>
                            <div className="flex flex-col w-full">
                                <span className="text-xs text-(--gray-400) font-medium uppercase tracking-wide">Price</span>
                                <Select defaultValue={PRICE_FILTERS[0]?.value}>
                                    <SelectTrigger className="w-full bg-transparent font-medium text-(--gray-800) border-0 focus:ring-0 p-0 h-auto shadow-none">
                                        <SelectValue placeholder="Select Price" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRICE_FILTERS.map((opt: FilterOption) => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="flex-1 w-full md:w-auto relative border-b md:border-b-0 md:border-r border-(--gray-100) px-4 py-2">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-(--gray-500)" />
                            <div className="flex flex-col w-full">
                                <span className="text-xs text-(--gray-400) font-medium uppercase tracking-wide">Date</span>
                                <Select defaultValue={DATE_FILTERS[0]?.value}>
                                    <SelectTrigger className="w-full bg-transparent font-medium text-(--gray-800) border-0 focus:ring-0 p-0 h-auto shadow-none">
                                        <SelectValue placeholder="Select Date" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DATE_FILTERS.map((opt: FilterOption) => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Event Type */}
                    <div className="flex-1 w-full md:w-auto relative px-4 py-2">
                        <div className="flex items-center gap-3">
                            <Info className="h-5 w-5 text-(--gray-500)" />
                            <div className="flex flex-col w-full">
                                <span className="text-xs text-(--gray-400) font-medium uppercase tracking-wide">Event Type</span>
                                <Select defaultValue={EVENT_TYPE_FILTERS[0]?.value}>
                                    <SelectTrigger className="w-full bg-transparent font-medium text-(--gray-800) border-0 focus:ring-0 p-0 h-auto shadow-none">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EVENT_TYPE_FILTERS.map((opt: FilterOption) => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Search Button */}
                    <Button className="w-full md:w-auto rounded-full px-8 py-6 bg-brand-900 hover:bg-(--brand-navy)/90 text-(--white) font-medium text-base">
                        Discover Events
                    </Button>

                </div>
            </div>
        </div>
    )
}
