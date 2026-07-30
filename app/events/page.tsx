import type { Metadata } from "next"
import EventsClient from "./events-client"

const title = "Events — Baatasari"
const description = "Browse live, upcoming, and past events near you — concerts, workshops, meetups, and more."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/events" },
  openGraph: {
    type: "website",
    url: "/events",
    siteName: "Baatasari",
    title,
    description,
    images: [{ url: "/events-hero.png", width: 1200, height: 630, alt: "Baatasari Events" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/events-hero.png"],
  },
}

export default function Page() {
  return <EventsClient />
}
