"use client";

import { ARTISTS_DATA } from "@/lib/landing-data";
import Image from "next/image";

export function ArtistSection() {
  const hasArtists = ARTISTS_DATA.length > 0;

  return (
    <section className="bg-background py-6 font-switzer">
      <div className="px-6 md:px-10 mb-6">
        <h2
          className="text-2xl md:text-3xl font-medium tracking-tight"
          style={{ color: "var(--brand-deep-blue)" }}
        >
          Trending Artists
        </h2>

        <p className="text-sm text-muted-foreground mt-2 font-normal max-w-lg">
          Discover the top-performing artists and catch them live in action across the city.
        </p>
      </div>

      {hasArtists ? (
        <div className="overflow-x-auto px-6 md:px-10 no-scrollbar">
          <div className="flex gap-10 md:gap-14 min-w-max pb-6">
            {ARTISTS_DATA.map((artist, i) => (
              <div
                key={i}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="relative">
                  <div
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden p-1.5 shadow-sm"
                    style={{
                      border: "1px solid var(--artist-card-border)",
                      backgroundColor: "var(--artist-card-bg)",
                    }}
                  >
                    <Image
                      src={artist.image}
                      width={80}
                      height={80}
                      className="w-full h-full rounded-full object-cover"
                      alt={artist.name}
                    />
                  </div>
                </div>

                <div className="mt-5 text-center">
                  <p
                    className="text-sm font-bold tracking-tight"
                    style={{ color: "var(--brand-deep-blue)" }}
                  >
                    {artist.name}
                  </p>

                  <div className="mt-1 flex flex-col items-center">
                    <div
                      className="h-0.5 w-0 group-hover:w-full transition-all duration-300 rounded-full mb-1"
                      style={{
                        backgroundColor: "var(--blue-soft)",
                      }}
                    />
                    <span
                      className="text-[9px] font-black uppercase tracking-[0.2em]"
                      style={{
                        color: "color-mix(in srgb, var(--blue-soft) 60%, transparent)",
                      }}
                    >
                      Artist
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-6 md:px-10 py-12 text-center">
          <p className="text-muted-foreground text-base md:text-lg font-medium">
            No trending artists available right now.
          </p>
          <p className="text-sm text-muted-foreground/80 mt-2">
            Check back soon — new performers are added regularly!
          </p>
        </div>
      )}
    </section>
  );
}