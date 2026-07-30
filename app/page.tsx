import type { Metadata } from "next"
import HomeClient from "./home-client"

const title = "Baatasari — Discover, Connect, Experience"
const description = "Book the best events, dining, and activities near you — curated events, venues, and experiences all in one place."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Baatasari",
    title,
    description,
    images: [{ url: "/hero-bg.png", width: 1200, height: 630, alt: "Baatasari" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/hero-bg.png"],
  },
}

export default function Page() {
  return <HomeClient />
}
