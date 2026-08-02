import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApiConfig } from "../context/ApiConfigContext";
import { useSession } from "../context/SessionContext";
import { useControlCodeFlow } from "../hooks/useControlCodeFlow";
import { authInitMobileId, authInitSmartId, authStatusMobileId, authStatusSmartId, type AuthStatusResult } from "../services/elpakoApi";

const METHOD_META = {
  "mobile-id": {
    label: "Mobile-ID",
    backHref: "/mobile-id",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="7" y="2.5" width="10" height="19" rx="2"></rect>
        <line x1="11" y1="18.2" x2="13" y2="18.2" strokeLinecap="round"></line>
      </svg>
    ),
  },
  "smart-id": {
    label: "Smart-ID",
    backHref: "/smart-id",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2 A10 10 0 0 1 12 22" strokeLinecap="round"></path>
        <path d="M12 2 A10 10 0 0 0 12 22" strokeLinecap="round" strokeDasharray="2 3"></path>
        <line x1="11.3" y1="9" x2="11.3" y2="16" strokeLinecap="round"></line>
        <circle cx="11.3" cy="6.2" r="1" fill="currentColor" stroke="none"></circle>
      </svg>
    ),
  },
} as const;

interface LoginVerifyPageProps {
  method: "mobile-id" | "smart-id";
}

export function LoginVerifyPage({ method }: LoginVerifyPageProps) {
  const navigate = useNavigate();
  const { config } = useApiConfig();
  const { mobileIdLogin, smartIdLogin, setAuthenticatedUser } = useSession();
  const meta = METHOD_META[method];

  const { status, controlCode, remainingSeconds, errorMessage, start, cancel } = useControlCodeFlow({
    durationSeconds: 120,
    initFn: () => {
      if (method === "mobile-id") {
        return authInitMobileId(config, {
          phone: mobileIdLogin?.phone,
          code: mobileIdLogin?.personalCode,
          message: "Prisijungimas į elpako",
        });
      }
      return authInitSmartId(config, {
        subjectCode: smartIdLogin?.personalCode,
        country: smartIdLogin?.country,
        message: "Prisijungimas į elpako",
      });
    },
    statusFn: (token) => (method === "mobile-id" ? authStatusMobileId(config, token) : authStatusSmartId(config, token)),
    onSuccess: (result: AuthStatusResult) => {
      setAuthenticatedUser({
        name: result.name,
        surname: result.surname,
        code: result.code,
        country: result.country,
        certificate: result.certificate,
      });
      navigate("/dashboard");
    },
  });

  useEffect(() => {
    start();
    // `start` is referentially stable (useCallback with no deps in
    // useControlCodeFlow), so this safely only fires once on mount.
  }, [start]);

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
          <span className="method-icon">{meta.icon}</span>
          <span className="method-name">{meta.label}</span>
        </div>
        <a
          className="back-link"
          href={meta.backHref}
          onClick={(e) => {
            e.preventDefault();
            navigate(meta.backHref);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 6 9 12 15 18"></polyline>
          </svg>
          Atgal
        </a>
      </div>

      <div className="code-box">
        <div className="code-heading">
          <svg className="spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="10 32"></circle>
          </svg>
          <span>Kontrolinis kodas</span>
        </div>
        <div className="code-value">{controlCode ?? "----"}</div>
        <div className={"code-expiry" + (remainingSeconds <= 0 ? " expired" : "")}>
          {remainingSeconds > 0 ? "Kodas baigs galioti po " + remainingSeconds + "s" : "Kodo galiojimo laikas baigėsi"}
        </div>
      </div>

      {status === "error" && errorMessage && <div className="control-error">{errorMessage}</div>}

      <div className="info-box">
        <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9.2"></circle>
          <line x1="12" y1="11" x2="12" y2="16.5" strokeLinecap="round"></line>
          <circle cx="12" cy="7.6" r="1.05" fill="currentColor" stroke="none"></circle>
        </svg>
        <p>Jei ekrane matomas kodas sutampa su kodu matomu telefono ekrane, patvirtinkite savo tapatybę, įvesdami savo sPIN1 kodą.</p>
      </div>

      <div className="cancel-btn-wrap">
        <button
          className="cancel-btn"
          type="button"
          onClick={() => {
            cancel();
            navigate(meta.backHref);
          }}
        >
          Atšaukti
        </button>
      </div>
    </div>
  );
}
