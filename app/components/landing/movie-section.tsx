"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export function MovieSection({}: { title: string }) {
  const router = useRouter();

  return (
    <section className="relative w-full overflow-hidden bg-gray-100 px-4 pt-4 md:px-6 md:pt-6">
      <div className="relative w-full overflow-hidden py-12 md:py-16 rounded-2xl md:rounded-3xl shadow-lg bg-black">

        <div className="absolute inset-0 opacity-30">
          <Image
            src="/landing/Baatasari-pass-entertainment-banner.jpg"
            alt="Banner"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <span className="mb-4 px-4 py-1 rounded-full bg-white/20 text-white text-sm">
            Baatasari Pass
          </span>

          <h1 className="mb-4 max-w-4xl text-4xl font-bold text-white md:text-5xl">
            Unlimited access to events & movies
          </h1>

          <p className="mb-6 max-w-2xl text-lg text-white/90">
            Get exclusive discounts and early access to the best experiences.
          </p>

          <button
            onClick={() => router.push("/")}
            className="rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-gray-200 transition"
          >
            Explore
          </button>
        </div>
      </div>
    </section>
  );
}
