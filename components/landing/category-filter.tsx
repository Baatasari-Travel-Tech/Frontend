"use client";

import { motion } from "framer-motion";
import {
    Flame,
    Music,
    Mic2,
    Laptop,
    Sparkles,
    Ticket
} from "lucide-react";

interface CategoryFilterProps {
    activeCategory: string;
    onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
    const categories = [
        { name: "All", icon: <Flame size={16} /> },
        { name: "Music", icon: <Music size={16} /> },
        { name: "Comedy", icon: <Mic2 size={16} /> },
        { name: "Education", icon: <Laptop size={16} /> },
        { name: "Festival", icon: <Sparkles size={16} /> },
        { name: "Movies", icon: <Ticket size={16} /> },
    ];

    return (
        <div className="w-full sticky top-14 z-40 px-2 md:px-10 py-3 font-switzer">
            <div
                className="mx-auto max-w-7xl backdrop-blur-lg shadow-xl rounded-[2.5rem] px-6 py-3 no-scrollbar overflow-x-auto"
                style={{
                    backgroundColor: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)"
                }}
            >
                <div className="flex items-center justify-center gap-6">

                    <div
                        className="hidden lg:flex items-center gap-2 px-5 py-2.5 rounded-full shadow-sm"
                        style={{
                            backgroundColor: "var(--glass-soft-bg)",
                            border: "1px solid var(--glass-border)"
                        }}
                    >
                        <span className="relative flex h-2.5 w-2.5">
                            <span
                                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                                style={{ backgroundColor: "var(--live-dot-soft)" }}
                            />
                            <span
                                className="relative inline-flex rounded-full h-2.5 w-2.5"
                                style={{ backgroundColor: "var(--live-dot-solid)" }}
                            />
                        </span>
                        <span
                            className="text-[11px] font-bold uppercase tracking-widest"
                            style={{ color: "var(--location-text)" }}
                        >
                            Visakhapatnam
                        </span>
                    </div>

                    <div
                        className="hidden lg:block h-8 w-px"
                        style={{ backgroundColor: "var(--category-divider)" }}
                    />

                    <div className="flex justify-center gap-2">
                        {categories.map((cat) => {
                            const isActive = activeCategory === cat.name;

                            return (
                                <button
                                    key={cat.name}
                                    onClick={() => onCategoryChange(cat.name)}
                                    className="relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap"
                                    style={{
                                        color: isActive
                                            ? "var(--white)"
                                            : "var(--category-inactive-text)"
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = "var(--category-hover-bg)";
                                            e.currentTarget.style.color = "var(--category-hover-text)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = "transparent";
                                            e.currentTarget.style.color = "var(--category-inactive-text)";
                                        }
                                    }}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-pill"
                                            className="absolute inset-0 z-0 rounded-full"
                                            style={{
                                                backgroundColor: "var(--category-active-bg)",
                                                boxShadow: `0 8px 20px var(--category-active-shadow)`
                                            }}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}

                                    <span className="relative z-10">{cat.icon}</span>
                                    <span className="relative z-10">{cat.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
