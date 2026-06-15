"use client";

import Image from "next/image";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Phone, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArtistCardProps {
    name: string;
    role: string;
    image: string;
    experience?: string;
    price?: number;
    description?: string;
    phone?: string;
    email?: string;
}

export function ArtistCard({
    name,
    role,
    image,
    experience = "5yr",
    price = 1500,
    description,
    phone = "9173865514",
    email = "baatasari.com",
}: ArtistCardProps) {
    const [showDetail, setShowDetail] = useState(false);

    return (
        <>
            {/* Simplified Card — just image + name + role */}
            <Card
                className="bg-background border border-gray-100 rounded-2xl shadow-sm transition-shadow h-full flex flex-col cursor-pointer overflow-hidden"
                onClick={() => setShowDetail(true)}
            >
                <div className="relative aspect-3/4 w-full bg-slate-100 rounded-t-2xl overflow-hidden">
                    <Image
                        src={image || "/placeholder.svg"}
                        alt={name}
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="p-4">
                    <h4 className="text-base font-bold font-bricolage text-(--upcoming-primary-800) leading-tight">
                        {name}
                    </h4>
                    <p className="text-sm font-medium font-poppins text-gray-500 mt-0.5">
                        {role}
                    </p>
                </div>
            </Card>

            {/* Detail Modal Overlay */}
            {showDetail && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 transition-all"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowDetail(false);
                    }}
                >
                    <div className="bg-background rounded-2xl shadow-2xl w-full max-w-110 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
                        {/* Close button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full bg-background/80"
                            onClick={() => setShowDetail(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        {/* Top section: Image + Name/Role/Experience/Price */}
                        <div className="p-6 pb-4 flex items-start gap-5">
                            <div className="relative w-28 h-28 rounded-xl overflow-hidden shrink-0">
                                <Image
                                    src={image || "/placeholder.svg"}
                                    alt={name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex flex-col gap-2 pt-1">
                                <h3 className="text-2xl font-bold font-bricolage text-(--upcoming-primary-800)">
                                    {name}
                                </h3>
                                <p className="text-base font-medium font-poppins text-gray-500">
                                    {role}
                                </p>
                                <p className="text-sm font-poppins text-gray-700">
                                    Experience : {experience}
                                </p>
                                <span className="inline-flex items-center justify-center border-2 border-gray-800 rounded-full px-5 py-1.5 text-sm font-semibold font-poppins text-gray-900 w-fit">
                                    Price : {price}
                                </span>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="px-6 pb-5">
                            <p className="text-sm text-gray-600 leading-relaxed font-poppins">
                                {description || "A talented artist ready to make your event special."}
                            </p>
                        </div>

                        {/* Contact buttons */}
                        <div className="px-6 pb-6 flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 h-12 rounded-full border-2 border-gray-800 text-gray-900 font-semibold text-sm"
                                asChild
                            >
                                <a href={`tel:${phone}`}>
                                    <Phone className="h-4 w-4 mr-2" />
                                    {phone}
                                </a>
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 h-12 rounded-full border-2 border-gray-800 text-gray-900 font-semibold text-sm"
                                asChild
                            >
                                <a href={`mailto:${email}`}>
                                    <Mail className="h-4 w-4 mr-2" />
                                    {email}
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
