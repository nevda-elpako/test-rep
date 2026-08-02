import { Link } from "react-router-dom";
import { useApiConfig } from "../context/ApiConfigContext";

export function ApiConnectionBanner() {
  const { hasAccessToken } = useApiConfig();
  if (hasAccessToken) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 1000,
        background: "#ab4cd3",
        color: "#ffffff",
        fontFamily: "'Segoe UI','Helvetica Neue',Arial,sans-serif",
        fontSize: 14,
        textAlign: "center",
        padding: "10px 16px",
        boxSizing: "border-box",
      }}
    >
      Nenustatytas API raktas.{" "}
      <Link to="/settings" style={{ color: "#ffffff", fontWeight: 700, textDecoration: "underline" }}>
        Nustatyti API prisijungimą
      </Link>
    </div>
  );
}
