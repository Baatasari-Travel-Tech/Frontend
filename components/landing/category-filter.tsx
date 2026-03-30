"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import {
    Flame,
    Music,
    Mic2,
    Laptop,
    Sparkles,
    Ticket,
    ChevronDown
} from "lucide-react";

interface CategoryFilterProps {
    activeCategory: string;
    onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const categories = [
        { name: "All", icon: <Flame size={16} /> },
        { name: "Music", icon: <Music size={16} /> },
        { name: "Comedy", icon: <Mic2 size={16} /> },
        { name: "Education", icon: <Laptop size={16} /> },
        { name: "Festival", icon: <Sparkles size={16} /> },
        { name: "Movies", icon: <Ticket size={16} /> },
    ];

    const activeCat = categories.find(cat => cat.name === activeCategory);

    return (
        <div className="w-full top-14 z-10 px-2 md:px-10 py-3 font-switzer">
            {/* Mobile version */}
            <div
                className="lg:hidden mx-auto max-w-7xl backdrop-blur-lg shadow-xl rounded-[2.5rem] px-6 py-3"
                style={{
                    backgroundColor: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)"
                }}
            >
                <div className="flex items-center justify-center gap-6">
                    <div
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full shadow-sm"
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
                        className="h-8 w-px"
                        style={{ backgroundColor: "var(--category-divider)" }}
                    />

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300"
                            style={{
                                backgroundColor: "var(--category-active-bg)",
                                border: "1px solid var(--glass-border)",
                                color: "var(--white)",
                                boxShadow: "0 8px 20px var(--category-active-shadow)"
                            }}
                        >
                            {activeCat?.icon}
                            {activeCategory}
                            <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown size={16} />
                            </motion.div>
                        </button>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full mt-2 min-w-50 shadow-xl rounded-2xl overflow-hidden z-50"
                                    style={{
                                        backgroundColor: "white",
                                        border: "1px solid var(--glass-border)",
                                        left: '50%',
                                        transform: 'translateX(-50%)'
                                    }}
                                >
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.name}
                                            onClick={() => {
                                                onCategoryChange(cat.name);
                                                setIsOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-300 hover:bg-opacity-20"
                                            style={{
                                                color: activeCategory === cat.name ? "var(--white)" : "var(--category-inactive-text)",
                                                backgroundColor: activeCategory === cat.name ? "var(--category-active-bg)" : "transparent"
                                            }}
                                        >
                                            {cat.icon}
                                            {cat.name}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Desktop version */}
            <div
                className="hidden lg:block mx-auto max-w-7xl backdrop-blur-lg shadow-xl rounded-[2.5rem] px-6 py-3 no-scrollbar overflow-x-auto"
                style={{
                    backgroundColor: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)"
                }}
            >
                <div className="flex items-center justify-center gap-6">
                    <div
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full shadow-sm"
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
                        className="h-8 w-px"
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
