import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { Dropzone } from "../components/Dropzone";
import { useSession } from "../context/SessionContext";
import { computeSha256Digest, readFileAsBase64 } from "../services/elpakoApi";
import { formatFileSize, getExtension } from "../utils/files";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormatKey = "pdf" | "pdflt" | "adoc" | "asic";

// Only the PDF copy is confirmed by the design; the others are placeholder
// copy until the real wording is provided, and real signing/verification
// calls are scoped to PDF only (see project plan).
const FORMAT_INFO: Record<FormatKey, { label: string; description: string }> = {
  pdf: { label: "PDF", description: "Pdf el. dokumentas" },
  pdflt: { label: "PDF-LT", description: "PDF-LT formato el. dokumentas su LT teisės aktus atitinkančiu parašu" },
  adoc: { label: "ADoc", description: "ADoc formato el. dokumentas su skaitmeniniu parašu" },
  asic: { label: "ASiC", description: "ASiC formato el. dokumentas su skaitmeniniu parašu" },
};

interface FileEntry {
  id: string;
  name: string;
  size: number;
  contentBase64?: string;
  digest?: string;
}

interface ParticipantEntry {
  id: string;
  email: string;
}

let nextId = 1;
function uid(prefix: string) {
  return prefix + "-" + nextId++;
}

export function SignDocumentPage() {
  const navigate = useNavigate();
  const { signDocuments, setSigningSession } = useSession();

  const [files, setFiles] = useState<FileEntry[]>([]);
  const [format, setFormat] = useState<FormatKey>("pdf");
  const [willSign, setWillSign] = useState(true);
  const [participants, setParticipants] = useState<ParticipantEntry[]>([]);
  const [messageEnabled, setMessageEnabled] = useState(false);
  const [message, setMessage] = useState("");

  // Seed the file list from whatever was dropped on the dashboard.
  useEffect(() => {
    if (signDocuments.length === 0) return;
    setFiles(
      signDocuments.map((m) => ({
        id: uid("id"),
        name: m.name,
        size: m.size,
        contentBase64: m.contentBase64,
        digest: m.digest,
      }))
    );
    const lastExt = getExtension(signDocuments[signDocuments.length - 1].name);
    setFormat(lastExt === ".adoc" ? "adoc" : "pdf");
    // Only seed once on mount — this mirrors the static site's one-shot
    // "consume pendingSignDocuments" behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addFiles(newFiles: File[]) {
    const entries = await Promise.all(
      newFiles.map(async (f) => ({
        id: uid("id"),
        name: f.name,
        size: f.size,
        contentBase64: await readFileAsBase64(f),
        digest: await computeSha256Digest(f),
      }))
    );
    setFiles((prev) => [...prev, ...entries]);

    const last = newFiles[newFiles.length - 1];
    if (last) {
      const ext = getExtension(last.name);
      if (ext === ".pdf") setFormat("pdf");
      else if (ext === ".adoc") setFormat("adoc");
    }
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function addParticipant() {
    setParticipants((prev) => [...prev, { id: uid("p"), email: "" }]);
  }

  function updateParticipant(id: string, email: string) {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, email } : p)));
  }

  function removeParticipant(id: string) {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }

  function handleContinue() {
    const mainFile = files[0];
    const mainDocument = mainFile
      ? { name: mainFile.name, size: mainFile.size, contentBase64: mainFile.contentBase64, digest: mainFile.digest }
      : null;

    setSigningSession({
      document: mainDocument,
      format,
      willSign,
      participants: participants.map((p) => p.email.trim()).filter((email) => email.length > 0),
    });
    navigate("/document-signing");
  }

  const hasParticipants = participants.length > 0;

  return (
    <>
      <TopBar />

      <div className="page-container">
        <section className="doc-section">
          <h1 className="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"></path>
              <path d="M14 3.5V8h4"></path>
            </svg>
            Dokumentai
          </h1>

          <div className="panel">
            <p className="field-heading">Pasirinkite dokumento formatą:</p>

            <div className="format-tabs" role="group" aria-label="Dokumento formatas">
              {(Object.keys(FORMAT_INFO) as FormatKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={"format-tab" + (format === key ? " active" : "")}
                  onClick={() => setFormat(key)}
                >
                  <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"></path>
                    <path d="M14 3.5V8h4"></path>
                  </svg>
                  {FORMAT_INFO[key].label}
                  {key !== "pdf" && (
                    <svg className="tab-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <p className="format-description">
              <strong>{FORMAT_INFO[format].label}:</strong> {FORMAT_INFO[format].description}
            </p>

            <p className="upload-label">Įkelkite dokumentus:</p>

            <Dropzone ariaLabel="Nutempkite dokumentus arba spauskite, kad pasirinktumėte failus pasirašymui" onValidFiles={addFiles} />

            <div className="file-list">
              {files.map((entry) => (
                <div className="file-item" key={entry.id}>
                  <span className="file-item-name">{entry.name}</span>
                  <span className="file-item-size">{formatFileSize(entry.size)}</span>
                  <button
                    type="button"
                    className="file-item-remove"
                    aria-label={"Pašalinti " + entry.name}
                    onClick={() => removeFile(entry.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 7h16"></path>
                      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"></path>
                      <path d="M10 11v6"></path>
                      <path d="M14 11v6"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="doc-section">
          <h1 className="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11Z"></path>
              <path d="M2.7 19c.7-3 3.2-5 6.3-5s5.6 2 6.3 5"></path>
              <path d="M16 5.1a3.2 3.2 0 0 1 0 6.2"></path>
              <path d="M18.8 14.3c2.5.6 4.2 2.4 4.5 4.7"></path>
            </svg>
            Dalyviai
          </h1>

          <div className="panel">
            <div className="confirm-row">
              <span className="confirm-question">Ar pasirašinėsite šį dokumentą?</span>
              <div className="toggle-group">
                <button
                  type="button"
                  className={"toggle-btn toggle-yes" + (willSign ? " selected" : "")}
                  onClick={() => setWillSign(true)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Taip
                </button>
                <button
                  type="button"
                  className={"toggle-btn toggle-no" + (!willSign ? " selected" : "")}
                  onClick={() => setWillSign(false)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9.3"></circle>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                  </svg>
                  Ne
                </button>
              </div>
            </div>
          </div>

          <div className="panel">
            <p className="participants-label">Kiti pasirašantys asmenys:</p>

            <div className="participants-grid">
              {participants.map((participant) => {
                const trimmed = participant.email.trim();
                const isValid = trimmed === "" || EMAIL_REGEX.test(trimmed);
                return (
                  <div className={"participant-field" + (isValid ? "" : " invalid")} key={participant.id}>
                    <div className="participant-field-label">El. pašto adresas</div>
                    <input
                      type="email"
                      placeholder="El. pašto adresas"
                      autoComplete="off"
                      value={participant.email}
                      onChange={(e) => updateParticipant(participant.id, e.target.value)}
                    />
                    <button
                      type="button"
                      className="participant-remove"
                      aria-label="Pašalinti dalyvį"
                      onClick={() => removeParticipant(participant.id)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 7h16"></path>
                        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                        <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"></path>
                        <path d="M10 11v6"></path>
                        <path d="M14 11v6"></path>
                      </svg>
                    </button>
                    {!isValid && <div className="participant-field-error">Neteisingas el. pašto adresas</div>}
                  </div>
                );
              })}
            </div>

            <div className="participants-actions">
              <button type="button" className="add-participant-btn" onClick={addParticipant}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 14c-4 0-7 2-7.7 5"></path>
                  <circle cx="9" cy="7" r="3.4"></circle>
                  <line x1="18" y1="8" x2="18" y2="14"></line>
                  <line x1="15" y1="11" x2="21" y2="11"></line>
                </svg>
                Pridėti dalyvį
              </button>

              {hasParticipants && <div className="actions-divider"></div>}

              {hasParticipants && (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={messageEnabled}
                    onChange={(e) => {
                      setMessageEnabled(e.target.checked);
                      if (!e.target.checked) setMessage("");
                    }}
                  />
                  <span className="checkbox-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  Pridėti žinutę dalyviams
                </label>
              )}
            </div>

            {hasParticipants && messageEnabled && (
              <textarea
                className="participant-message"
                placeholder="Žinutė dalyviams"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            )}
          </div>
        </section>

        <div className="continue-btn-wrap">
          <button type="button" className="continue-btn" onClick={handleContinue}>
            Pereiti į dokumento pasirašymą
          </button>
        </div>
      </div>
    </>
  );
}
