"use client";

/**
 * AuthInitializer — mounts once in the root layout (client-side only).
 *
 * Problem it solves:
 *   Zustand persist uses localStorage, which is unavailable during SSR.
 *   On the first render the store starts as { isAuthenticated: false }.
 *   By the time the client hydrates and reads localStorage, protected pages
 *   have already redirected the user to /auth/login.
 *
 * Fix:
 *   On mount (guaranteed client-side), read the access_token cookie.
 *   Cookies survive browser close (unlike localStorage on some mobile browsers),
 *   and are available before React hydration completes.
 *   If the cookie exists, set isAuthenticated: true immediately.
 *   If not (expired / logged out elsewhere), clear the store.
 */

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";
import Cookies from "js-cookie";

export default function AuthInitializer() {
  const { rehydrateFromCookies, setUser, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Step 1: sync cookie → store immediately (fast, synchronous)
    rehydrateFromCookies();

    // Step 2: if we have a token, silently refresh the user profile in background
    // so user.full_name, user.email etc. are always up to date
    const token = Cookies.get("access_token");
    if (token) {
      authApi
        .me()
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          // Token is invalid / expired — clear everything
          logout();
        });
    }
  }, []);

  // Renders nothing — purely for side effects
  return null;
}
