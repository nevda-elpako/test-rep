import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { ApiConfig } from "../services/elpakoApi";

const STORAGE_KEYS = {
  accessToken: "elpako_access_token",
};

function loadConfig(): ApiConfig {
  return {
    accessToken: localStorage.getItem(STORAGE_KEYS.accessToken) || "",
  };
}

interface ApiConfigContextValue {
  config: ApiConfig;
  setConfig: (config: ApiConfig) => void;
}

const ApiConfigContext = createContext<ApiConfigContextValue | null>(null);

export function ApiConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<ApiConfig>(loadConfig);

  const value = useMemo<ApiConfigContextValue>(
    () => ({
      config,
      setConfig: (next: ApiConfig) => {
        localStorage.setItem(STORAGE_KEYS.accessToken, next.accessToken || "");
        setConfigState({ accessToken: next.accessToken || "" });
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
