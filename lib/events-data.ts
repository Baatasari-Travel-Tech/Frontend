export interface EventData {
    title: string;
    price: string;
    category: string;
    image: string;
    id: string;
    numericPrice: number;
    date: string;
    location: string;
    tag?: string;
    chiefGuest?: string;
    sponsors?: string;
    eventTime?: string;
    highlights?: string[];
}

export const HANDPICKED_DATA: EventData[] = [
    { id: "voice-notes-tour", title: "Voice Notes Tour", price: "₹ 999", numericPrice: 999, category: "Concert", image: "/events/i.svg", date: "25 MAR 2026", location: "Hauz Khas, Delhi" },
    { id: "art-workshop", title: "Art Workshop", price: "₹ 499", numericPrice: 499, category: "Workshop", image: "/events/k.svg", date: "26 MAR 2026", location: "Cyber Hub, Gurgaon" },
    { id: "beach-yoga", title: "Beach Yoga", price: "₹ 299", numericPrice: 299, category: "Fitness", image: "/events/v.svg", date: "27 MAR 2026", location: "Goa" },
    { id: "city-tour", title: "City Tour", price: "₹ 999", numericPrice: 999, category: "Explore", image: "/events/v.svg", date: "28 MAR 2026", location: "Mumbai" },
];

export const NEXT_UP_DATA: EventData[] = [
    { id: "jazz-night", title: "Jazz Night", price: "₹ 1200", numericPrice: 1200, category: "Music", image: "/events/i.svg", date: "29 MAR 2026", location: "Koramangala, Bangalore" },
    { id: "pottery-class", title: "Pottery Class", price: "₹ 800", numericPrice: 800, category: "Hobby", image: "/events/i.svg", date: "30 MAR 2026", location: "Whitefield, Bangalore" },
    { id: "tech-talk", title: "Tech Talk", price: "Free", numericPrice: 0, category: "Meetup", image: "/events/i.svg", date: "31 MAR 2026", location: "HSR Layout, Bangalore" },
    { id: "startup-mixer", title: "Startup Mixer", price: "Free", numericPrice: 0, category: "Business", image: "/events/v.svg", date: "01 APR 2026", location: "Indiranagar, Bangalore" },
];

export const INTEREST_DATA: EventData[] = [
    { id: "cooking-masterclass", title: "Cooking Masterclass", price: "₹ 1500", numericPrice: 1500, category: "Food", image: "/events/i.svg", date: "02 APR 2026", location: "Saket, Delhi" },
    { id: "photography-walk", title: "Photography Walk", price: "Free", numericPrice: 0, category: "Hobby", image: "/events/i.svg", date: "03 APR 2026", location: "Chandni Chowk, Delhi" },
    { id: "wine-tasting", title: "Wine Tasting", price: "₹ 2500", numericPrice: 2500, category: "Social", image: "/events/i.svg", date: "04 APR 2026", location: "Vasant Kunj, Delhi" },
    { id: "paint-sip", title: "Paint & Sip", price: "₹ 1500", numericPrice: 1500, category: "Art", image: "/events/v.svg", date: "05 APR 2026", location: "Gachibowli, Hyderabad" },
];

export const SOLO_DATA: EventData[] = [
    { id: "standup-special", title: "Standup Special", price: "₹ 600", numericPrice: 600, category: "Comedy", image: "/events/k.svg", date: "06 APR 2026", location: "Banjara Hills, Hyderabad" },
    { id: "acoustic-solo", title: "Acoustic Solo", price: "₹ 400", numericPrice: 400, category: "Music", image: "/events/i.svg", date: "07 APR 2026", location: "Jubilee Hills, Hyderabad" },
    { id: "poetry-slam", title: "Poetry Slam", price: "₹ 200", numericPrice: 200, category: "Literary", image: "/events/v.svg", date: "08 APR 2026", location: "Somajiguda, Hyderabad" },
    { id: "open-mic", title: "Open Mic", price: "Free", numericPrice: 0, category: "Performance", image: "/events/v.svg", date: "09 APR 2026", location: "Begumpet, Hyderabad" },
];

export const SOLOPRENEUR_DATA: EventData[] = [
    { id: "seo-strategy", title: "SEO Strategy", price: "₹ 2000", numericPrice: 2000, category: "Marketing", image: "/events/i.svg", date: "10 APR 2026", location: "Salt Lake, Kolkata" },
    { id: "freelance-tax-101", title: "Freelance Tax 101", price: "₹ 500", numericPrice: 500, category: "Finance", image: "/events/s.svg", date: "11 APR 2026", location: "Park Street, Kolkata" },
    { id: "networking-mixer", title: "Networking Mixer", price: "₹ 300", numericPrice: 300, category: "Business", image: "/events/v.svg", date: "12 APR 2026", location: "Ballygunge, Kolkata" },
    { id: "client-acquisition", title: "Client Acquisition", price: "₹ 1200", numericPrice: 1200, category: "Strategy", image: "/events/v.svg", date: "13 APR 2026", location: "New Town, Kolkata" },
];

export const getAllEvents = (): EventData[] => {
    return [
        ...HANDPICKED_DATA,
        ...NEXT_UP_DATA,
        ...INTEREST_DATA,
        ...SOLO_DATA,
        ...SOLOPRENEUR_DATA,
    ];
};
