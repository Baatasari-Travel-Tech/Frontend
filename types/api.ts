export type BackendRole = "USER" | "ORGANIZER" | "ADMIN";
export type ActiveRole = "USER" | "ORGANIZER";
export type OnboardingStatus = "PENDING" | "COMPLETED";

// Every successful API response from the Express backend is wrapped in
// `{ success: true, data: T }` (see Backend/src/utils/response.ts).
// Error responses are `{ success: false, code, message, ... }` — typed
// separately as ApiErrorPayload.
export type ApiEnvelope<T> = {
  success: true;
  data: T;
};

export type SafeUser = {
  id: string;
  email: string;
  role: BackendRole;
  onboardingStatus: OnboardingStatus;
  emailVerified: boolean;
  organizerDocumentsSubmitted: boolean;
  organizerApproved: boolean;
  createdAt: string;
  updatedAt: string;
  // Set to an ISO timestamp when the user is soft-deleted. Admin UI uses
  // this to render the row as "deleted" with a Revive action instead of
  // Delete. End-user-facing endpoints filter these out server-side, so
  // SafeUser instances coming from /auth/me will always have null here.
  deletedAt: string | null;
};

export type AuthResponse = ApiEnvelope<{ user: SafeUser }>;

export type MessageResponse = ApiEnvelope<{ message: string }>;

export type ApiErrorPayload = {
  success?: false;
  code: string;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  retryAfter?: number;
};

export type UserProfile = {
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  dob: string | null;
  location: string | null;
  gender: string | null;
  profession: string | null;
  organizerDisplayName: string | null;
  organizerDescription: string | null;
  companyName: string | null;
  companyWebsite: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type LegacyProfile = {
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  dob: string | null;
  location: string | null;
  gender: string | null;
  profession: string | null;
  global_onboarding_completed: boolean;
};

export type OrganizerProfile = {
  entityType: "ORGANIZATION" | "INDIVIDUAL";
  orgName: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  panNumber: string | null;
  gstNumber: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  bankAccountType: string | null;
  bankName: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  primaryContactName: string | null;
  secondaryContactPhone: string | null;
  logoUrl: string | null;
  logoPublicId: string | null;
  kycDocUrl: string | null;
  kycDocPublicId: string | null;
  gstDeclarationMode: "HAS_GSTIN" | "NO_GSTIN" | null;
  gstDetails: Array<{ gstin: string; state: string }>;
  undertakingAccepted: boolean;
  undertakingState: string | null;
  itrFiledLastTwoYears: boolean | null;
  panDocumentKey: string | null;
  agreementDocumentKey: string | null;
  agreementDownloadedAt: string | null;
  documentsSubmittedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SimplePreferences = {
  notifications: boolean;
  language: string;
  travel: string[];
  interests: string[];
  food: string[];
  emotional: string[];
  logistics: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type OrganizerEventTicketTier = {
  id?: string;
  name: string;
  description?: string | null;
  quantity: number;
  soldCount?: number;
  price: number;
  perks?: string[];
  saleStartsAt?: string | null;
  saleEndsAt?: string | null;
};

// Sub-shapes for the previously-untyped JSON blobs on EventSummary. All leaf
// fields are optional because the API does not enforce presence — the FE
// consumers (lib/event-helpers.ts, components/event-org/manage-events) read
// them defensively via asString/asNumber/asBoolean helpers, which is the
// safety net for any drift from this shape.
export type EventSponsor = {
  name: string;
  website: string;
};

export type EventSponsorGroups = {
  titleSponsors?: EventSponsor[];
  coPartners?: EventSponsor[];
  mediaPartners?: EventSponsor[];
};

export type EventRequirements = {
  highlights?: string[];
  personnel?: string;
};

export type EventPostEventFollowUp = {
  thankYouNote?: string;
};

export type EventContactInfo = {
  mobile?: string;
  email?: string;
  website?: string;
  additionalLinks?: string;
};

export type EventAudienceRange = {
  min?: number;
  max?: number;
};

export type EventAddOns = {
  freebies?: boolean;
  giftHampers?: boolean;
  merchandise?: boolean;
  addOther?: boolean;
  giftHampersDescription?: string;
  addOtherDescription?: string;
};

export type EventGuidelines = {
  text?: string;
};

export type EventSummary = {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  capacity: number;
  slug: string | null;
  category: string | null;
  tagline: string | null;
  heroImageUrl: string | null;
  heroImagePublicId: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  googleMapsUrl: string | null;
  transportToEvent: string | null;
  entrySide: string | null;
  transportOptions: Record<string, boolean>;
  artists: Array<{ name: string; genre?: string | null }>;
  sponsors: EventSponsorGroups;
  requirements: EventRequirements;
  postEventFollowUp: EventPostEventFollowUp;
  contactInfo: EventContactInfo;
  audienceRange: EventAudienceRange;
  targetAudience: Record<string, boolean>;
  addOns: EventAddOns;
  // No FE consumer reads from `discounts` yet — kept as an open record so the
  // backend can populate it without churning this type when a real consumer
  // arrives.
  discounts: Record<string, unknown>;
  guidelines: EventGuidelines;
  published: boolean;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  startingPrice?: number;
  bookedCount?: number;
  ticketTierCount?: number;
};

export type EventDetail = EventSummary & {
  ticketTiers: OrganizerEventTicketTier[];
};

export type GstThresholdStatus = {
  turnover: number;
  threshold: number;
  remindThreshold: number;
  hasGstin: boolean;
  salesBlocked: boolean;
  stage: "ok" | "approaching" | "blocked";
};

export type OrganizerAnalytics = {
  totalEvents: number;
  totalCapacity: number;
  nextEventDate: string | null;
  paidOrders: number;
  grossRevenue: number;
  gstThreshold?: GstThresholdStatus;
};

export type EventFunnelPoint = {
  date: string;
  views: number;
  purchases: number;
};

export type EventFunnel = {
  series: EventFunnelPoint[];
  totalViews: number;
  totalPurchases: number;
  conversionRate: number;
};


export type OrderBreakdown = {
  subtotal: number;
  taxAmount: number;
  platformFee: number;
  totalAmount: number;
  currency: string;
};

export type TicketRecord = {
  ticketId: string;
  orderId: string;
  eventId: string;
  eventTitle: string;
  venue: string;
  eventDate: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string | null;
  quantity: number;
  ticketCode: string;
  qrPayload: string | null;
  ticketStatus: string;
  orderStatus: string;
  totalAmount: number;
  refundedAmount: number;
  currency: string;
  paidAt: string | null;
};

export type TaxInvoice = {
  invoiceNumber: string;
  invoiceDate: string | null;
  orderNumber: string;
  supplier: {
    gstin: string;
    legalName: string;
    tradeName: string;
    address: string;
    stateName: string;
    stateCode: string;
  };
  buyer: { name: string | null; email: string | null; gstin: string | null };
  sac: string;
  placeOfSupplyStateCode: string;
  intraState: boolean;
  eventTitle: string;
  quantity: number;
  currency: string;
  ticketSubtotal: string;
  platformFee: {
    ratePct: number;
    inclusive: string;
    taxable: string;
    cgst: string;
    sgst: string;
    igst: string;
    tax: string;
  };
  grandTotal: string;
};

export type TalentProfile = {
  stageName: string | null;
  mainSkill: string | null;
  experienceLevel: string | null;
  yearsOfExperience: string | null;
  bio: string | null;
  preferredSlots: string[];
  availableFor: string[];
  location: string | null;
  expectedPriceBand: string | null;
  portfolioLinks: string[];
  feeAmount: number;
  paymentStatus: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  paidAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminUserListResponse = {
  users: Array<
    SafeUser & {
      organizationName: string | null;
    }
  >;
  total: number;
  page: number;
  limit: number;
};

export type AdminLoginPayload = {
  username: string;
  password: string;
};

export type AdminVerifyPayload = {
  token: string;
  // Pending-2FA session id from /admin/login — binds this TOTP step to the
  // password step so 2FA is a true second factor.
  pending: string;
};

export type AdminDashboardResponse = {
  message: string;
  stats: {
    totalUsers: number;
    organizerCount: number;
    pendingOrganizerCount: number;
  };
};

export type AdminPendingOrganizerUser = SafeUser & {
  profile: Record<string, unknown> | null;
};

export type AdminOrganizerDetailsResponse = {
  user: SafeUser;
  userProfile: UserProfile | null;
  organizerProfile: OrganizerProfile | null;
};

export type AdminUserDetailsResponse = {
  user: SafeUser;
  userProfile: UserProfile | null;
};

export type SiteConfig = {
  instagram: string;
  linkedin: string;
  twitter: string;
  contactEmail: string;
};

export type GstinVerifyResult = {
  valid: boolean;
  embeddedPan: string;
  legalName?: string;
  status?: string;
  registrationDate?: string;
  address?: string;
  taxpayerType?: string;
};

export type PanVerifyResult = {
  valid: boolean;
  pan: string;
};

export class ApiError extends Error {
  code: string;
  status: number;
  errors?: Array<{ field: string; message: string }>;
  retryAfter?: number;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = status;
    this.code = payload.code;
    this.errors = payload.errors;
    this.retryAfter = payload.retryAfter;
  }
}
