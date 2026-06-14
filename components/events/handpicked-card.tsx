"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Tag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { EventStatus } from "@/lib/events-data"

interface HandpickedEventCardProps {
    id: string
    image: string
    title: string
    price: string
    category: string
    date: string
    location: string
    bookedCount?: number
    tag?: string
    chiefGuest?: string
    sponsors?: string
    eventTime?: string
    highlights?: string[]
    gridMode?: boolean
    compact?: boolean
    status?: EventStatus
    cancelled?: boolean
}

export function HandpickedEventCard({
    id,
    image,
    title,
    price,
    category,
    date,
    gridMode = false,
    compact = false,
    status,
    cancelled = false,
}: HandpickedEventCardProps) {
    const [errored, setErrored] = useState(false)

    useEffect(() => {
        setErrored(false)
    }, [image])

    return (
        <div className={gridMode ? "h-full w-full" : "flex flex-col md:flex-row items-center h-full mr-4 mb-4"}>
            <Link href={`/events/${id}`} className="block relative z-20 h-full w-full">
                <Card
                    className={`${gridMode ? "h-full w-full flex flex-col" : "w-75 md:w-85 shrink-0"} border-0 shadow-sm transition-all duration-300 ${
                        compact ? "rounded-2xl" : "rounded-[24px]"
                    } overflow-hidden bg-(--white) hover:shadow-md`}
                >
                    <CardContent className={`flex h-full flex-col ${compact ? "p-2.5" : "p-4"}`}>
                        <div
                            className={`relative w-full shrink-0 overflow-hidden ${
                                compact
                                    ? "aspect-[2/3] mb-3 rounded-xl"
                                    : "aspect-[2/3] mb-4 rounded-4xl"
                            }`}
                        >
                            {image && !errored ? (
                                <Image
                                    src={image}
                                    alt={title}
                                    fill
                                    sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                                    className={`object-cover transition-transform duration-500 hover:scale-105 ${
                                        cancelled ? "grayscale opacity-60" : ""
                                    }`}
                                    onError={() => setErrored(true)}
                                />
                            ) : (
                                <div className="absolute inset-0 bg-slate-100" />
                            )}

                            {cancelled ? (
                                <div
                                    className={`absolute left-2 top-2 z-10 rounded-full bg-rose-600 px-2.5 py-1 font-poppins font-bold uppercase tracking-wider text-white ${
                                        compact ? "text-[9px]" : "text-[10px]"
                                    }`}
                                >
                                    Cancelled
                                </div>
                            ) : null}

                            {!cancelled && (status === "live" || status === "upcoming") ? (
                                <div
                                    className={`absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 font-poppins font-bold uppercase tracking-wider text-white backdrop-blur-md ${
                                        compact ? "text-[9px]" : "text-[10px]"
                                    }`}
                                >
                                    <span className="relative flex h-2 w-2">
                                        {status === "live" ? (
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                        ) : null}
                                        <span
                                            className={`relative inline-flex h-2 w-2 rounded-full ${
                                                status === "live" ? "bg-emerald-500" : "bg-orange-500"
                                            }`}
                                        />
                                    </span>
                                    {status === "live" ? "Live" : "Upcoming"}
                                </div>
                            ) : null}
                        </div>

                        <div className={`flex flex-1 flex-col ${compact ? "space-y-2" : "space-y-4"}`}>
                            <div
                                className={`flex items-center justify-between gap-3 text-(--upcoming-primary-800) font-poppins font-semibold uppercase tracking-wider ${
                                    compact ? "text-[11px]" : "text-[14px]"
                                }`}
                            >
                                <div className="flex min-w-0 items-center gap-1.5">
                                    <Calendar className={compact ? "h-3 w-3 shrink-0" : "h-4 w-4 shrink-0"} />
                                    <span className="truncate">{date}</span>
                                </div>
                            </div>

                            <h3
                                className={`font-poppins font-bold leading-tight text-(--upcoming-primary-800) line-clamp-2 ${
                                    compact ? "min-h-[2.6em] text-[15px]" : "min-h-[2.4em] text-[24px]"
                                }`}
                            >
                                {title}
                            </h3>

                            <div className="mt-auto h-px w-full bg-gray-100" />

                            <div className="flex items-center justify-between">
                                <div
                                    className={`flex items-center gap-1.5 text-gray-500 font-poppins font-medium ${
                                        compact ? "text-[12px]" : "text-[16px]"
                                    }`}
                                >
                                    <Tag className={compact ? "h-3 w-3 shrink-0" : "h-4 w-4 shrink-0"} />
                                    <span className={`truncate ${compact ? "max-w-24" : "max-w-37.5"}`}>{category}</span>
                                </div>
                                <div
                                    className={`font-poppins font-bold text-(--upcoming-primary-800) ${
                                        compact ? "text-[14px]" : "text-[22px]"
                                    }`}
                                >
                                    {price.replace('₹', 'Rs')}
                                </div>
                            </div>

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
        </div>
    )
}
