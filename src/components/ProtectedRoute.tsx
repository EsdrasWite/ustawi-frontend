import { Navigate, useLocation } from "react-router-dom";
import { useStore } from "@/lib/store";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = useStore((s) => s.isAuthenticated);
  const location = useLocation();
  if (!isAuth) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
};
