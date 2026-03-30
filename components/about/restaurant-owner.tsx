"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function RestaurantOwner() {
  return (
    <motion.section
      id="restaurants"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true }}
      className="py-20 bg-(--white)"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-12 max-w-6xl mx-auto">

          {/* Text Content */}
          <motion.div
            className="lg:w-1/2"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            {/* Heading */}
            <h2 className="font-bricolage font-bold text-4xl md:text-5xl tracking-tight text-(--brand-blue) mb-4">
              Are You a Restaurant or Cafe Owner ?
            </h2>

            <div className="relative w-full mb-8 lg:hidden h-72">
              <Image
                src="/bro.png"
                alt="Restaurant Owner Illustration"
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>

            {/* Subheading */}
            <p className="font-albert font-medium text-2xl md:text-3xl leading-tight tracking-tight text-(--about-heading-color) mb-6">
              Turn Hungry Searches Into Full Tables.
            </p>

            {/* Description */}
            <div className="font-albert text-base leading-relaxed text-(--about-body-text) mb-8">
              <p className="mb-3">
                Baatasari isn&apos;t just for diners – it&apos;s built for passionate culinary creators like you. When people search for places to eat, cafes near them, or new food experiences, your restaurant deserves to be seen.
              </p>
              <p className="mb-2">We help you</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Showcase your unique dishes and vibe</li>
                <li>Reach customers actively looking for food experiences</li>
                <li>Promote special menus, events, and offers.</li>
                <li>Manage bookings with ease</li>
                <li>Increase visibility without marketing chaos</li>
              </ul>
              <p className="mt-3">
                No complicated tools. No wasted reach. Just real people discovering your place.
              </p>
            </div>

            {/* CTA */}
            <Button 
                className="font-albert font-medium text-lg leading-6 text-(--white) bg-brand-900 hover:bg-(--brand-navy)/90 px-8 py-3 rounded-full transition h-auto"
                disabled>
              {/* Become a Restaurant Partner. */}Coming Soon ...
            </Button>
          </motion.div>

          {/* Desktop Image (Hidden on mobile, block on lg) */}
          <motion.div
            className="lg:w-1/2 w-full hidden lg:block"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <div className="relative w-full h-96">
              <Image
                src="/bro.png"
                alt="Restaurant Owner Illustration"
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
