"use client";

import React from "react";
import { StallCard } from "./stall-card";

export type Stall = {
    id: string;
    title: string;
    category: string;
    image: string;
    isApproved?: boolean;
};

export function StallsGrid({
    stalls,
    onApprove,
    onViewMore,
    className = "",
}: {
    stalls: Stall[];
    onApprove?: (stall: Stall) => void;
    onViewMore?: (stall: Stall) => void;
    className?: string;
}) {
    return (
        <div
            className={[
                // auto-fit makes cards stretch to fill available width nicely
                "grid gap-6 auto-rows-fr",
                "grid-cols-[repeat(auto-fit,minmax(220px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]",
                className,
            ].join(" ")}
        >
            {stalls.map((stall) => (
                <StallCard
                    key={stall.id}
                    title={stall.title}
                    category={stall.category}
                    image={stall.image}
                    isApproved={stall.isApproved}
                    onViewMore={() => onViewMore?.(stall)}
                    onApprove={() => onApprove?.(stall)}
                />
            ))}
        </div>
    );
}
