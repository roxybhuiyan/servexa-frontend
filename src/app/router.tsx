import { useState, useEffect, lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useSession, home } from "./session";
import type { UserRole } from "../api/types";
import { Loading, ErrorBox, Title, Panel } from "../components/ui";
import { Footer } from "../components/Footer";
import { Catalog, ServiceDetail, ProviderDetail } from "../features/public";
import { AuthPage, Profile } from "../features/auth";
import { BookingList, NewBooking, BookingDetail } from "../features/bookings";
import { OwnReviews } from "../features/reviews";
import { PaymentReturn } from "../features/payments";
import {
  Approval,
  ProviderDashboard,
  ProviderProfile,
  ProviderServices,
  ServiceEditor,
  ProviderReviews,
} from "../features/provider";
const AdminDashboard = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.AdminDashboard })),
);
const AdminUsers = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.AdminUsers })),
);
const AdminUserDetail = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.AdminUserDetail })),
);
const AdminProviders = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.AdminProviders })),
);
const AdminCategories = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.AdminCategories })),
);
const AdminReviews = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.AdminReviews })),
);
const AuditList = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.AuditList })),
);
const AuditDetail = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.AuditDetail })),
);
export function Guard({ role }: { role?: UserRole }) {
  const { user, hydrating, error } = useSession();
  const location = useLocation();
  if (hydrating) return <Loading />;
  if (!user)
    return (
      <>
        {error && <ErrorBox error={error} />}
        <Navigate
          to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
          replace
        />
      </>
    );
  if (role && role !== user.role) return <Failure forbidden />;
  return (
    <Suspense fallback={<Loading />}>
      <Outlet />
    </Suspense>
  );
}
const links = {
  CUSTOMER: [
    ["/customer", "Overview"],
    ["/customer/bookings", "Bookings"],
    ["/customer/reviews", "My reviews"],
    ["/account/profile", "Profile"],
  ],
  PROVIDER: [
    ["/provider", "Overview"],
    ["/provider/profile", "Business profile"],
    ["/provider/services", "Services"],
    ["/provider/bookings", "Jobs"],
    ["/provider/reviews", "Reviews"],
    ["/account/profile", "Account"],
  ],
  ADMIN: [
    ["/admin", "Overview"],
    ["/admin/users", "Users"],
    ["/admin/providers", "Providers"],
    ["/admin/categories", "Categories"],
    ["/admin/reviews", "Reviews"],
    ["/admin/audit-logs", "Audit trail"],
    ["/account/profile", "Account"],
  ],
};
function Shell() {
  const session = useSession(),
    location = useLocation();
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const privatePage =
    /^\/(customer|provider(?:\/|$)|admin|account|payments)/.test(
      location.pathname,
    );
  return (
    <div className="app-shell">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <div className="layout-container topbar-inner">
          <Link className="brand" to="/">
            s<span>Servexa</span>
            <sup>↗</sup>
          </Link>
          <nav aria-label="Main navigation">
            <NavLink to="/services">Explore services</NavLink>
            {session.user ? (
              <>
                <Link to={home(session.user.role)}>Workspace</Link>
                <button
                  onClick={() => {
                    setError(null);
                    void session.logout().catch(setError);
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Sign in</Link>
                <Link className="button primary" to="/register">
                  Get started ↗
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <div
        className={
          privatePage && session.user
            ? "workspace"
            : "layout-container public-shell"
        }
      >
        {privatePage && session.user && (
          <aside className="sidebar">
            <small>{session.user.role} WORKSPACE</small>
            <p>{session.user.name}</p>
            <nav aria-label="Workspace navigation">
              {links[session.user.role].map(([path, title]) => (
                <NavLink key={path} to={path} end>
                  {title}
                  <span aria-hidden="true">↗</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        )}
        <main id="main" tabIndex={-1}>
          <ErrorBox error={error} />
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <Footer />
    </div>
  );
}
function Failure({ forbidden = false }: { forbidden?: boolean }) {
  return (
    <>
      <Title
        title={
          forbidden
            ? "This space is not available to your account."
            : "We could not find that page."
        }
        eyebrow={forbidden ? "403 / ACCESS RESTRICTED" : "404 / PAGE NOT FOUND"}
      />
      <Panel>
        <Link to="/">Return home →</Link>
      </Panel>
    </>
  );
}
export const router = createBrowserRouter([
  {
    element: <Shell />,
    errorElement: <Failure />,
    children: [
      { path: "/", element: <Catalog landing /> },
      { path: "/services", element: <Catalog /> },
      { path: "/services/:serviceId", element: <ServiceDetail /> },
      { path: "/providers/:providerId", element: <ProviderDetail /> },
      { path: "/register", element: <AuthPage registration /> },
      { path: "/login", element: <AuthPage /> },
      {
        element: <Guard />,
        children: [{ path: "/account/profile", element: <Profile /> }],
      },
      {
        element: <Guard role="CUSTOMER" />,
        children: [
          { path: "/customer", element: <BookingList dashboard /> },
          { path: "/customer/bookings", element: <BookingList /> },
          { path: "/customer/bookings/new", element: <NewBooking /> },
          { path: "/customer/bookings/:bookingId", element: <BookingDetail /> },
          { path: "/customer/reviews", element: <OwnReviews /> },
          { path: "/payments/success", element: <PaymentReturn /> },
          { path: "/payments/cancel", element: <PaymentReturn /> },
        ],
      },
      {
        element: <Guard role="PROVIDER" />,
        children: [
          { path: "/provider", element: <ProviderDashboard /> },
          { path: "/provider/profile", element: <ProviderProfile /> },
          { path: "/provider/services", element: <ProviderServices /> },
          { path: "/provider/services/new", element: <ServiceEditor /> },
          {
            path: "/provider/services/:serviceId/edit",
            element: <ServiceEditor />,
          },
          {
            path: "/provider/availability",
            element: <Navigate to="/provider/services" replace />,
          },
          {
            path: "/provider/bookings",
            element: (
              <Approval>
                <BookingList provider />
              </Approval>
            ),
          },
          {
            path: "/provider/bookings/:bookingId",
            element: (
              <Approval>
                <BookingDetail provider />
              </Approval>
            ),
          },
          { path: "/provider/reviews", element: <ProviderReviews /> },
        ],
      },
      {
        element: <Guard role="ADMIN" />,
        children: [
          { path: "/admin", element: <AdminDashboard /> },
          { path: "/admin/users", element: <AdminUsers /> },
          { path: "/admin/users/:userId", element: <AdminUserDetail /> },
          { path: "/admin/providers", element: <AdminProviders /> },
          { path: "/admin/categories", element: <AdminCategories /> },
          { path: "/admin/reviews", element: <AdminReviews /> },
          { path: "/admin/audit-logs", element: <AuditList /> },
          { path: "/admin/audit-logs/:auditLogId", element: <AuditDetail /> },
        ],
      },
      { path: "/403", element: <Failure forbidden /> },
      { path: "*", element: <Failure /> },
    ],
  },
]);
