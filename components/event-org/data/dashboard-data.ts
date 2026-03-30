import {
    Users,
    CalendarDays,
    IndianRupee,
    Star,
    CalendarPlus,
    FileText,
    MessageCircle
} from "lucide-react";

export const STATS_DATA = [
    {
        icon: Users,
        iconBgColor: "bg-orange-100",
        iconColor: "text-orange-600",
        value: "2,420",
        label: "Total Participants",
        trend: {
            direction: "up" as const,
            percentage: "40%",
            comparisonText: "vs last month",
        },
    },
    {
        icon: CalendarDays,
        iconBgColor: "bg-purple-100",
        iconColor: "text-purple-600",
        value: "85",
        label: "Total events",
        trend: {
            direction: "down" as const,
            percentage: "10%",
            comparisonText: "vs last month",
        },
    },
    {
        icon: IndianRupee,
        iconBgColor: "bg-blue-100",
        iconColor: "text-blue-600",
        value: "₹4,75,000",
        label: "Total Revenue",
        trend: {
            direction: "up" as const,
            percentage: "20%",
            comparisonText: "vs last year",
        },
    },
    {
        icon: Star,
        iconBgColor: "bg-yellow-100",
        iconColor: "text-yellow-600",
        value: "4.8",
        label: "Average Rating",
        trend: {
            direction: "up" as const,
            percentage: "25%",
            comparisonText: "vs last month",
        },
    },
];

export const EVENT_HIGHLIGHTS = {
    title: "MARITZA CORREA Vizag",
    date: "Wednesday, 28 May 2025",
    time: "4:15 - 8:37 PM",
    type: "Music Concert",
    venue: "Qubaa (Vizag)",
    aboutTitle: "About The Event",
    aboutDescription: "Get ready for an electrifying musical transformation as we dive into the world of heavyweight music!",
    highlightsTitle: "Event Highlights",
    highlights: [
        "One of the sensational USA maestros @djmaritzacorrea who has set hearts racing with her mind-blowing performance."
    ],
    stats: {
        registrations: "375",
        revenue: "₹10,00,000",
        addOns: "20",
        dateChange: "45"
    }
};

export const QUICK_ACTIONS = [
    {
        label: "Create event",
        icon: CalendarPlus,
    },
    {
        label: "Export Reports",
        icon: FileText,
    },
    {
        label: "Feedback",
        icon: MessageCircle,
    },
    {
        label: "Feedback",
        icon: MessageCircle,
    },
];

export const CHART_DATA = {
    monthly: [
        { label: "Jan", revenue: 10, tickets: 150 },
        { label: "Feb", revenue: 15, tickets: 220 },
        { label: "Mar", revenue: 40, tickets: 450 },
        { label: "Apr", revenue: 45, tickets: 500 },
        { label: "May", revenue: 35, tickets: 380 },
        { label: "Jun", revenue: 30, tickets: 320 },
        { label: "Jul", revenue: 60, tickets: 650 },
        { label: "Aug", revenue: 55, tickets: 590 },
        { label: "Sep", revenue: 50, tickets: 540 },
        { label: "Oct", revenue: 65, tickets: 700 },
        { label: "Nov", revenue: 70, tickets: 750 },
        { label: "Dec", revenue: 80, tickets: 850 },
    ],
    weekly: [
        { label: "Mon", revenue: 5, tickets: 50 },
        { label: "Tue", revenue: 8, tickets: 80 },
        { label: "Wed", revenue: 12, tickets: 120 },
        { label: "Thu", revenue: 10, tickets: 100 },
        { label: "Fri", revenue: 20, tickets: 200 },
        { label: "Sat", revenue: 35, tickets: 350 },
        { label: "Sun", revenue: 30, tickets: 300 },
    ],
    yearly: [
        { label: "2021", revenue: 150, tickets: 1500 },
        { label: "2022", revenue: 200, tickets: 2200 },
        { label: "2023", revenue: 350, tickets: 3800 },
        { label: "2024", revenue: 450, tickets: 4900 },
        { label: "2025", revenue: 500, tickets: 5500 },
    ]
};
