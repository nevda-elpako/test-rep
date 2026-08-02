import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { ApiConfig } from "../services/elpakoApi";

const STORAGE_KEYS = {
  baseUrl: "elpako_base_url",
  accessToken: "elpako_access_token",
};

const DEFAULT_BASE_URL = "https://localhost:61488";

function loadConfig(): ApiConfig {
  return {
    baseUrl: localStorage.getItem(STORAGE_KEYS.baseUrl) || DEFAULT_BASE_URL,
    accessToken: localStorage.getItem(STORAGE_KEYS.accessToken) || "",
  };
}

interface ApiConfigContextValue {
  config: ApiConfig;
  hasAccessToken: boolean;
  setConfig: (config: ApiConfig) => void;
}

const ApiConfigContext = createContext<ApiConfigContextValue | null>(null);

export function ApiConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<ApiConfig>(loadConfig);

  const value = useMemo<ApiConfigContextValue>(
    () => ({
      config,
      hasAccessToken: config.accessToken.trim().length > 0,
      setConfig: (next: ApiConfig) => {
        localStorage.setItem(STORAGE_KEYS.baseUrl, next.baseUrl || DEFAULT_BASE_URL);
        localStorage.setItem(STORAGE_KEYS.accessToken, next.accessToken || "");
        setConfigState({ baseUrl: next.baseUrl || DEFAULT_BASE_URL, accessToken: next.accessToken || "" });
      },
    }),
    [config]
  );

  return <ApiConfigContext.Provider value={value}>{children}</ApiConfigContext.Provider>;
}

export function useApiConfig(): ApiConfigContextValue {
  const ctx = useContext(ApiConfigContext);
  if (!ctx) throw new Error("useApiConfig must be used within an ApiConfigProvider");
  return ctx;
}
