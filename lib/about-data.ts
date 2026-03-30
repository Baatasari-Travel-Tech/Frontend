export interface Feature {
    title: string;
    description: string;
    image: string;
}

export interface Performer {
    title: string;
    description: string;
    image: string;
}

export const FEATURES_DATA: Feature[] = [
    {
        title: "Inclusive events in seconds!",
        description:
            "Discover Real Experiences in Seconds. Not just events or restaurants. But experiences that actually match what you feel like doing.",
        image: "/e1.png",
    },
    {
        title: "Plan your day in minutes",
        description:
            "From live music and creative workshops to food spots, meetups, fitness sessions, and cultural happenings — Batasari helps you.",
        image: "/e2.png",
    },
    {
        title: "Beyond travel!",
        description:
            "No endless searching. No scattered information. Just curated recommendations tailored to you.",
        image: "/e3.png",
    },
];

export const PERFORMERS_DATA: Performer[] = [
    {
        title: "Dancers",
        description: "Enchant your audience with your energizing moves",
        image: "/a1.png",
    },
    {
        title: "Singers",
        description: "Captivate the crowd and let your voice be heard.",
        image: "/a2.png",
    },
    {
        title: "Artists",
        description: "Showcase your creativity and connect with your audience",
        image: "/a3.png",
    },
];