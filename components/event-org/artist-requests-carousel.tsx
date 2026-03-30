"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"

import { ARTIST_REQUESTS, type ArtistRequest } from "@/lib/artist-request-data"

const STORAGE_KEY = "eventFormData"

export function ArtistRequestsCarousel() {
    const router = useRouter()
    const [activeIndex, setActiveIndex] = useState(0)
    const [hovered, setHovered] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)

    const touchStartX = useRef(0)
    const touchEndX = useRef(0)

    const totalCards = ARTIST_REQUESTS.length

    const getPosition = (index: number): number => {
        let diff = index - activeIndex
        if (diff > totalCards / 2) diff -= totalCards
        if (diff < -totalCards / 2) diff += totalCards
        return diff
    }

    const handleHostEvent = (e: React.MouseEvent, item: ArtistRequest) => {
        e.stopPropagation()

        const formData = {
            eventName: item.title,
            category: "Entertainment",
            description: item.about,
            venue: item.location,
            date: "",
            time: "",
            endTime: "",
            googleMapsUrl: "",
            personnel: "",
            tagline: "",
            contactInfo: { mobile: "", email: "", website: "", additionalLinks: "" },
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
        router.push("/create-event?startDirectly=true")
    }

    const navigate = (direction: "left" | "right") => {
        if (isAnimating) return
        if (totalCards <= 1) return

        setIsAnimating(true)
        setHovered(false)

        setTimeout(() => {
            if (direction === "right") {
                setActiveIndex((prev) => (prev + 1) % totalCards)
            } else {
                setActiveIndex((prev) => (prev - 1 + totalCards) % totalCards)
            }
            setIsAnimating(false)
        }, 100)
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
        touchEndX.current = e.touches[0].clientX
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX
    }

    const handleTouchEnd = () => {
        const diff = touchStartX.current - touchEndX.current
        const minSwipeDistance = 50

        if (Math.abs(diff) > minSwipeDistance) {
            navigate(diff > 0 ? "right" : "left")
        }
    }

    const handleCardClick = (index: number) => {
        if (index === activeIndex || isAnimating) return
        navigate(getPosition(index) > 0 ? "right" : "left")
    }

    return (
        <div className="w-full">
            <div className="w-full max-w-screen-2xl mx-auto py-4 px-0 lg:px-6 lg:py-12">
                {/* MOBILE */}
                <div
                    className="block lg:hidden"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="relative overflow-hidden">
                        <div
                            className="flex transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                        >
                            {ARTIST_REQUESTS.map((item, index) => (
                                <div key={index} className="w-full shrink-0 px-2">
                                    <div className="rounded-2xl bg-white border-2 border-(--navy-900) shadow-2xl">
                                        <div className="p-4">
                                            <div className="relative w-full h-80 rounded-xl overflow-hidden">
                                                <Image
                                                    src={item.image}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>

                                            <div className="mt-4">
                                                <div className="border rounded-lg p-3 mb-3 transition-colors">
                                                    <h2 className="text-lg font-semibold mb-1 text-(--upcoming-primary-700)">
                                                        {item.title}
                                                    </h2>
                                                    <p className="text-sm text-black">
                                                        <b>Month:</b> {item.month}
                                                    </p>
                                                    <p className="text-sm text-black">
                                                        <b>Location:</b> {item.location}
                                                    </p>
                                                </div>

                                                <div className="bg-linear-to-br from-(--blue-100) to-(--blue-50) rounded-lg p-4 text-center mb-4">
                                                    <p className="text-3xl font-bold text-blue-soft">
                                                        {item.interest}
                                                    </p>
                                                    <p className="text-sm text-(--gray-600)">
                                                        Interest So Far
                                                    </p>
                                                </div>

                                                <Button
                                                    className="w-full rounded-full bg-(--navy-900) h-11"
                                                    onClick={(e) => handleHostEvent(e, item)}
                                                >
                                                    Host the Event
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-center gap-2 mt-4">
                        {ARTIST_REQUESTS.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all ${i === activeIndex
                                    ? "bg-(--navy-900) w-6"
                                    : "bg-(--gray-300) w-1.5"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* DESKTOP */}
                <div className="hidden lg:block">
                    <div className="relative h-145 flex items-center justify-center">
                        {ARTIST_REQUESTS.map((item, index) => {
                            const position = getPosition(index)
                            const isActive = position === 0
                            const isExpanded = isActive && hovered
                            if (Math.abs(position) > 1) return null

                            return (
                                <div
                                    key={index}
                                    onClick={() => handleCardClick(index)}
                                    onMouseEnter={() => isActive && setHovered(true)}
                                    onMouseLeave={() => setHovered(false)}
                                    style={{
                                        transform: `translateX(${position * 400}px) scale(${isActive ? 1 : 0.85
                                            })`,
                                        zIndex: isActive ? 30 : 20,
                                        opacity: isActive ? 1 : 0.6,
                                    }}
                                    className={`
                    absolute grid rounded-2xl bg-white overflow-hidden cursor-pointer
                    transition-[width,transform,opacity,box-shadow] duration-700 ease-out

                    ${isExpanded
                                            ? "w-180 min-h-130 grid-cols-[360px_1fr] grid-rows-[1fr_auto]"
                                            : "w-90 h-130 grid-cols-1"
                                        }

                    ${isActive
                                            ? "border-2 border-(--navy-900) shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]"
                                            : "border border-(--gray-200) shadow-xl"
                                        }
                  `}
                                >
                                    <div className="p-4">
                                        <div className="relative w-full h-90 rounded-xl overflow-hidden bg-gray-50">
                                            <Image
                                                src={item.image}
                                                alt={item.title}
                                                fill
                                                className={`object-cover transition-transform duration-1000 ease-out ${isActive && hovered ? "scale-110" : "scale-100"
                                                    }`}
                                            />
                                        </div>

                                        {!isExpanded && (
                                            <div>
                                                <h3 className="mt-4 font-semibold text-lg leading-tight text-(--upcoming-primary-800)">
                                                    {item.title}
                                                </h3>
                                                <p className="text-sm mt-1 text-black">
                                                    <span className="font-medium text-blue-soft">
                                                        {item.interest}
                                                    </span>{" "}
                                                    People show interest
                                                </p>

                                                <span
                                                    className={`inline-block mt-3 text-xs px-4 py-1.5 rounded-full 
                            ${item.tag === "Popular"
                                                            ? "bg-(--green-100) text-(--green-700)"
                                                            : item.tag === "Trending"
                                                                ? "bg-(--orange-100) text-(--orange-700)"
                                                                : "bg-(--purple-soft-bg) text-(--purple-soft-text)"
                                                        }
                          `}
                                                >
                                                    {item.tag}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {isExpanded && (
                                        <div className="p-6 flex flex-col justify-between">
                                            <div>
                                                <div className="border rounded-xl p-4 mb-4 transition-colors">
                                                    <h2 className="text-2xl font-semibold mb-2 text-(--upcoming-primary-800)">
                                                        {item.title}
                                                    </h2>
                                                    <p className="text-sm text-black">
                                                        <b>Month:</b> {item.month}
                                                    </p>
                                                    <p className="text-sm text-black">
                                                        <b>Location:</b> {item.location}
                                                    </p>
                                                </div>

                                                <div className="bg-linear-to-br from-(--blue-100) to-(--blue-50) rounded-xl p-6 text-center mb-6 transition-shadow">
                                                    <p className="text-4xl font-bold text-blue-soft">
                                                        {item.interest}
                                                    </p>
                                                    <p className="text-sm text-(--gray-600) mt-1">
                                                        Interest So Far
                                                    </p>
                                                </div>
                                            </div>

                                            <Button
                                                className="rounded-full bg-(--navy-900) h-12 transition-all"
                                                onClick={(e) => handleHostEvent(e, item)}
                                            >
                                                Host the Event
                                            </Button>
                                        </div>
                                    )}

                                    {isExpanded && (
                                        <div className="col-span-2 px-6 pb-6">
                                            <h4 className="font-semibold text-lg mb-1">
                                                About the Event
                                            </h4>
                                            <p className="text-sm text-(--gray-600) leading-relaxed">
                                                {item.about}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
