import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { CertificateInfo, CheckDocumentResult } from "../services/elpakoApi";

const STORAGE_KEYS = {
  mobileIdLogin: "mobileIdLogin",
  smartIdLogin: "smartIdLogin",
  authenticatedUser: "authenticatedUser",
  signDocuments: "signDocuments",
  signingSession: "signingSession",
  verifySession: "verifySession",
};

export interface MobileIdLoginData {
  phone: string;
  personalCode: string;
}

export interface SmartIdLoginData {
  personalCode: string;
  country: string;
}

export interface AuthenticatedUser {
  name: string | null;
  surname: string | null;
  code: string | null;
  country: string | null;
  certificate: CertificateInfo | null;
}

export interface DocumentMeta {
  name: string;
  size: number;
  contentBase64?: string;
  digest?: string;
}

export interface SigningSessionData {
  document: DocumentMeta | null;
  format: string;
  willSign: boolean;
  participants: string[];
}

export interface VerifySessionData {
  document: DocumentMeta;
  result: CheckDocumentResult;
}

function readSessionStorage<T>(key: string): T | null {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function useSessionStorageState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readSessionStorage<T>(key) ?? initial);

  const setAndPersist: Dispatch<SetStateAction<T>> = (next) => {
    setValue((prev) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
      if (resolved === null || resolved === undefined) {
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, JSON.stringify(resolved));
      }
      return resolved;
    });
  };

  return [value, setAndPersist];
}

interface SessionContextValue {
  mobileIdLogin: MobileIdLoginData | null;
  setMobileIdLogin: Dispatch<SetStateAction<MobileIdLoginData | null>>;
  smartIdLogin: SmartIdLoginData | null;
  setSmartIdLogin: Dispatch<SetStateAction<SmartIdLoginData | null>>;
  authenticatedUser: AuthenticatedUser | null;
  setAuthenticatedUser: Dispatch<SetStateAction<AuthenticatedUser | null>>;
  signDocuments: DocumentMeta[];
  setSignDocuments: Dispatch<SetStateAction<DocumentMeta[]>>;
  signingSession: SigningSessionData | null;
  setSigningSession: Dispatch<SetStateAction<SigningSessionData | null>>;
  verifySession: VerifySessionData | null;
  setVerifySession: Dispatch<SetStateAction<VerifySessionData | null>>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [mobileIdLogin, setMobileIdLogin] = useSessionStorageState<MobileIdLoginData | null>(STORAGE_KEYS.mobileIdLogin, null);
  const [smartIdLogin, setSmartIdLogin] = useSessionStorageState<SmartIdLoginData | null>(STORAGE_KEYS.smartIdLogin, null);
  const [authenticatedUser, setAuthenticatedUser] = useSessionStorageState<AuthenticatedUser | null>(
    STORAGE_KEYS.authenticatedUser,
    null
  );
  const [signDocuments, setSignDocuments] = useSessionStorageState<DocumentMeta[]>(STORAGE_KEYS.signDocuments, []);
  const [signingSession, setSigningSession] = useSessionStorageState<SigningSessionData | null>(
    STORAGE_KEYS.signingSession,
    null
  );
  const [verifySession, setVerifySession] = useSessionStorageState<VerifySessionData | null>(
    STORAGE_KEYS.verifySession,
    null
  );

  const value: SessionContextValue = {
    mobileIdLogin,
    setMobileIdLogin,
    smartIdLogin,
    setSmartIdLogin,
    authenticatedUser,
    setAuthenticatedUser,
    signDocuments,
    setSignDocuments,
    signingSession,
    setSigningSession,
    verifySession,
    setVerifySession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
