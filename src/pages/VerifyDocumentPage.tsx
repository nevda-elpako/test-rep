import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/TopBar";
import { ParticipantsList, type Participant } from "../components/ParticipantsList";
import { useSession } from "../context/SessionContext";
import { getExtension, formatFileSize } from "../utils/files";
import { SHOW_PARTICIPANTS } from "../featureFlags";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_DOCUMENT = { name: "Instrukcija_Naujam_ELPAKO_programuotojui.pdf", size: 55000 };
const DEFAULT_EXISTING_SIGNERS = [{ name: "DummyName DummySurname", timestamp: "2026-07-12 09:41" }];

const FORMAT_SUBTITLE: Record<string, string> = {
  ".pdf": "PDF Pdf el. dokumentas",
  ".adoc": "ADoc formato el. dokumentas su skaitmeniniu parašu",
  ".asic": "ASiC formato el. dokumentas su skaitmeniniu parašu",
};

let nextId = 1;
function uid() {
  return "p-" + nextId++;
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function certificateDisplayName(certificate: { subject: { name: string | null; surname: string | null; common_name: string | null } } | undefined): string {
  if (!certificate?.subject) return "Nežinomas pasirašantysis";
  const { name, surname, common_name: commonName } = certificate.subject;
  return [name, surname].filter(Boolean).join(" ") || commonName || "Nežinomas pasirašantysis";
}

export function VerifyDocumentPage() {
  const { verifySession, authenticatedUser } = useSession();

  const currentUserName = useMemo(
    () => [authenticatedUser?.name, authenticatedUser?.surname].filter(Boolean).join(" ") || "DummyName DummySurname",
    [authenticatedUser]
  );

  const document_ = verifySession?.document ?? DEFAULT_DOCUMENT;
  const result = verifySession?.result;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [willSign, setWillSign] = useState(false);

  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newEmailInvalid, setNewEmailInvalid] = useState(false);
  const [newMessageEnabled, setNewMessageEnabled] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const signatures = result?.structure?.signatures;
    const existingSigners = signatures
      ? signatures.map((sig) => ({ name: certificateDisplayName(sig.certificate), timestamp: sig.signing_time }))
      : verifySession?.document
      ? []
      : DEFAULT_EXISTING_SIGNERS;

    setParticipants(
      existingSigners.map((signer) => ({ id: uid(), name: signer.name, status: "signed" as const, timestamp: signer.timestamp, fromDocument: true }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ext = getExtension(document_.name);
  const subtitle = FORMAT_SUBTITLE[ext] || FORMAT_SUBTITLE[".pdf"];

  const hasErrors = Boolean(result?.errors && result.errors.length > 0);
  const validityText = !result
    ? "Dokumentas galiojantis"
    : hasErrors
    ? result!.errors!.map((e) => e.message).filter(Boolean).join(" ") || "Dokumentas turi validacijos klaidų"
    : "Dokumentas galiojantis";

  function handleWillSignToggle(checked: boolean) {
    setWillSign(checked);
    const now = new Date();
    setParticipants((prev) => {
      const selfIndex = prev.findIndex((p) => p.name === currentUserName && !p.fromDocument);
      if (checked && selfIndex === -1) {
        return [...prev, { id: uid(), name: currentUserName, status: "pending", timestamp: formatTimestamp(now), fromDocument: false }];
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

    setParticipants((prev) => [
      ...prev,
      { id: uid(), name: email, status: "pending", timestamp: formatTimestamp(new Date()), fromDocument: false },
    ]);
    resetAddPanel();
    setAddPanelOpen(false);
  }

  function removeParticipant(id: string) {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <>
      <TopBar />

      <div className="doc-hero">
        <div className="doc-hero-inner">
          <h1>Dokumento peržiūra</h1>
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
                <p className="main-doc-subtitle">{subtitle}</p>
              </div>
              <span className={"status-pill" + (hasErrors ? " error" : " success")}>
                {hasErrors ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9.2" strokeWidth="1.8"></circle>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9.2" strokeWidth="1.8"></circle>
                    <polyline points="8 12.5 10.8 15.3 16 9.5"></polyline>
                  </svg>
                )}
                <span>{validityText}</span>
              </span>
            </div>

            <hr className="panel-divider" />

            <div className="doc-file-row">
              <span className="file-item-name">{document_.name}</span>
              <span className="file-item-size">{formatFileSize(document_.size)}</span>
              <div className="doc-file-actions">
                <button type="button" className="doc-file-action" onClick={() => console.log("save-doc-btn stub clicked", document_)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"></path>
                    <line x1="12" y1="11" x2="12" y2="16" strokeLinecap="round"></line>
                    <line x1="9.3" y1="13.5" x2="14.7" y2="13.5" strokeLinecap="round"></line>
                  </svg>
                  Išsaugoti
                </button>
                <button type="button" className="doc-file-action" onClick={() => console.log("preview-doc-btn stub clicked", document_)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  Peržiūrėti
                </button>
                <button type="button" className="doc-file-action" onClick={() => console.log("download-doc-btn stub clicked", document_)}>
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
        </section>

        {SHOW_PARTICIPANTS && (
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
                    <button type="button" className="input-clear-btn" aria-label="Išvalyti" onClick={() => setNewEmail("")}>
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
        )}
      </div>
    </>
  );
}
