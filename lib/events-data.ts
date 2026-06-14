export type EventStatus = "live" | "upcoming" | "past";

export interface EventData {
    title: string;
    price: string;
    category: string;
    image: string;
    id: string;
    numericPrice: number;
    date: string;
    location: string;
    bookedCount?: number;
    tag?: string;
    chiefGuest?: string;
    sponsors?: string;
    eventTime?: string;
    highlights?: string[];
    status?: EventStatus;
    cancelled?: boolean;
}

export const HANDPICKED_DATA: EventData[] = [
    // { id: "voice-notes-tour", title: "Voice Notes Tour", price: "₹ 999", numericPrice: 999, category: "Concert", image: "/events/i.svg", date: "25 MAR 2026", location: "Hauz Khas, Delhi" }
];

export const NEXT_UP_DATA: EventData[] = [];

export const INTEREST_DATA: EventData[] = [];

export const SOLO_DATA: EventData[] = [];

export const SOLOPRENEUR_DATA: EventData[] = [];

export const getAllEvents = (): EventData[] => {
    return [
        ...HANDPICKED_DATA,
        ...NEXT_UP_DATA,
        ...INTEREST_DATA,
        ...SOLO_DATA,
        ...SOLOPRENEUR_DATA,
    ];
};
