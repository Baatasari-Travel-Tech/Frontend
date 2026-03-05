"use client";

import { useState } from "react";
import { HeroSection } from "@/components/landing/hero-section";
import { CategoryFilter } from "@/components/landing/category-filter";
import { EventSection } from "@/components/landing/event-section";
import { ArtistSection } from "@/components/landing/artist-section";
import SuggestionsForm from "@/components/landing/suggestions-form";

export default function Home() {
  // 1. Create the state to track the category
  const [selectedCategory, setSelectedCategory] = useState("All");

  return (
    <div className="min-h-screen">
      <main className="flex flex-col gap-2">
        <HeroSection />

        {/* 2. Pass the state and the setter function as props */}
        <CategoryFilter
          activeCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* 3. Pass the state to EventSection so it knows what to show */}
        <EventSection
          title="Experiences for You"
          activeCategory={selectedCategory}
        />

        <ArtistSection />

        <SuggestionsForm />

        {/* 4. This section also reacts to the same filter */}
        <EventSection
          title="Pocket-Friendly (Under ₹499)"
          activeCategory={selectedCategory}
          maxPrice={499}
        />
      </main>
    </div>
  );
}
