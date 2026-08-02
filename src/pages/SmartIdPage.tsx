import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";

export function SmartIdPage() {
  const navigate = useNavigate();
  const { setSmartIdLogin } = useSession();
  const [personalCode, setPersonalCode] = useState("");

  return (
    <div className="card">
      <div className="card-header">
        <div className="logo">
          <img src="/elpako_logo.svg" alt="elpako" />
        </div>
        <button className="close-btn" type="button" aria-label="Uždaryti" onClick={() => navigate("/")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="4" y1="4" x2="20" y2="20"></line>
            <line x1="20" y1="4" x2="4" y2="20"></line>
          </svg>
        </button>
      </div>

      <h1>Prisijungimas</h1>

      <div className="method-row">
        <div className="method-info">
          <span className="method-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2 A10 10 0 0 1 12 22" strokeLinecap="round"></path>
              <path d="M12 2 A10 10 0 0 0 12 22" strokeLinecap="round" strokeDasharray="2 3"></path>
              <line x1="11.3" y1="9" x2="11.3" y2="16" strokeLinecap="round"></line>
              <circle cx="11.3" cy="6.2" r="1" fill="currentColor" stroke="none"></circle>
            </svg>
          </span>
          <span className="method-name">Smart-ID</span>
        </div>
        <a
          className="back-link"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 6 9 12 15 18"></polyline>
          </svg>
          Atgal
        </a>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSmartIdLogin({ personalCode, country: "LT" });
          navigate("/smart-id-verify");
        }}
      >
        <div className="form-fields">
          <div className="field-row">
            <div className="field no-label">
              <input
                type="text"
                placeholder="Asmens kodas"
                inputMode="numeric"
                autoComplete="off"
                value={personalCode}
                onChange={(e) => setPersonalCode(e.target.value)}
              />
              <button
                className="field-clear"
                type="button"
                aria-label="Išvalyti asmens kodą"
                disabled={personalCode.trim().length === 0}
                onClick={() => setPersonalCode("")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="5" y1="5" x2="19" y2="19"></line>
                  <line x1="19" y1="5" x2="5" y2="19"></line>
                </svg>
              </button>
            </div>

            <button className="flag-box" type="button" aria-label="Pasirinkta šalis: Lietuva">
              <span className="flag-lt">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>
        </div>

        <p className="consent">
          Prisijungdami sutinkate su{" "}
          <a href="#" onClick={(e) => e.preventDefault()}>
            naudojimosi taisyklėmis
          </a>{" "}
          ir{" "}
          <a href="#" onClick={(e) => e.preventDefault()}>
            privatumo politika
          </a>
        </p>

        <button className="submit-btn" type="submit">
          Prisijungti
        </button>
      </form>
    </div>
  );
}
