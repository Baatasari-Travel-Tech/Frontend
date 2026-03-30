import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArtistDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    artist: {
        name: string;
        role: string;
        image: string;
        experience?: string;
        price?: number;
        description?: string;
        phone?: string;
        email?: string;
    } | null;
}

export function ArtistDetailsModal({
    isOpen,
    onClose,
    artist,
}: ArtistDetailsModalProps) {
    if (!artist) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-175 p-0 overflow-hidden bg-white gap-0 border-none shadow-2xl rounded-2xl">
                <div className="flex flex-col md:flex-row h-full">
                    {/* Left Side - Image */}
                    <div className="w-full md:w-70 bg-slate-100 relative h-75 md:h-auto shrink-0">
                        <div className="absolute inset-4 rounded-xl overflow-hidden shadow-sm">
                            <Image
                                src={artist.image}
                                alt={artist.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>

                    {/* Right Side - Content */}
                    <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                        <DialogHeader className="mb-4 text-left">
                            <DialogTitle className="text-3xl font-bold font-bricolage text-(--upcoming-primary-800) mb-1">
                                {artist.name}
                            </DialogTitle>
                            <div className="text-lg font-medium text-slate-600 font-poppins">
                                {artist.role}
                            </div>
                        </DialogHeader>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <p className="text-lg font-medium text-slate-800 font-poppins">
                                    Experience : {artist.experience || "5yr"}
                                </p>
                            </div>

                            <div className="inline-block">
                                <div className="bg-(--brand-blue) text-white px-8 py-3 rounded-full text-lg font-medium font-poppins shadow-md">
                                    Price : {artist.price || 1500}
                                </div>
                            </div>

                            <DialogDescription className="text-slate-600 text-sm leading-relaxed font-poppins">
                                {artist.description ||
                                    "I'm a singer-songwriter who's built a career on honest, diary-like lyrics, sharing my life's journey through my music. From country roots to global pop stardom, I've used my experiences with love, loss, and public life to connect with fans around the world."}
                            </DialogDescription>

                            <div className="flex gap-4 pt-2">
                                <Button variant="outline" className="flex-1 h-12 rounded-full border-2 border-slate-900 text-slate-900 font-medium text-base relative group overflow-hidden">
                                    <div className="flex items-center justify-center gap-2 w-full">
                                        <Phone className="h-5 w-5" />
                                        <span className="font-poppins">{artist.phone || "9173865514"}</span>
                                    </div>
                                </Button>
                                <Button variant="outline" className="flex-1 h-12 rounded-full border-2 border-slate-900 text-slate-900 font-medium text-base relative group overflow-hidden">
                                    <div className="flex items-center justify-center gap-2 w-full">
                                        <Mail className="h-5 w-5" />
                                        <span className="font-poppins">{artist.email || "baatasari.com"}</span>
                                    </div>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
