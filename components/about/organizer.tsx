"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function EventOrganizer() {
  const router = useRouter();

  return (
    <motion.section
      id="events"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true }}
      className="py-20 bg-(--gray-50)"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 max-w-6xl mx-auto">

          {/* Text Content */}
          <motion.div
            className="lg:w-1/2"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            {/* Heading */}
            <h2 className="font-bricolage font-bold text-4xl md:text-5xl tracking-tight text-(--brand-blue) mb-4">
              Are You an Event Organizer or Local Business?
            </h2>

            <div className="relative w-full mb-8 lg:hidden h-72">
              <Image
                src="/event-org.png"
                alt="Event Organizer Illustration"
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>

            {/* Subheading */}
            <p className="font-albert font-medium text-2xl md:text-3xl leading-tight tracking-tight text-(--about-heading-color) mb-6">
              Reach the right audience – Effortlessly
            </p>

            {/* Description */}
            <p className="font-albert text-lg leading-relaxed text-(--about-body-text) mb-8">
              Baatasari isn&apos;t just for explorers.
              It&apos;s built for creators, organizers, performers, cafes,
              communities, and experience curators.
              List your events.
              Connect with people actively looking for things to
              do.
              Manage bookings and visibility – all in one place.
              No noise.
              Just meaningful reach.
              Grow your audience.
              Fill your events.
              Build your presence.
            </p>

            {/* CTA */}
            <Button
              className="font-albert font-medium text-lg leading-6 text-(--white) bg-brand-900 hover:bg-(--brand-navy)/90 px-8 py-3 rounded-full transition h-auto"
              onClick={() => router.push('/?auth=register&role=organizer')}
            >
              Join as an Event Organizer
            </Button>
          </motion.div>

          {/* Desktop Image (Hidden on mobile, block on lg) */}
          <motion.div
            className="lg:w-1/2 w-full hidden lg:block"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <div className="relative w-full h-96">
              <Image
                src="/event-org.png"
                alt="Event Organizer Illustration"
                fill
                sizes="50vw"
                className="object-cover"
              />
            </div>
          </motion.div>

        </div>
      </div>
    </motion.section>
  );
}
