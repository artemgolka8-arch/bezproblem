import { useEffect, useRef } from "react";
import { useAuth } from "./AuthContext.jsx";

const IDLE_LIMIT_MS = 20 * 60 * 1000; // 20 minutes of inactivity

export function useIdleLogout() {
  const { token, logout } = useAuth();
  const timer = useRef(null);

  useEffect(() => {
    if (!token) return;

    const reset = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        logout();
        window.location.href = "/login?reason=idle";
      }, IDLE_LIMIT_MS);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();

    return () => {
      clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [token, logout]);
}
