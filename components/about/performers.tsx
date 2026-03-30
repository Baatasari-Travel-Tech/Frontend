"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PERFORMERS_DATA } from "@/lib/about-data";
import Image from "next/image";

export default function Performers() {
  const [activeIndex, setActiveIndex] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const totalCards = PERFORMERS_DATA.length;

  const getPosition = (index: number) => {
    let diff = index - activeIndex;
    if (diff > totalCards / 2) diff -= totalCards;
    if (diff < -totalCards / 2) diff += totalCards;
    return diff;
  };

  const navigate = (direction: "left" | "right") => {
    if (isAnimating) return;
    setIsAnimating(true);

    if (direction === "right") {
      setActiveIndex((prev) => (prev + 1) % totalCards);
    } else {
      setActiveIndex((prev) => (prev - 1 + totalCards) % totalCards);
    }

    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  const handleCardClick = (index: number) => {
    if (isAnimating) return;
    const position = getPosition(index);
    if (position === 0) return;

    if (position > 0) {
      navigate("right");
    } else {
      navigate("left");
    }
  };

  return (
    <section id="performers" className="py-24 bg-(--white) overflow-hidden relative">
      <div className="container mx-auto px-4 relative">
        {/* Heading */}
        <h2 className="font-bricolage font-bold text-[54px] leading-18 tracking-[0] text-(--brand-blue) mb-20">
          Calling All Performers!
        </h2>

        {/* 3D Carousel Container */}
        <div className="relative h-117.5 flex items-center justify-center">
          {PERFORMERS_DATA.map((item, index) => {
            const position = getPosition(index);
            const isActive = position === 0;

            return (
              <div
                key={index}
                onClick={() => handleCardClick(index)}
                style={{
                  transform: `translateX(${position * 420}px) scale(${isActive ? 1 : 0.85})`,
                  zIndex: isActive ? 30 : 20,
                  opacity: isActive ? 1 : 0.6,
                }}
                className={`
                    absolute
                    w-95 h-105
                    rounded-[64px] bg-(--white) 
                    cursor-pointer
                    transition-all duration-700 ease-out
                    border
                    ${isActive
                    ? "border-(--card-active-border) shadow-[0_25px_60px_rgba(37,99,235,0.35)]"
                    : "border-(--gray-200) shadow-xl"
                  }
                  `}
              >
                {/* Image */}
                <div className="relative w-full h-56 rounded-t-2xl overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={380}
                    height={240}
                    className={`w-full h-full object-contain transition-transform duration-1000 ease-out ${isActive ? "scale-105" : "scale-100"}`}
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zNWVtIiBmaWxsPSIjOUI5QkE0IiBmb250LXNpemU9IjE0Ij5Ccm9rZW48L3RleHQ+Cjwvc3ZnPg==';
                    }}
                  />
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Card Title */}
                  <h3 className="font-albert font-medium text-[24px] leading-8 tracking-[0.0015em] text-(--about-card-text) mb-2">
                    {item.title}
                  </h3>

                  {/* Card Description */}
                  <p className="font-albert font-normal text-[16px] leading-6 tracking-[0.005em] text-(--about-card-text)">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>


        {/* Navigation Arrows */}
        <div className="absolute right-6 bottom-24 flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("left")}
            className="w-12 h-12 rounded-full flex items-center justify-center transition border p-0 bg-(--white) text-(--gray-600) border-(--gray-300) hover:bg-(--gray-100)"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("right")}
            className="w-12 h-12 rounded-full flex items-center justify-center transition border p-0 bg-(--white) text-(--gray-600) border-(--gray-300) hover:bg-(--gray-100)"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* CTA */}
        <div className="flex justify-center mt-20">
          <Link href="/talent">
            <Button className="font-albert font-medium text-[18px] leading-6 tracking-[0] text-(--white) px-10 py-4 rounded-full bg-brand-900 hover:bg-(--brand-navy)/90 transition h-auto">
              Showcase your Talent
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
