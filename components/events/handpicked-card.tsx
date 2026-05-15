"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Tag, Users } from "lucide-react"
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
    bookedCount?: number
    tag?: string
    chiefGuest?: string
    sponsors?: string
    eventTime?: string
    highlights?: string[]
    gridMode?: boolean
}

export function HandpickedEventCard({
    id,
    image,
    title,
    price,
    category,
    date,
    bookedCount = 0,
    gridMode = false,
}: HandpickedEventCardProps) {
    const [imageSrc, setImageSrc] = useState(image)

    useEffect(() => {
        setImageSrc(image)
    }, [image])

    return (
        <div className={gridMode ? "w-full" : "flex flex-col md:flex-row items-center h-full mr-4 mb-4"}>
            <Link href={`/events/${id}`} className="block relative z-20 w-full">
                <Card className={`${gridMode ? "w-full" : "w-75 md:w-85 shrink-0"} border-0 shadow-sm transition-all duration-300 rounded-[24px] overflow-hidden bg-(--white)`}>
                    <CardContent className="p-4">
                        <div className="relative aspect-square w-full mb-4 overflow-hidden rounded-4xl">
                            <Image
                                src={imageSrc}
                                alt={title}
                                fill
                                unoptimized
                                className="object-cover"
                                onError={() => setImageSrc("/e1.png")}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-3 text-(--upcoming-primary-800) font-poppins font-semibold text-[14px] uppercase tracking-wider">
                                <div className="flex min-w-0 items-center gap-2">
                                    <Calendar className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{date}</span>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5 text-(--upcoming-primary-700)">
                                    <Users className="h-4 w-4" />
                                    <span>{bookedCount}</span>
                                </div>
                            </div>

                            <h3 className="font-poppins font-bold text-[24px] leading-tight text-(--upcoming-primary-800) line-clamp-2">
                                {title}
                            </h3>

                            <div className="h-px w-full bg-gray-100" />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-gray-500 font-poppins font-medium text-[16px]">
                                    <Tag className="h-4 w-4 shrink-0" />
                                    <span className="truncate max-w-37.5">{category}</span>
                                </div>
                                <div className="font-poppins font-bold text-[22px] text-(--upcoming-primary-800)">
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
