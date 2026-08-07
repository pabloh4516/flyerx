import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AdminUser } from '@/types';
import { getAdminMe, adminLogout, clearToken, getToken } from '@/lib/api/admin';

interface AuthState {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAdmin: (admin: AdminUser | null) => void;
  fetchAdmin: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAdminStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      isAuthenticated: false,
      isLoading: true,

      setAdmin: (admin) => {
        set({
          admin,
          isAuthenticated: !!admin,
          isLoading: false,
        });
      },

      fetchAdmin: async () => {
        const token = getToken();
        if (!token) {
          set({ admin: null, isAuthenticated: false, isLoading: false });
          return;
        }

        try {
          set({ isLoading: true });
          const admin = await getAdminMe();
          set({
            admin,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          clearToken();
          set({
            admin: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      logout: async () => {
        try {
          await adminLogout();
        } catch {
          // Ignorar erros
        } finally {
          set({
            admin: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'flyerx-admin-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
