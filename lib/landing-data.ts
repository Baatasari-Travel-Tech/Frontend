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
    // {
    //     title: "Holi Sundowner Fest",
    //     location: "Hauz Khas, Delhi",
    //     price: "₹999",
    //     date: "25 Mar 2026",
    //     image: "/images/e3.png",
    //     category: "Festival",
    //     numericPrice: 999
    // }
];

export const ARTISTS_DATA: Artist[] = [
    // { name: "Anirudh", image: "/images/artists/anirudh.png" }
];

export const MOVIES_DATA: Movie[] = [
    // { title: "Dhurandhar", rating: "A", language: "Hindi", image: "action+movie+poster" }
];
