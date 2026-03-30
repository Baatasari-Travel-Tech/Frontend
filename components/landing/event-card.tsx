"use client";

import { HandpickedEventCard } from "@/components/events/handpicked-card";
import { motion } from "framer-motion";

interface EventCardProps {
  title: string;
  location: string;
  price: string;
  date: string;
  image: string;
  category?: string;
}

// simple slug generator to satisfy the `id` prop of HandpickedEventCard
function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "");
}

export function EventCard(props: EventCardProps) {
  const { title, image, price, category } = props;
  const id = slugify(title);

  // delegate to the existing HandpickedEventCard which already implements
  // the hover animation, slide‑out details panel, and styling. We reuse the
  // same default content values defined there, so landing page cards behave
  // identically to the event section cards.
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      className="group w-70 shrink-0 cursor-pointer"
    >
      <HandpickedEventCard
        id={id}
        image={image}
        title={title}
        price={price}
        category={category || "Event"} date={""} location={""}      />
    </motion.div>
  );
}