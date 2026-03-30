 export interface ArtistRequest {
    title: string;
    interest: number;
    tag: string;
    image: string;
    month: string;
    location: string;
    about: string;
}

export const ARTIST_REQUESTS: ArtistRequest[] = [
    {
        title: "Art and Music Collaboration at beach",
        interest: 110,
        tag: "Fest and Gathering",
        image: "/party.svg",
        month: "June",
        location: "Novotel",
        about:
            "Get ready for an electrifying night filled with powerful performances and soul-stirring melodies. From heart-thumping beats to soothing harmonies, this concert promises a musical journey like no other.",
    },
    {
        title: "Beach Music Night",
        interest: 220,
        tag: "Popular",
        image: "/party.svg",
        month: "July",
        location: "Beach Arena",
        about: "An open-air music celebration featuring live bands and DJs.",
    },
    {
        title: "Art Expo 2025",
        interest: 90,
        tag: "Trending",
        image: "/party.svg",
        month: "August",
        location: "Vizag",
        about:
            "A creative gathering of artists and performers from across the country.",
    },
]
