"use client";

import { useState } from "react";
import { HeroSection } from "./components/landing/hero-section";
import { CategoryFilter } from "./components/landing/category-filter";
import { EventSection } from "./components/landing/event-section";
import { ArtistSection } from "./components/landing/artist-section";
import { MovieSection } from "./components/landing/movie-section";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  return (
    <div className="flex flex-col gap-10 pb-10">
      <HeroSection />

      <CategoryFilter
        activeCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <EventSection
        title="Experiences for You"
        activeCategory={selectedCategory}
      />

      <ArtistSection />

      <MovieSection title="Now Showing" />

      <EventSection
        title="Pocket-Friendly (Under Rs 499)"
        activeCategory={selectedCategory}
        maxPrice={499}
      />
    </div>
  );
}
