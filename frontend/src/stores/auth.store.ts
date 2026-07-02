import { create } from "zustand";
import type  { User } from "@/types/user";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  deleteUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  deleteUser: () => {
    set({
      user: null,
      isAuthenticated: false,
    })
  }
}));