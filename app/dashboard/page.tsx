"use client";

import { useState } from "react";
import { HeroSection } from "@/components/landing/hero-section";
import { EventSection } from "@/components/landing/event-section";
import { ArtistSection } from "@/components/landing/artist-section";
import SuggestionsForm from "@/components/suggestions-form";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function DashboardPage() {
  const [selectedCategory] = useState("All");

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <main className="flex flex-col gap-2">
          <HeroSection />
          <br />

          <EventSection
            title="Experiences for You"
            activeCategory={selectedCategory}
          />

          <ArtistSection />

          <SuggestionsForm autoScrollOnDraft />

          <EventSection
            title="Pocket-Friendly (Under Rs 499)"
            activeCategory={selectedCategory}
            maxPrice={499}
          />
        </main>
      </div>
    </ProtectedRoute>
  );
}
