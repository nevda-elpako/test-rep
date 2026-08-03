import { Link, Navigate, useNavigate } from "react-router-dom";
import { useApiConfig } from "../context/ApiConfigContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { hasAccessToken } = useApiConfig();

  // No point offering login methods before the API connection is set up —
  // send the user to Settings first.
  if (!hasAccessToken) {
    return <Navigate to="/settings" replace />;
  }

  return (
    <div className="card">
      <div className="logo">
        <img src="/elpako_logo.svg" alt="elpako" />
      </div>

      <h1>Prisijungimas</h1>
      <p className="subtitle">Patvirtinkite savo tapatybę jums patogiu būdu</p>

      <div className="options" role="group" aria-label="Autentifikacijos būdai">
        <button className="option" type="button" onClick={() => navigate("/mobile-id")}>
          <span className="option-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="7" y="2.5" width="10" height="19" rx="2"></rect>
              <line x1="11" y1="18.2" x2="13" y2="18.2" strokeLinecap="round"></line>
            </svg>
          </span>
          <span className="option-label">Mobile-ID</span>
          <span className="option-chevron">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 6 15 12 9 18"></polyline>
            </svg>
          </span>
        </button>

        <button className="option" type="button" onClick={() => navigate("/smart-id")}>
          <span className="option-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2 A10 10 0 0 1 12 22" strokeLinecap="round"></path>
              <path d="M12 2 A10 10 0 0 0 12 22" strokeLinecap="round" strokeDasharray="2 3"></path>
              <line x1="11.3" y1="9" x2="11.3" y2="16" strokeLinecap="round"></line>
              <circle cx="11.3" cy="6.2" r="1" fill="currentColor" stroke="none"></circle>
            </svg>
          </span>
          <span className="option-label">Smart-ID</span>
          <span className="option-chevron">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 6 15 12 9 18"></polyline>
            </svg>
          </span>
        </button>

        <button className="option" type="button" onClick={() => navigate("/usb-signature")}>
          <span className="option-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="5" y="9" width="14" height="11" rx="2"></rect>
              <path d="M9 9 V6 a3 3 0 0 1 6 0 v3" strokeLinecap="round"></path>
            </svg>
          </span>
          <span className="option-label">USB parašas</span>
          <span className="option-chevron">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 6 15 12 9 18"></polyline>
            </svg>
          </span>
        </button>
      </div>

      <p className="consent" style={{ textAlign: "center", marginTop: 20, marginBottom: 0 }}>
        <Link to="/settings">API nustatymai</Link>
      </p>
    </div>
  );
}
