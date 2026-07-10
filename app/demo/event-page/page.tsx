"use client"

/**
 * DEMO — the real redesigned event page rendered with dummy data.
 * Preview at /demo/event-page. This is a thin wrapper around the LIVE
 * component (app/events/[id]/event-detail-client.tsx), so any change to the
 * real page is automatically reflected here. Booking/checkout links point at
 * a fake event id and won't complete — this is for design review only.
 */

import EventDetailClient from "@/app/events/[id]/event-detail-client"
import type { EventDetail } from "@/types/api"

const DEMO_EVENT: EventDetail = {
  id: "demo-jaanapada-raathri",
  organizerId: "demo-organizer",
  title: "Jaanapada Raathri — Folk Night by the Sea",
  description:
    "Jaanapada Raathri brings the villages to the beach — three hours of live folk performances from artists across Uttarandhra, followed by a DJ set that runs till the lights go out.\n\nExpect Dimsa and Kolatam troupes, a Burrakatha storyteller, a 40-stall food street serving Araku bamboo chicken and Vizag-style muri mixture, and a bonfire circle right on the sand. Gates open at 5 PM; the first performance starts at 5:30 sharp.\n\nCarry a light jacket — the sea breeze picks up after sunset.",
  date: "2026-07-26T00:00:00.000Z",
  venue: "RK Beach Amphitheatre, Visakhapatnam",
  capacity: 800,
  slug: "jaanapada-raathri-demo",
  category: "Music & Culture",
  tagline: "An evening of Telugu folk music, dance and street food",
  heroImageUrl: null,
  heroImagePublicId: null,
  endDate: "2026-07-27T00:00:00.000Z",
  startTime: "5:30 PM",
  endTime: "10:30 PM",
  googleMapsUrl: "https://maps.google.com/?q=RK+Beach+Visakhapatnam",
  transportToEvent: "APSRTC stop 200 m away",
  entrySide: "Entry from Gate 2 · Beach Road side",
  transportOptions: { parkingAvailable: true, autoStandAtGate2: true },
  artists: [
    { name: "Mandala Collective", genre: "Folk fusion" },
    { name: "Gidugu Ramanaidu Bruodam", genre: "Burrakatha" },
    { name: "Srikakulam Dimsa Troupe", genre: "Dimsa" },
    { name: "DJ Varun", genre: "Electronic" },
  ],
  sponsors: {
    titleSponsors: [{ name: "Visakha Dairy", website: "https://example.com" }],
    coPartners: [
      { name: "Araku Coffee House", website: "" },
      { name: "Bay Leaf Hotels", website: "" },
    ],
    mediaPartners: [
      { name: "Sakshi TV", website: "" },
      { name: "Radio Mirchi Vizag", website: "" },
    ],
  },
  requirements: {
    highlights: [
      "12 live folk troupes",
      "Bonfire circle on the sand",
      "40-stall food street",
      "Craft bazaar",
      "Kids' storytelling corner",
      "Fireworks finale",
    ],
    personnel: "Padma Shri Sobha Naidu (chief guest)",
  },
  postEventFollowUp: { thankYouNote: "" },
  contactInfo: {
    mobile: "9550993024",
    email: "hello@coastalandhra.events",
    website: "https://example.com",
    additionalLinks: "",
  },
  audienceRange: { min: 0, max: 100 },
  targetAudience: {
    "Student (School / College)": true,
    "Working Professional - IT / Tech": true,
    Homemaker: true,
    "Freelancer / Creator": true,
  },
  addOns: {
    freebies: true,
    giftHampers: true,
    merchandise: true,
    addOther: false,
    giftHampersDescription: "Araku coffee sampler for VIP Deck",
    addOtherDescription: "",
  },
  discounts: {},
  guidelines: {
    text: "Tickets once booked cannot be exchanged or refunded.\nGates close at 9:30 PM — no late entry after that.\nCarry a valid ID; rights of admission reserved.\nOutside food and drinks are not allowed.",
  },
  published: true,
  cancelledAt: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
  startingPrice: 700,
  organizerDisplayName: "Coastal Andhra Events",
  ticketTiers: [
    {
      id: "demo-tier-kids",
      name: "Kids",
      description: "Ages 5–12 · storytelling corner access",
      price: 700,
      quantity: 100,
      soldCount: 16,
    },
    {
      id: "demo-tier-adults",
      name: "Adults",
      description: "Full access · all performances",
      price: 1000,
      quantity: 500,
      soldCount: 288,
    },
    {
      id: "demo-tier-vip",
      name: "VIP Deck",
      description: "Front deck seats · welcome snacks",
      price: 2500,
      quantity: 40,
      soldCount: 31,
    },
  ],
}

export default function DemoEventPage() {
  return <EventDetailClient event={DEMO_EVENT} />
}
