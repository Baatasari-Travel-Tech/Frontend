'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { getRoleDashboard, getRoleOnboarding } from '@/lib/roles'
import Hero from "@/components/about/hero"
import Features from "@/components/about/features"
import { FaTwitter, FaLinkedin, FaInstagram} from "react-icons/fa";
import Image from "next/image";
import EventOrganizer from "@/components/about/organizer"
import RestaurantOwner from "@/components/about/restaurant-owner"
import Performers from "@/components/about/performers"
import CampusAmbassador from "@/components/about/campus-ambassador"

export default function AboutPage() {
    const router = useRouter()
    const { session, activeRole, userRoles, organizerVerificationStatus, isLoading } = useAuth()

    const homeHref = useMemo(() => {
        if (!session?.user) return '/'

        const activeRoleRecord = userRoles.find((record) => record.role === activeRole)
        const userRoleRecord = userRoles.find((record) => record.role === 'USER')
        const organizerRoleRecord = userRoles.find((record) => record.role === 'EVENT_ORGANIZER')

        if (activeRole === 'EVENT_ORGANIZER') {
            const organizerOnboarded = organizerRoleRecord?.onboarding_completed === true
            if (!organizerOnboarded) return getRoleOnboarding('EVENT_ORGANIZER')
            if (organizerVerificationStatus === 'EMAIL_NOT_VERIFIED') return '/organizer/email-verification'
            if (organizerVerificationStatus === 'DOCUMENTS_REQUIRED') return '/organizer/document-upload'
            if (organizerVerificationStatus !== 'APPROVED') return '/organizer/pending'
            return getRoleDashboard('EVENT_ORGANIZER')
        }

        if (activeRole === 'USER') {
            return userRoleRecord?.onboarding_completed ? '/events' : '/onboarding'
        }

        return activeRoleRecord?.onboarding_completed
            ? getRoleDashboard(activeRole)
            : getRoleOnboarding(activeRole)
    }, [session?.user, activeRole, userRoles, organizerVerificationStatus])

    useEffect(() => {
        if (isLoading) return
        if (session?.user && homeHref && homeHref !== '/') {
            router.replace(homeHref)
        }
    }, [isLoading, session?.user, homeHref, router])

    if (isLoading) {
        return null
    }

    if (session?.user) {
        return null
    }

    return (
        <main className="min-h-screen">
            <Hero />
            <Features />
            <EventOrganizer />
            <RestaurantOwner />
            <CampusAmbassador />
            <Performers />
            
            <footer className="text-white border-t border-slate-200 bg-slate-900">
              <div className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 md:px-10 lg:px-16">
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-x-6 gap-y-8">

                  {/* Row 1: Logo */}
                  <div className="md:col-span-1">
                    <Image
                      src="/FLogo.png"
                      alt="Baatasari"
                      width={100}
                      height={40}
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>

                  {/* Empty cols for row 1 */}
                  <div className="hidden md:block" />
                  <div className="hidden md:block" />
                  <div className="hidden md:block" />

                  {/* Row 2 */}
                  {/* Description */}
                  <div className="text-sm text-slate-300 max-w-sm">
                    Discover, connect, experience. Official platform for curated events, venues, and experiences.
                  </div>

                  {/* Company */}
                  <div className="space-y-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Company</p>
                    <div className="grid gap-2 text-slate-300">
                      <a className="hover:text-white transition" href="/about">About</a>
                    </div>
                  </div>

                  {/* Resources */}
                  <div className="space-y-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resources</p>
                    <div className="grid gap-2 text-slate-300">
                      <a className="hover:text-white transition" href="/contact">Contact</a>
                    </div>
                  </div>

                  {/* Legal */}
                  <div className="space-y-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Legal</p>
                    <div className="grid gap-2 text-slate-300">
                      <a className="hover:text-white transition" href="/terms&conditions">Terms & Conditions</a>
                      <a className="hover:text-white transition" href="/privacy-policy">Privacy Policy</a>
                    </div>
                  </div>

                  {/* Row 3: Socials */}
                  <div className="flex items-center gap-4 mt-4">
                    <a className="rounded-full border border-slate-600 p-2.5 hover:bg-slate-800">
                      <FaInstagram className="h-5 w-5" />
                    </a>
                    <a className="rounded-full border border-slate-600 p-2.5 hover:bg-slate-800">
                      <FaLinkedin className="h-5 w-5" />
                    </a>
                    <a className="rounded-full border border-slate-600 p-2.5 hover:bg-slate-800">
                      <FaTwitter className="h-5 w-5" />
                    </a>
                  </div>

                </div>

                {/* Bottom bar – full width inside container */}
                <div className="mt-4 border-t border-slate-700 pt-4 text-xs text-slate-400 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p>© {new Date().getFullYear()} Baatasari. All rights reserved.</p>
                  <p>Built for personalized experiences.</p>
                </div>
              </div>
            </footer>
        </main>
    )
}
