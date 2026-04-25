"use client"

import { useState, useRef, useEffect, useCallback } from "react"

import { StallCard } from "@/components/event-org/stalls/stall-card"
import { ArtistCard } from "@/components/event-org/stalls/artist-card"
import { StallDetails } from "@/components/event-org/stalls/stall-details"
import { useToast } from "@/components/use-toast"
import {
    STALLS_DATA,
    ARTISTS,
    generateRandomItems,
    type Stall,
} from "../../../components/event-org/data/stalls-data"
import { useLocalStorage } from "@/hooks/use-local-storage"

type StallItem = { name: string; price: number }

export default function EventsPage() {
    const [selectedStall, setSelectedStall] = useState<Stall | null>(null)
    const [stallItems, setStallItems] = useState<StallItem[]>([])
    const [approvedStalls, setApprovedStalls] = useLocalStorage<string[]>(
        "approvedStalls",
        []
    )
    const [deniedStalls, setDeniedStalls] = useLocalStorage<string[]>(
        "deniedStalls",
        []
    )
    const { toast } = useToast()

    // Refs and state for scroll-aware fixed positioning
    const stallsSectionRef = useRef<HTMLDivElement>(null)
    const [panelMode, setPanelMode] = useState<"fixed" | "absolute">("fixed")

    const handleScroll = useCallback(() => {
        if (!stallsSectionRef.current || !selectedStall) return

        const sectionRect = stallsSectionRef.current.getBoundingClientRect()
        const panelHeight = 480 // approximate height of the stall details panel
        const topOffset = 96 // top-24 = 96px

        // If the bottom of the section minus the panel height is above the top offset,
        // the panel should stop being fixed and stick to the bottom of the section
        if (sectionRect.bottom - topOffset < panelHeight) {
            setPanelMode("absolute")
        } else {
            setPanelMode("fixed")
        }
    }, [selectedStall])

    useEffect(() => {
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [handleScroll])

    const handleViewMore = (stall: Stall) => {
        if (selectedStall?.title === stall.title) {
            setSelectedStall(null)
            return
        }

        setSelectedStall(stall)
        setStallItems(generateRandomItems())
        setPanelMode("fixed") // reset on new selection
    }

    const handleClose = () => {
        setSelectedStall(null)
    }

    const handleApprove = (stallTitle: string) => {
        if (approvedStalls.includes(stallTitle)) return

        setApprovedStalls([...approvedStalls, stallTitle])
        toast({
            title: "✓ Stall Approved",
            description: `${stallTitle} has been approved successfully.`,
            duration: 3000,
        })
    }

    const handleRevoke = (stallTitle: string) => {
        // If it was approved, remove from approved
        if (approvedStalls.includes(stallTitle)) {
            setApprovedStalls(approvedStalls.filter((t) => t !== stallTitle))
        }
        // Add to denied list so it's removed from the stalls page
        if (!deniedStalls.includes(stallTitle)) {
            setDeniedStalls([...deniedStalls, stallTitle])
        }
        toast({
            title: "✗ Stall Denied",
            description: `${stallTitle} has been denied.`,
            duration: 3000,
        })
    }

    const handlePanelApprove = () => {
        if (!selectedStall) return
        handleApprove(selectedStall.title)
        handleClose()
    }

    const handlePanelRevoke = () => {
        if (!selectedStall) return
        handleRevoke(selectedStall.title)
        handleClose()
    }

    const visibleStalls = STALLS_DATA.filter(
        (stall) => !approvedStalls.includes(stall.title) && !deniedStalls.includes(stall.title)
    )

    return (
        <>
            <div className="w-full mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-10 py-6 flex flex-col gap-16">
                <div ref={stallsSectionRef} className="relative flex flex-col lg:flex-row gap-6 lg:gap-8 transition-all duration-500 ease-in-out">
                    <div className="flex-1 transition-all duration-500 ease-in-out">
                        <section>
                            <div className="mb-8 flex flex-col gap-2">
                                <h1 className="text-3xl font-medium text-(--upcoming-primary-700) font-bricolage">
                                    Stalls
                                </h1>
                                <p className="text-black font-albert">
                                    You can choose the stalls you want to add here.
                                </p>
                            </div>

                            {visibleStalls.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center bg-white/50 rounded-3xl border border-dashed border-slate-300">
                                    <div className="bg-green-100 p-4 rounded-full mb-4">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="w-8 h-8 text-green-600"
                                        >
                                            <path d="M3 21h18" />
                                            <path d="M5 21V7l8-4 8 4v14" />
                                            <path d="M9 10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl font-bold font-bricolage text-slate-800 mb-2">
                                        House Full!
                                    </h3>
                                    <p className="text-slate-500 font-poppins max-w-md">
                                        All stalls have been approved. You&apos;re all set for a great event!
                                    </p>
                                </div>
                            ) : (
                                <div
                                    className={`grid gap-6 lg:gap-8 transition-all duration-500 ${selectedStall
                                        ? "grid-cols-1 md:grid-cols-2"
                                        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                        }`}
                                >
                                    {visibleStalls.map((stall) => (
                                        <StallCard
                                            key={stall.title}
                                            {...stall}
                                            onViewMore={() => handleViewMore(stall)}
                                            onApprove={() => handleApprove(stall.title)}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Desktop side panel - fixed while scrolling, stops at section end */}
                    <div
                        className={`transition-all duration-500 ease-in-out shrink-0 ${selectedStall
                            ? "hidden lg:block lg:w-95"
                            : "hidden"
                            }`}
                    >
                        <div
                            className={`w-85 transition-all duration-500 ease-in-out ${panelMode === "fixed"
                                ? "fixed top-24 z-40"
                                : "absolute bottom-0 right-0"
                                } ${selectedStall
                                    ? "opacity-100 translate-x-0"
                                    : "opacity-0 translate-x-8 pointer-events-none"
                                }`}
                        >
                            {selectedStall && (
                                <StallDetails
                                    title={selectedStall.title}
                                    subtitle="Where Style Meets Sparkle"
                                    items={stallItems}
                                    onClose={handleClose}
                                    onApprove={handlePanelApprove}
                                    isApproved={approvedStalls.includes(selectedStall.title)}
                                    onRevoke={handlePanelRevoke}
                                />
                            )}
                        </div>
                    </div>

                    {/* Mobile Overlay Panel */}
                    <div
                        className={`fixed inset-0 z-50 flex items-center justify-center p-4 lg:hidden transition-all duration-400 ease-in-out ${selectedStall
                            ? "bg-black/50 opacity-100 pointer-events-auto"
                            : "bg-black/0 opacity-0 pointer-events-none"
                            }`}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) handleClose();
                        }}
                    >
                        <div className={`w-full max-w-85 transition-all duration-400 ease-in-out ${selectedStall
                            ? "opacity-100 scale-100 translate-y-0"
                            : "opacity-0 scale-95 translate-y-4"
                            }`}>
                            {selectedStall && (
                                <StallDetails
                                    title={selectedStall.title}
                                    subtitle="Where Style Meets Sparkle"
                                    items={stallItems}
                                    onClose={handleClose}
                                    onApprove={handlePanelApprove}
                                    isApproved={approvedStalls.includes(selectedStall.title)}
                                    onRevoke={handlePanelRevoke}
                                />
                            )}
                        </div>
                    </div>
                </div>
                <div className="bg-background z-1 ">
                    <section>
                        <div className="mb-8 flex flex-col gap-2">
                            <h2 className="text-3xl font-medium text-(--upcoming-primary-700) font-bricolage">
                                Artists
                            </h2>
                            <p className="text-black font-albert">
                                You can meet all talented artists here
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
                            {ARTISTS.map((artist) => (
                                <ArtistCard
                                    key={artist.name}
                                    {...artist}
                                />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </>
    )
}
