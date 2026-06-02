import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import Cookies from "js-cookie";
import { User, UserRole } from "@/types";
import { setAuthCookies, clearAuth } from "@/lib/api";

interface AuthState {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  setAuth: (tokens: { access_token: string; refresh_token: string; role: UserRole; user_id: number }) => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
  /** Call this once on app mount to reconcile cookie state with the store. */
  rehydrateFromCookies: () => void;
}

const isClient = typeof window !== "undefined";
const cookieToken = isClient ? Cookies.get("access_token") : null;
const cookieRole = isClient ? (Cookies.get("user_role") as UserRole) : null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: cookieRole,
      isAuthenticated: !!cookieToken,
      isLoading: !cookieToken,  // start as loading only if we do not have a token yet

      setUser: (user) => set({ user, isAuthenticated: true, role: user.role, isLoading: false }),

      setAuth: ({ access_token, refresh_token, role, user_id }) => {
        setAuthCookies(access_token, refresh_token);
        Cookies.set("user_role", role, { expires: 30, sameSite: "Lax" });
        Cookies.set("user_id", String(user_id), { expires: 30, sameSite: "Lax" });
        set({ role, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        clearAuth();
        set({ user: null, role: null, isAuthenticated: false, isLoading: false });
      },

      setLoading: (v) => set({ isLoading: v }),

      /**
       * Reads cookies (which persist across browser close) and syncs the store.
       * Call once from a client-side layout component on mount.
       * This fixes the SSR hydration gap where localStorage isn't available
       * on the first server render but cookies are always present.
       */
      rehydrateFromCookies: () => {
        if (!isClient) return;
        const hasToken = !!Cookies.get("access_token");
        const role = (Cookies.get("user_role") as UserRole) || null;
        set({
          isAuthenticated: hasToken,
          role: hasToken ? role : null,
          isLoading: false,
        });
      },
    }),
    {
      name: "ratnamayuri-auth",
      storage: createJSONStorage(() => localStorage),
      // Persist user so full_name, email etc. survive page reload without an API round-trip
      partialize: (s) => ({
        user: s.user,
        role: s.role,
        isAuthenticated: s.isAuthenticated,
      }),
      // After localStorage rehydration completes, reconcile with cookies
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // If cookie is gone (logged out on another tab / expired), clear the store
        if (isClient && !Cookies.get("access_token")) {
          state.user = null;
          state.role = null;
          state.isAuthenticated = false;
        }
        state.isLoading = false;
      },
    }
  )
);
