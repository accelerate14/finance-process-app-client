import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useUiPathAuth } from "../../context/UiPathAuthContext";

interface ProtectedRouteProps {
  allowedRole: "Borrower" | "Officer" | "Underwriter";
}

export const ProtectedRoute = ({ allowedRole }: ProtectedRouteProps) => {
  const { isAuthenticated: isBorrowerAuth, isLoading: isBorrowerLoading } = useAuth();
  const { 
    isAuthenticated: isLenderAuth, 
    roleLender, 
    isLoading: isLenderLoading 
  } = useUiPathAuth();

  // Wait for both auth providers to finish loading
  if (isBorrowerLoading || isLenderLoading) {
    return <div className="p-10 text-center italic text-gray-500">Verifying permissions...</div>;
  }

  // 1. Logic for Borrower Routes
  if (allowedRole === "Borrower") {
    return isBorrowerAuth ? <Outlet /> : <Navigate to="/borrower/login" replace />;
  }

  // 2. Logic for Officer/Underwriter Routes
  if (allowedRole === "Officer" || allowedRole === "Underwriter") {
    if (!isLenderAuth) return <Navigate to="/lender-login" replace />;
    
    // Check if the specific role matches (Officer vs Underwriter)
    if (roleLender !== allowedRole) {
      return <Navigate to="/access-denied" replace />;
    }
    
    return <Outlet />;
  }

  return <Navigate to="/access-denied" replace />;
};