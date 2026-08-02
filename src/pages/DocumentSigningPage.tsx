import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/TopBar";
import { ParticipantsList, type Participant } from "../components/ParticipantsList";
import { useApiConfig } from "../context/ApiConfigContext";
import { useSession, type DocumentMeta } from "../context/SessionContext";
import { useControlCodeFlow } from "../hooks/useControlCodeFlow";
import {
  signInitMobileId,
  signInitSmartId,
  signStatusMobileId,
  signStatusSmartId,
  type SignInitResult,
  type SignStatusResult,
  type SignedFile,
} from "../services/elpakoApi";
import { formatFileSize } from "../utils/files";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type MethodKey = "mobile-id" | "usb" | "advanced" | "smart-id";
type SignaturePosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

// Used only when the page is opened directly (no handoff data from
// sign-document), so the page can still be previewed/demoed on its own.
const DEFAULT_DOCUMENT: DocumentMeta = { name: "Instrukcija_Naujam_ELPAKO_programuotojui.pdf", size: 55000 };

let nextId = 1;
function uid() {
  return "p-" + nextId++;
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function DocumentSigningPage() {
  const { config } = useApiConfig();
  const { signingSession, mobileIdLogin, smartIdLogin, authenticatedUser } = useSession();

  const currentUserName = useMemo(
    () => [authenticatedUser?.name, authenticatedUser?.surname].filter(Boolean).join(" ") || "DummyName DummySurname",
    [authenticatedUser]
  );

  const session = signingSession ?? { document: null, format: "pdf", willSign: true, participants: [] as string[] };
  const document_ = session.document ?? DEFAULT_DOCUMENT;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [willSign, setWillSign] = useState(session.willSign);
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition>("top-left");
  const [activeMethod, setActiveMethod] = useState<MethodKey>("mobile-id");
  const [signedFile, setSignedFile] = useState<SignedFile | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newEmailInvalid, setNewEmailInvalid] = useState(false);
  const [newMessageEnabled, setNewMessageEnabled] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Seed participants from the handoff session, once.
  useEffect(() => {
    const now = new Date();
    const initial: Participant[] = [];
    if (session.willSign) {
      initial.push({ id: uid(), name: currentUserName, status: "pending", timestamp: formatTimestamp(now) });
    }
    session.participants.forEach((email) => {
      initial.push({ id: uid(), name: email, status: "pending", timestamp: formatTimestamp(now) });
    });
    setParticipants(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function markCurrentUserSigned() {
    setParticipants((prev) => prev.map((p) => (p.name === currentUserName ? { ...p, status: "signed" } : p)));
  }

  const controlFlow = useControlCodeFlow<SignInitResult, SignStatusResult>({
    durationSeconds: 120,
    pollIntervalMs: 2000,
    initFn: () => {
      const contentBase64 = document_.contentBase64;
      const digest = document_.digest;
      if (!contentBase64 || !digest) {
        return Promise.reject(new Error("Nėra tikro dokumento turinio šiam pasirašymui."));
      }
      if (activeMethod === "mobile-id") {
        return signInitMobileId(config, {
          phone: mobileIdLogin?.phone,
          code: mobileIdLogin?.personalCode,
          message: "Dokumento pasirašymas",
          fileName: document_.name,
          fileContentBase64: contentBase64,
          fileDigest: digest,
        });
      }
      return signInitSmartId(config, {
        code: smartIdLogin?.personalCode,
        country: smartIdLogin?.country,
        message: "Dokumento pasirašymas",
        fileName: document_.name,
        fileContentBase64: contentBase64,
        fileDigest: digest,
      });
    },
    statusFn: (token) => (activeMethod === "mobile-id" ? signStatusMobileId(config, token) : signStatusSmartId(config, token)),
    onSuccess: (result) => {
      setSignedFile(result.file);
      markCurrentUserSigned();
    },
  });

  function handleSignClick() {
    setLocalError(null);

    if (!document_.contentBase64) {
      setLocalError("Nėra tikro dokumento turinio šiam pasirašymui — pradėkite nuo pradinio srauto (įkelkite dokumentą per skydelį).");
      return;
    }

    if (activeMethod === "mobile-id") {
      if (!mobileIdLogin?.phone) {
        setLocalError("Norėdami pasirašyti Mobile-ID, prisijunkite Mobile-ID būdu.");
        return;
      }
      controlFlow.start();
    } else if (activeMethod === "smart-id") {
      if (!smartIdLogin?.personalCode) {
        setLocalError("Norėdami pasirašyti Smart-ID, prisijunkite Smart-ID būdu.");
        return;
      }
      controlFlow.start();
    } else {
      setLocalError("Šis pasirašymo būdas bus įgyvendintas vėliau.");
    }
  }

  function base64ToBlobUrl(base64: string, mimeType: string): string {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  }

  function handlePreview() {
    const content = signedFile?.content ?? document_.contentBase64;
    if (!content) {
      alert("Dokumento turinio nėra peržiūrai.");
      return;
    }
    window.open(base64ToBlobUrl(content, "application/pdf"), "_blank");
  }

  function handleDownload() {
    const content = signedFile?.content ?? document_.contentBase64;
    const name = signedFile?.name ?? document_.name;
    if (!content) {
      alert("Dokumento turinio nėra atsisiuntimui.");
      return;
    }
    const a = window.document.createElement("a");
    a.href = base64ToBlobUrl(content, "application/pdf");
    a.download = name || "dokumentas.pdf";
    window.document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function handleWillSignToggle(checked: boolean) {
    setWillSign(checked);
    const now = new Date();
    setParticipants((prev) => {
      const selfIndex = prev.findIndex((p) => p.name === currentUserName);
      if (checked && selfIndex === -1) {
        return [{ id: uid(), name: currentUserName, status: "pending", timestamp: formatTimestamp(now) }, ...prev];
      }
      if (!checked && selfIndex !== -1) {
        return prev.filter((_, i) => i !== selfIndex);
      }
      return prev;
    });
  }

  function resetAddPanel() {
    setNewEmail("");
    setNewEmailInvalid(false);
    setNewMessageEnabled(false);
    setNewMessage("");
  }

  function confirmAddParticipant() {
    const email = newEmail.trim();
    const isValid = EMAIL_REGEX.test(email);
    setNewEmailInvalid(!isValid);
    if (!isValid) return;

    setParticipants((prev) => [...prev, { id: uid(), name: email, status: "pending", timestamp: formatTimestamp(new Date()) }]);
    resetAddPanel();
    setAddPanelOpen(false);
  }

  function removeParticipant(id: string) {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }

  const positions: { key: SignaturePosition; label: string; cornerClass: string }[] = [
    { key: "top-left", label: "Viršus kairė", cornerClass: "corner-top-left" },
    { key: "top-right", label: "Viršus dešinė", cornerClass: "corner-top-right" },
    { key: "bottom-left", label: "Apačia kairė", cornerClass: "corner-bottom-left" },
    { key: "bottom-right", label: "Apačia dešinė", cornerClass: "corner-bottom-right" },
  ];

  const methods: { key: MethodKey; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
    {
      key: "mobile-id",
      label: "Mobile-ID",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="7" y="2.5" width="10" height="19" rx="2"></rect>
          <line x1="11" y1="18.2" x2="13" y2="18.2" strokeLinecap="round"></line>
        </svg>
      ),
    },
    {
      key: "usb",
      label: "USB parašas",
      disabled: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="5" y="9" width="14" height="11" rx="2"></rect>
          <path d="M9 9 V6 a3 3 0 0 1 6 0 v3" strokeLinecap="round"></path>
        </svg>
      ),
    },
    {
      key: "advanced",
      label: "Pažangusis parašas",
      disabled: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="12" rx="1.6"></rect>
          <line x1="8" y1="20" x2="16" y2="20" strokeLinecap="round"></line>
          <line x1="12" y1="17" x2="12" y2="20" strokeLinecap="round"></line>
        </svg>
      ),
    },
    {
      key: "smart-id",
      label: "Smart-ID",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2 A10 10 0 0 1 12 22" strokeLinecap="round"></path>
          <path d="M12 2 A10 10 0 0 0 12 22" strokeLinecap="round" strokeDasharray="2 3"></path>
          <line x1="11.3" y1="9" x2="11.3" y2="16" strokeLinecap="round"></line>
          <circle cx="11.3" cy="6.2" r="1" fill="currentColor" stroke="none"></circle>
        </svg>
      ),
    },
  ];

  const signStatusVisible = Boolean(localError) || controlFlow.status !== "idle";
  const signButtonDisabled = controlFlow.status === "waiting";

  return (
    <>
      <TopBar />

      <div className="doc-hero">
        <div className="doc-hero-inner">
          <h1>Dokumento pasirašymas</h1>
          <p>Liko 6 iš 6 pasirašymų ir 2 iš 6 nemokamų patikrinimų iki 2026-08-29</p>
        </div>
      </div>

      <div className="page-container">
        <section className="doc-section">
          <h2 className="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"></path>
              <path d="M14 3.5V8h4"></path>
            </svg>
            Pagrindinis dokumentas
          </h2>

          <div className="panel">
            <div className="main-doc-header">
              <div>
                <p className="main-doc-title">{document_.name}</p>
                <p className="main-doc-subtitle">PDF Pdf el. dokumentas</p>
              </div>
              <span className="status-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"></path>
                  <path d="M14 3.5V8h4"></path>
                </svg>
                El. dokumentas rengiamas
              </span>
            </div>

            <hr className="panel-divider" />

            <div className="doc-file-row">
              <span className="file-item-name">{document_.name}</span>
              <span className="file-item-size">{formatFileSize(document_.size)}</span>
              <div className="doc-file-actions">
                <button type="button" className="doc-file-action" onClick={handlePreview}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  Peržiūrėti
                </button>
                <button type="button" className="doc-file-action" onClick={handleDownload}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 4v11"></path>
                    <path d="M7.5 11.5 12 16l4.5-4.5"></path>
                    <path d="M4.5 18.5h15"></path>
                  </svg>
                  Parsisiųsti
                </button>
              </div>
            </div>
          </div>

          <div className="panel">
            <p className="field-heading">Dokumento sudarymas</p>
            <div className="info-field">
              <span className="info-field-label">Elektroninio dokumento specifikacijos identifikatorius</span>
              <span className="info-field-value">PDF/A</span>
            </div>
          </div>
        </section>

        <section className="doc-section">
          <h2 className="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11Z"></path>
              <path d="M2.7 19c.7-3 3.2-5 6.3-5s5.6 2 6.3 5"></path>
              <path d="M16 5.1a3.2 3.2 0 0 1 0 6.2"></path>
              <path d="M18.8 14.3c2.5.6 4.2 2.4 4.5 4.7"></path>
            </svg>
            Dalyviai
          </h2>

          <div className="panel">
            <ParticipantsList participants={participants} onRemove={removeParticipant} />

            <div className="participants-footer">
              <button type="button" className="add-participant-btn" onClick={() => setAddPanelOpen(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 14c-4 0-7 2-7.7 5"></path>
                  <circle cx="9" cy="7" r="3.4"></circle>
                  <line x1="18" y1="8" x2="18" y2="14"></line>
                  <line x1="15" y1="11" x2="21" y2="11"></line>
                </svg>
                Pridėti dalyvį
              </button>

              <div className="will-sign-row">
                <span>Ar pasirašinėsite šį dokumentą?</span>
                <label className="toggle-switch">
                  <input type="checkbox" checked={willSign} onChange={(e) => handleWillSignToggle(e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            {addPanelOpen && (
              <div className="add-participant-panel">
                <div className="add-participant-row">
                  <div className={"participant-input-wrap" + (newEmailInvalid ? " invalid" : "")}>
                    <input
                      type="email"
                      placeholder="El. pašto adresas"
                      autoComplete="off"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                    <button
                      type="button"
                      className="input-clear-btn"
                      aria-label="Išvalyti"
                      onClick={() => setNewEmail("")}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <line x1="5" y1="5" x2="19" y2="19"></line>
                        <line x1="19" y1="5" x2="5" y2="19"></line>
                      </svg>
                    </button>
                  </div>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newMessageEnabled}
                      onChange={(e) => {
                        setNewMessageEnabled(e.target.checked);
                        if (!e.target.checked) setNewMessage("");
                      }}
                    />
                    <span className="checkbox-box">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </span>
                    Pridėti žinutę dalyviui
                  </label>
                </div>

                {newMessageEnabled && (
                  <textarea
                    className="panel-message"
                    placeholder="Žinutė dalyviams"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                )}

                {newEmailInvalid && <div className="panel-error">Neteisingas el. pašto adresas</div>}

                <div className="panel-actions">
                  <button
                    type="button"
                    className="text-action-btn cancel"
                    onClick={() => {
                      resetAddPanel();
                      setAddPanelOpen(false);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <line x1="5" y1="5" x2="19" y2="19"></line>
                      <line x1="19" y1="5" x2="5" y2="19"></line>
                    </svg>
                    Atšaukti
                  </button>
                  <button type="button" className="text-action-btn confirm" onClick={confirmAddParticipant}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Patvirtinti
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="doc-section">
          <h2 className="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"></path>
              <path d="M14 3.5V8h4"></path>
            </svg>
            Vizualus parašas
          </h2>

          <div className="panel">
            <div className="signature-row">
              <div className="position-options">
                {positions.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    className={"position-option" + (signaturePosition === p.key ? " selected" : "")}
                    onClick={() => setSignaturePosition(p.key)}
                  >
                    <span className="position-preview">
                      <span className={"position-badge " + p.cornerClass}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </span>
                    </span>
                    <span className="position-label">{p.label}</span>
                    <span className="position-radio"></span>
                  </button>
                ))}
              </div>

              <div className="signature-preview-card">
                <div className="sig-name">Vardenis Pavardenis</div>
                <div className="sig-date">2021-04-22</div>
                <div className="sig-meta">
                  <svg className="sig-badge" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0" y="0" width="64" height="64" rx="16" fill="#20a866"></rect>
                    <path
                      d="M20 10 C20 6 23 4 26 6 C28 8 27 11 25 12"
                      stroke="#ffffff"
                      strokeWidth="3.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    ></path>
                    <path
                      d="M25 12 L14 46 C13 50 16 54 20 54 C23 54 25 52 26 49 L32 30 L38 49 C39 52 41 54 44 54 C48 54 51 50 50 46 L39 12"
                      stroke="#ffffff"
                      strokeWidth="3.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    ></path>
                    <path d="M25 12 C29 16 35 16 39 12" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" fill="none"></path>
                    <circle cx="30" cy="18" r="1.8" fill="#ffffff"></circle>
                  </svg>
                  <div>
                    <div className="sig-meta-title">Kvalifikuotas el. parašas</div>
                    <div className="sig-domain">elpako.eu</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="doc-section">
          <h2 className="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"></path>
              <path d="M14 3.5V8h4"></path>
              <circle cx="17.5" cy="17.5" r="3.6"></circle>
              <path d="M20 20l2 2"></path>
            </svg>
            Dokumento pasirašymas
          </h2>

          <div className="panel">
            <div className="method-tabs" role="tablist">
              {methods.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={"method-tab" + (activeMethod === m.key ? " active" : "")}
                  title={m.disabled ? "Netrukus" : undefined}
                  onClick={() => {
                    setActiveMethod(m.key);
                    setLocalError(null);
                    controlFlow.cancel();
                  }}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>

            <p className="quota-text">Liko 6 iš 6 pasirašymų ir 2 iš 6 nemokamų patikrinimų iki 2026-08-29</p>

            {activeMethod === "mobile-id" && (
              <div className="method-panel">
                <div className="cert-box">
                  <p className="cert-box-title">Pasirinktas sertifikatas:</p>
                  <p className="cert-box-details">DummyName DummySurname / EpkTestCA / Galioja iki: 2039-11-12 12:09:00 +02:00</p>
                  <button type="button" className="cert-switch-link" onClick={() => console.log("switch-cert-btn stub clicked")}>
                    Pasirinkti kitą sertifikatą
                  </button>
                </div>

                <div className="info-box">
                  <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="9.2"></circle>
                    <line x1="12" y1="11" x2="12" y2="16.5" strokeLinecap="round"></line>
                    <circle cx="12" cy="7.6" r="1.05" fill="currentColor" stroke="none"></circle>
                  </svg>
                  <p>Pasirašydami dokumentą Mobile-ID parašu, sukursite kvalifikuotą el. parašą, kurio teisinė galia yra lygiavertė rašytiniam parašui.</p>
                </div>
              </div>
            )}

            {signStatusVisible && (
              <div>
                {localError && <p style={{ textAlign: "center", color: "#c1272d", fontWeight: 600 }}>{localError}</p>}
                {!localError && controlFlow.status === "waiting" && !controlFlow.controlCode && (
                  <p style={{ textAlign: "center", color: "#4a5170" }}>Kviečiama...</p>
                )}
                {!localError && controlFlow.status === "waiting" && controlFlow.controlCode && (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ color: "#4a5170", marginBottom: 6 }}>Kontrolinis kodas</p>
                    <p style={{ fontSize: 36, fontWeight: 800, color: "#ab4cd3", letterSpacing: 3, margin: "0 0 10px" }}>
                      {controlFlow.controlCode}
                    </p>
                    <p style={{ color: "#4a5170", fontSize: 14 }}>Patvirtinkite pasirašymą savo įrenginyje.</p>
                  </div>
                )}
                {!localError && controlFlow.status === "success" && (
                  <p style={{ textAlign: "center", color: "#37b524", fontWeight: 700 }}>
                    Dokumentas sėkmingai pasirašytas. Galite jį parsisiųsti.
                  </p>
                )}
                {!localError && controlFlow.status === "error" && (
                  <p style={{ textAlign: "center", color: "#c1272d", fontWeight: 600 }}>{controlFlow.errorMessage}</p>
                )}
              </div>
            )}

            {activeMethod === "usb" && (
              <div className="method-panel">
                <div className="method-placeholder">Pasirašymas USB parašu bus įgyvendintas vėliau.</div>
              </div>
            )}

            {activeMethod === "advanced" && (
              <div className="method-panel">
                <div className="method-placeholder">Pasirašymas pažangiuoju parašu bus įgyvendintas vėliau.</div>
              </div>
            )}

            {activeMethod === "smart-id" && (
              <div className="method-panel">
                <div className="info-box">
                  <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="9.2"></circle>
                    <line x1="12" y1="11" x2="12" y2="16.5" strokeLinecap="round"></line>
                    <circle cx="12" cy="7.6" r="1.05" fill="currentColor" stroke="none"></circle>
                  </svg>
                  <p>Pasirašydami dokumentą Smart-ID parašu, sukursite kvalifikuotą el. parašą, kurio teisinė galia yra lygiavertė rašytiniam parašui.</p>
                </div>
              </div>
            )}

            <div className="continue-btn-wrap">
              <button type="button" className="continue-btn" disabled={signButtonDisabled} onClick={handleSignClick}>
                Pasirašyti dokumentą
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
