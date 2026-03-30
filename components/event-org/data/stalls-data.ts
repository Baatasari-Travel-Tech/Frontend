export interface Stall {
    title: string;
    category: string;
    image: string;
}

export interface Artist {
    name: string;
    role: string;
    image: string;
    experience?: string;
    price?: number;
    description?: string;
    phone?: string;
    email?: string;
}

// Helper function to generate random items
export const generateRandomItems = () => {
    const items = [
        { name: "Chains", price: 150 },
        { name: "Bows", price: 80 },
        { name: "Bracelets", price: 50 },
        { name: "Claw clips", price: 60 },
        { name: "Scrunchies", price: 40 },
        { name: "Earrings", price: 120 },
        { name: "Rings", price: 90 },
        { name: "Necklaces", price: 200 },
    ];

    // Shuffle and pick 3-5 random items
    const shuffled = items.sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 3) + 3; // 3 to 5 items
    return shuffled.slice(0, count);
};

export const STALLS_DATA: Stall[] = [
    {
        title: "Twinkle Tales",
        category: "Accessories",
        image: "/jewelry-and-accessories-shop.jpg",
    },
    {
        title: "Taste Town",
        category: "Food",
        image: "/delicious-street-food-stall.jpg",
    },
    {
        title: "Handmade Haven",
        category: "Crafts",
        image: "/handmade-crafts-and-plushies.jpg",
    },
    {
        title: "Melody Makers",
        category: "Live Music",
        image: "/band-on-stage.png",
    },
    {
        title: "Fun Zone",
        category: "Gaming",
        image: "/colorful-board-game-or-carnival-game.jpg",
    },
    {
        title: "LEGENDS of hip-Hop",
        category: "Music",
        image: "/hip-hop-concert-poster.jpg",
    },
];

export const ARTISTS: Artist[] = [
    {
        name: "Taylor Swift",
        role: "Singer",
        image: "https://i.pravatar.cc/300?img=5",
        experience: "20yr",
        price: 1500,
        description: "I'm a singer-songwriter who's built a career on honest, diary-like lyrics, sharing my life's journey through my music.",
        phone: "9173865514",
        email: "taylor@example.com"
    },
    {
        name: "Rihanna",
        role: "Singer",
        image: "https://i.pravatar.cc/300?img=9",
        experience: "18yr",
        price: 2000,
        description: "Barbadian singer, actress, and businesswoman. Born in Saint Michael and raised in Bridgetown, Barbados.",
        phone: "9173865515",
        email: "riri@example.com"
    },
    {
        name: "Lady Gaga",
        role: "Singer",
        image: "https://i.pravatar.cc/300?img=3",
        experience: "15yr",
        price: 1800,
        description: "Known for her image reinventions and musical versatility. Gaga began performing as a teenager, singing at open mic nights and acting in school plays.",
        phone: "9173865516",
        email: "gaga@example.com"
    },
    {
        name: "Ed Sheeran",
        role: "Singer",
        image: "https://i.pravatar.cc/300?img=12",
        experience: "12yr",
        price: 1200,
        description: "English singer-songwriter. Born in Halifax, West Yorkshire, and raised in Framlingham, Suffolk.",
        phone: "9173865517",
        email: "ed@example.com"
    },
    {
        name: "Dua Lipa",
        role: "Singer",
        image: "https://i.pravatar.cc/300?img=16",
        experience: "8yr",
        price: 1400,
        description: "English and Albanian singer and songwriter. Her mezzo-soprano vocal range and disco-influenced production have received critical acclaim.",
        phone: "9173865518",
        email: "dua@example.com"
    },
    {
        name: "Adele",
        role: "Singer",
        image: "https://i.pravatar.cc/300?img=20",
        experience: "16yr",
        price: 2500,
        description: "English singer-songwriter. She is known for her powerful mezzo-soprano vocals and songwriting.",
        phone: "9173865519",
        email: "adele@example.com"
    },
    {
        name: "Olivia Rodrigo",
        role: "Singer",
        image: "https://i.pravatar.cc/300?img=24",
        experience: "5yr",
        price: 1000,
        description: "American singer-songwriter and actress. She gained recognition with her lead roles on the Disney Channel programs Bizaardvark and High School Musical.",
        phone: "9173865520",
        email: "olivia@example.com"
    },
    {
        name: "Pitbull",
        role: "Rapper",
        image: "https://i.pravatar.cc/300?img=33",
        experience: "22yr",
        price: 1600,
        description: "American rapper and businessman. He began his career in the early 2000s, recording reggaeton, Latin hip hop, and crunk music.",
        phone: "9173865521",
        email: "dale@example.com"
    },
];
