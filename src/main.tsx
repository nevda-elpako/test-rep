import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/styles.css";
import "./styles/dashboard.css";
import "./styles/documents.css";
import "./styles/document-signing.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
