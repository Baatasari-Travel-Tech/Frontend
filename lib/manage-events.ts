export interface EventItem {
    date: string;
    name: string;
    category: string;
    status: string;
    action: string;
}

export const UPCOMING_EVENT_DETAILS = {
    title: "MARITZA CORREA Vizag",
    date: "Wednesday, 28 May 2025",
    timeRange: "4:15 – 8:30 PM",
    type: "Music Concert",
    venue: "Qubaa (Vizag)",
    aboutTitle: "About The Event",
    aboutDescription: "Get ready for an electrifying musical transformation as we dive into the world of heavyweight mutati",
    highlightsTitle: "Event Highlights",
    highlights: [
        "one of the sensational USA maestros",
        "@djmaritzacorrea who has set hearts racing with her mind-blowing"
    ],
    posterImage: "/event-img.svg",
    stats: {
        registrations: "375",
        revenue: "₹10,00,000",
        addOns: "20",
        dateChange: "45"
    },
    // Data for actions
    formData: {
        eventName: "MARITZA CORREA Vizag",
        category: "Music Concert",
        description: "Music Concert Description",
        date: "2025-05-28",
        time: "16:15",
        endTime: "20:30",
        venue: "Qubaa (Vizag)"
    },
    analyticsData: {
        eventName: "MARITZA CORREA Vizag",
        date: "Wednesday, 28 May 2025",
        category: "Music Concert",
        status: "Upcoming"
    }
};

export const UPCOMING_EVENTS_LIST = [
    UPCOMING_EVENT_DETAILS,
    {
        title: "Elyzium Band Live",
        date: "Saturday, 14 June 2025",
        timeRange: "6:00 – 10:00 PM",
        type: "Live Band Concert",
        venue: "Beach Road Arena (Vizag)",
        aboutTitle: "About The Event",
        aboutDescription: "Experience the ultimate live music night with Elyzium Band performing their chart-topping hits and fan-favorite originals.",
        highlightsTitle: "Event Highlights",
        highlights: [
            "Elyzium Band's first-ever Vizag concert",
            "featuring surprise guest artists and immersive light shows"
        ],
        posterImage: "/event-img.svg",
        stats: {
            registrations: "520",
            revenue: "₹15,50,000",
            addOns: "35",
            dateChange: "12"
        },
        formData: {
            eventName: "Elyzium Band Live",
            category: "Live Band Concert",
            description: "Live Band Concert Description",
            date: "2025-06-14",
            time: "18:00",
            endTime: "22:00",
            venue: "Beach Road Arena (Vizag)"
        },
        analyticsData: {
            eventName: "Elyzium Band Live",
            date: "Saturday, 14 June 2025",
            category: "Live Band Concert",
            status: "Upcoming"
        }
    },
    {
        title: "Drone Shaurya Expo",
        date: "Friday, 04 July 2025",
        timeRange: "10:00 AM – 5:00 PM",
        type: "Tech Expo",
        venue: "GITAM Convention Centre (Vizag)",
        aboutTitle: "About The Event",
        aboutDescription: "A grand showcase of cutting-edge drone technology, defense innovations, and aerial robotics demonstrations from global leaders.",
        highlightsTitle: "Event Highlights",
        highlights: [
            "Live drone racing and defense demos",
            "featuring 50+ exhibitors and keynote speakers from across the globe"
        ],
        posterImage: "/event-img.svg",
        stats: {
            registrations: "890",
            revenue: "₹25,00,000",
            addOns: "60",
            dateChange: "8"
        },
        formData: {
            eventName: "Drone Shaurya Expo",
            category: "Tech Expo",
            description: "Tech Expo Description",
            date: "2025-07-04",
            time: "10:00",
            endTime: "17:00",
            venue: "GITAM Convention Centre (Vizag)"
        },
        analyticsData: {
            eventName: "Drone Shaurya Expo",
            date: "Friday, 04 July 2025",
            category: "Tech Expo",
            status: "Upcoming"
        }
    }
];

export const ALL_EVENTS_DATA = {
    page1: [
        { date: "May 3, 2025", name: "Elyzium Band Live", category: "Entertainment", status: "Ongoing", action: "Edit" },
        { date: "May 14–16, 2025", name: "Bharat Marine Systems 2025", category: "Defense", status: "Upcoming", action: "Edit" },
        { date: "May 14–16, 2025", name: "GeoSpace Bharat 2025", category: "Technology", status: "Upcoming", action: "Edit" },
        { date: "May 14–16, 2025", name: "SwaRaksha Mahotsav 2025", category: "Public Safety", status: "Upcoming", action: "Edit" },
        { date: "May 14–16, 2025", name: "Drone Shaurya Global Summit & Expo", category: "Technology", status: "Upcoming", action: "Edit" },
    ],
    page2: [
        { date: "March 21, 2025", name: "MARITZA CORREA Vizag", category: "Music Concert", status: "Past", action: "Repeat" },
        { date: "March 21, 2025", name: "MARITZA CORREA Vizag", category: "Music Concert", status: "Past", action: "Repeat" },
        { date: "March 21, 2025", name: "MARITZA CORREA Vizag", category: "Music Concert", status: "Past", action: "Repeat" },
    ]
};
