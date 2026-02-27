// src/stores/authStore.js
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAdmin: false,
      isSuspended: false,
      isFlagged: false,  // 🆕 추가

      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      setAuth: (user, token) =>
        set({
          user,
          token,
          isAdmin: user?.role === 'ADMIN',
          isSuspended: user?.isSuspended || false,
          isFlagged: user?.isFlagged || false,  // 🆕 추가
        }),

      logout: () => {
        localStorage.removeItem('auth-storage')
        set({ user: null, token: null, isAdmin: false, isSuspended: false, isFlagged: false, hasHydrated: true })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),

      onRehydrateStorage: () => (state, error) => {
        if (error) {
          state?.setHasHydrated(true)
          return
        }
        state?.setHasHydrated(true)
      },
    }
  )
)