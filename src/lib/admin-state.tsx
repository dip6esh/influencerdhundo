/**
 * Admin auth context — completely isolated from creator/business state.
 * Only used by /admin routes; not exposed anywhere else.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabaseDb } from "./supabase";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
};

type AdminState = {
  adminUser: AdminUser | null;
  adminLoading: boolean;
  loginAdmin: (user: AdminUser) => void;
  signOutAdmin: () => Promise<void>;
};

const AdminContext = createContext<AdminState | null>(null);

export function AdminStateProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);

  // On mount, check if there's already an active admin session
  useEffect(() => {
    supabaseDb
      .getAdminSession()
      .then((session) => {
        if (session) setAdminUser(session);
      })
      .finally(() => setAdminLoading(false));
  }, []);

  const value = useMemo<AdminState>(
    () => ({
      adminUser,
      adminLoading,
      loginAdmin: (user: AdminUser) => setAdminUser(user),
      signOutAdmin: async () => {
        await supabaseDb.signOutAdmin();
        setAdminUser(null);
      },
    }),
    [adminUser, adminLoading],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdminState() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdminState must be used inside AdminStateProvider");
  return ctx;
}
