export interface SelectOption {
    value: string;
    label: string;
}

export const SLOT_OPTIONS: string[] = [
    "Everyday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

export const AVAILABLE_OPTIONS: string[] = [
    "All", "Events", "Pop-ups", "Corporate", "Restaurants", "Cafes",
];

export const SKILL_OPTIONS: SelectOption[] = [
    { value: "Others", label: "Others" },
    { value: "photography", label: "Photography" },
    { value: "dancing", label: "Dancing" },
    { value: "standup", label: "Stand up Comedy" },
    { value: "music", label: "Music" },
    { value: "painting", label: "Painting" },
    { value: "cooking", label: "Cooking/Backing" },
    { value: "mehndi", label: "Mehendhi art" },
    { value: "crafts", label: "Craft Workshops" },
    { value: "makeup", label: "Makeup & Styling" },
    { value: "tattoo", label: "Tattoo artist" },
    { value: "tours", label: "Custom Tours" },
    { value: "talks", label: "Language or Cultural talks" },
];

export const EXPERIENCE_LEVEL_OPTIONS: SelectOption[] = [
    { value: "expert", label: "Expert" },
    { value: "intermediate", label: "Inter" },
    { value: "beginner", label: "Beginner" },
];

export const BOOKING_FROM_OPTIONS: SelectOption[] = [
    { value: "tourists", label: "Tourists" },
    { value: "locals", label: "Locals" },
    { value: "events", label: "Events" },
    { value: "vendors", label: "Vendors" },
    { value: "cafes", label: "Cafes" },
];

export const PRICE_OPTIONS: SelectOption[] = [
    { value: "hourly", label: "Hourly" },
    { value: "packages", label: "Packages" },
    { value: "custom", label: "Custom Quote" },
];