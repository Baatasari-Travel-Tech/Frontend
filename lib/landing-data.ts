export interface EventItem {
    title: string;
    location: string;
    price: string;
    date: string;
    image: string;
    category: string;
    numericPrice: number;
}

export interface Artist {
    name: string;
    image: string;
}

export interface Movie {
    title: string;
    rating: string;
    language: string;
    image: string;
}

export const EXPERIENCES_DATA: EventItem[] = [
    {
        title: "Holi Sundowner Fest",
        location: "Hauz Khas, Delhi",
        price: "₹999",
        date: "25 Mar 2026",
        image: "/images/e3.png",
        category: "Festival",
        numericPrice: 999
    },
    {
        title: "Live Music Night",
        location: "Hyderabad",
        price: "₹499",
        date: "26 Mar 2026",
        image: "/images/event1.png",
        category: "Music",
        numericPrice: 499
    },
    {
        title: "Standup Comedy",
        location: "Bangalore",
        price: "₹699",
        date: "28 Mar 2026",
        image: "/images/e2.png",
        category: "Comedy",
        numericPrice: 699
    },
    {
        title: "Tech Workshop",
        location: "Visakhapatnam",
        price: "Free",
        date: "05 Apr 2026",
        image: "/images/e3.png",
        category: "Education",
        numericPrice: 0
    },
    {
        title: "Coke Studio Bharat Live | Delhi",
        location: "NSIC Exhibition Ground, Delhi/NCR",
        price: "₹999",
        date: "Sun, 11 Jan, 5:30 PM",
        image: "/images/event1.png",
        category: "Music",
        numericPrice: 999,
    },
];

export const ARTISTS_DATA: Artist[] = [
    { name: "Anirudh", image: "/images/artists/anirudh.png" },
    { name: "Arijit Troop", image: "/images/artists/arijit.png" },
    { name: "Shreya Ghoshal", image: "/images/artists/shreya.png" },
    { name: "Sid Sriram", image: "/images/artists/sid.png" },
];

export const MOVIES_DATA: Movie[] = [
    { title: "Dhurandhar", rating: "A", language: "Hindi", image: "action+movie+poster" },
    { title: "Kis Kisko Pyaar Karoon 2", rating: "UA16+", language: "Hindi", image: "comedy+movie+poster" },
    { title: "Tere Ishk Mein", rating: "UA16+", language: "Hindi", image: "romance+movie+poster" },
    { title: "Sholay: The Final Cut (1975)", rating: "UA", language: "Hindi", image: "classic+bollywood+poster" },
];
