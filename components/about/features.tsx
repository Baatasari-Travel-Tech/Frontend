"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FEATURES_DATA } from "@/lib/about-data";
import Image from "next/image";

export default function Features() {
  const [activeIndex, setActiveIndex] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const totalCards = FEATURES_DATA.length;

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
    <section id="features" className="pt-16 pb-24 bg-(--white) overflow-hidden relative">
      <div className="container mx-auto px-4 relative">
        {/* Section Heading */}
        <h2 className="font-bricolage font-bold text-[54px] leading-16 tracking-[0] text-(--brand-blue) mb-16">
          What makes us stand apart?
        </h2>

        {/* 3D Carousel Container */}
        <div className="relative h-135 flex items-center justify-center">
          {FEATURES_DATA.map((item, index) => {
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
                    w-95 h-117.5
                    rounded-[64px] bg-(--white) 
                    cursor-pointer
                    transition-all duration-700 ease-out
                    border
                    ${isActive
                    ? "border-(--blue-400) shadow-[0_25px_60px_rgba(37,99,235,0.35)]"
                    : "border-(--gray-200) shadow-xl"
                  }
                  `}
              >
                {/* Image */}
                <div className="relative w-full h-60 rounded-t-2xl overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 380px"
                    priority={isActive}
                    className={`object-contain transition-transform duration-1000 ease-out ${isActive ? "scale-105" : "scale-100"}`}
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zNWVtIiBmaWxsPSIjOUI5QkE0IiBmb250LXNpemU9IjE0Ij5Ccm9rZW48L3RleHQ+Cjwvc3ZnPg==';
                    }}
                  />
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-albert font-bold text-[24px] leading-8 tracking-[0] text-(--text-subtle) mb-2">
                    {item.title}
                  </h3>

                  <p className="font-albert font-medium text-[16px] leading-6 tracking-[0.005em] text-(--text-muted-custom)">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrows */}
        <div className="absolute right-4 -bottom-8 flex gap-3">
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
      </div>
    </section>
  );
}
