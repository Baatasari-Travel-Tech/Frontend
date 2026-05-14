"use client"

import { useEffect, useState } from "react"
import { FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa"
import { PageShell, SectionCard } from "@/components/platform/page-shell"
import { getFooterConfig, type FooterConfig } from "@/lib/footer-config"

export default function ContactUsPage() {
  const [config, setConfig] = useState<FooterConfig>(getFooterConfig)

  useEffect(() => {
    setConfig(getFooterConfig())
  }, [])

  const hasAnyLink =
    config.instagram !== "#" || config.linkedin !== "#" || config.twitter !== "#"

  return (
    <PageShell
      eyebrow="Contact us"
      title="Get in Touch"
      description="For organizer-related communication, use the official contact channel below."
    >
      <SectionCard title="Official Email">
        <a
          href="mailto:contact-us@baatasari.com"
          className="inline-flex rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800 transition"
        >
          contact-us@baatasari.com
        </a>
      </SectionCard>

      <SectionCard title="Find Us Online">
        {hasAnyLink ? (
          <div className="flex flex-wrap items-center gap-4">
            {config.instagram !== "#" && (
              <a
                href={config.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <FaInstagram className="h-4 w-4" />
                Instagram
              </a>
            )}
            {config.linkedin !== "#" && (
              <a
                href={config.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <FaLinkedin className="h-4 w-4" />
                LinkedIn
              </a>
            )}
            {config.twitter !== "#" && (
              <a
                href={config.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <FaTwitter className="h-4 w-4" />
                Twitter / X
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Social links not configured yet. Visit the{" "}
            <a href="/events" className="underline hover:text-slate-700">
              events page
            </a>{" "}
            footer to add them.
          </p>
        )}
      </SectionCard>
    </PageShell>
  )
}
