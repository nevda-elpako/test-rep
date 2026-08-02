import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../services/elpakoApi";

export type ControlCodeStatus = "idle" | "waiting" | "success" | "error";

interface StatusResult {
  status: string;
}

interface UseControlCodeFlowOptions<TInit extends { token: string; control_code: string }, TStatus extends StatusResult> {
  durationSeconds?: number;
  pollIntervalMs?: number;
  initFn: () => Promise<TInit>;
  statusFn: (token: string) => Promise<TStatus>;
  onSuccess: (result: TStatus) => void;
}

// Shared control-code init → poll → success/error state machine, used by
// both the Mobile-ID/Smart-ID login flow and the document-signing flow
// (previously duplicated as auth-common.js's initControlCode and
// document-signing.js's runControlCodeSign in the static site).
export function useControlCodeFlow<TInit extends { token: string; control_code: string }, TStatus extends StatusResult>(
  options: UseControlCodeFlowOptions<TInit, TStatus>
) {
  const [status, setStatus] = useState<ControlCodeStatus>("idle");
  const [controlCode, setControlCode] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(options.durationSeconds ?? 120);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cancelledRef = useRef(false);
  const pollTimerRef = useRef<number | undefined>(undefined);
  const countdownTimerRef = useRef<number | undefined>(undefined);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  function stopTimers() {
    if (pollTimerRef.current) window.clearTimeout(pollTimerRef.current);
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
  }

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    stopTimers();
    setStatus("idle");
    setControlCode(null);
  }, []);

  const start = useCallback(() => {
    cancelledRef.current = false;
    setStatus("waiting");
    setControlCode(null);
    setErrorMessage(null);
    setRemainingSeconds(optionsRef.current.durationSeconds ?? 120);

    countdownTimerRef.current = window.setInterval(() => {
      setRemainingSeconds((r) => Math.max(0, r - 1));
    }, 1000);

    const pollIntervalMs = optionsRef.current.pollIntervalMs ?? 2000;

    optionsRef.current
      .initFn()
      .then((initResult) => {
        if (cancelledRef.current) return;
        setControlCode(initResult.control_code);

        const poll = () => {
          if (cancelledRef.current) return;
          optionsRef.current
            .statusFn(initResult.token)
            .then((result) => {
              if (cancelledRef.current) return;
              if (result.status === "waiting") {
                pollTimerRef.current = window.setTimeout(poll, pollIntervalMs);
                return;
              }
              stopTimers();
              setStatus("success");
              optionsRef.current.onSuccess(result);
            })
            .catch((err: unknown) => {
              stopTimers();
              setStatus("error");
              setErrorMessage(err instanceof ApiError || err instanceof Error ? err.message : "Klaida.");
            });
        };
        pollTimerRef.current = window.setTimeout(poll, pollIntervalMs);
      })
      .catch((err: unknown) => {
        stopTimers();
        setStatus("error");
        setErrorMessage(err instanceof ApiError || err instanceof Error ? err.message : "Nepavyko pradėti.");
      });
  }, []);

  useEffect(() => stopTimers, []);

  return { status, controlCode, remainingSeconds, errorMessage, start, cancel };
}
