"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { STALLS_DATA } from "../data/stalls-data"
import { useLocalStorage } from "@/hooks/use-local-storage"

export function ApprovedStallsSection() {
    const [approvedStalls, , isInitialized] = useLocalStorage<string[]>("approvedStalls", [])

    if (!isInitialized) return null
    if (approvedStalls.length === 0) return null

    const stallsToShow = STALLS_DATA.filter(stall => approvedStalls.includes(stall.title))

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-bold text-blue-soft">
                    Approved Stalls
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {stallsToShow.map((stall) => (
                        <div
                            key={stall.title}
                            className="bg-background rounded-xl overflow-hidden border border-border flex flex-col group"
                        >
                            <div className="relative aspect-video w-full">
                                <Image
                                    src={stall.image || "/placeholder.svg"}
                                    alt={stall.title}
                                    fill
                                    className="object-cover transition-transform duration-300"
                                />
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                    Approved
                                </div>
                            </div>

                            <div className="p-4">
                                <h3 className="font-medium text-lg text-foreground leading-tight font-albert mb-1">
                                    {stall.title}
                                </h3>
                                <p className="text-muted-foreground text-xs font-poppins">
                                    {stall.category}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
