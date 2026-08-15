import { useEffect, useState } from "react";
import { AUTH_EVENT, getToken } from "../auth";

export function useIsLoggedIn(): boolean {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getToken());

  useEffect(() => {
    function handleChange() {
      setIsLoggedIn(!!getToken());
    }
    window.addEventListener(AUTH_EVENT, handleChange);
    return () => window.removeEventListener(AUTH_EVENT, handleChange);
  }, []);

  return isLoggedIn;
}