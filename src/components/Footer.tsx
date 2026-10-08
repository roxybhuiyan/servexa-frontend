import { Link } from "react-router-dom";
import { home, useSession } from "../app/session";

export function Footer() {
  const { user, hydrating } = useSession();
  // Wait for session hydration before deciding whether to expose provider links.
  const providerLinks = !hydrating && (!user || user.role === "PROVIDER");
  return (
    <footer className="site-footer">
      <div className="layout-container footer-inner" data-reveal>
        <div className="footer-columns">
          <div className="footer-brand-block">
            <Link className="brand" to="/">
              <span>Servexa</span>
              <sup aria-hidden="true">↗</sup>
            </Link>
            <p className="footer-tagline">Good service. Less searching.</p>
            <p className="footer-description">
              Find trusted services, place orders, and manage everything in one
              place.
            </p>
          </div>
          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore">Explore</h2>
            <Link to="/services">Explore Services</Link>
            <Link to="/services">All Services</Link>
            <Link to="/services">Categories</Link>
          </nav>
          <nav aria-labelledby="footer-providers">
            <h2 id="footer-providers">For Providers</h2>
            {providerLinks ? (
              <>
                <Link to="/provider">Provider Workspace</Link>
                <Link to="/provider/services/new">Add Service</Link>
                <Link to="/provider/services">Manage Services</Link>
                <Link to="/provider/bookings">Jobs</Link>
              </>
            ) : (
              <p className="footer-description">
                {hydrating
                  ? "Checking your account…"
                  : "Service management tools are available with a provider account."}
              </p>
            )}
          </nav>
          <nav aria-labelledby="footer-account">
            <h2 id="footer-account">Account</h2>
            {hydrating ? (
              <p className="footer-description">Checking your account…</p>
            ) : user ? (
              <>
                <Link to={home(user.role)}>Workspace</Link>
                {user.role === "CUSTOMER" && (
                  <Link to="/customer/bookings">My Bookings</Link>
                )}
                <Link to="/account/profile">My Account</Link>
              </>
            ) : (
              <>
                <Link to="/login">Sign In</Link>
                <Link to="/register">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Servexa. All rights reserved.
          </span>
          <Link to="/services">
            Find your next service <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
