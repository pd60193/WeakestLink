"use client";

import { useState, useRef, useEffect } from "react";
import {
  PersistedGameSession,
  loadSession,
  clearSession as clearStoredSession,
} from "@/lib/sessionPersistence";

export function useSessionPersistence() {
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const savedStateRef = useRef<PersistedGameSession | null>(null);

  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      savedStateRef.current = saved;
      setHasSavedSession(true);
    }
    setIsReady(true);
  }, []);

  const clearSession = () => {
    clearStoredSession();
    savedStateRef.current = null;
    setHasSavedSession(false);
  };

  return {
    hasSavedSession,
    savedState: savedStateRef.current,
    isReady,
    clearSession,
  };
}
