> Historical coverage snapshot. Service ordering now uses serviceId and optional notes only. Availability UI is retired; the legacy route redirects to Services. Current verification is recorded by the test suites.

# Servexa coverage audit

Coverage means a connected browser implementation or an explicit non-browser exception. Deterministic HTTP tests are separate from live backend verification.

## Backend endpoints — 66

| ID | HTTP route | UI/action | Evidence | Status |
|---|---|---|---|---|
| E01 | POST `/auth/register` | Register / Registration | src/features/auth.tsx | implemented |
| E02 | POST `/auth/login` | Login / Login | src/features/auth.tsx | implemented |
| E03 | POST `/auth/refresh-token` | Session adapter / Refresh session | src/api/client.ts | implemented |
| E04 | POST `/auth/logout` | Account menu / Logout | src/app/session.tsx | implemented |
| E05 | GET `/auth/me` | Session adapter / Current identity | src/app/session.tsx | implemented |
| E06 | GET `/users/me` | Profile / Own profile | src/features/auth.tsx | implemented |
| E07 | PATCH `/users/me` | Profile / Edit user profile | src/features/auth.tsx | implemented |
| E08 | GET `/providers/me` | Provider profile / Provider profile | src/features/provider.tsx | implemented |
| E09 | PATCH `/providers/me` | Provider profile / Edit provider profile | src/features/provider.tsx | implemented |
| E10 | GET `/providers/:id` | Provider details / Public provider | src/features/public.tsx | implemented |
| E11 | GET `/categories` | Catalog / Browse categories | src/features/public.tsx | implemented |
| E12 | GET `/services` | Services / Discover services | src/features/public.tsx | implemented |
| E13 | GET `/services/:id` | Service details / Service details | src/features/public.tsx | implemented |
| E14 | GET `/providers/me/services` | Provider services / Own services | src/features/provider.tsx | implemented |
| E15 | POST `/providers/me/services` | Provider service form / Create service | src/features/provider.tsx | implemented |
| E16 | PATCH `/providers/me/services/:id` | Provider service form / Edit service | src/features/provider.tsx | implemented |
| E17 | DELETE `/providers/me/services/:id` | Provider services / Delete service | src/features/provider.tsx | implemented |
| E18 | GET `/services/:serviceId/availability` | Service details / Booking / Available slots | src/features/public.tsx | implemented |
| E19 | GET `/providers/me/availability` | Provider availability / Own slots | src/features/provider.tsx | implemented |
| E20 | POST `/providers/me/availability` | Provider availability / Create slot | src/features/provider.tsx | implemented |
| E21 | PATCH `/providers/me/availability/:id` | Provider availability / Edit slot | src/features/provider.tsx | implemented |
| E22 | DELETE `/providers/me/availability/:id` | Provider availability / Delete slot | src/features/provider.tsx | implemented |
| E23 | POST `/bookings` | Booking / Create booking | src/features/bookings.tsx | implemented |
| E24 | GET `/bookings/me` | Customer bookings / Booking history | src/features/bookings.tsx | implemented |
| E25 | GET `/bookings/:id` | Customer booking detail / Booking detail | src/features/bookings.tsx | implemented |
| E26 | PATCH `/bookings/:id/cancel` | Customer booking detail / Cancel booking | src/features/bookings.tsx | implemented |
| E27 | GET `/providers/me/bookings` | Provider jobs / Incoming/active/history jobs | src/features/bookings.tsx | implemented |
| E28 | GET `/providers/me/bookings/:id` | Provider job detail / Job detail | src/features/bookings.tsx | implemented |
| E29 | PATCH `/providers/me/bookings/:id/accept` | Provider job detail / Accept job | src/features/bookings.tsx | implemented |
| E30 | PATCH `/providers/me/bookings/:id/reject` | Provider job detail / Reject job | src/features/bookings.tsx | implemented |
| E31 | PATCH `/providers/me/bookings/:id/start` | Provider job detail / Start job | src/features/bookings.tsx | implemented |
| E32 | PATCH `/providers/me/bookings/:id/complete` | Provider job detail / Complete job | src/features/bookings.tsx | implemented |
| E33 | POST `/payments/initiate/:bookingId` | Booking payment / Start Checkout | src/features/payments.tsx | implemented |
| E34 | GET `/payments/booking/:bookingId` | Payment return / Booking detail / Payment reconciliation | src/features/payments.tsx | implemented |
| E35 | POST `/payments/stripe/webhook` | Server only / Gateway event | Server-to-server Stripe webhook. Browser must never call. | intentional exception |
| E36 | POST `/reviews` | Completed booking / Reviews / Write review | src/features/reviews.tsx | implemented |
| E37 | GET `/reviews/me` | Customer reviews / Own reviews | src/features/reviews.tsx | implemented |
| E38 | PATCH `/reviews/:id` | Customer reviews / Edit review | src/features/reviews.tsx | implemented |
| E39 | DELETE `/reviews/:id` | Customer reviews / Delete review | src/features/reviews.tsx | implemented |
| E40 | GET `/services/:serviceId/reviews` | Service / Provider details / Public services reviews | src/features/public.tsx | implemented |
| E41 | GET `/services/:serviceId/rating-summary` | Service / Provider details / Live services rating | src/features/public.tsx | implemented |
| E42 | GET `/providers/:providerId/reviews` | Service / Provider details / Public providers reviews | src/features/public.tsx | implemented |
| E43 | GET `/providers/:providerId/rating-summary` | Service / Provider details / Live providers rating | src/features/public.tsx | implemented |
| E44 | GET `/admin/dashboard/overview` | Admin dashboard / Marketplace counts | src/features/admin.tsx | implemented |
| E45 | GET `/admin/dashboard/revenue` | Admin dashboard / Revenue totals | src/features/admin.tsx | implemented |
| E46 | GET `/admin/dashboard/bookings` | Admin dashboard / Booking analytics | src/features/admin.tsx | implemented |
| E47 | GET `/admin/dashboard/providers` | Admin dashboard / Provider analytics | src/features/admin.tsx | implemented |
| E48 | GET `/admin/dashboard/services` | Admin dashboard / Service analytics | src/features/admin.tsx | implemented |
| E49 | GET `/admin/dashboard/recent-activity` | Admin dashboard / Recent audit activity | src/features/admin.tsx | implemented |
| E50 | GET `/admin/audit-logs` | Admin audit / Audit list | src/features/admin.tsx | implemented |
| E51 | GET `/admin/audit-logs/:id` | Admin audit detail / Audit detail | src/features/admin.tsx | implemented |
| E52 | GET `/admin/users` | Admin users / User management list | src/features/admin.tsx | implemented |
| E53 | GET `/admin/users/:id` | Admin user detail / User detail | src/features/admin.tsx | implemented |
| E54 | PATCH `/admin/users/:id/status` | Admin users / User moderation | src/features/admin.tsx | implemented |
| E55 | DELETE `/admin/users/:id` | Admin users / Delete user | src/features/admin.tsx | implemented |
| E56 | GET `/admin/providers` | Admin providers / Provider moderation list | src/features/admin.tsx | implemented |
| E57 | PATCH `/admin/providers/:id/status` | Admin providers / Provider approval/rejection | src/features/admin.tsx | implemented |
| E58 | GET `/admin/categories` | Admin categories / Category management list | src/features/admin.tsx | implemented |
| E59 | POST `/admin/categories` | Admin category form / Create category | src/features/admin.tsx | implemented |
| E60 | PATCH `/admin/categories/:id` | Admin category form / Edit category | src/features/admin.tsx | implemented |
| E61 | DELETE `/admin/categories/:id` | Admin categories / Delete category | src/features/admin.tsx | implemented |
| E62 | GET `/admin/reviews` | Admin reviews / Review moderation list | src/features/admin.tsx | implemented |
| E63 | DELETE `/admin/reviews/:id` | Admin reviews / Moderate review | src/features/admin.tsx | implemented |
| E64 | GET `/health` | Operational probe / Health | Operational GET /health, outside API prefix; not polled by UI. | intentional exception |
| E65 | GET `/payments/success` | Payment return / Checkout success redirect | Backend informational success redirect. Frontend uses E34 + E25. | intentional exception |
| E66 | GET `/payments/cancel` | Payment return / Checkout cancel redirect | Backend informational cancel redirect. Frontend uses E34 + E25. | intentional exception |

## Postman examples — 73

| ID | Example | Endpoint | Page/action or exception |
|---|---|---|---|
| P01 | Health | E64 | Operational GET /health, outside API prefix; not polled by UI. |
| P02 | Register Customer | E01 | Register / Registration |
| P03 | Register Provider | E01 | Register / Registration |
| P04 | Login Customer | E02 | Login / Login |
| P05 | Login Provider | E02 | Login / Login |
| P06 | Login Admin | E02 | Login / Login |
| P07 | Refresh Token | E03 | Session adapter / Refresh session |
| P08 | Logout | E04 | Account menu / Logout |
| P09 | Get Current User | E05 | Session adapter / Current identity |
| P10 | Get My Profile | E06 | Profile / Own profile |
| P11 | Update My Profile | E07 | Profile / Edit user profile |
| P12 | Get My Provider Profile | E08 | Provider profile / Provider profile |
| P13 | Update My Provider Profile | E09 | Provider profile / Edit provider profile |
| P14 | Get Public Provider | E10 | Provider details / Public provider |
| P15 | Get My Services | E14 | Provider services / Own services |
| P16 | Create Service | E15 | Provider service form / Create service |
| P17 | Update Service | E16 | Provider service form / Edit service |
| P18 | Delete Service | E17 | Provider services / Delete service |
| P19 | Get My Availability | E19 | Provider availability / Own slots |
| P20 | Create Availability | E20 | Provider availability / Create slot |
| P21 | Update Availability | E21 | Provider availability / Edit slot |
| P22 | Delete Availability | E22 | Provider availability / Delete slot |
| P23 | Get My Bookings | E27 | Provider jobs / Incoming/active/history jobs |
| P24 | Get Provider Booking | E28 | Provider job detail / Job detail |
| P25 | Accept Booking | E29 | Provider job detail / Accept job |
| P26 | Reject Booking | E30 | Provider job detail / Reject job |
| P27 | Start Booking | E31 | Provider job detail / Start job |
| P28 | Complete Booking | E32 | Provider job detail / Complete job |
| P29 | Public Provider Reviews | E42 | Service / Provider details / Public providers reviews |
| P30 | Provider Rating Summary | E43 | Service / Provider details / Live providers rating |
| P31 | Public Category List | E11 | Catalog / Browse categories |
| P32 | Admin Category List | E58 | Admin categories / Category management list |
| P33 | Admin Create Category | E59 | Admin category form / Create category |
| P34 | Admin Update Category | E60 | Admin category form / Edit category |
| P35 | Admin Delete Category | E61 | Admin categories / Delete category |
| P36 | Public Service List | E12 | Services / Discover services |
| P37 | Public Service Detail | E13 | Service details / Service details |
| P38 | Search Services | E12 | Services / Discover services |
| P39 | Filter by Category | E12 | Services / Discover services |
| P40 | Filter by Price | E12 | Services / Discover services |
| P41 | Filter by City | E12 | Services / Discover services |
| P42 | Service Availability | E18 | Service details / Booking / Available slots |
| P43 | Service Reviews | E40 | Service / Provider details / Public services reviews |
| P44 | Service Rating Summary | E41 | Service / Provider details / Live services rating |
| P45 | Create Booking | E23 | Booking / Create booking |
| P46 | My Bookings | E24 | Customer bookings / Booking history |
| P47 | Booking Detail | E25 | Customer booking detail / Booking detail |
| P48 | Cancel Booking | E26 | Customer booking detail / Cancel booking |
| P49 | Initiate Stripe Checkout | E33 | Booking payment / Start Checkout |
| P50 | Get Payment by Booking | E34 | Payment return / Booking detail / Payment reconciliation |
| P51 | Stripe Webhook (documentation only) | E35 | Server-to-server Stripe webhook. Browser must never call. |
| P52 | Payment Success Redirect (informational) | E65 | Backend informational success redirect. Frontend uses E34 + E25. |
| P53 | Payment Cancel Redirect (informational) | E66 | Backend informational cancel redirect. Frontend uses E34 + E25. |
| P54 | Create Review | E36 | Completed booking / Reviews / Write review |
| P55 | My Reviews | E37 | Customer reviews / Own reviews |
| P56 | Update Review | E38 | Customer reviews / Edit review |
| P57 | Delete Review | E39 | Customer reviews / Delete review |
| P58 | List Users | E52 | Admin users / User management list |
| P59 | Get User | E53 | Admin user detail / User detail |
| P60 | Update User Status | E54 | Admin users / User moderation |
| P61 | Soft Delete User | E55 | Admin users / Delete user |
| P62 | List Providers | E56 | Admin providers / Provider moderation list |
| P63 | Update Provider Status | E57 | Admin providers / Provider approval/rejection |
| P64 | Admin Review List | E62 | Admin reviews / Review moderation list |
| P65 | Admin Delete Review | E63 | Admin reviews / Moderate review |
| P66 | Overview | E44 | Admin dashboard / Marketplace counts |
| P67 | Revenue | E45 | Admin dashboard / Revenue totals |
| P68 | Booking Analytics | E46 | Admin dashboard / Booking analytics |
| P69 | Provider Analytics | E47 | Admin dashboard / Provider analytics |
| P70 | Service Analytics | E48 | Admin dashboard / Service analytics |
| P71 | Recent Activity | E49 | Admin dashboard / Recent audit activity |
| P72 | List Audit Logs | E50 | Admin audit / Audit list |
| P73 | Audit Log Detail | E51 | Admin audit detail / Audit detail |

## Screens — 31

All screens share loading, background-fetch, error and empty-result components; forms preserve values on ordinary errors and disable pending actions. Destructive mutations require native dialog confirmation. Read-only pages have no mutation state.

| ID | Route | Role | Implementation |
|---|---|---|---|
| UI01 | `/` | Public | src/features/public.tsx |
| UI02 | `/services` | Public | src/features/public.tsx |
| UI03 | `/services/:serviceId` | Public | src/features/public.tsx |
| UI04 | `/providers/:providerId` | Public | src/features/public.tsx |
| UI05 | `/register` | Public | src/features/auth.tsx |
| UI06 | `/login` | Public | src/features/auth.tsx |
| UI07 | `/account/profile` | Any | src/features/auth.tsx |
| UI08 | `/customer` | CUSTOMER | src/features/bookings.tsx |
| UI09 | `/customer/bookings` | CUSTOMER | src/features/bookings.tsx |
| UI10 | `/customer/bookings/new?serviceId=...&slotId=...` | CUSTOMER | src/features/bookings.tsx |
| UI11 | `/customer/bookings/:bookingId` | CUSTOMER | src/features/bookings.tsx |
| UI12 | `/payments/success` | CUSTOMER return context | src/features/payments.tsx |
| UI13 | `/payments/cancel` | CUSTOMER return context | src/features/payments.tsx |
| UI14 | `/customer/reviews` | CUSTOMER | src/features/reviews.tsx |
| UI15 | `/provider` | PROVIDER | src/features/provider.tsx |
| UI16 | `/provider/profile` | PROVIDER | src/features/provider.tsx |
| UI17 | `/provider/services` | PROVIDER | src/features/provider.tsx |
| UI18 | `/provider/services/new` | PROVIDER | src/features/provider.tsx |
| UI19 | `/provider/services/:serviceId/edit` | PROVIDER | src/features/provider.tsx |
| UI20 | `/provider/availability` | PROVIDER | src/features/provider.tsx |
| UI21 | `/provider/bookings` | PROVIDER | src/features/bookings.tsx |
| UI22 | `/provider/bookings/:bookingId` | PROVIDER | src/features/bookings.tsx |
| UI23 | `/provider/reviews` | PROVIDER | src/features/provider.tsx |
| UI24 | `/admin` | ADMIN | src/features/admin.tsx |
| UI25 | `/admin/users` | ADMIN | src/features/admin.tsx |
| UI26 | `/admin/users/:userId` | ADMIN | src/features/admin.tsx |
| UI27 | `/admin/providers` | ADMIN | src/features/admin.tsx |
| UI28 | `/admin/categories` | ADMIN | src/features/admin.tsx |
| UI29 | `/admin/reviews` | ADMIN | src/features/admin.tsx |
| UI30 | `/admin/audit-logs` | ADMIN | src/features/admin.tsx |
| UI31 | `/admin/audit-logs/:auditLogId` | ADMIN | src/features/admin.tsx |
