"use client";

import React, { useCallback, useRef } from "react";
import { ChevronDownIcon, PlusIcon, TrashIcon, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { EventFormData, ADD_ON_OPTIONS, TARGET_AUDIENCE_OPTIONS } from "./data/create-event-data";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TicketingFormProps {
    formData: EventFormData;
    setFormData: React.Dispatch<React.SetStateAction<EventFormData>>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; // kept for compatibility, not used (same as your file)
    addArrayItem: (arrayName: string) => void;
    updateArrayField: (arrayName: string, index: number, field: string, value: string) => void;
    removeArrayItem: (arrayName: string, index: number) => void;
    openSections: { [key: string]: boolean };
    toggleSection: (section: string) => void;
    formErrors: { [key: string]: string };
}

function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(val, max));
}

const minGap = 10;

interface DualThumbSliderProps {
    min: number;
    max: number;
    valueMin: number;
    valueMax: number;
    onChange: (values: { min: number; max: number }) => void;
}

const DualThumbSlider: React.FC<DualThumbSliderProps> = ({ min = 0, max = 100, valueMin, valueMax, onChange }) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const percent = (v: number) => ((v - min) / (max - min)) * 100;

    const startDrag = (thumb: "min" | "max") => () => {
        const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
            const clientX = "touches" in moveEvent ? moveEvent.touches[0]?.clientX : moveEvent.clientX;
            if (!clientX || !trackRef.current) return;

            const rect = trackRef.current.getBoundingClientRect();
            const percentVal = clamp((clientX - rect.left) / rect.width, 0, 1);
            let value = Math.round(percentVal * (max - min) + min);

            if (thumb === "min") {
                value = clamp(value, min, valueMax - minGap);
                onChange({ min: value, max: valueMax });
            } else {
                value = clamp(value, valueMin + minGap, max);
                onChange({ min: valueMin, max: value });
            }
        };

        const stopHandler = () => {
            document.removeEventListener("mousemove", moveHandler);
            document.removeEventListener("touchmove", moveHandler);
            document.removeEventListener("mouseup", stopHandler);
            document.removeEventListener("touchend", stopHandler);
        };

        document.addEventListener("mousemove", moveHandler);
        document.addEventListener("touchmove", moveHandler);
        document.addEventListener("mouseup", stopHandler);
        document.addEventListener("touchend", stopHandler);
    };

    const minLeft = `calc(${percent(valueMin)}% - 10px)`;
    const maxLeft = `calc(${percent(valueMax)}% - 10px)`;

    return (
        <div className="relative h-10 my-5">
            <div ref={trackRef} className="absolute top-4.5 left-0 right-0 h-1.5 bg-gray-300 rounded-[3px] z-1" />

            <div
                className="absolute top-4.5 h-1.5 rounded-[3px] z-2 transition-all duration-100"
                style={{
                    left: percent(valueMin) + "%",
                    width: percent(valueMax) - percent(valueMin) + "%",
                    background: "linear-gradient(90deg, var(--royal-blue) 0%, var(--revenue-color) 100%)",
                }}
            />

            {/* Min Thumb */}
            <div
                className="absolute top-3.5 w-5 h-5 bg-card rounded-full cursor-grab shadow-[0_2px_6px_rgb(0_0_0/0.2)] z-3 transition-all duration-200 border-[3px] border-royal-blue"
                style={{ left: minLeft }}
                onMouseDown={startDrag("min")}
                onTouchStart={startDrag("min")}
                tabIndex={0}
                aria-label="Minimum value"
                role="slider"
                aria-valuenow={valueMin}
                aria-valuemin={min}
                aria-valuemax={valueMax - minGap}
            />

            {/* Max Thumb */}
            <div
                className="absolute top-3.5 w-5 h-5 bg-card rounded-full cursor-grab shadow-[0_2px_6px_rgb(0_0_0/0.2)] z-3 transition-all duration-200 border-[3px] border-revenue"
                style={{ left: maxLeft }}
                onMouseDown={startDrag("max")}
                onTouchStart={startDrag("max")}
                tabIndex={0}
                aria-label="Maximum value"
                role="slider"
                aria-valuenow={valueMax}
                aria-valuemin={valueMin + minGap}
                aria-valuemax={max}
            />


            {/* Scale underneath */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: -22,
                    fontSize: 11,
                    color: "#888",
                    userSelect: "none",
                }}
            >
                {[0, 20, 40, 60, 80, 100].map((v) => (
                    <span key={v}>{v}</span>
                ))}
            </div>
        </div>
    );
};

const TicketingForm: React.FC<TicketingFormProps> = ({
    formData,
    setFormData,
    addArrayItem,
    updateArrayField,
    removeArrayItem,
    openSections = {},
    toggleSection,
    formErrors = {},
}) => {
    // your local handleInputChange (keeps your "no debounce" behavior)
    const localHandleInputChange = useCallback(
        (name: string, value: string | number | boolean) => {
            setFormData((prev) => {
                const newFormData = { ...prev };
                const nameParts = name.split(".");
                let current = newFormData as unknown as Record<string, unknown>;

                for (let i = 0; i < nameParts.length - 1; i++) {
                    if (!current[nameParts[i]]) current[nameParts[i]] = {};
                    current = current[nameParts[i]] as Record<string, unknown>;
                }

                current[nameParts[nameParts.length - 1]] = value;
                return newFormData;
            });
        },
        [setFormData]
    );

    const handleAudienceSelection = useCallback(
        (audience: string) => {
            setFormData((prev) => ({
                ...prev,
                targetAudience: {
                    ...prev.targetAudience,
                    [audience]: !prev.targetAudience[audience],
                },
            }));
        },
        [setFormData]
    );

    const handleEnableOffersToggle = useCallback(() => {
        setFormData((prev) => ({
            ...prev,
            enableOffers: !prev.enableOffers,
            ...(prev.enableOffers ? { ticketName: "", ticketQuantity: "", discountType: "", discountAmount: "", discountCode: "" } : {}),
        }));
    }, [setFormData]);

    const handleTicketTypeChange = useCallback(
        (type: string) => {
            setFormData((prev) => ({
                ...prev,
                ticketType: type,
                ...(type === "free" ? { audienceCategory: [{ category: "", numberOfTickets: "", price: "", description: "" }], refundPolicy: "" } : {}),
            }));
        },
        [setFormData]
    );

    const handleAddOnChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; checked: boolean } }) => {
            const { name, checked } = e.target;
            const addOnId = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                addOns: { ...prev.addOns, [addOnId]: checked },
            }));
        },
        [setFormData]
    );

    const addOnOptions = ADD_ON_OPTIONS;
    const audienceTypes = TARGET_AUDIENCE_OPTIONS;
    const audienceCategory = formData.audienceCategory || [{ category: "", price: "", description: "" }];

    return (
        <div className="w-full">
            {/* Ticketing Section */}
            <div className="w-full bg-card rounded-2xl border border-ring p-0 mb-8 shadow-none max-w-full">
                <div
                    onClick={() => toggleSection("ticketing")}
                    onKeyDown={(e) => e.key === "Enter" && toggleSection("ticketing")}
                    className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer"
                    role="button"
                    tabIndex={0}
                    aria-expanded={openSections.ticketing}
                    aria-controls="ticketing-section"
                >
                    <h3 className="text-2xl font-medium text-upcoming-primary-700 m-0">Ticketing</h3>
                    <span>
                        <ChevronDownIcon className="w-6 h-6" />
                    </span>
                </div>

                <div className="overflow-hidden transition-[max-height] duration-500 ease-in-out" style={{ maxHeight: openSections.ticketing ? "2000px" : "0" }}>
                    <div className="px-8 pb-8 max-[768px]:px-2! max-[768px]:pb-4! min-[1200px]:px-8! min-[1200px]:pb-8!">
                        <div className="flex flex-col gap-4 mt-4" style={{ marginTop: "2rem" }}>
                            {/* Paid/Free Toggle */}
                            <div className="flex items-center justify-center mb-2 mt-1">
                                <div className="flex relative w-55 h-11 bg-gray-100 rounded-full border border-gray-200 overflow-hidden mx-auto">
                                    <div
                                        className="absolute top-0 w-1/2 h-full bg-blue-soft rounded-full transition-[left] duration-300 ease-in-out z-1"
                                        style={{ left: formData.ticketType === "paid" ? 0 : "50%" }}
                                    />
                                    <button
                                        type="button"
                                        className={`flex-1 p-3 border-none bg-transparent text-sm font-medium cursor-pointer z-2 transition-colors duration-200 ${formData.ticketType === "paid" ? "text-background" : "text-gray-700"
                                            }`}
                                        onClick={() => handleTicketTypeChange("paid")}
                                        aria-pressed={formData.ticketType === "paid"}
                                        tabIndex={0}
                                    >
                                        Paid
                                    </button>
                                    <button
                                        type="button"
                                        className={`flex-1 p-3 border-none bg-transparent text-sm font-medium cursor-pointer z-2 transition-colors duration-200 ${formData.ticketType === "free" ? "text-background" : "text-gray-700"
                                            }`}
                                        onClick={() => handleTicketTypeChange("free")}
                                        aria-pressed={formData.ticketType === "free"}
                                        tabIndex={0}
                                    >
                                        Free
                                    </button>
                                </div>
                            </div>

                            {formErrors.ticketType && <span className="text-danger-red text-xs">{formErrors.ticketType}</span>}

                            {/* Audience Category Fields */}
                            {formData.ticketType === "paid" && (
                                <>
                                    {audienceCategory.map((type, index) => (
                                        <div key={index} className="flex flex-col gap-4 relative pr-10">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-base font-medium text-foreground m-0">Category {index + 1}</h3>

                                                {audienceCategory.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeArrayItem("audienceCategory", index)}
                                                        className="absolute top-0 right-0 p-2 text-destructive bg-none border-none cursor-pointer flex items-center justify-center h-10 w-10 max-[768px]:h-12.5 max-[768px]:w-12.5"
                                                        aria-label={`Remove audience category ${index + 1}`}
                                                    >
                                                        <TrashIcon className="w-5 h-5 max-[768px]:w-7 max-[768px]:h-7" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex gap-4 flex-wrap w-full">
                                                <div className="relative flex-1 min-w-50">
                                                    <label htmlFor={`category-${index}`} className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                                                        Audience Category
                                                    </label>
                                                    <input
                                                        id={`category-${index}`}
                                                        type="text"
                                                        name={`audienceCategory.${index}.category`}
                                                        value={type.category || ""}
                                                        onChange={(e) => updateArrayField("audienceCategory", index, "category", e.target.value)}
                                                        className="w-full h-12 px-4 py-3 border border-gray-400 rounded-md text-sm text-gray-800 bg-background transition-[border-color,box-shadow] duration-300 outline-none box-border"
                                                        placeholder="Ex: Gold Pass"
                                                    />
                                                    {formErrors[`audienceCategory.${index}.category`] && (
                                                        <span className="text-danger-red text-xs">{formErrors[`audienceCategory.${index}.category`]}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-4 flex-wrap w-full">
                                                <div className="relative flex-1 min-w-50">
                                                    <label htmlFor={`numberOfTickets-${index}`} className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                                                        Number of Tickets
                                                    </label>
                                                    <input
                                                        id={`numberOfTickets-${index}`}
                                                        type="number"
                                                        min="1"
                                                        name={`audienceCategory.${index}.numberOfTickets`}
                                                        value={type.numberOfTickets || ""}
                                                        onChange={(e) => updateArrayField("audienceCategory", index, "numberOfTickets", e.target.value)}
                                                        className="w-full h-12 px-4 py-3 border border-gray-400 rounded-md text-sm text-gray-800 bg-background transition-[border-color,box-shadow] duration-300 outline-none box-border"
                                                        placeholder="Ex: 100"
                                                    />
                                                    {formErrors[`audienceCategory.${index}.numberOfTickets`] && (
                                                        <span className="text-danger-red text-xs">{formErrors[`audienceCategory.${index}.numberOfTickets`]}</span>
                                                    )}
                                                </div>

                                                <div className="relative flex-1 min-w-50">
                                                    <label htmlFor={`price-${index}`} className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                                                        Price
                                                    </label>
                                                    <input
                                                        id={`price-${index}`}
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        name={`audienceCategory.${index}.price`}
                                                        value={type.price || ""}
                                                        onChange={(e) => updateArrayField("audienceCategory", index, "price", e.target.value)}
                                                        className="w-full h-12 px-4 py-3 border border-gray-400 rounded-md text-sm text-gray-800 bg-background transition-[border-color,box-shadow] duration-300 outline-none box-border"
                                                        placeholder="₹"
                                                    />
                                                    {formErrors[`audienceCategory.${index}.price`] && (
                                                        <span className="text-danger-red text-xs">{formErrors[`audienceCategory.${index}.price`]}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="relative w-full">
                                                <label htmlFor={`description-${index}`} className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                                                    Description
                                                </label>
                                                <textarea
                                                    id={`description-${index}`}
                                                    name={`audienceCategory.${index}.description`}
                                                    value={type.description || ""}
                                                    onChange={(e) => {
                                                        updateArrayField("audienceCategory", index, "description", e.target.value);
                                                        e.target.style.height = "auto";
                                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                                    }}
                                                    className="w-full h-30 px-4 py-3 border border-gray-400 rounded-md text-sm text-gray-800 bg-background resize-y transition-[border-color,box-shadow] duration-200 outline-none box-border"
                                                    placeholder="Describe the ticket"
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
                                                {formErrors[`audienceCategory.${index}.description`] && (
                                                    <span className="text-danger-red text-xs">{formErrors[`audienceCategory.${index}.description`]}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex justify-end mt-2">
                                        <button type="button" onClick={() => addArrayItem("audienceCategory")} className="flex items-center gap-1 bg-none border-none text-revenue text-sm font-medium cursor-pointer">
                                            <PlusIcon size={16} /> Add Category
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-4 mt-4">
                                        <h3 className="text-base font-medium text-foreground m-0">Refund Policy</h3>
                                        <div className="relative w-full">
                                            <label htmlFor="refundPolicy" className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                                                Refund Policy <span style={{ color: "red" }}>*</span>
                                            </label>
                                            <textarea
                                                id="refundPolicy"
                                                name="refundPolicy"
                                                value={formData.refundPolicy || ""}
                                                onChange={(e) => {
                                                    localHandleInputChange(e.target.name, e.target.value);
                                                    e.target.style.height = "auto";
                                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                                }}
                                                className={cn(
                                                    "w-full h-30 px-4 py-3 border border-gray-400 rounded-md text-sm text-gray-800 bg-background resize-y transition-[border-color,box-shadow] duration-200 outline-none box-border",
                                                    formErrors.refundPolicy ? "border-destructive!" : ""
                                                )}
                                                placeholder="Mention if tickets are refundable and under what conditions"
                                                aria-describedby="refundPolicy-error"
                                                aria-invalid={!formData.refundPolicy}
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
                                            {formErrors.refundPolicy && <span className="text-danger-red text-xs">{formErrors.refundPolicy}</span>}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Guidelines/Rules Section */}
            <div className="w-full bg-card rounded-2xl border border-ring p-0 mb-8 shadow-none max-w-full">
                <div
                    onClick={() => toggleSection("guidelines")}
                    onKeyDown={(e) => e.key === "Enter" && toggleSection("guidelines")}
                    className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer"
                    role="button"
                    tabIndex={0}
                    aria-expanded={openSections.guidelines}
                    aria-controls="guidelines-section"
                >
                    <h3 className="text-2xl font-medium text-upcoming-primary-700 m-0">Guidelines/Rules</h3>
                    <span>
                        <ChevronDownIcon className="w-6 h-6" />
                    </span>
                </div>

                <div className="overflow-hidden transition-[max-height] duration-500 ease-in-out" style={{ maxHeight: openSections.guidelines ? "1000px" : "0" }}>
                    <div className="px-8 pb-8 max-[768px]:px-2! max-[768px]:pb-4! min-[1200px]:px-8! min-[1200px]:pb-8!">
                        <div className="relative w-full" style={{ marginTop: 16 }}>
                            <label htmlFor="guidelines" className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                                Guidelines
                            </label>
                            <textarea
                                id="guidelines"
                                name="guidelines"
                                value={formData.guidelines || ""}
                                onChange={(e) => {
                                    localHandleInputChange(e.target.name, e.target.value);
                                    e.target.style.height = "auto";
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                className="w-full h-30 px-4 py-3 border border-gray-400 rounded-md text-sm text-gray-800 bg-background resize-y transition-[border-color,box-shadow] duration-200 outline-none box-border"
                                placeholder="Enter The Guidelines"
                                aria-describedby="guidelines-error"
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
                            {formErrors.guidelines && <span className="text-danger-red text-xs">{formErrors.guidelines}</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add-Ons Section */}
            {formData.ticketType === "paid" && (
                <div className="w-full bg-card rounded-2xl border border-ring p-0 mb-8 shadow-none max-w-full">
                    <div
                        onClick={() => toggleSection("addOns")}
                        onKeyDown={(e) => e.key === "Enter" && toggleSection("addOns")}
                        className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer"
                        role="button"
                        tabIndex={0}
                        aria-expanded={openSections.addOns}
                        aria-controls="addOns-section"
                    >
                        <h3 className="text-2xl font-medium text-upcoming-primary-700 m-0">Add-Ons</h3>
                        <span>
                            <ChevronDownIcon className="w-6 h-6" />
                        </span>
                    </div>

                    <div className="overflow-hidden transition-[max-height] duration-500 ease-in-out" style={{ maxHeight: openSections.addOns ? "100%" : "0" }}>
                        <div className="px-8 pb-8 max-[768px]:px-2! max-[768px]:pb-4! min-[1200px]:px-8! min-[1200px]:pb-8!">
                            <div className="flex flex-col gap-4 mt-4">
                                <div className="flex flex-wrap gap-3 w-full">
                                    {addOnOptions.map((option) => {
                                        const active = !!formData.addOns?.[option.id];
                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => handleAddOnChange({ target: { name: `addOns.${option.id}`, checked: !active } })}
                                                className={`px-4 py-2 rounded-full text-xs text-foreground cursor-pointer transition-all duration-200 font-medium border border-gray-200 bg-gray-100 ${active ? "bg-blue-soft border-blue-soft text-background" : ""
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {addOnOptions
                                    .filter((option) => !!formData.addOns?.[option.id])
                                    .map((option) => (
                                        <div key={option.id} className="relative w-full">
                                            <label htmlFor={`${option.id}Description`} className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                                                {option.label}
                                            </label>
                                            <textarea
                                                id={`${option.id}Description`}
                                                name={`addOns.${option.id}Description`}
                                                value={(formData.addOns as Record<string, string | boolean | undefined>)[`${option.id}Description`] as string || ""}
                                                onChange={(e) => {
                                                    localHandleInputChange(e.target.name, e.target.value);
                                                    e.target.style.height = "auto";
                                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                                }}
                                                className="w-full h-30 px-4 py-3 border border-gray-400 rounded-md text-sm text-gray-800 bg-background resize-y transition-[border-color,box-shadow] duration-200 outline-none box-border"
                                                placeholder={`Describe the ${option.label.toLowerCase()} details`}
                                                style={{ transition: "height 0.2s ease", minHeight: "60px", height: "60px" }}
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
                                            {formErrors[`addOns.${option.id}Description`] && (
                                                <span className="text-danger-red text-xs">{formErrors[`addOns.${option.id}Description`]}</span>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Discounts/Offers Section */}
            {formData.ticketType === "paid" && (
                <div className="w-full bg-card rounded-2xl border border-ring p-0 mb-8 shadow-none max-w-full">
                    <div
                        onClick={() => toggleSection("discounts")}
                        onKeyDown={(e) => e.key === "Enter" && toggleSection("discounts")}
                        className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer"
                        role="button"
                        tabIndex={0}
                        aria-expanded={openSections.discounts}
                        aria-controls="discounts-section"
                    >
                        <h3 className="text-2xl font-medium text-upcoming-primary-700 m-0">Discounts/Offers</h3>
                        <span>
                            <ChevronDownIcon className="w-6 h-6" />
                        </span>
                    </div>

                    <div className="overflow-hidden transition-[max-height] duration-500 ease-in-out" style={{ maxHeight: openSections.discounts ? "1000px" : "0" }}>
                        <div className="px-8 pb-8 max-[768px]:px-2! max-[768px]:pb-4! min-[1200px]:px-8! min-[1200px]:pb-8!">
                            <div className="flex flex-col gap-4 mt-4">
                                <div className="flex gap-4 items-center flex-wrap w-full">
                                    <div className="relative flex-[1_1_200px] min-w-45">
                                        <label htmlFor="ticketName" className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                                            Ticket Name
                                        </label>
                                        <input
                                            id="ticketName"
                                            name="ticketName"
                                            value={formData.ticketName || ""}
                                            onChange={(e) => localHandleInputChange(e.target.name, e.target.value)}
                                            className="w-full h-10 px-4 py-2 border border-gray-400 rounded-md text-sm text-gray-800 bg-background transition-[border-color,box-shadow] duration-200 outline-none box-border"
                                            placeholder="Enter ticket name"
                                        />
                                        {formErrors.ticketName && <span className="text-danger-red text-xs">{formErrors.ticketName}</span>}
                                    </div>

                                    <div className="relative flex-[1_1_200px] min-w-45">
                                        <label htmlFor="ticketQuantity" className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                                            Ticket Quantity
                                        </label>
                                        <input
                                            id="ticketQuantity"
                                            name="ticketQuantity"
                                            type="number"
                                            min="1"
                                            value={formData.ticketQuantity || ""}
                                            onChange={(e) => localHandleInputChange(e.target.name, e.target.value)}
                                            className="w-full h-10 px-4 py-2 border border-gray-400 rounded-md text-sm text-gray-800 bg-background transition-[border-color,box-shadow] duration-200 outline-none box-border"
                                            placeholder="Enter quantity"
                                        />
                                        {formErrors.ticketQuantity && <span className="text-danger-red text-xs">{formErrors.ticketQuantity}</span>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-medium text-gray-700" htmlFor="enableOffers">
                                        Enable Offers
                                    </label>
                                    <div
                                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${formData.enableOffers ? "bg-blue-soft" : "bg-gray-300"}`}
                                        onClick={handleEnableOffersToggle}
                                        onKeyDown={(e) => e.key === "Enter" && handleEnableOffersToggle()}
                                        role="switch"
                                        tabIndex={0}
                                        aria-checked={formData.enableOffers}
                                    >
                                        <div className={`w-4.5 h-4.5 rounded-full bg-card absolute top-0.75 transition-[left] duration-300 ${formData.enableOffers ? "left-6.75" : "left-0.75"}`} />
                                    </div>
                                </div>

                                {formData.enableOffers && (
                                    <div className="flex flex-col gap-4 mt-4">
                                        <div className="flex flex-row flex-wrap gap-3" style={{ display: "flex", gap: 24, alignItems: "center" }}>
                                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
                                                <input
                                                    type="radio"
                                                    name="discountType"
                                                    value="flat"
                                                    checked={formData.discountType === "flat"}
                                                    onChange={() => setFormData((prev) => ({ ...prev, discountType: "flat" }))}
                                                    style={{ accentColor: "var(--upcoming-primary-700)" }}
                                                />
                                                Flat discount
                                            </label>

                                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
                                                <input
                                                    type="radio"
                                                    name="discountType"
                                                    value="percentage"
                                                    checked={formData.discountType === "percentage"}
                                                    onChange={() => setFormData((prev) => ({ ...prev, discountType: "percentage" }))}
                                                    style={{ accentColor: "var(--upcoming-primary-700)" }}
                                                />
                                                Percentage
                                            </label>
                                        </div>

                                        <div className="flex gap-4 flex-wrap w-full">
                                            <div className="relative flex-[1_1_150px] min-w-30">
                                                <label htmlFor="discountAmount" className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                                                    Discount Amount
                                                </label>
                                                <input
                                                    id="discountAmount"
                                                    name="discountAmount"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={formData.discountAmount || ""}
                                                    onChange={(e) => localHandleInputChange(e.target.name, e.target.value)}
                                                    className="w-full h-10 px-4 py-2 border border-gray-400 rounded-md text-sm text-gray-800 bg-background transition-[border-color,box-shadow] duration-200 outline-none box-border"
                                                    placeholder="Amount"
                                                />
                                                {formErrors.discountAmount && <span className="text-danger-red text-xs">{formErrors.discountAmount}</span>}
                                            </div>

                                            <div className="relative flex-[1_1_200px] min-w-45">
                                                <label htmlFor="discountCode" className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                                                    Discount Code
                                                </label>
                                                <input
                                                    id="discountCode"
                                                    name="discountCode"
                                                    type="text"
                                                    value={formData.discountCode || ""}
                                                    onChange={(e) => localHandleInputChange(e.target.name, e.target.value)}
                                                    className="w-full h-10 px-4 py-2 border border-gray-400 rounded-md text-sm text-gray-800 bg-background transition-[border-color,box-shadow] duration-200 outline-none box-border"
                                                    placeholder="Enter code"
                                                />
                                                {formErrors.discountCode && <span className="text-danger-red text-xs">{formErrors.discountCode}</span>}
                                            </div>
                                        </div>

                                        {formData.discountType === "percentage" && (
                                            <>
                                                <div className="relative w-full">
                                                    <label htmlFor="couponCode" className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                                                        Discount Coupon Code
                                                    </label>
                                                    <input
                                                        id="couponCode"
                                                        name="couponCode"
                                                        type="text"
                                                        value={formData.couponCode || ""}
                                                        onChange={(e) => localHandleInputChange(e.target.name, e.target.value)}
                                                        className="w-full h-10 px-4 py-2 border border-gray-400 rounded-md text-sm text-gray-800 bg-background transition-[border-color,box-shadow] duration-200 outline-none box-border"
                                                        placeholder="Enter coupon code"
                                                    />
                                                    {formErrors.couponCode && <span className="text-danger-red text-xs">{formErrors.couponCode}</span>}
                                                </div>

                                                <div className="flex gap-4 flex-wrap w-full">
                                                    <div className="relative flex-[1_1_200px] min-w-45">
                                                        <label htmlFor="couponExpiry" className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                                                            Coupon Expiry Date
                                                        </label>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "w-full h-10 px-4 py-2 border border-gray-400 rounded-md text-sm text-gray-800 bg-background transition-[border-color,box-shadow] duration-200 outline-none box-border",
                                                                        "justify-start text-left font-normal",
                                                                        !formData.couponExpiry && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {formData.couponExpiry ? (
                                                                        format(new Date(formData.couponExpiry), "PPP")
                                                                    ) : (
                                                                        <span>Pick expiry date</span>
                                                                    )}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={formData.couponExpiry ? new Date(formData.couponExpiry) : undefined}
                                                                    onSelect={(date) => {
                                                                        if (date) {
                                                                            const formatted = format(date, "yyyy-MM-dd");
                                                                            localHandleInputChange("couponExpiry", formatted);
                                                                        }
                                                                    }}
                                                                    fromDate={new Date()}
                                                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        {formErrors.couponExpiry && <span className="text-danger-red text-xs">{formErrors.couponExpiry}</span>}
                                                    </div>

                                                    <div className="relative flex-[1_1_200px] min-w-45">
                                                        <label htmlFor="minOrderValue" className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                                                            Minimum Order Value
                                                        </label>
                                                        <input
                                                            id="minOrderValue"
                                                            name="minOrderValue"
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={formData.minOrderValue || ""}
                                                            onChange={(e) => localHandleInputChange(e.target.name, e.target.value)}
                                                            className="w-full h-10 px-4 py-2 border border-gray-400 rounded-md text-sm text-gray-800 bg-background transition-[border-color,box-shadow] duration-200 outline-none box-border"
                                                            placeholder="₹"
                                                        />
                                                        {formErrors.minOrderValue && <span className="text-danger-red text-xs">{formErrors.minOrderValue}</span>}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Audience Section */}
            <div className="w-full bg-card rounded-2xl border border-ring p-0 mb-8 shadow-none max-w-full">
                <div
                    onClick={() => toggleSection("audience")}
                    onKeyDown={(e) => e.key === "Enter" && toggleSection("audience")}
                    className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer"
                    role="button"
                    tabIndex={0}
                    aria-expanded={openSections.audience}
                    aria-controls="audience-section"
                >
                    <h3 className="text-2xl font-medium text-upcoming-primary-700 m-0">Audience</h3>
                    <span>
                        <ChevronDownIcon className="w-6 h-6" />
                    </span>
                </div>

                <div className="overflow-hidden transition-[max-height] duration-500 ease-in-out" style={{ maxHeight: openSections.audience ? "1000px" : "0" }}>
                    <div className="px-8 pb-8 max-[768px]:px-2! max-[768px]:pb-4! min-[1200px]:px-8! min-[1200px]:pb-8!">
                        <div className="flex flex-col gap-3 mt-4">
                            <div className="flex flex-col gap-2 pl-2 mt-2 w-full">
                                <h3 className="text-base font-medium text-foreground m-0">Select  Age Range </h3>

                                {/* Min / Max input boxes */}
                                <div style={{ display: "flex", gap: 16, alignItems: "center", margin: "8px 0 4px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                        <label style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>Min</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={(formData.audienceRange?.max ?? 100) - 10}
                                            value={formData.audienceRange?.min ?? 0}
                                            onChange={(e) => {
                                                const val = Math.max(0, Math.min(Number(e.target.value), (formData.audienceRange?.max ?? 100) - 10));
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    audienceRange: { min: val, max: prev.audienceRange?.max ?? 100 },
                                                }));
                                            }}
                                            style={{
                                                width: 56,
                                                height: 40,
                                                textAlign: "center",
                                                border: "1px solid var(--gray-400)",
                                                borderRadius: 6,
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: "var(--foreground)",
                                                background: "var(--background)",
                                                outline: "none",
                                            }}
                                        />
                                    </div>

                                    <span style={{ fontSize: 16, color: "#aaa", marginTop: 18 }}>—</span>

                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                        <label style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>Max</label>
                                        <input
                                            type="number"
                                            min={(formData.audienceRange?.min ?? 0) + 10}
                                            max={100}
                                            value={formData.audienceRange?.max ?? 100}
                                            onChange={(e) => {
                                                const val = Math.min(100, Math.max(Number(e.target.value), (formData.audienceRange?.min ?? 0) + 10));
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    audienceRange: { min: prev.audienceRange?.min ?? 0, max: val },
                                                }));
                                            }}
                                            style={{
                                                width: 56,
                                                height: 40,
                                                textAlign: "center",
                                                border: "1px solid var(--gray-400)",
                                                borderRadius: 6,
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: "var(--foreground)",
                                                background: "var(--background)",
                                                outline: "none",
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="w-[70%] mx-auto py-2" style={{ paddingBottom: 28 }}>
                                    <DualThumbSlider
                                        min={0}
                                        max={100}
                                        valueMin={formData.audienceRange?.min ?? 0}
                                        valueMax={formData.audienceRange?.max ?? 100}
                                        onChange={({ min, max }) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                audienceRange: { min, max },
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 flex-col">
                                <h3 className="text-base font-medium text-foreground m-0 pl-2"><b> Audience category</b></h3>

                                <div className="flex flex-wrap gap-3 w-full pl-2">
                                    {audienceTypes.map((audience) => {
                                        const active = !!formData.targetAudience?.[audience];
                                        return (
                                            <div
                                                key={audience}
                                                className={`px-3 py-2 rounded-full border border-gray-200 bg-gray-100 cursor-pointer transition-all duration-200 ${active ? "border-blue-soft! bg-blue-soft!" : ""
                                                    }`}
                                                onClick={() => handleAudienceSelection(audience)}
                                                onKeyDown={(e) => e.key === "Enter" && handleAudienceSelection(audience)}
                                                role="button"
                                                tabIndex={0}
                                                aria-pressed={active}
                                            >
                                                <span className={`text-sm font-medium ${active ? "text-background" : "text-foreground"}`}>{audience}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketingForm;
