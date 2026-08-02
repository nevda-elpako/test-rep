// ----------------------------------------------------------------------
// Elpako API client. Talks directly to the Elpako REST API from the
// browser — base URL + access_token are passed in explicitly (supplied
// by ApiConfigContext) rather than read from a global, so this module
// stays framework-agnostic and testable.
//
// Endpoint paths were taken from Elpako's Postman documentation
// (collection id 40d77160-1d63-4378-a295-b0444491bad8). If the API
// changes, re-check that collection before assuming these are stale.
// ----------------------------------------------------------------------

export interface ApiConfig {
  baseUrl: string;
  accessToken: string;
}

export interface CertificateSubject {
  country: string | null;
  common_name: string | null;
  surname: string | null;
  name: string | null;
  serial_number: string | null;
  organisation: string | null;
  organisation_unit: string | null;
  email: string | null;
}

export interface CertificateInfo {
  name: string;
  subject: CertificateSubject;
  issuer: CertificateSubject;
  valid_from?: string;
  valid_to?: string;
  value?: string;
}

export interface ApiErrorDetail {
  message: string;
  error_code: number;
  field?: string | null;
  signature_id?: string | null;
}

export interface AuthInitResult {
  token: string;
  control_code: string;
  message: string | null;
  errors: ApiErrorDetail[];
  status: string;
  error_code: number | null;
}

export interface AuthStatusResult {
  name: string | null;
  surname: string | null;
  code: string | null;
  country: string | null;
  authentication_method?: string;
  certificate: CertificateInfo | null;
  message: string | null;
  errors: ApiErrorDetail[];
  status: string;
  error_code: number | null;
}

export interface SignedFile {
  name: string;
  content: string;
  digest?: string;
}

export interface SignInitResult {
  token: string;
  control_code: string;
  certificate?: CertificateInfo;
  message: string | null;
  errors: ApiErrorDetail[];
  status: string;
  error_code: number | null;
}

export interface SignStatusResult {
  signature_id: string | null;
  file: SignedFile | null;
  message: string | null;
  errors: ApiErrorDetail[];
  status: string;
  error_code: number | null;
}

export interface CheckDocumentSignature {
  id: string;
  signing_time: string;
  signing_purpose?: string;
  certificate: CertificateInfo;
}

export interface CheckDocumentResult {
  structure?: {
    content: unknown[];
    signatures: CheckDocumentSignature[];
  };
  message?: string | null;
  errors?: ApiErrorDetail[];
  status?: string;
  error_code?: number | null;
}

export class ApiError extends Error {
  errorCode: number | null;
  errors: ApiErrorDetail[];
  httpStatus: number | null;

  constructor(message: string, errorCode: number | null, errors: ApiErrorDetail[] | undefined, httpStatus: number | null) {
    super(message || "Nežinoma API klaida");
    this.name = "ApiError";
    this.errorCode = errorCode ?? null;
    this.errors = errors ?? [];
    this.httpStatus = httpStatus ?? null;
  }
}

type Fields = Record<string, string | undefined>;

function apiUrl(config: ApiConfig, path: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return config.baseUrl.replace(/\/+$/, "") + path + separator + "access_token=" + encodeURIComponent(config.accessToken);
}

function toFormData(fields?: Fields): FormData {
  const formData = new FormData();
  Object.entries(fields ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  return formData;
}

interface RawResponse<T> {
  httpOk: boolean;
  httpStatus: number;
  data: T | null;
}

// Low-level request: never throws on an application-level error status —
// callers decide whether {status: "error"} / HTTP 400 is exceptional or a
// legitimate result (e.g. "document has validation errors" is a normal
// result for the check endpoint, not an exception).
async function apiRequest<T>(config: ApiConfig, method: "GET" | "POST", path: string, fields?: Fields): Promise<RawResponse<T>> {
  const url = apiUrl(config, path);
  const options: RequestInit = { method };
  if (method !== "GET" && fields) {
    options.body = toFormData(fields);
  }

  const response = await fetch(url, options);
  let data: T | null = null;
  try {
    data = (await response.json()) as T;
  } catch {
    data = null;
  }
  return { httpOk: response.ok, httpStatus: response.status, data };
}

interface StatusEnvelope {
  status?: string;
  message?: string | null;
  error_code?: number | null;
  errors?: ApiErrorDetail[];
}

// Throws ApiError for anything that isn't a clean success. Use for
// auth/signing calls where a non-ok result should stop the flow.
async function apiCall<T extends StatusEnvelope>(config: ApiConfig, method: "GET" | "POST", path: string, fields?: Fields): Promise<T> {
  const { httpOk, httpStatus, data } = await apiRequest<T>(config, method, path, fields);
  if (!httpOk || !data || data.status === "error") {
    const message = data?.message ?? "API užklausa nepavyko (" + httpStatus + ")";
    throw new ApiError(message, data?.error_code ?? null, data?.errors, httpStatus);
  }
  return data;
}

export async function readFileAsBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function computeSha256Digest(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ----------------------------------------------------------------------
// Login (authentication only — no document involved)
// ----------------------------------------------------------------------

export function authInitMobileId(config: ApiConfig, args: { phone?: string; code?: string; message?: string }): Promise<AuthInitResult> {
  return apiCall<AuthInitResult>(config, "POST", "/api/v1/mobile/login.json", args);
}

export function authStatusMobileId(config: ApiConfig, token: string): Promise<AuthStatusResult> {
  return apiCall<AuthStatusResult>(config, "GET", "/api/v1/mobile/login/status/" + encodeURIComponent(token) + ".json");
}

export function authInitSmartId(
  config: ApiConfig,
  args: { subjectCode?: string; country?: string; message?: string }
): Promise<AuthInitResult> {
  return apiCall<AuthInitResult>(config, "POST", "/api/v1/smart-id/login.json", {
    subject_code: args.subjectCode,
    country: args.country || "lt",
    message: args.message,
  });
}

export function authStatusSmartId(config: ApiConfig, token: string): Promise<AuthStatusResult> {
  return apiCall<AuthStatusResult>(config, "GET", "/api/v1/smart-id/login/status/" + encodeURIComponent(token) + ".json");
}

// ----------------------------------------------------------------------
// Document signing (Mobile-ID / Smart-ID). Scoped to type "pdf" only —
// ADoc/ASiC/PDF-LT need additional required metadata not collected by
// this UI and are left as stubs, matching the static site's scope.
// ----------------------------------------------------------------------

export interface SignDocumentArgs {
  fileName: string;
  fileContentBase64: string;
  fileDigest: string;
  message?: string;
}

export function signInitMobileId(
  config: ApiConfig,
  args: SignDocumentArgs & { phone?: string; code?: string }
): Promise<SignInitResult> {
  return apiCall<SignInitResult>(config, "POST", "/api/v1/mobile/sign.json", {
    file_return_mode: "base64string",
    phone: args.phone,
    code: args.code,
    message: args.message,
    type: "pdf",
    "pdf[files][0][name]": args.fileName,
    "pdf[files][0][content]": args.fileContentBase64,
    "pdf[files][0][digest]": args.fileDigest,
  });
}

export function signStatusMobileId(config: ApiConfig, token: string): Promise<SignStatusResult> {
  return apiCall<SignStatusResult>(config, "GET", "/api/v1/mobile/sign/status/" + encodeURIComponent(token) + ".json");
}

export function signInitSmartId(
  config: ApiConfig,
  args: SignDocumentArgs & { code?: string; country?: string }
): Promise<SignInitResult> {
  return apiCall<SignInitResult>(config, "POST", "/api/v1/smartid/sign.json", {
    file_return_mode: "base64string",
    code: args.code,
    country: args.country || "lt",
    message: args.message,
    type: "pdf",
    "pdf[files][0][name]": args.fileName,
    "pdf[files][0][content]": args.fileContentBase64,
    "pdf[files][0][digest]": args.fileDigest,
  });
}

export function signStatusSmartId(config: ApiConfig, token: string): Promise<SignStatusResult> {
  return apiCall<SignStatusResult>(config, "GET", "/api/v1/smartid/sign/status/" + encodeURIComponent(token) + ".json");
}

// ----------------------------------------------------------------------
// Document verification ("Dokumento tikrinimas" / check.json). Returns
// the raw result rather than throwing on a 400 — a document with
// validation errors is a normal, expected result here, not exceptional.
// ----------------------------------------------------------------------

export async function verifyDocument(
  config: ApiConfig,
  args: { fileName: string; fileContentBase64: string; fileDigest: string }
): Promise<CheckDocumentResult> {
  const { data } = await apiRequest<CheckDocumentResult>(config, "POST", "/api/v1/check.json", {
    type: "pdf",
    "file[name]": args.fileName,
    "file[content]": args.fileContentBase64,
    "file[digest]": args.fileDigest,
  });
  return data ?? {};
}
