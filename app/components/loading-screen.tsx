"use client";

import type { FC } from "react";

export const LoadingScreen: FC = () => {
  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center bg-brand-900/5 backdrop-blur-[6px] font-sans"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading Baatasari experience"
    >
      <div className="relative w-[min(92vw,420px)] rounded-[28px] border border-white/60 bg-white/50 px-10 py-12 text-center shadow-[0_30px_90px_rgba(12,29,55,0.18)] backdrop-blur-2xl">
        <div className="absolute inset-0 -z-10 rounded-[28px] bg-linear-to-br from-white/80 via-white/40 to-white/10" />

        <div className="relative mx-auto w-fit">
          <div className="absolute inset-0 rounded-full bg-brand-900/10 blur-sm animate-pulse" />
          <div className="relative h-14 w-14 rounded-full border-4 border-transparent border-t-brand-900/80 animate-spin motion-reduce:animate-none [animation-duration:3s]">
            <div className="absolute inset-0.5 rounded-full border-[3px] border-transparent border-t-brand-700/70 animate-spin motion-reduce:animate-none [animation-duration:2s] [animation-direction:reverse]" />
            <div className="absolute inset-1.25 rounded-full border-2 border-transparent border-b-brand-900/60 animate-spin motion-reduce:animate-none [animation-duration:1s]" />
          </div>
        </div>

        <div className="mt-6">
          <h1 className="text-3xl font-semibold tracking-[0.35em] text-transparent bg-linear-to-r from-brand-900 to-brand-700 bg-clip-text">
            BAATASARI
          </h1>
          <p className="mt-2 text-sm text-foreground/70 animate-pulse">
            Loading your experience
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-brand-900/30 animate-dot-bounce motion-reduce:animate-none" />
          <div className="h-2 w-2 rounded-full bg-brand-900/30 animate-dot-bounce motion-reduce:animate-none [animation-delay:0.2s]" />
          <div className="h-2 w-2 rounded-full bg-brand-900/30 animate-dot-bounce motion-reduce:animate-none [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
