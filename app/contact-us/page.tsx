import { PageShell, SectionCard } from "@/components/platform/page-shell"

export default function ContactUsPage() {
  return (
    <PageShell
      eyebrow="Contact us"
      title="Get in Touch"
      description="For organizer-related communication, use the official contact channel below."
    >
      <SectionCard title="Official Email">
        <a
          href="mailto:contact-us@baatasari.com"
          className="inline-flex rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800"
        >
          contact-us@baatasari.com
        </a>
      </SectionCard>
    </PageShell>
  )
}
