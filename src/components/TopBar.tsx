import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { useEffect, useRef, useState } from "react";

const SHOW_NAV_LINKS = false;

export function TopBar() {
  const { authenticatedUser } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = authenticatedUser
    ? [authenticatedUser.name, authenticatedUser.surname].filter(Boolean).join(" ")
    : "DummyName DummySurname";

  useEffect(() => {
    function onDocumentClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/dashboard" className="topbar-logo">
          <img src="/elpako_logo.svg" alt="elpako" />
        </Link>

        <nav className="topbar-nav">
          {/* Nav links hidden for now (still non-functional stubs / just
              duplicate the dashboard's own upload cards) — re-enable by
              uncommenting when there's somewhere for them to actually go. */}
          {SHOW_NAV_LINKS && (
            <>
              <a href="#" className="nav-link" onClick={(e) => e.preventDefault()}>
                Admin
              </a>
              <a href="#" className="nav-link" onClick={(e) => e.preventDefault()}>
                Mano dokumentai
              </a>
              <Link to="/dashboard" className="nav-link">
                Pasirašyti dokumentą
              </Link>
              <Link to="/dashboard" className="nav-link">
                Patikrinti dokumentą
              </Link>
            </>
          )}

          <div className="user-menu" ref={menuRef}>
            <button
              type="button"
              className="user-menu-btn"
              aria-expanded={open}
              onClick={(e) => {
                e.stopPropagation();
                setOpen((o) => !o);
              }}
            >
              <span>{displayName}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="user-menu-dropdown" hidden={!open}>
              <a href="#" onClick={(e) => e.preventDefault()}>
                Mano paskyra
              </a>
              <a href="#" onClick={(e) => e.preventDefault()}>
                Atsijungti
              </a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
