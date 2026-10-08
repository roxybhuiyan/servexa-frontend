import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { home, useSession } from "../app/session";

export function Header({ onError }: { onError: (error: unknown) => void }) {
  const session = useSession();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const workspace = session.user ? home(session.user.role) : "";
  const workspaceActive =
    !!workspace &&
    (location.pathname === workspace ||
      location.pathname.startsWith(`${workspace}/`) ||
      /^\/(account|payments)(\/|$)/.test(location.pathname));
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search, session.user?.id]);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 601px)");
    const close = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, []);
  return (
    <header
      className="topbar"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <div className="layout-container topbar-inner">
        <Link
          className="brand"
          to="/"
          aria-label="Servexa home"
          onClick={() => setOpen(false)}
        >
          s<span>Servexa</span>
          <sup aria-hidden="true">↗</sup>
        </Link>
        <button
          ref={toggle}
          type="button"
          className="header-menu-toggle"
          aria-expanded={open}
          aria-controls="header-navigation"
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true">{open ? "×" : "☰"}</span>{" "}
          {open ? "Close" : "Menu"}
        </button>
        <nav
          id="header-navigation"
          className={open ? "header-navigation is-open" : "header-navigation"}
          aria-label="Main navigation"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <NavLink className="header-link" to="/services">
            Explore services
          </NavLink>
          {session.user ? (
            <>
              <Link
                className={`header-link${workspaceActive ? " active" : ""}`}
                aria-current={workspaceActive ? "page" : undefined}
                to={workspace}
              >
                Workspace
              </Link>
              <div className="header-actions">
                <button
                  onClick={() => {
                    onError(null);
                    void session
                      .logout()
                      .then(() => setOpen(false))
                      .catch(onError);
                  }}
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <div className="header-actions">
              <NavLink className="header-link" to="/login">
                Sign in
              </NavLink>
              <Link className="button primary" to="/register">
                Get started <span aria-hidden="true">↗</span>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
