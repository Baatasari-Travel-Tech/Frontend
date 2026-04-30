export const UNLIMITED_TICKET_CAPACITY = 999999

export interface EventFormData {
  eventName: string
  category: string
  tagline: string
  description: string
  personnel: string
  date: string
  time: string
  endDate: string
  endTime: string
  venue: string
  googleMapsUrl: string
  transportToEvent: string
  entrySide: string
  ticketType: "paid" | "free"
  audienceCategory: {
    category: string
    numberOfTickets: string
    isLimited: boolean
    price: string
    description: string
  }[]
  ticketName: string
  ticketQuantity: string
  ticketPrice?: string
  guidelines: string
  addOns: {
    freebies: boolean
    giftHampers: boolean
    merchandise: boolean
    addOther: boolean
    giftHampersDescription: string
    addOtherDescription?: string
    [key: string]: boolean | string | undefined
  }
  contactInfo: {
    mobile: string
    email: string
    website: string
    additionalLinks: string
  }
  sponsors: {
    titleSponsors: { name: string; website: string }[]
    coPartners: { name: string; website: string }[]
    mediaPartners: { name: string; website: string }[]
    [key: string]: { name: string; website: string }[]
  }
  postEventFollowUp: {
    thankYouNote: string
  }
  artists: { name: string; genre?: string }[]
  audienceRange: { min: number; max: number }
  targetAudience: { [key: string]: boolean }
  eventPhoto: File | null
  hasStoredCover?: boolean
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
  transportToEvent: "",
  entrySide: "",
  guidelines: "",
  ticketName: "",
  ticketPrice: "",
  ticketType: "paid",
  ticketQuantity: "",
  audienceCategory: [
    {
      category: "",
      numberOfTickets: "",
      isLimited: true,
      price: "",
      description: "",
    },
  ],
  addOns: {
    freebies: false,
    giftHampers: false,
    merchandise: false,
    addOther: false,
    giftHampersDescription: "",
    addOtherDescription: "",
  },
  audienceRange: { min: 13, max: 86 },
  targetAudience: {
    Entrepreneurs: false,
    "High School Learners": false,
    "University Scholars": true,
    Artists: false,
    Singers: false,
    "General Public": true,
  },
  sponsors: {
    titleSponsors: [],
    coPartners: [],
    mediaPartners: [],
  },
  contactInfo: {
    mobile: "",
    email: "",
    website: "",
    additionalLinks: "",
  },
  postEventFollowUp: {
    thankYouNote: "",
  },
  artists: [{ name: "", genre: "" }],
  hasStoredCover: false,
}

export const STEP_FIELDS = [
  [
    "eventPhoto",
    "eventName",
    "category",
    "description",
    "date",
    "time",
    "endTime",
    "venue",
    "googleMapsUrl",
  ],
  ["ticketType", "audienceCategory"],
  ["sponsors"],
  ["contactInfo.mobile", "contactInfo.email", "postEventFollowUp.thankYouNote"],
]

export const PROGRESS_STEPS = [
  { number: "01", label: "Event Information" },
  { number: "02", label: "Ticketing" },
  { number: "03", label: "Sponsorship" },
  { number: "04", label: "Final" },
]

export const EVENT_CATEGORIES = [
  { label: "Music", value: "music" },
  { label: "Art", value: "art" },
  { label: "Tech", value: "tech" },
  { label: "Business", value: "business" },
]

export const TARGET_AUDIENCE_OPTIONS = [
  "Entrepreneurs",
  "High School Learners",
  "University Scholars",
  "Artists",
  "Singers",
  "General Public",
]

export const ADD_ON_OPTIONS = [
  { id: "freebies", label: "Freebies" },
  { id: "giftHampers", label: "Gift Hampers" },
  { id: "merchandise", label: "Merchandise" },
  { id: "addOther", label: "Add Other" },
]
