"use client";

import { use } from "react";
import { getAllEvents } from "@/lib/events-data";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    MapPin,
    CalendarX2,
    CalendarPlus,
    HelpCircle,
    Footprints,
    Car,
    Bus,
    Flag
} from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle
} from "@/components/ui/dialog"
import { DateReviewsSection } from "@/components/events/date-reviews-section"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function EventDetailsPage({ params }: PageProps) {
    const { id } = use(params);
    const events = getAllEvents();
    const event = events.find((e) => e.id === id);

    if (!event) {
        return (
            <div className="min-h-screen bg-(--white) flex flex-col">
                <main className="flex-1 container mx-auto px-4 py-20 flex items-center justify-center">
                    <h1 className="text-2xl font-bold text-(--gray-800)">Event not found</h1>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-(--white) flex flex-col">

            <main className="flex-1 container mx-auto px-4 py-8 md:py-24 max-w-6xl mt-20">


                <div className="flex flex-col lg:flex-row items-start gap-6 mb-16">
                    {/* 2. Left Column: Poster Image */}
                    <div className="flex-1 w-full lg:w-auto flex justify-center lg:justify-end lg:pr-6">
                        <div className="relative w-full max-w-100 aspect-3/4 rounded-2xl overflow-hidden shadow-lg">
                            <Image
                                src={event.image}
                                alt={event.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    </div>

                    {/* 3. Right Column: Booking Form */}
                    <div className="flex-1 w-full lg:w-auto">
                        <h1 className="text-3xl md:text-4xl font-bold text-(--brand-blue) mb-6 text-left font-bricolage">
                            {event.title}
                        </h1>
                        <div className="bg-(--white) border border-(--gray-200) rounded-xl p-6 shadow-sm sticky top-24">
                            <h2 className="text-xl font-semibold text-(--black) mb-6">Enter Your Details</h2>
                            <form className="space-y-6">
                                <div className="relative">
                                    <label htmlFor="name" className="absolute -top-2 left-3 bg-(--white) px-1 text-xs font-medium text-(--gray-500) z-10 text-[11px]">Name</label>
                                    <Input
                                        type="text"
                                        id="name"
                                        placeholder="Enter your name"
                                        className="w-full h-11 px-3 rounded-md border border-(--gray-400) focus-visible:ring-0 focus-visible:border-brand-900 text-sm placeholder:text-(--gray-300) placeholder:font-light"
                                    />
                                </div>
                                <div className="relative">
                                    <label htmlFor="email" className="absolute -top-2 left-3 bg-(--white) px-1 text-xs font-medium text-(--gray-500) z-10 text-[11px]">E-mail</label>
                                    <Input
                                        type="email"
                                        id="email"
                                        placeholder="Enter your g-mail"
                                        className="w-full h-11 px-3 rounded-md border border-(--gray-400) focus-visible:ring-0 focus-visible:border-brand-900 text-sm placeholder:text-(--gray-300) placeholder:font-light"
                                    />
                                </div>
                                <div className="relative">
                                    <label htmlFor="mobile" className="absolute -top-2 left-3 bg-(--white) px-1 text-xs font-medium text-(--gray-500) z-10 text-[11px]">Mobile Number</label>
                                    <Input
                                        type="tel"
                                        id="mobile"
                                        placeholder="Enter your Mobile Number"
                                        className="w-full h-11 px-3 rounded-md border border-(--gray-400) focus-visible:ring-0 focus-visible:border-brand-900 text-sm placeholder:text-(--gray-300) placeholder:font-light"
                                    />
                                </div>
                                <div className="relative">
                                    <label htmlFor="tickets" className="absolute -top-2 left-3 bg-(--white) px-1 text-xs font-medium text-(--gray-500) z-10 text-[11px]">No of Tickets</label>
                                    <Input
                                        type="number"
                                        id="tickets"
                                        placeholder="Select no of tickets"
                                        className="w-full h-11 px-3 rounded-md border border-(--gray-400) focus-visible:ring-0 focus-visible:border-brand-900 text-sm placeholder:text-(--gray-300) placeholder:font-light"
                                    />
                                </div>

                                <Button className="w-full h-11 mt-4 bg-brand-900 text-(--white) font-medium hover:bg-(--brand-navy)/90 rounded-full text-base">
                                    Pay
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* 4. Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12 mb-12">
                    <div>
                        <p className="font-semibold text-(--black) text-lg mb-1">Date: 21st March 2025</p>
                    </div>
                    <div>
                        <p className="font-semibold text-(--black) text-lg mb-1">Time: 8 AM Onwards</p>
                    </div>
                    <div>
                        <p className="font-semibold text-(--black) text-lg mb-1">Venue: <span className="underline decoration-1 underline-offset-4">Qubaa, Visakhapatnam</span></p>
                    </div>
                    <div>
                        <p className="font-semibold text-(--black) text-lg mb-1">Age Eligibility: 21+ Years</p>
                    </div>
                    <div>
                        <p className="font-semibold text-(--black) text-lg mb-1">Event Duration: 4hrs</p>
                    </div>
                    <div>
                        <p className="font-semibold text-(--black) text-lg mb-1">Entry Time: 7 PM Onwards</p>
                    </div>
                </div>

                {/* 5. Detailed Body Content */}
                <div className="space-y-8 max-w-4xl">
                    {/* About & Highlights Card */}
                    <div className="border border-(--gray-200) rounded-xl p-8 bg-(--white) shadow-sm">
                        <h3 className="font-bold text-lg text-(--black) mb-4">About the Event</h3>
                        <p className="text-(--gray-600) mb-6 leading-relaxed">
                            {event.title} is set to be an unforgettable experience. Join us for a day filled with energy, music, and great vibes.
                            Get ready for an electrifying musical transformation as we dive into the world of heavyweight mutations.
                        </p>

                        <h3 className="font-bold text-lg text-(--black) mb-4">Event Highlights</h3>
                        <ul className="list-disc pl-5 space-y-2 text-(--gray-600)">
                            <li>Get ready for an electrifying musical transformation as we dive into the world of heavyweight mutations</li>
                            {event.highlights?.map((highlight, index) => (
                                <li key={index}>{highlight}</li>
                            )) || (
                                    <li>One of the sensational maestros who has set hearts racing with mind-blowing performances</li>
                                )}
                            <li>Renowned labels and production quality that guarantees a top-tier experience</li>
                        </ul>
                    </div>

                    {/* Can't make it Card included with Dialog */}
                    <div className="border border-(--gray-200) rounded-xl p-8 bg-(--white) shadow-sm text-center">
                        <div className="flex justify-center mb-4">
                            <CalendarX2 className="h-10 w-10 text-(--black)" />
                        </div>
                        <h3 className="font-bold text-lg text-(--black) mb-2">Can&apos;t make it this time?</h3>
                        <p className="text-(--gray-600) mb-6 max-w-lg mx-auto">
                            Can&apos;t attend on the scheduled date? You can request a different day that suits you — and also view how many others are interested in the same!
                        </p>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="bg-brand-900 text-(--white) hover:bg-(--black)/90 rounded-full px-6">
                                    <CalendarPlus className="h-4 w-4 mr-2" /> Request a New Date
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="p-0 overflow-hidden w-[95vw] max-w-5xl rounded-3xl bg-(--white) border-0 max-h-[85vh] flex flex-col items-center justify-center">
                                <VisuallyHidden>
                                    <DialogTitle>Select Date and View Reviews</DialogTitle>
                                </VisuallyHidden>
                                <div className="w-full h-full overflow-y-auto p-6 md:p-8 flex items-center justify-center">
                                    <DateReviewsSection />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Accordions */}
                    <div className="space-y-8">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1" className="border border-(--gray-200) rounded-xl bg-(--white) px-6 data-[state=open]:pb-4 last:border-b">
                                <AccordionTrigger className="hover:no-underline font-bold text-(--black) text-lg py-6">
                                    Terms & Conditions
                                </AccordionTrigger>
                                <AccordionContent className="text-(--gray-600)">
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Tickets once booked cannot be exchanged or refunded.</li>
                                        <li>An Internet handling fee per ticket may be levied. Please check the total amount before payment.</li>
                                        <li>We recommend that you arrive at least 20 minutes prior at the venue for a seamless entry.</li>
                                        <li>Rights of admission reserved.</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>


                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-2" className="border border-(--gray-200) rounded-xl bg-(--white) px-6 data-[state=open]:pb-4 last:border-b">
                                <AccordionTrigger className="hover:no-underline font-bold text-(--black) text-lg py-6">
                                    <span className="flex items-center gap-3">
                                        <HelpCircle className="h-5 w-5" />
                                        How to Get Here
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="text-(--gray-600)">
                                    <div className="space-y-6 pt-2">
                                        {/* Top Info */}
                                        <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-sm text-brand-900 font-medium border-b border-(--gray-100) pb-6">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-(--gray-400)" />
                                                <span>Venue: Qubaa (Vizag)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Bus className="h-4 w-4 text-(--gray-400)" />
                                                <span>Nearest Bus Stop: RK Beach</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Flag className="h-4 w-4 text-(--gray-400)" />
                                                <span>Landmark: Opposite The Park Hotel</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Left: Map */}
                                            <div className="rounded-xl overflow-hidden min-h-75 relative bg-(--slate-100) border border-(--slate-200)">
                                                {/* Placeholder for Map - using an iframe or image would be ideal here */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-(--slate-400) gap-2">
                                                    <MapPin className="h-8 w-8 opacity-50" />
                                                    <span className="text-sm font-medium">Map View</span>
                                                </div>
                                            </div>

                                            {/* Right: Instructions */}
                                            <div className="space-y-8">
                                                {/* First time */}
                                                <div>
                                                    <h4 className="font-bold text-(--black) mb-3 text-base">First time this way?</h4>
                                                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-(--gray-600)">
                                                        <li>Ola/Uber autos & bikes available widely</li>
                                                        <li>Use The Park Hotel as landmark if drivers are unsure</li>
                                                    </ul>
                                                </div>

                                                {/* Sections */}
                                                <div className="space-y-6">
                                                    <div>
                                                        <h4 className="font-bold text-(--black) mb-2 text-base flex items-center gap-2">
                                                            <Footprints className="h-4 w-4" /> By Foot
                                                        </h4>
                                                        <ul className="list-disc pl-5 space-y-1.5 text-sm text-(--gray-600)">
                                                            <li>If you&apos;re at RK Beach: Walk towards Kali Temple, take left from Dolphin Hotel</li>
                                                            <li>It&apos;s a 3-min walk from there</li>
                                                        </ul>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-bold text-(--black) mb-2 text-base flex items-center gap-2">
                                                            <Car className="h-4 w-4" /> By Car
                                                        </h4>
                                                        <ul className="list-disc pl-5 space-y-1.5 text-sm text-(--gray-600)">
                                                            <li>Set destination as &ldquo;Qubaa Vizag&rdquo; on Google Maps</li>
                                                            <li>Limited parking available — try nearby lots like opposite YMCA</li>
                                                            <li>Recommended entry via Beach Road</li>
                                                        </ul>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-bold text-(--black) mb-2 text-base flex items-center gap-2">
                                                            <Bus className="h-4 w-4" /> By Bus
                                                        </h4>
                                                        <ul className="list-disc pl-5 space-y-1.5 text-sm text-(--gray-600)">
                                                            <li>Bus no. 900K, 400, 38 - Get down at RK Beach stop</li>
                                                            <li>Walk towards Dolphin Hotel</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            </main>
        </div>
    );
}
