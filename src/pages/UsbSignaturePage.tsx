import { useNavigate } from "react-router-dom";

// Stub, matching the static site's scope: real USB/SmartCard signing needs
// Elpako's local certificate-reading agent ("Lokalus API"), which is a
// separate, hardware-dependent integration outside this demo's scope.
export function UsbSignaturePage() {
  const navigate = useNavigate();
  const selectedDevice = "Kriptografinė USB laikmena";

  function selectUsbDevice() {
    console.log("selectUsbDevice stub called");
  }

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
              <rect x="5" y="9" width="14" height="11" rx="2"></rect>
              <path d="M9 9 V6 a3 3 0 0 1 6 0 v3" strokeLinecap="round"></path>
            </svg>
          </span>
          <span className="method-name">USB parašas</span>
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
          console.log("submitLogin stub called", { method: "usb-signature", extra: { device: selectedDevice } });
          alert('Autentifikacijos veiksmas („usb-signature“) bus įgyvendintas vėliau.');
        }}
      >
        <button type="button" className="usb-box" onClick={selectUsbDevice}>
          <span>{selectedDevice}</span>
        </button>

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
