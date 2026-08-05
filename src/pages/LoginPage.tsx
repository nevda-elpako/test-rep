import { Link, useNavigate } from "react-router-dom";
import { LtIdIcon, ZealIdIcon } from "../components/icons/AuthMethodIcons";

const CHEVRON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 6 15 12 9 18"></polyline>
  </svg>
);

export function LoginPage() {
  const navigate = useNavigate();

  function stub(label: string) {
    alert('Autentifikacijos veiksmas („' + label + '“) bus įgyvendintas vėliau.');
  }

  const options: { label: string; icon: React.ReactNode; onClick: () => void }[] = [
    {
      label: "Smart-ID",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2 A10 10 0 0 1 12 22" strokeLinecap="round"></path>
          <path d="M12 2 A10 10 0 0 0 12 22" strokeLinecap="round" strokeDasharray="2 3"></path>
          <line x1="11.3" y1="9" x2="11.3" y2="16" strokeLinecap="round"></line>
          <circle cx="11.3" cy="6.2" r="1" fill="currentColor" stroke="none"></circle>
        </svg>
      ),
      onClick: () => navigate("/smart-id"),
    },
    {
      label: "Mobile-ID",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="7" y="2.5" width="10" height="19" rx="2"></rect>
          <line x1="11" y1="18.2" x2="13" y2="18.2" strokeLinecap="round"></line>
        </svg>
      ),
      onClick: () => navigate("/mobile-id"),
    },
    {
      label: "USB parašas/Asmens tapatybės kortelė",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="5" y="9" width="14" height="11" rx="2"></rect>
          <path d="M9 9 V6 a3 3 0 0 1 6 0 v3" strokeLinecap="round"></path>
        </svg>
      ),
      onClick: () => navigate("/usb-signature"),
    },
    {
      label: "LT-ID",
      icon: <LtIdIcon />,
      onClick: () => stub("LT-ID"),
    },
    {
      label: "zealID",
      icon: <ZealIdIcon />,
      onClick: () => stub("zealID"),
    },
  ];

  return (
    <div className="card">
      <div className="logo">
        <img src="/elpako_logo.svg" alt="elpako" />
      </div>

      <h1>Prisijungimas</h1>
      <p className="subtitle">Patvirtinkite savo tapatybę jums patogiu būdu</p>

      <div className="options" role="group" aria-label="Autentifikacijos būdai">
        {options.map((option) => (
          <button key={option.label} className="option" type="button" onClick={option.onClick}>
            <span className="option-icon">{option.icon}</span>
            <span className="option-label">{option.label}</span>
            <span className="option-chevron">{CHEVRON}</span>
          </button>
        ))}
      </div>

      <p className="consent" style={{ textAlign: "center", marginTop: 20, marginBottom: 0 }}>
        <Link to="/settings">API nustatymai</Link>
      </p>
    </div>
  );
}
