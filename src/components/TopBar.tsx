import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";

const SHOW_NAV_LINKS = false;

export function TopBar() {
  const navigate = useNavigate();
  const { authenticatedUser, setAuthenticatedUser, setMobileIdLogin, setSmartIdLogin } = useSession();

  const displayName = authenticatedUser
    ? [authenticatedUser.name, authenticatedUser.surname].filter(Boolean).join(" ")
    : "DummyName DummySurname";

  function handleLogout() {
    setAuthenticatedUser(null);
    setMobileIdLogin(null);
    setSmartIdLogin(null);
    navigate("/");
  }

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

          <div className="topbar-user">
            <span className="topbar-user-name">{displayName}</span>
            <button type="button" className="topbar-logout-btn" aria-label="Atsijungti" title="Atsijungti" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"></path>
                <path d="M13 16l4-4-4-4"></path>
                <path d="M17 12H8"></path>
              </svg>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
