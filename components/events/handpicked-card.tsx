"use client"

import { useState, useRef, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Calendar, Tag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface HandpickedEventCardProps {
    id: string
    image: string
    title: string
    price: string
    category: string
    date: string
    location: string
    tag?: string
    chiefGuest?: string
    sponsors?: string
    eventTime?: string
    highlights?: string[]
}


export function HandpickedEventCard({
    id,
    image,
    title,
    price,
    category,
    date,
    tag = "Music Festival",
    chiefGuest = "Allu Arjun",
    sponsors = "aata events",
    eventTime = "Telugu | 6yrs + | 4hrs",
    highlights = ["Rockstar Devi Sri Prasad", "Rockstar Devi Sri Prasad", "Rockstar Devi Sri Prasad"]
}: HandpickedEventCardProps) {
    const [showDetails, setShowDetails] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const handleMouseEnter = useCallback(() => {
        timerRef.current = setTimeout(() => {
            setShowDetails(true)
        }, 600)
    }, [])

    const handleMouseLeave = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
        setShowDetails(false)
    }, [])

    return (
        <div
            className="flex flex-col md:flex-row items-center h-full mr-4 mb-4"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Link href={`/events/${id}`} className="block relative z-20">
                {/* Main Card */}
                <Card className={`w-75 md:w-85 shrink-0 border-0 shadow-sm transition-all duration-300 rounded-[24px] overflow-hidden bg-(--white) ${showDetails ? "-translate-y-2 shadow-2xl" : ""}`}>
                    <CardContent className="p-4">
                        {/* Image Container */}
                        <div className="relative aspect-square w-full mb-4 overflow-hidden rounded-4xl">
                            <Image
                                src={image}
                                alt={title}
                                fill
                                className={`object-cover transition-transform duration-500 ${showDetails ? "scale-105" : ""}`}
                            />
                        </div>

                        {/* Content */}
                        <div className="space-y-4">
                            {/* Date */}
                            <div className="flex items-center gap-2 text-(--upcoming-primary-800) font-poppins font-semibold text-[14px] uppercase tracking-wider">
                                <Calendar className="h-4 w-4" />
                                <span>{date}</span>
                            </div>

                            {/* Title */}
                            <h3 className="font-poppins font-bold text-[24px] leading-tight text-(--upcoming-primary-800) line-clamp-2">
                                {title}
                            </h3>

                            {/* Divider */}
                            <div className="h-px w-full bg-gray-100" />

                            {/* Bottom Info: Category & Price */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-gray-500 font-poppins font-medium text-[16px]">
                                    <Tag className="h-4 w-4 shrink-0" />
                                    <span className="truncate max-w-37.5">{category}</span>
                                </div>
                                <div className="font-poppins font-bold text-[22px] text-(--upcoming-primary-800)">
                                    {price.replace('₹', 'Rs')}
                                </div>
                            </div>

                            {/* Category Badge - Hidden based on design or placed elsewhere? Keeping it small and subtle if needed */}
                            <div className="hidden">
                                <Badge
                                    variant="secondary"
                                    className="bg-(--white) text-(--blue-600) hover:bg-(--white)/80 rounded-full px-4 py-1 font-poppins font-medium text-[14px]"
                                >
                                    {category}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Link>

            {/* Details Panel - Mobile (Hidden) & Desktop (Slide-out) */}
            <div
                className={`hidden md:flex transition-all duration-500 ease-in-out bg-(--white) rounded-b-[24px] md:rounded-b-none md:rounded-r-[24px] border border-t-0 md:border-t md:border-l-0 border-(--gray-100) shadow-xl overflow-hidden flex-col z-10 relative md:h-[95%] md:my-auto -mt-5 pt-5 md:mt-0 md:pt-0 ${showDetails ? "md:w-85 md:opacity-100 md:ml-0" : "md:w-0 md:opacity-0 md:-ml-6"}`}
            >
                <div className="min-w-75 md:min-w-85 p-6 flex flex-col h-full justify-between">
                    <div className="space-y-4">
                        {/* Tag */}
                        <Badge variant="secondary" className="bg-(--events-badge-bg) text-(--events-card-text)/80 hover:bg-(--events-badge-bg)/80 rounded-full">
                            {tag}
                        </Badge>

                        {/* Guests & Sponsors */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-(--gray-500) text-sm">Chief Guest</p>
                                <p className="font-semibold text-(--events-card-text)">{chiefGuest}</p>
                            </div>
                            <div>
                                <p className="text-(--gray-500) text-sm">Sponsors</p>
                                <p className="font-semibold text-(--events-card-text)">{sponsors}</p>
                            </div>
                        </div>

                        {/* Meta Info */}
                        <p className="text-(--gray-600) text-sm font-medium">{eventTime}</p>

                        {/* Highlights */}
                        <div className="space-y-2">
                            <h4 className="font-bold text-(--events-card-text)">Event Highlights</h4>
                            <ul className="space-y-1">
                                {highlights.map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-(--gray-700)">
                                        <CheckCircle className="h-4 w-4 text-(--green-500) shrink-0" />
                                        <span className="truncate">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Actions */}
                    <Link href={`/events/${id}`} className="space-y-3 mt-4 block">
                        <Button className="w-full bg-(--promo-warm-bg) text-(--events-card-text) font-semibold py-2 rounded-full hover:bg-(--promo-warm-bg)/90 transition-colors h-auto">
                            Buy 1 Get 1
                        </Button>
                        <Button className="w-full bg-brand-900 text-(--white) font-semibold py-3 rounded-full hover:bg-(--brand-navy)/90 transition-colors h-auto">
                            Pay {price}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
