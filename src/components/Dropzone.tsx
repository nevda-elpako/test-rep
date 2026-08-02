import { useRef, useState, type KeyboardEvent } from "react";
import { ALLOWED_EXTENSIONS, validateFiles } from "../utils/files";

interface DropzoneProps {
  ariaLabel: string;
  multiple?: boolean;
  onValidFiles: (files: File[]) => void;
}

export function Dropzone({ ariaLabel, multiple = true, onValidFiles }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(fileList: FileList | null) {
    const { valid, invalid } = validateFiles(Array.from(fileList ?? []));
    if (invalid.length > 0) {
      const names = invalid.map((f) => f.name).join(", ");
      setError("Netinkamas failo formatas (" + names + "). Leidžiami formatai: " + ALLOWED_EXTENSIONS.join(", ") + ".");
    } else {
      setError(null);
    }
    if (valid.length > 0) {
      onValidFiles(valid);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  }

  return (
    <div
      className={"dropzone" + (dragOver ? " dragover" : "")}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
      onClick={() => inputRef.current?.click()}
      onKeyDown={handleKeyDown}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="visually-hidden"
        accept={ALLOWED_EXTENSIONS.join(",")}
        multiple={multiple}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <svg className="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M7.5 17.5a4 4 0 0 1-.6-7.96 5 5 0 0 1 9.66-1.8A4.5 4.5 0 0 1 17.5 17.5H16"></path>
        <path d="M12 20v-8"></path>
        <path d="M9 14.5 12 11.5 15 14.5"></path>
      </svg>

      <div className="dropzone-title">Nutempkite dokumentus</div>
      <div className="dropzone-subtitle">
        arba{" "}
        <button
          type="button"
          className="link-btn"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          įkelkite dokumentus
        </button>{" "}
        iš kompiuterio
      </div>

      {error && <div className="dropzone-error">{error}</div>}
    </div>
  );
}
