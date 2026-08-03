import { HashRouter, Route, Routes } from "react-router-dom";
import { ApiConfigProvider } from "./context/ApiConfigContext";
import { SessionProvider } from "./context/SessionContext";
import { ApiConnectionBanner } from "./components/ApiConnectionBanner";
import { AuthLayout } from "./components/AuthLayout";
import { LoginPage } from "./pages/LoginPage";
import { MobileIdPage } from "./pages/MobileIdPage";
import { SmartIdPage } from "./pages/SmartIdPage";
import { LoginVerifyPage } from "./pages/LoginVerifyPage";
import { UsbSignaturePage } from "./pages/UsbSignaturePage";
import { SettingsPage } from "./pages/SettingsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { SignDocumentPage } from "./pages/SignDocumentPage";
import { DocumentSigningPage } from "./pages/DocumentSigningPage";
import { VerifyDocumentPage } from "./pages/VerifyDocumentPage";

function App() {
  return (
    <ApiConfigProvider>
      <SessionProvider>
        <HashRouter>
          <ApiConnectionBanner />
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/" element={<LoginPage />} />
              <Route path="/mobile-id" element={<MobileIdPage />} />
              <Route path="/mobile-id-verify" element={<LoginVerifyPage method="mobile-id" />} />
              <Route path="/smart-id" element={<SmartIdPage />} />
              <Route path="/smart-id-verify" element={<LoginVerifyPage method="smart-id" />} />
              <Route path="/usb-signature" element={<UsbSignaturePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/sign-document" element={<SignDocumentPage />} />
            <Route path="/document-signing" element={<DocumentSigningPage />} />
            <Route path="/verify-document" element={<VerifyDocumentPage />} />
          </Routes>
        </HashRouter>
      </SessionProvider>
    </ApiConfigProvider>
  );
}

export default App;
