export type ID = string;
export type DateString = string;
export type DecimalString = string;
export type UserRole = "CUSTOMER" | "PROVIDER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BLOCKED";
export type ProviderStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ServiceStatus = "ACTIVE" | "INACTIVE";
export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";
export type PaymentStatus =
  "UNPAID" | "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
export type PaymentProvider = "SSLCOMMERZ" | "STRIPE";
export type TokenPair = { accessToken: string; refreshToken: string };
export type UserCore = {
  id: ID;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: DateString;
  updatedAt: DateString;
};
export type AuthUser = UserCore & {
  providerProfile: {
    id: ID;
    businessName: string;
    status: ProviderStatus;
  } | null;
};
export type ProfileFields = {
  id: ID;
  businessName: string;
  bio: string | null;
  phone: string;
  city: string;
  address: string;
  status: ProviderStatus;
  rating: DecimalString;
  totalReviews: number;
  createdAt: DateString;
  updatedAt: DateString;
};
export type UserProfile = UserCore & { providerProfile: ProfileFields | null };
export type ProviderUser = {
  id: ID;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
};
export type ProviderSelf = ProfileFields & { user: ProviderUser };
export type ProviderPublic = {
  id: ID;
  businessName: string;
  bio: string | null;
  city: string;
  address: string;
  rating: DecimalString;
  totalReviews: number;
  createdAt: DateString;
  user: { id: ID; name: string };
  _count: { services: number };
};
export type AdminUser = UserCore & {
  providerProfile: {
    id: ID;
    businessName: string;
    status: ProviderStatus;
    city: string;
    rating: DecimalString;
    totalReviews: number;
  } | null;
};
export type AdminProvider = {
  id: ID;
  businessName: string;
  city: string;
  status: ProviderStatus;
  rating: DecimalString;
  totalReviews: number;
  createdAt: DateString;
  updatedAt: DateString;
  user: ProviderUser;
};
export type Category = {
  id: ID;
  name: string;
  slug: string;
  description: string | null;
  createdAt: DateString;
  updatedAt: DateString;
};
export type CategoryRef = { id: ID; name: string; slug: string };
export type ServiceFields = {
  id: ID;
  title: string;
  slug: string;
  description: string | null;
  price: DecimalString;
  duration: number;
  imageUrl: string | null;
  serviceArea: string | null;
  createdAt: DateString;
  category: CategoryRef;
};
export type PublicService = ServiceFields & {
  provider: {
    id: ID;
    businessName: string;
    city: string;
    rating: DecimalString;
    totalReviews: number;
    user: { id: ID; name: string };
  };
};
export type OwnService = ServiceFields & {
  categoryId: ID;
  status: ServiceStatus;
  updatedAt: DateString;
};
export type PublicSlot = {
  id: ID;
  serviceId: ID;
  startTime: DateString;
  endTime: DateString;
  createdAt: DateString;
};
export type OwnSlot = PublicSlot & {
  providerId: ID;
  isBooked: boolean;
  updatedAt: DateString;
  service: {
    id: ID;
    title: string;
    slug: string;
    duration: number;
    status: ServiceStatus;
  };
};
export type CustomerBooking = {
  id: ID;
  status: BookingStatus;
  servicePrice: DecimalString;
  platformFee: DecimalString;
  totalAmount: DecimalString;
  notes: string | null;
  createdAt: DateString;
  updatedAt: DateString;
  cancelledAt: DateString | null;
  completedAt: DateString | null;
  service: {
    id: ID;
    title: string;
    slug: string;
    duration: number;
    imageUrl: string | null;
  };
  provider: { id: ID; businessName: string; city: string; phone: string };
  payment: {
    status: PaymentStatus;
    amount: DecimalString;
    paidAt: DateString | null;
  } | null;
};
export type ProviderBooking = CustomerBooking & {
  customer: { id: ID; name: string; phone: string };
};
export type Payment = {
  id: ID;
  status: PaymentStatus;
  amount: DecimalString;
  provider: PaymentProvider;
  transactionId: string | null;
  createdAt: DateString;
  paidAt: DateString | null;
};
export type PaymentState = {
  bookingId: ID;
  bookingStatus: BookingStatus;
  currency: string;
  payment: Payment | { status: "UNPAID" };
};
export type Checkout = { paymentUrl: string; sessionId: string };
export type PublicReview = {
  id: ID;
  rating: number;
  comment: string | null;
  createdAt: DateString;
  customer: { id: ID; name: string };
};
export type OwnReview = PublicReview & {
  service: { id: ID; title: string };
  bookingId: ID;
  updatedAt: DateString;
};
export type AdminReview = OwnReview & {
  customerId: ID;
  serviceId: ID;
  deletedAt: DateString | null;
  booking: { providerId: ID };
};
export type RatingSummary = { averageRating: number; reviewCount: number };
export type Activity = {
  id: ID;
  action: string;
  entityType: string;
  entityId: ID;
  createdAt: DateString;
  user: { id: ID; name: string; role: UserRole } | null;
};
export type Audit = Activity & {
  userId: ID | null;
  oldData: unknown;
  newData: unknown;
  ipAddress: string | null;
  userAgent: string | null;
};

export type Overview = {
  users: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    blockedUsers: number;
    totalCustomers: number;
    totalProviders: number;
  };
  providers: {
    totalProviders: number;
    pendingProviders: number;
    approvedProviders: number;
    rejectedProviders: number;
  };
  services: {
    totalServices: number;
    activeServices: number;
    inactiveServices: number;
  };
  bookings: {
    totalBookings: number;
    pendingBookings: number;
    acceptedBookings: number;
    confirmedBookings: number;
    inProgressBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    rejectedBookings: number;
  };
  payments: {
    totalPayments: number;
    unpaidPayments: number;
    paidPayments: number;
    pendingPayments: number;
    failedPayments: number;
    cancelledPayments: number;
    refundedPayments: number;
  };
  reviews: { totalReviews: number; averageRating: number };
};
export type Revenue = {
  grossRevenue: DecimalString;
  platformRevenue: DecimalString;
  providerRevenue: DecimalString;
  paidBookingCount: number;
  averageOrderValue: DecimalString;
};
export type BookingMetrics = {
  totalBookings: number;
  counts: {
    pending: number;
    accepted: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    rejected: number;
  };
  completionRate: number;
  cancellationRate: number;
};
export type ProviderMetrics = {
  totalProviders: number;
  approvedProviders: number;
  pendingProviders: number;
  rejectedProviders: number;
  providersWithServices: number;
  providersWithCompletedBookings: number;
  topProviders: Array<{
    providerId: ID;
    businessName: string;
    completedBookings: number;
    totalRevenue: DecimalString;
    averageRating: number;
    reviewCount: number;
  }>;
};
export type RankedService = {
  serviceId: ID;
  title: string;
  bookingCount: number;
  completedBookingCount: number;
  averageRating: number;
  reviewCount: number;
};
export type ServiceMetrics = {
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
  servicesWithBookings: number;
  mostBookedServices: RankedService[];
  highestRatedServices: RankedService[];
};

export type Success<T> = { success: true; message: string; data: T };
export type Page<T> = {
  meta: { page: number; limit: number; total: number; totalPages: number };
  data: T[];
};
