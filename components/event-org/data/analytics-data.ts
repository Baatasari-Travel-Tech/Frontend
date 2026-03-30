import { ChartConfig } from "@/components/ui/chart"

// --- Event Stats Data ---

// Chart 1: Registered
export const REGISTERED_DATA = [{ category: "total", registered: 375, available: 25 }]

export const REGISTERED_CONFIG = {
    registered: { label: "Registered", color: "hsl(230, 60%, 65%)" },
    available: { label: "Available", color: "hsl(100, 70%, 65%)" }
} satisfies ChartConfig

// Chart 2: Demographics
export const DEMOGRAPHICS_DATA = [
    { type: "Male", visitors: 50, fill: "hsl(210, 90%, 75%)" },
    { type: "Female", visitors: 30, fill: "hsl(340, 80%, 75%)" },
    { type: "Other", visitors: 10, fill: "hsl(0, 0%, 75%)" },
]

export const DEMOGRAPHICS_CONFIG = {
    visitors: { label: "Visitors" }
} satisfies ChartConfig

// Chart 3: Cancelled
export const CANCELLED_VALUE = 8
export const CANCELLED_CONFIG = {
    Cancelled: { label: "Cancelled" }
} satisfies ChartConfig


// --- Revenue Stats Data ---

export const REVENUE_BY_DATE_DATA = [
    { date: "1 Jun", revenue: 2000, addOns: 200 },
    { date: "2 Jun", revenue: 3500, addOns: 400 },
    { date: "3 Jun", revenue: 5000, addOns: 500 },
    { date: "4 Jun", revenue: 4200, addOns: 450 },
    { date: "5 Jun", revenue: 8500, addOns: 900 },
    { date: "6 Jun", revenue: 12000, addOns: 1200 },
    { date: "7 Jun", revenue: 9000, addOns: 950 },
    { date: "8 Jun", revenue: 7500, addOns: 800 },
    { date: "9 Jun", revenue: 10000, addOns: 1100 },
    { date: "10 Jun", revenue: 13500, addOns: 1400 },
    { date: "11 Jun", revenue: 11000, addOns: 1200 },
    { date: "12 Jun", revenue: 9200, addOns: 1000 },
    { date: "13 Jun", revenue: 7800, addOns: 850 },
    { date: "14 Jun", revenue: 10500, addOns: 1100 },
    { date: "15 Jun", revenue: 8000, addOns: 900 },
    { date: "16 Jun", revenue: 6500, addOns: 700 },
    { date: "17 Jun", revenue: 9800, addOns: 1050 },
    { date: "18 Jun", revenue: 7200, addOns: 780 },
    { date: "19 Jun", revenue: 11500, addOns: 1250 },
    { date: "20 Jun", revenue: 15000, addOns: 1600 },
    { date: "21 Jun", revenue: 18500, addOns: 2000 },
    { date: "22 Jun", revenue: 22000, addOns: 2400 },
    { date: "23 Jun", revenue: 19000, addOns: 2100 },
    { date: "24 Jun", revenue: 16500, addOns: 1800 },
    { date: "25 Jun", revenue: 14000, addOns: 1500 },
]

export const TICKETS_BY_DATE_DATA = [
    { date: "1 Jun", vip: 2, regular: 8, child: 1, family: 0 },
    { date: "2 Jun", vip: 3, regular: 12, child: 2, family: 1 },
    { date: "3 Jun", vip: 5, regular: 18, child: 3, family: 1 },
    { date: "4 Jun", vip: 4, regular: 14, child: 2, family: 1 },
    { date: "5 Jun", vip: 7, regular: 28, child: 4, family: 2 },
    { date: "6 Jun", vip: 10, regular: 38, child: 6, family: 3 },
    { date: "7 Jun", vip: 8, regular: 30, child: 5, family: 2 },
    { date: "8 Jun", vip: 6, regular: 24, child: 4, family: 2 },
    { date: "9 Jun", vip: 9, regular: 32, child: 5, family: 3 },
    { date: "10 Jun", vip: 12, regular: 42, child: 7, family: 3 },
    { date: "11 Jun", vip: 10, regular: 36, child: 6, family: 3 },
    { date: "12 Jun", vip: 8, regular: 28, child: 5, family: 2 },
    { date: "13 Jun", vip: 7, regular: 22, child: 4, family: 2 },
    { date: "14 Jun", vip: 9, regular: 34, child: 5, family: 3 },
    { date: "15 Jun", vip: 7, regular: 26, child: 4, family: 2 },
    { date: "16 Jun", vip: 5, regular: 20, child: 3, family: 2 },
    { date: "17 Jun", vip: 8, regular: 30, child: 5, family: 2 },
    { date: "18 Jun", vip: 6, regular: 22, child: 4, family: 2 },
    { date: "19 Jun", vip: 10, regular: 36, child: 6, family: 3 },
    { date: "20 Jun", vip: 13, regular: 48, child: 8, family: 4 },
    { date: "21 Jun", vip: 16, regular: 58, child: 10, family: 5 },
    { date: "22 Jun", vip: 19, regular: 68, child: 12, family: 5 },
    { date: "23 Jun", vip: 15, regular: 56, child: 9, family: 4 },
    { date: "24 Jun", vip: 12, regular: 46, child: 8, family: 4 },
    { date: "25 Jun", vip: 10, regular: 38, child: 6, family: 3 },
]

export const REVENUE_CHART_CONFIG = {
    revenue: {
        label: "Total Revenue",
        color: "hsl(215, 60%, 45%)", // Dark blueish
    },
    addOns: {
        label: "Add-Ons Revenue",
        color: "hsl(142, 60%, 45%)", // Greenish
    },
} satisfies ChartConfig

export const TICKETS_CHART_CONFIG = {
    vip: { label: "VIP", color: "hsl(280, 60%, 65%)" },
    regular: { label: "Regular", color: "hsl(215, 60%, 45%)" },
    child: { label: "Child", color: "hsl(340, 60%, 65%)" },
    family: { label: "Family", color: "hsl(32, 80%, 55%)" },
} satisfies ChartConfig

export const RADIAL_DATA = [
    { name: "Booked", value: 79, fill: "hsl(215, 60%, 50%)" },
    { name: "Remaining", value: 21, fill: "transparent" }
]
