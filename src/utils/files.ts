export const ALLOWED_EXTENSIONS = [".pdf", ".adoc"];

export function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx === -1 ? "" : fileName.slice(idx).toLowerCase();
}

export function validateFiles(files: File[]): { valid: File[]; invalid: File[] } {
  const valid: File[] = [];
  const invalid: File[] = [];
  files.forEach((file) => {
    if (ALLOWED_EXTENSIONS.includes(getExtension(file.name))) {
      valid.push(file);
    } else {
      invalid.push(file);
    }
  });
  return { valid, invalid };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1).replace(".", ",") + " KB";
  const mb = kb / 1024;
  return mb.toFixed(1).replace(".", ",") + " MB";
}
