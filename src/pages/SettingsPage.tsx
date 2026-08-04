import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApiConfig } from "../context/ApiConfigContext";
import { Toast } from "../components/Toast";

const TOAST_DURATION_MS = 1800;

export function SettingsPage() {
  const navigate = useNavigate();
  const { config, setConfig } = useApiConfig();
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [accessToken, setAccessToken] = useState(config.accessToken);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => navigate("/"), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [showToast, navigate]);

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

      <h1>API prisijungimas</h1>
      <p className="subtitle">
        Šis demo puslapis kalbasi tiesiogiai su Elpako API iš naršyklės. Įveskite savo aplinkos adresą ir jums suteiktą access_token.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setConfig({ baseUrl: baseUrl.trim(), accessToken: accessToken.trim() });
          setShowToast(true);
        }}
      >
        <div className="form-fields">
          <div className="field">
            <div className="field-label">API adresas (base URL)</div>
            <input type="text" autoComplete="off" spellCheck={false} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </div>

          <div className="field">
            <div className="field-label">Access token</div>
            <input
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="Gautas iš Elpako"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
          </div>
        </div>

        <p className="consent">
          Šis raktas išsaugomas tik jūsų naršyklėje (localStorage) ir naudojamas tiesiogiai kviečiant Elpako API — jis niekur kitur
          nesiunčiamas.
        </p>

        <button className="submit-btn" type="submit">
          Išsaugoti
        </button>
      </form>

      {showToast && <Toast message="API raktas sėkmingai pridėtas" />}
    </div>
  );
}
