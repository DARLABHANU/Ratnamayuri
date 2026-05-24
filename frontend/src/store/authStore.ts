import { create } from "zustand";
import { persist } from "zustand/middleware";
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
}

const isClient = typeof window !== "undefined";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: (isClient ? Cookies.get("user_role") : null) as UserRole || null,
      isAuthenticated: isClient ? !!Cookies.get("access_token") : false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: true, role: user.role }),

      setAuth: ({ access_token, refresh_token, role, user_id }) => {
        setAuthCookies(access_token, refresh_token);
        Cookies.set("user_role", role, { expires: 30 });
        Cookies.set("user_id", String(user_id), { expires: 30 });
        set({ role, isAuthenticated: true });
      },

      logout: () => {
        clearAuth();
        set({ user: null, role: null, isAuthenticated: false });
      },

      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: "ratnamayuri-auth",
      partialize: (s) => ({ role: s.role, isAuthenticated: s.isAuthenticated }),
    }
  )
);
