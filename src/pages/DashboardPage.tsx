import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { Dropzone } from "../components/Dropzone";
import { useApiConfig } from "../context/ApiConfigContext";
import { useSession } from "../context/SessionContext";
import { computeSha256Digest, readFileAsBase64, verifyDocument } from "../services/elpakoApi";

export function DashboardPage() {
  const navigate = useNavigate();
  const { config } = useApiConfig();
  const { setSignDocuments, setVerifySession } = useSession();

  async function onDocumentsSelectedForSigning(files: File[]) {
    const metadata = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        size: f.size,
        contentBase64: await readFileAsBase64(f),
        digest: await computeSha256Digest(f),
      }))
    );
    setSignDocuments(metadata);
    navigate("/sign-document");
  }

  async function onDocumentsSelectedForVerification(files: File[]) {
    // The verify page only shows a single document, so only the first
    // selected file is actually checked.
    const file = files[0];
    const [contentBase64, digest] = await Promise.all([readFileAsBase64(file), computeSha256Digest(file)]);

    let result;
    try {
      result = await verifyDocument(config, { fileName: file.name, fileContentBase64: contentBase64, fileDigest: digest });
    } catch (err) {
      result = { errors: [{ message: err instanceof Error ? err.message : "Nepavyko patikrinti dokumento.", error_code: 0 }] };
    }

    setVerifySession({ document: { name: file.name, size: file.size }, result });
    navigate("/verify-document");
  }

  return (
    <>
      <TopBar />

      <main>
        <section className="hero">
          <h1>
            Elektroninis dokumentų
            <br />
            pasirašymas su elpako
          </h1>
          <p>6 pasirašymai ir 6 dokumentų tikrinimai per mėnesį nemokamai</p>
        </section>

        <section className="upload-section">
          <div className="upload-card">
            <div className="upload-card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"></path>
                <path d="M14 3.5V8h4"></path>
                <circle cx="11" cy="14" r="2.6"></circle>
                <line x1="12.9" y1="15.9" x2="15" y2="18"></line>
              </svg>
              <span>Pasirašyti dokumentą</span>
            </div>
            <Dropzone ariaLabel="Nutempkite dokumentus arba spauskite, kad pasirinktumėte failus pasirašymui" onValidFiles={onDocumentsSelectedForSigning} />
          </div>

          <div className="upload-card">
            <div className="upload-card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"></path>
                <path d="M14 3.5V8h4"></path>
                <circle cx="11" cy="14" r="2.6"></circle>
                <line x1="12.9" y1="15.9" x2="15" y2="18"></line>
              </svg>
              <span>Patikrinti dokumentą</span>
            </div>
            <Dropzone ariaLabel="Nutempkite dokumentus arba spauskite, kad pasirinktumėte failus tikrinimui" onValidFiles={onDocumentsSelectedForVerification} />
          </div>
        </section>
      </main>
    </>
  );
}
