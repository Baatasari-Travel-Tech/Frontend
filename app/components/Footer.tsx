"use client";

import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t bg-black text-white">
      <div className="container mx-auto px-4 py-12">

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">

          {/* Logo */}
          <div className="lg:col-span-2">
            <div className="mb-4 relative h-[88px] w-[216px] overflow-hidden rounded-xl">
              <Image
                src="/landing/footer-logo.png"
                alt="Baatasari"
                fill
                className="object-contain object-left"
              />
            </div>

            <p className="mb-4 text-sm text-gray-300 max-w-sm">
              Discover and book the best events, movies, and activities near you.
            </p>

            <div className="flex gap-3">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <button
                  key={i}
                  className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/10 transition"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 font-semibold text-lg">Company</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 font-semibold text-lg">Support</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">Terms</a></li>
              <li><a href="#" className="hover:text-white">Privacy</a></li>
            </ul>
          </div>

          {/* App buttons */}
          <div>
            <h3 className="mb-4 font-semibold text-lg">Download App</h3>

            <button className="w-full mb-3 border border-gray-600 rounded-lg px-4 py-2 text-left hover:bg-white/10 transition">
               App Store
            </button>

            <button className="w-full border border-gray-600 rounded-lg px-4 py-2 text-left hover:bg-white/10 transition">
              ▶ Google Play
            </button>
          </div>

        </div>

        <div className="mt-8 border-t border-gray-700 pt-6 text-center text-sm text-gray-400">
          © 2025 Baatasari. All rights reserved.
        </div>

      </div>
    </footer>
  );
}