import { useState, useEffect } from "react";

export default function useLocalState<T>(key: string, initial: T) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);

  useEffect(() => {
    const handleStorage = () => {
      try {
        const raw = localStorage.getItem(key);
        setState(raw ? JSON.parse(raw) : initial);
      } catch {}
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key, initial]);

  return [state, setState] as const;
}
