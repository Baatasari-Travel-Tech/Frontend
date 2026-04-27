export type BackendRole = "USER" | "ORGANIZER" | "ADMIN";
export type ActiveRole = "USER" | "ORGANIZER";
export type OnboardingStatus = "PENDING" | "COMPLETED";

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
};

export type AuthResponse = {
  accessToken: string;
  user: SafeUser;
};

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
  sponsors: Record<string, unknown>;
  requirements: Record<string, unknown>;
  postEventFollowUp: Record<string, unknown>;
  contactInfo: Record<string, unknown>;
  audienceRange: Record<string, unknown>;
  targetAudience: Record<string, boolean>;
  addOns: Record<string, unknown>;
  discounts: Record<string, unknown>;
  guidelines: Record<string, unknown>;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  startingPrice?: number;
  bookedCount?: number;
};

export type EventDetail = EventSummary & {
  ticketTiers: OrganizerEventTicketTier[];
};

export type OrganizerAnalytics = {
  totalEvents: number;
  totalCapacity: number;
  nextEventDate: string | null;
  paidOrders: number;
  grossRevenue: number;
};

export type SuggestedEventSummary = {
  id: string;
  creatorUserId: string;
  creatorName: string;
  title: string;
  location: string;
  category: string;
  month: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  supportDeadline: string;
  interestCount: number;
  interestedByCurrentUser: boolean;
  isCreator: boolean;
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
  totalAmount: number;
  currency: string;
  paidAt: string | null;
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
