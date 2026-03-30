
export interface EventFormData {
    eventName: string;
    category: string;
    tagline: string;
    description: string;
    personnel: string;
    date: string;
    time: string;
    endDate: string;
    endTime: string;
    venue: string;
    googleMapsUrl: string;
    transportToEvent: string;
    entrySide: string;
    ticketType: string;
    audienceCategory: { category: string; numberOfTickets: string; price: string; description: string }[];
    refundPolicy: string;
    ticketName: string;
    ticketQuantity: string;
    enableOffers: boolean;
    discountType: string;
    discountAmount: string;
    discountCode: string;
    couponCode: string;
    couponExpiry: string;
    minOrderValue: string;
    guidelines: string;
    addOns: {
        freebies: boolean;
        giftHampers: boolean;
        merchandise: boolean;
        addOther: boolean;
        giftHampersDescription: string;
        addOtherDescription?: string;
        [key: string]: boolean | string | undefined;
    };
    contactInfo: {
        mobile: string;
        email: string;
        website: string;
        additionalLinks: string;
    };
    sponsors: {
        titleSponsors: { name: string; website: string }[];
        coPartners: { name: string; website: string }[];
        mediaPartners: { name: string; website: string }[];
        [key: string]: { name: string; website: string }[];
    } | { name: string; website: string; type: string }[];
    requirements: {
        artists: string;
        stallsAvailability: string;
        stallsPrices: { stallType: string; stallPrice: string }[];
    };
    postEventFollowUp: {
        thankYouNote: string;
    };
    transportOptions: {
        publicTransport: boolean;
        ownVehicles: boolean;
        thirdPartyApp: boolean;
        localPrivateTransport: boolean;
    };
    artists: { name: string; genre: string }[];
    chefGuests: { name: string; specialty: string }[];
    attractions: { name: string; description: string }[];
    media: string;
    idleness: string;
    titleSponsors?: { name: string; website: string }[];
    coPartners?: { name: string; website: string }[];
    mediaPartners?: { name: string; website: string }[];
    type?: string;
    ticketPrice?: string;
    audienceRange: { min: number; max: number };
    targetAudience: { [key: string]: boolean };
    eventPhoto: File | null;
}

export const INITIAL_EVENT_FORM_DATA: EventFormData = {
    eventName: "",
    category: "",
    description: "",
    tagline: "",
    eventPhoto: null,
    personnel: "",
    date: "",
    endDate: "",
    time: "",
    endTime: "",
    venue: "",
    googleMapsUrl: "",
    artists: [{ name: "", genre: "" }],
    chefGuests: [{ name: "", specialty: "" }],
    attractions: [{ name: "", description: "" }],
    media: "",
    transportOptions: {
        publicTransport: false,
        ownVehicles: false,
        thirdPartyApp: false,
        localPrivateTransport: false,
    },
    transportToEvent: "",
    entrySide: "",
    guidelines: "",
    idleness: '',
    ticketName: '',
    ticketPrice: '',
    ticketType: 'paid',
    ticketQuantity: '',
    discountType: '',
    discountCode: '',
    couponCode: '',
    couponExpiry: '',
    minOrderValue: '',
    discountAmount: '',
    type: 'flat',
    enableOffers: false,
    audienceCategory: [{ category: '', numberOfTickets: '', price: '', description: '' }],
    refundPolicy: '',
    addOns: {
        freebies: false,
        giftHampers: false,
        merchandise: false,
        addOther: false,
        giftHampersDescription: '',
    },
    audienceRange: { min: 13, max: 86 },
    targetAudience: {
        Entrepreneurs: false,
        'High School Learners': false,
        'University Scholars': true,
        Artists: false,
        Singers: false,
        'General Public': true,
    },
    sponsors: {
        titleSponsors: [{ name: '', website: '' }],
        coPartners: [{ name: '', website: '' }],
        mediaPartners: [{ name: '', website: '' }],
    },
    contactInfo: {
        mobile: "",
        email: "",
        website: "",
        additionalLinks: "",
    },
    requirements: {
        artists: '',
        stallsAvailability: '',
        stallsPrices: [
            { stallType: '', stallPrice: '' },
            { stallType: '', stallPrice: '' },
        ],
    },
    postEventFollowUp: {
        thankYouNote: '',
    },
};

export const STEP_FIELDS = [
    ["eventName", "category", "tagline", "description", "personnel", "date", "time", "endTime", "venue", "googleMapsUrl", "transportToEvent", "entrySide"],
    ["ticketType", "ticketName", "ticketQuantity", "audienceCategory", "refundPolicy", "discountType", "discountAmount", "discountCode", "guidelines", "addOns.giftHampersDescription"],
    ["contactInfo.mobile", "contactInfo.email", "sponsors.titleSponsors", "sponsors.coPartners", "sponsors.mediaPartners"],
    ["requirements.artists", "requirements.stallsAvailability", "requirements.stallsPrices", "postEventFollowUp.thankYouNote"]
];

export const PROGRESS_STEPS = [
    { number: "01", label: "Event Information" },
    { number: "02", label: "Ticketing" },
    { number: "03", label: "Sponsorship" },
    { number: "04", label: "Final" },
];

export const EVENT_CATEGORIES = [
    { label: "Music", value: "music" },
    { label: "Art", value: "art" },
    { label: "Tech", value: "tech" },
    { label: "Business", value: "business" },
];

export const TRANSPORT_OPTIONS = [
    { label: "Public Transport", value: "publicTransport" },
    { label: "Own Vehicles", value: "ownVehicles" },
    { label: "Third Party App", value: "thirdPartyApp" },
    { label: "Local Private Transport", value: "localPrivateTransport" },
];

export const TARGET_AUDIENCE_OPTIONS = [
    'Entrepreneurs',
    'High School Learners',
    'University Scholars',
    'Artists',
    'Singers',
    'General Public',
];

export const ADD_ON_OPTIONS = [
    { id: 'freebies', label: 'Freebies' },
    { id: 'giftHampers', label: 'Gift Hampers' },
    { id: 'merchandise', label: 'Merchandise' },
    { id: 'addOther', label: 'Add Other' },
];
