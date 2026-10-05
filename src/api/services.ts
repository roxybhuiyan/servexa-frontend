import type * as T from "./types";
import type * as B from "../contracts/forms";
import { client, queryString } from "./client";
import { parseQuery } from "../contracts/queries";
export const endpoints = {
  E01: { method: "POST", path: "/auth/register", public: true },
  E02: { method: "POST", path: "/auth/login", public: true },
  E03: { method: "POST", path: "/auth/refresh-token", public: true },
  E04: { method: "POST", path: "/auth/logout", public: true },
  E05: { method: "GET", path: "/auth/me", public: false },
  E06: { method: "GET", path: "/users/me", public: false },
  E07: { method: "PATCH", path: "/users/me", public: false },
  E08: { method: "GET", path: "/providers/me", public: false },
  E09: { method: "PATCH", path: "/providers/me", public: false },
  E10: { method: "GET", path: "/providers/:id", public: true },
  E11: { method: "GET", path: "/categories", public: true },
  E12: { method: "GET", path: "/services", public: true },
  E13: { method: "GET", path: "/services/:id", public: true },
  E14: { method: "GET", path: "/providers/me/services", public: false },
  E15: { method: "POST", path: "/providers/me/services", public: false },
  E16: { method: "PATCH", path: "/providers/me/services/:id", public: false },
  E17: { method: "DELETE", path: "/providers/me/services/:id", public: false },
  E18: {
    method: "GET",
    path: "/services/:serviceId/availability",
    public: true,
  },
  E19: { method: "GET", path: "/providers/me/availability", public: false },
  E20: { method: "POST", path: "/providers/me/availability", public: false },
  E21: {
    method: "PATCH",
    path: "/providers/me/availability/:id",
    public: false,
  },
  E22: {
    method: "DELETE",
    path: "/providers/me/availability/:id",
    public: false,
  },
  E23: { method: "POST", path: "/bookings", public: false },
  E24: { method: "GET", path: "/bookings/me", public: false },
  E25: { method: "GET", path: "/bookings/:id", public: false },
  E26: { method: "PATCH", path: "/bookings/:id/cancel", public: false },
  E27: { method: "GET", path: "/providers/me/bookings", public: false },
  E28: { method: "GET", path: "/providers/me/bookings/:id", public: false },
  E29: {
    method: "PATCH",
    path: "/providers/me/bookings/:id/accept",
    public: false,
  },
  E30: {
    method: "PATCH",
    path: "/providers/me/bookings/:id/reject",
    public: false,
  },
  E31: {
    method: "PATCH",
    path: "/providers/me/bookings/:id/start",
    public: false,
  },
  E32: {
    method: "PATCH",
    path: "/providers/me/bookings/:id/complete",
    public: false,
  },
  E33: { method: "POST", path: "/payments/initiate/:bookingId", public: false },
  E34: { method: "GET", path: "/payments/booking/:bookingId", public: false },
  E36: { method: "POST", path: "/reviews", public: false },
  E37: { method: "GET", path: "/reviews/me", public: false },
  E38: { method: "PATCH", path: "/reviews/:id", public: false },
  E39: { method: "DELETE", path: "/reviews/:id", public: false },
  E40: { method: "GET", path: "/services/:serviceId/reviews", public: true },
  E41: {
    method: "GET",
    path: "/services/:serviceId/rating-summary",
    public: true,
  },
  E42: { method: "GET", path: "/providers/:providerId/reviews", public: true },
  E43: {
    method: "GET",
    path: "/providers/:providerId/rating-summary",
    public: true,
  },
  E44: { method: "GET", path: "/admin/dashboard/overview", public: false },
  E45: { method: "GET", path: "/admin/dashboard/revenue", public: false },
  E46: { method: "GET", path: "/admin/dashboard/bookings", public: false },
  E47: { method: "GET", path: "/admin/dashboard/providers", public: false },
  E48: { method: "GET", path: "/admin/dashboard/services", public: false },
  E49: {
    method: "GET",
    path: "/admin/dashboard/recent-activity",
    public: false,
  },
  E50: { method: "GET", path: "/admin/audit-logs", public: false },
  E51: { method: "GET", path: "/admin/audit-logs/:id", public: false },
  E52: { method: "GET", path: "/admin/users", public: false },
  E53: { method: "GET", path: "/admin/users/:id", public: false },
  E54: { method: "PATCH", path: "/admin/users/:id/status", public: false },
  E55: { method: "DELETE", path: "/admin/users/:id", public: false },
  E56: { method: "GET", path: "/admin/providers", public: false },
  E57: { method: "PATCH", path: "/admin/providers/:id/status", public: false },
  E58: { method: "GET", path: "/admin/categories", public: false },
  E59: { method: "POST", path: "/admin/categories", public: false },
  E60: { method: "PATCH", path: "/admin/categories/:id", public: false },
  E61: { method: "DELETE", path: "/admin/categories/:id", public: false },
  E62: { method: "GET", path: "/admin/reviews", public: false },
  E63: { method: "DELETE", path: "/admin/reviews/:id", public: false },
} as const;
export interface Responses {
  E01: T.AuthUser;
  E02: T.TokenPair;
  E03: T.TokenPair;
  E04: null;
  E05: T.AuthUser;
  E06: T.UserProfile;
  E07: T.UserProfile;
  E08: T.ProviderSelf;
  E09: T.ProviderSelf;
  E10: T.ProviderPublic;
  E11: T.Category[];
  E12: T.Page<T.PublicService>;
  E13: T.PublicService;
  E14: T.Page<T.OwnService>;
  E15: T.OwnService;
  E16: T.OwnService;
  E17: null;
  E18: T.Page<T.PublicSlot>;
  E19: T.Page<T.OwnSlot>;
  E20: T.OwnSlot;
  E21: T.OwnSlot;
  E22: null;
  E23: T.CustomerBooking;
  E24: T.Page<T.CustomerBooking>;
  E25: T.CustomerBooking;
  E26: T.CustomerBooking;
  E27: T.Page<T.ProviderBooking>;
  E28: T.ProviderBooking;
  E29: T.ProviderBooking;
  E30: T.ProviderBooking;
  E31: T.ProviderBooking;
  E32: T.ProviderBooking;
  E33: T.Checkout;
  E34: T.PaymentState;
  E36: T.OwnReview;
  E37: T.Page<T.OwnReview>;
  E38: T.OwnReview;
  E39: null;
  E40: T.Page<T.PublicReview>;
  E41: T.RatingSummary;
  E42: T.Page<T.PublicReview>;
  E43: T.RatingSummary;
  E44: T.Overview;
  E45: T.Revenue;
  E46: T.BookingMetrics;
  E47: T.ProviderMetrics;
  E48: T.ServiceMetrics;
  E49: T.Activity[];
  E50: T.Page<T.Audit>;
  E51: T.Audit;
  E52: T.Page<T.AdminUser>;
  E53: T.AdminUser;
  E54: T.AdminUser;
  E55: null;
  E56: T.Page<T.AdminProvider>;
  E57: T.AdminProvider;
  E58: T.Page<T.Category>;
  E59: T.Category;
  E60: T.Category;
  E61: null;
  E62: T.Page<T.AdminReview>;
  E63: null;
}
export interface Bodies {
  E01: B.Register;
  E02: B.Login;
  E03: B.TokenBody;
  E04: B.TokenBody;
  E05: undefined;
  E06: undefined;
  E07: B.PatchUser;
  E08: undefined;
  E09: B.PatchProvider;
  E10: undefined;
  E11: undefined;
  E12: undefined;
  E13: undefined;
  E14: undefined;
  E15: B.CreateService;
  E16: B.PatchService;
  E17: undefined;
  E18: undefined;
  E19: undefined;
  E20: B.CreateSlot;
  E21: B.PatchSlot;
  E22: undefined;
  E23: B.CreateBooking;
  E24: undefined;
  E25: undefined;
  E26: undefined;
  E27: undefined;
  E28: undefined;
  E29: undefined;
  E30: undefined;
  E31: undefined;
  E32: undefined;
  E33: undefined;
  E34: undefined;
  E36: B.CreateReview;
  E37: undefined;
  E38: B.PatchReview;
  E39: undefined;
  E40: undefined;
  E41: undefined;
  E42: undefined;
  E43: undefined;
  E44: undefined;
  E45: undefined;
  E46: undefined;
  E47: undefined;
  E48: undefined;
  E49: undefined;
  E50: undefined;
  E51: undefined;
  E52: undefined;
  E53: undefined;
  E54: B.UserStatusBody;
  E55: undefined;
  E56: undefined;
  E57: B.ProviderStatusBody;
  E58: undefined;
  E59: B.CreateCategory;
  E60: B.PatchCategory;
  E61: undefined;
  E62: undefined;
  E63: undefined;
}
export type Endpoint = keyof typeof endpoints;
export function api<E extends Endpoint>(
  id: E,
  options: {
    id?: string;
    query?: Record<string, unknown>;
    body?: Bodies[E];
    signal?: AbortSignal;
  } = {},
): Promise<Responses[E]> {
  const route = endpoints[id];
  const path = route.path.replace(/:[A-Za-z]+/g, () => {
    if (!options.id) throw new Error("Resource ID required");
    return encodeURIComponent(options.id);
  });
  return client.request<Responses[E]>(
    path + queryString(parseQuery(id, options.query)),
    {
      method: route.method,
      public: route.public,
      body: options.body,
      signal: options.signal,
    },
  );
}
