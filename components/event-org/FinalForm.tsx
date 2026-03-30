"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, PlusIcon, TrashIcon } from "lucide-react";
import { EventFormData } from "./validateEventform";

interface FinalFormProps {
    formData: EventFormData;
    setFormData: React.Dispatch<React.SetStateAction<EventFormData>>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    addArrayItem?: (arrayName: string, subField?: string, item?: Record<string, unknown>) => void;
    updateArrayField?: (arrayName: string, index: number, field: string, value: string) => void;
    removeArrayItem?: (arrayName: string, index: number) => void;
    formErrors: { [key: string]: string };
}

const FinalForm: React.FC<FinalFormProps> = ({
    formData,
    setFormData,
    formErrors = {},
}) => {
    const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
        requirements: true,
        postEvent: true,
    });
    const [artistsDropdownOpen, setArtistsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setArtistsDropdownOpen(false);
            }
        };

        if (artistsDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [artistsDropdownOpen]);

    const toggleSection = (section: string) => {
        setOpenSections((prev) => ({
            ...prev,
            [section]: !prev[section as keyof typeof openSections],
        }));
    };

    const handleAddStallPrice = () => {
        setFormData((prev) => ({
            ...prev,
            requirements: {
                ...prev.requirements,
                stallsPrices: [...(prev.requirements?.stallsPrices || []), { stallType: "", stallPrice: "" }],
            },
        }));
    };

    const handleRemoveStallPrice = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            requirements: {
                ...prev.requirements,
                stallsPrices: prev.requirements.stallsPrices.filter((_, i) => i !== index),
            },
        }));
    };

    const handleStallPriceChange = (index: number, field: string, value: string) => {
        setFormData((prev) => {
            const newStallsPrices = [...prev.requirements.stallsPrices];
            newStallsPrices[index] = { ...newStallsPrices[index], [field]: value };
            return {
                ...prev,
                requirements: {
                    ...prev.requirements,
                    stallsPrices: newStallsPrices,
                },
            };
        });
    };

    const handleRequirementChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const field = name.split(".")[1];
        setFormData((prev) => ({
            ...prev,
            requirements: {
                ...prev.requirements,
                [field]: value,
            },
        }));
    };

    const handlePostEventChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const field = name.split(".")[1];
        setFormData((prev) => ({
            ...prev,
            postEventFollowUp: {
                ...prev.postEventFollowUp,
                [field]: value,
            },
        }));
    };

    return (
        <div className="flex flex-col gap-8 w-full">
            {/* Requirements Section */}
            <div className="w-full bg-card rounded-2xl border border-ring p-0 shadow-none max-w-full">
                <div onClick={() => toggleSection("requirements")} className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer">
                    <h3 className="text-2xl font-medium text-upcoming-primary-700 m-0">Requirements/Planning</h3>
                    <ChevronDownIcon
                        className={`w-6 h-6 transition-transform duration-300 ${openSections.requirements ? "rotate-180" : ""}`}
                    />
                </div>

                {openSections.requirements && (
                    <div className="px-8 pb-8 max-[768px]:px-4 max-[768px]:pb-4">
                        <div className="flex flex-col gap-6 mt-4">
                            {/* Artists & Stalls Availability */}
                            <div className="flex gap-6 flex-wrap">
                                <div className="relative flex-[2_1_400px] min-w-0">
                                    <label className="absolute -top-2.5 left-3 bg-card px-1 text-xs font-medium text-gray-700 z-1">Artists / Singers / Special Guests</label>
                                    <div ref={dropdownRef} style={{ position: "relative" }}>
                                        <div
                                            className="w-full min-h-12 px-4 py-3 border border-gray-400 rounded text-sm outline-none text-gray-800 bg-background"
                                            onClick={() => setArtistsDropdownOpen((prev) => !prev)}
                                            style={{ width: "100%", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                        >
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", flex: 1, marginRight: "12px", alignItems: "center" }}>
                                                {(formData.requirements?.artists || "").split(",").filter(Boolean).length > 0
                                                    ? (formData.requirements?.artists || "").split(",").filter(Boolean).map((selectedOption) => (
                                                        <span
                                                            key={selectedOption}
                                                            className="inline-block self-start mx-4 px-4 py-1.5 rounded-full bg-upcoming-primary-700 text-white border border-upcoming-primary-700 text-sm cursor-pointer transition-all duration-200"
                                                            style={{ margin: 0, padding: "4px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const selected = (formData.requirements?.artists || "").split(",").filter(Boolean);
                                                                const newSelected = selected.filter((s) => s !== selectedOption);
                                                                handleRequirementChange({
                                                                    target: { name: "requirements.artists", value: newSelected.join(",") },
                                                                } as React.ChangeEvent<HTMLInputElement>);
                                                            }}
                                                        >
                                                            {selectedOption}
                                                            <span style={{ fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>&times;</span>
                                                        </span>
                                                    ))
                                                    : <span style={{ color: "var(--gray-500)" }}>Select requirements</span>
                                                }
                                            </div>
                                            <ChevronDownIcon style={{ width: 16, height: 16, flexShrink: 0, transition: "transform 0.2s", transform: artistsDropdownOpen ? "rotate(180deg)" : "none", color: "var(--gray-500)" }} />
                                        </div>
                                        {artistsDropdownOpen && (
                                            <div style={{
                                                position: "absolute",
                                                top: "100%",
                                                left: 0,
                                                right: 0,
                                                background: "var(--card)",
                                                border: "1px solid var(--gray-300)",
                                                borderRadius: 8,
                                                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                                                zIndex: 50,
                                                maxHeight: 220,
                                                overflowY: "auto",
                                                padding: "4px 0",
                                                marginTop: "4px"
                                            }}>
                                                {[
                                                    "Sound System Required",
                                                    "Green Room Required",
                                                    "Backstage Access",
                                                    "Personal Makeup Artist",
                                                    "Transportation Included",
                                                    "Accommodation Required",
                                                    "Special Dietary Needs",
                                                    "Security Personnel",
                                                ].map((option) => {
                                                    const selected = (formData.requirements?.artists || "").split(",").filter(Boolean);
                                                    const isChecked = selected.includes(option);
                                                    return (
                                                        <div
                                                            key={option}
                                                            className="block w-full text-left px-4 py-2.5 bg-transparent border-none text-sm text-gray-800 cursor-pointer transition-colors duration-200 hover:bg-gray-100"
                                                            onClick={() => {
                                                                const newSelected = isChecked
                                                                    ? selected.filter((s) => s !== option)
                                                                    : [...selected, option];
                                                                handleRequirementChange({
                                                                    target: { name: "requirements.artists", value: newSelected.join(",") },
                                                                } as React.ChangeEvent<HTMLInputElement>);
                                                            }}
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 8,
                                                                padding: "8px 16px",
                                                                cursor: "pointer",
                                                                fontSize: 14,
                                                                backgroundColor: isChecked ? "var(--gray-100)" : "transparent",
                                                            }}
                                                        >
                                                            {option}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {formErrors["requirements.artists"] && (
                                        <span className="text-danger-red text-xs">{formErrors["requirements.artists"]}</span>
                                    )}
                                </div>

                                <div className="relative flex-[1_1_150px] min-w-0">
                                    <label className="absolute -top-2.5 left-3 bg-card px-1 text-xs font-medium text-gray-700 z-1">Stalls Availability</label>
                                    <input
                                        type="number"
                                        name="requirements.stallsAvailability"
                                        min="0"
                                        value={formData.requirements?.stallsAvailability || ""}
                                        onChange={handleRequirementChange}
                                        className="w-full px-4 py-3 rounded-lg border border-border text-sm outline-none box-border text-gray-800 bg-background"
                                        placeholder="Enter number of stalls"
                                    />

                                    {formErrors["requirements.stallsAvailability"] && (
                                        <span className="text-danger-red text-xs">{formErrors["requirements.stallsAvailability"]}</span>
                                    )}
                                </div>
                            </div>

                            {/* Stalls Prices */}
                            <div style={{ marginTop: 8 }}>
                                <div className="flex justify-between items-center mb-4 max-[768px]:flex-col max-[768px]:items-start max-[768px]:gap-3">
                                    <label className="text-base font-medium text-foreground">Stalls</label>
                                    <button type="button" onClick={handleAddStallPrice} className="flex items-center gap-1 bg-none border-none text-revenue text-sm font-medium cursor-pointer">
                                        <PlusIcon size={16} /> Add stall
                                    </button>
                                </div>

                                {formData.requirements?.stallsPrices?.map((stall, index) => (
                                    <div key={index} className="relative flex gap-6 mb-5 items-center flex-wrap pr-10">
                                        <div className="flex-1 relative min-w-37.5">
                                            <label className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">Stall Type</label>
                                            <input
                                                className="w-full px-4 py-3 rounded-lg border border-border text-sm outline-none box-border text-gray-800 bg-background"
                                                value={stall.stallType}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                                                    handleStallPriceChange(index, "stallType", val);
                                                }}
                                                placeholder="e.g. Food, Merch"
                                            />
                                            {formErrors[`requirements.stallsPrices.${index}.stallType`] && (
                                                <span className="text-danger-red text-xs">
                                                    {formErrors[`requirements.stallsPrices.${index}.stallType`]}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1 relative min-w-25">
                                            <label className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">Stall Price</label>
                                            <input
                                                className="w-full px-4 py-3 rounded-lg border border-border text-sm outline-none box-border text-gray-800 bg-background"
                                                type="number"
                                                min="0"
                                                value={stall.stallPrice}
                                                onChange={(e) => handleStallPriceChange(index, "stallPrice", e.target.value)}
                                                placeholder="₹"
                                            />
                                            {formErrors[`requirements.stallsPrices.${index}.stallPrice`] && (
                                                <span className="text-danger-red text-xs">
                                                    {formErrors[`requirements.stallsPrices.${index}.stallPrice`]}
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveStallPrice(index)}
                                            className="absolute top-0 right-0 p-2 text-destructive bg-none border-none cursor-pointer flex items-center justify-center h-10 w-10 max-[768px]:h-12.5 max-[768px]:w-12.5"
                                            aria-label="Remove stall"
                                        >
                                            <TrashIcon className="w-5 h-5 max-[768px]:w-7 max-[768px]:h-7" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Post-Event Follow Up Section */}
            <div className="w-full bg-card rounded-2xl border border-ring p-0 shadow-none max-w-full">
                <div onClick={() => toggleSection("postEvent")} className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer">
                    <h3 className="text-2xl font-medium text-upcoming-primary-700 m-0">Post-Event Follow Up</h3>
                    <ChevronDownIcon
                        className={`w-6 h-6 transition-transform duration-300 ${openSections.postEvent ? "rotate-180" : ""}`}
                    />
                </div>

                {openSections.postEvent && (
                    <div className="px-8 pb-8 max-[768px]:px-4 max-[768px]:pb-4">
                        <div className="mt-4 relative">
                            <label className="absolute -top-2.5 left-3 bg-card px-1 text-xs font-medium text-gray-700 z-1">Feedback Request</label>
                            <textarea
                                className="w-full h-30 px-4 py-3 border border-gray-400 rounded text-sm outline-none resize-y text-gray-800 bg-background box-border max-[768px]:text-base"
                                name="postEventFollowUp.thankYouNote"
                                value={formData.postEventFollowUp?.thankYouNote || ""}
                                onChange={(e) => {
                                    handlePostEventChange(e);
                                    e.target.style.height = "auto";
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                placeholder="Write a message to send to attendees after the event..."
                                style={{ transition: "height 0.2s ease" }}
                                onFocus={(e) => {
                                    e.target.style.height = "auto";
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                    e.target.style.overflow = "hidden";
                                }}
                                onBlur={(e) => {
                                    e.target.style.height = "";
                                    e.target.style.overflow = "auto";
                                }}
                            />
                            {formErrors["postEventFollowUp.thankYouNote"] && (
                                <span className="text-danger-red text-xs">{formErrors["postEventFollowUp.thankYouNote"]}</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinalForm;
