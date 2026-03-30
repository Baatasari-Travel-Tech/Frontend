export interface HeroSlide {
    id: number;
    image: string;
    alt: string;
}

export interface FilterOption {
    value: string;
    label: string;
}

export const HERO_SLIDES: HeroSlide[] = [
    { id: 1, image: "/events/hero.png", alt: "Concert Event 1" },
    { id: 2, image: "/events/hero.png", alt: "Concert Event 2" },
    { id: 3, image: "/events/hero.png", alt: "Concert Event 3" },
];

export const LOCATION_FILTERS: FilterOption[] = [
    { value: "New York, NY", label: "New York, NY" },
    { value: "Los Angeles, CA", label: "Los Angeles, CA" },
];

export const PRICE_FILTERS: FilterOption[] = [
    { value: "Any Price", label: "Any Price" },
    { value: "Free", label: "Free" },
    { value: "Paid", label: "Paid" },
];

export const DATE_FILTERS: FilterOption[] = [
    { value: "Select Date", label: "Select Date" },
    { value: "Today", label: "Today" },
    { value: "Tomorrow", label: "Tomorrow" },
    { value: "This Weekend", label: "This Weekend" },
];

export const EVENT_TYPE_FILTERS: FilterOption[] = [
    { value: "All Events", label: "All Events" },
    { value: "Music", label: "Music" },
    { value: "Comedy", label: "Comedy" },
];
