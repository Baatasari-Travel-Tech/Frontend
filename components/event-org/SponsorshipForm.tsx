"use client";

import React from "react";
import { ChevronDownIcon, PlusIcon, TrashIcon } from "lucide-react";
import { EventFormData } from "./validateEventform";

interface SponsorshipFormProps {
    formData: EventFormData;
    setFormData: React.Dispatch<React.SetStateAction<EventFormData>>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    openSections: { [key: string]: boolean };
    toggleSection: (section: string) => void;
    formErrors: { [key: string]: string };
}

interface SponsorItem {
    name: string;
    website: string;
}

interface SponsorsState {
    titleSponsors: SponsorItem[];
    coPartners: SponsorItem[];
    mediaPartners: SponsorItem[];
    [key: string]: SponsorItem[];
}

const SponsorshipForm: React.FC<SponsorshipFormProps> = ({
    formData,
    setFormData,
    openSections,
    toggleSection,
    formErrors = {},
}) => {
    const sponsors =
        (formData.sponsors as {
            titleSponsors: SponsorItem[];
            coPartners: SponsorItem[];
            mediaPartners: SponsorItem[];
        }) || {
            titleSponsors: [],
            coPartners: [],
            mediaPartners: [],
        };

    const handleAddSponsor = (typeId: string) => {
        setFormData((prev) => {
            const currentSponsors = (prev.sponsors as unknown as SponsorsState) || {
                titleSponsors: [],
                coPartners: [],
                mediaPartners: [],
            };

            return {
                ...prev,
                sponsors: {
                    ...currentSponsors,
                    [typeId]: [...(currentSponsors[typeId] || []), { name: "", website: "" }],
                },
            };
        });
    };

    const handleRemoveSponsor = (typeId: string, index: number) => {
        setFormData((prev) => {
            const currentSponsors = prev.sponsors as unknown as SponsorsState;
            return {
                ...prev,
                sponsors: {
                    ...currentSponsors,
                    [typeId]: (currentSponsors[typeId] || []).filter((_, i) => i !== index),
                },
            };
        });
    };

    const handleSponsorChange = (typeId: string, index: number, field: string, value: string) => {
        setFormData((prev) => {
            const currentSponsors = prev.sponsors as unknown as SponsorsState;
            const updatedList = [...(currentSponsors[typeId] || [])];
            if (updatedList[index]) updatedList[index] = { ...updatedList[index], [field]: value };

            return {
                ...prev,
                sponsors: {
                    ...currentSponsors,
                    [typeId]: updatedList,
                },
            };
        });
    };

    const updateContactInfo = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            contactInfo: {
                ...prev.contactInfo,
                [field]: value,
            },
        }));
    };

    return (
        <div className="flex flex-col gap-8 w-full">
            {/* Sponsorship Information Section */}
            <div className="w-full bg-card rounded-2xl border border-ring p-0 shadow-none max-w-full">
                <div onClick={() => toggleSection("sponsorship")} className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer">
                    <h3 className="text-2xl font-medium text-upcoming-primary-700 m-0">Sponsorship Information</h3>
                    <ChevronDownIcon
                        className={`w-6 h-6 transition-transform duration-300 ${openSections.sponsorship ? "rotate-180" : ""}`}
                    />
                </div>

                {openSections.sponsorship && (
                    <div className="px-8 pb-8 max-[768px]:px-4 max-[768px]:pb-4">
                        {/* Title Sponsors */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-base font-medium text-foreground">Title Sponsors</label>
                                <button type="button" onClick={() => handleAddSponsor("titleSponsors")} className="flex items-center gap-1 bg-none border-none text-revenue text-sm font-medium cursor-pointer">
                                    <PlusIcon size={16} /> Add
                                </button>
                            </div>

                            {sponsors.titleSponsors?.map((sponsor, index) => (
                                <div key={index} className="relative flex gap-4 mb-3 items-start flex-wrap pr-10">
                                    <div className="flex-1 min-w-50">
                                        <input
                                            type="text"
                                            placeholder="Sponsor Name"
                                            value={sponsor.name}
                                            onChange={(e) => handleSponsorChange("titleSponsors", index, "name", e.target.value)}
                                            className="w-full p-3 rounded-lg border border-border text-sm outline-none box-border text-gray-800 bg-background"
                                        />
                                        {formErrors[`sponsors.titleSponsors.${index}.name`] && (
                                            <span className="text-danger-red text-xs">{formErrors[`sponsors.titleSponsors.${index}.name`]}</span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-50">
                                        <input
                                            type="text"
                                            placeholder="Website (Optional)"
                                            value={sponsor.website}
                                            onChange={(e) => handleSponsorChange("titleSponsors", index, "website", e.target.value)}
                                            className="w-full p-3 rounded-lg border border-border text-sm outline-none box-border text-gray-800 bg-background"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSponsor("titleSponsors", index)}
                                        className="absolute top-0 right-0 p-2 text-destructive bg-none border-none cursor-pointer flex items-center justify-center h-10 w-10 max-[768px]:h-12.5 max-[768px]:w-12.5"
                                        aria-label="Remove title sponsor"
                                    >
                                        <TrashIcon className="w-5 h-5 max-[768px]:w-7 max-[768px]:h-7" />
                                    </button>
                                </div>
                            ))}

                            {sponsors.titleSponsors?.length === 0 && <p className="text-sm text-gray-500 italic m-0">No title sponsors added.</p>}
                        </div>

                        {/* Co-Partners */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-base font-medium text-foreground">Co-Partners</label>
                                <button type="button" onClick={() => handleAddSponsor("coPartners")} className="flex items-center gap-1 bg-none border-none text-revenue text-sm font-medium cursor-pointer">
                                    <PlusIcon size={16} /> Add
                                </button>
                            </div>

                            {sponsors.coPartners?.map((sponsor, index) => (
                                <div key={index} className="relative flex gap-4 mb-3 items-start flex-wrap pr-10">
                                    <div className="flex-1 min-w-50">
                                        <input
                                            type="text"
                                            placeholder="Sponsor Name"
                                            value={sponsor.name}
                                            onChange={(e) => handleSponsorChange("coPartners", index, "name", e.target.value)}
                                            className="w-full p-3 rounded-lg border border-border text-sm outline-none box-border text-gray-800 bg-background"
                                        />
                                        {formErrors[`sponsors.coPartners.${index}.name`] && (
                                            <span className="text-danger-red text-xs">{formErrors[`sponsors.coPartners.${index}.name`]}</span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-50">
                                        <input
                                            type="text"
                                            placeholder="Website (Optional)"
                                            value={sponsor.website}
                                            onChange={(e) => handleSponsorChange("coPartners", index, "website", e.target.value)}
                                            className="w-full p-3 rounded-lg border border-border text-sm outline-none box-border text-gray-800 bg-background"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSponsor("coPartners", index)}
                                        className="absolute top-0 right-0 p-2 text-destructive bg-none border-none cursor-pointer flex items-center justify-center h-10 w-10 max-[768px]:h-12.5 max-[768px]:w-12.5"
                                        aria-label="Remove co-partner"
                                    >
                                        <TrashIcon className="w-5 h-5 max-[768px]:w-7 max-[768px]:h-7" />
                                    </button>
                                </div>
                            ))}

                            {sponsors.coPartners?.length === 0 && <p className="text-sm text-gray-500 italic m-0">No co-partners added.</p>}
                        </div>

                        {/* Media Partners */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-base font-medium text-foreground">Media Partners</label>
                                <button type="button" onClick={() => handleAddSponsor("mediaPartners")} className="flex items-center gap-1 bg-none border-none text-revenue text-sm font-medium cursor-pointer">
                                    <PlusIcon size={16} /> Add
                                </button>
                            </div>

                            {sponsors.mediaPartners?.map((sponsor, index) => (
                                <div key={index} className="relative flex gap-4 mb-3 items-start flex-wrap pr-10">
                                    <div className="flex-1 min-w-50">
                                        <input
                                            type="text"
                                            placeholder="Sponsor Name"
                                            value={sponsor.name}
                                            onChange={(e) => handleSponsorChange("mediaPartners", index, "name", e.target.value)}
                                            className="w-full p-3 rounded-lg border border-border text-sm outline-none box-border text-gray-800 bg-background"
                                        />
                                        {formErrors[`sponsors.mediaPartners.${index}.name`] && (
                                            <span className="text-danger-red text-xs">{formErrors[`sponsors.mediaPartners.${index}.name`]}</span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-50">
                                        <input
                                            type="text"
                                            placeholder="Website (Optional)"
                                            value={sponsor.website}
                                            onChange={(e) => handleSponsorChange("mediaPartners", index, "website", e.target.value)}
                                            className="w-full p-3 rounded-lg border border-border text-sm outline-none box-border text-gray-800 bg-background"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSponsor("mediaPartners", index)}
                                        className="absolute top-0 right-0 p-2 text-destructive bg-none border-none cursor-pointer flex items-center justify-center h-10 w-10 max-[768px]:h-12.5 max-[768px]:w-12.5"
                                        aria-label="Remove media partner"
                                    >
                                        <TrashIcon className="w-5 h-5 max-[768px]:w-7 max-[768px]:h-7" />
                                    </button>
                                </div>
                            ))}

                            {sponsors.mediaPartners?.length === 0 && <p className="text-sm text-gray-500 italic m-0">No media partners added.</p>}
                        </div>
                    </div>
                )}
            </div>

            {/* Contact Information Section */}
            <div className="w-full bg-card rounded-2xl border border-ring p-0 shadow-none max-w-full">
                <div onClick={() => toggleSection("contactInfo")} className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer">
                    <h3 className="text-2xl font-medium text-upcoming-primary-700 m-0">Contact Information</h3>
                    <ChevronDownIcon
                        className={`w-6 h-6 transition-transform duration-300 ${openSections.contactInfo ? "rotate-180" : ""}`}
                    />
                </div>

                {openSections.contactInfo && (
                    <div className="px-8 pb-8 max-[768px]:px-4 max-[768px]:pb-4">
                        <div className="grid gap-6 mt-4">
                            {/* Mobile + Email */}
                            <div className="flex gap-6 flex-wrap w-full">
                                <div className="flex-[1_1_250px] relative min-w-62.5">
                                    <label className="absolute -top-2.5 left-3 bg-card px-1 text-xs font-medium text-gray-700 z-1">Mobile Number</label>
                                    <input
                                        type="tel"
                                        value={formData.contactInfo.mobile || "+91 "}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            let inputWithoutPrefix = val.startsWith("+91 ") ? val.slice(4) : val;

                                            if (!val.startsWith("+91 ")) {
                                                inputWithoutPrefix = val.replace(/^\+91\s?/, "").replace(/[^0-9]/g, "");
                                            }

                                            if (/^\d*$/.test(inputWithoutPrefix) && inputWithoutPrefix.length <= 10) {
                                                updateContactInfo("mobile", "+91 " + inputWithoutPrefix);
                                            }
                                        }}
                                        className="w-full px-4 py-3 border border-gray-400 rounded text-sm outline-none text-gray-800 bg-background box-border max-[768px]:text-base"
                                        placeholder="Enter mobile number"
                                    />
                                    {formErrors["contactInfo.mobile"] && (
                                        <span className="text-danger-red text-xs absolute -bottom-5 left-0">{formErrors["contactInfo.mobile"]}</span>
                                    )}
                                </div>

                                <div className="flex-[1_1_250px] relative min-w-62.5">
                                    <label className="absolute -top-2.5 left-3 bg-card px-1 text-xs font-medium text-gray-700 z-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.contactInfo.email}
                                        onChange={(e) => updateContactInfo("email", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-400 rounded text-sm outline-none text-gray-800 bg-background box-border max-[768px]:text-base"
                                        placeholder="example@email.com"
                                    />
                                    {formErrors["contactInfo.email"] && (
                                        <span className="text-danger-red text-xs absolute -bottom-5 left-0">{formErrors["contactInfo.email"]}</span>
                                    )}
                                </div>
                            </div>

                            {/* Website */}
                            <div className="relative mt-3">
                                <label className="absolute -top-2.5 left-3 bg-card px-1 text-xs font-medium text-gray-700 z-1">Website</label>
                                <input
                                    type="url"
                                    value={formData.contactInfo.website}
                                    onChange={(e) => updateContactInfo("website", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-400 rounded text-sm outline-none text-gray-800 bg-background box-border max-[768px]:text-base"
                                    placeholder="https://www.example.com"
                                />
                            </div>

                            {/* Additional Links */}
                            <div className="relative mt-2">
                                <label className="absolute -top-2.5 left-3 bg-card px-1 text-xs font-medium text-gray-700 z-1">Additional Links</label>
                                <input
                                    type="text"
                                    value={formData.contactInfo.additionalLinks}
                                    onChange={(e) => updateContactInfo("additionalLinks", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-400 rounded text-sm outline-none text-gray-800 bg-background box-border max-[768px]:text-base"
                                    placeholder="Social media, portfolio, etc."
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SponsorshipForm;
