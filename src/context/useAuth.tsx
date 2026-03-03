import React, { useState, useEffect, createContext, useContext } from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

type Role = "borrower" | null;

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string;
  borrowerId: string;
  isLoading: boolean;
  role: Role;
  handleBorrowerId: (id: string) => void;
  borrowerLogin: (token: string) => void;
  borrowerLogout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [borrowerId, setBorrowerId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<Role>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const restoreSession = () => {
      try {
        const borrowerToken = localStorage.getItem("borrower_token");
        if (borrowerToken) {
          const decoded = jwtDecode<{ guid: string }>(borrowerToken);
          setIsAuthenticated(true);
          setRole("borrower");
          setUserId(decoded.guid);
          setBorrowerId(localStorage.getItem('borrowerId') || "");
        }
      } catch (err) {
        console.error("Borrower session restore failed", err);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, [borrowerId]);

  const borrowerLogin = (token: string) => {
    localStorage.setItem("borrower_token", token);
    const decoded = jwtDecode<{ guid: string }>(token);
    localStorage.setItem('borrowerId', decoded.guid);
    console.log("Borrower logged in with ID:", decoded.guid);
    setUserId(decoded.guid);
    setIsAuthenticated(true);
    setRole("borrower");
  };

  const borrowerLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setRole(null);
    setUserId("");
    setBorrowerId("");
  };

  const handleBorrowerId = (id: string) => {
    setBorrowerId(id);
    localStorage.setItem('borrowerId', id);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userId,
        borrowerId,
        isLoading,
        role,
        borrowerLogin,
        borrowerLogout,
        handleBorrowerId,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

// import React, {
//   useState,
//   useEffect,
//   createContext,
//   useContext,
// } from "react";
// import type { ReactNode } from "react";
// import { UiPath } from "@uipath/uipath-typescript";
// import type { UiPathSDKConfig } from "@uipath/uipath-typescript";
// import { jwtDecode } from "jwt-decode";

// /* ================= TYPES ================= */

// type Role = "borrower" | "officer" | null;

// interface AuthContextType {
//   isAuthenticated: boolean;
//   userId: string;
//   borrowerId: string;
//   isLoading: boolean;
//   role: Role;

//   officerLogin: () => Promise<void>;
//   officerLogout: () => void;
//   handleBorrowerId: (id: string) => void;

//   borrowerLogin: (token: string) => void;
//   borrowerLogout: () => void;

//   error: string | null;
// }

// /* ================= CONTEXT ================= */

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// /* ================= PROVIDER ================= */

// export const AuthProvider: React.FC<{
//   children: ReactNode;
//   config: UiPathSDKConfig;
// }> = ({ children, config }) => {
//   const [sdk, setSdk] = useState(() => new UiPath(config));
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [userId, setUserId] = useState<string>("");
//   const [borrowerId, setBorrowerId] = useState<string>("");
//   const [isLoading, setIsLoading] = useState(true);
//   const [role, setRole] = useState<Role>(null);
//   const [error, setError] = useState<string | null>(null);

//   /* 🔁 Restore session */
//   useEffect(() => {
//     const restoreSession = async () => {
//       try {
//         // Borrower
//         const borrowerToken = localStorage.getItem("borrower_token");
//         const userId = jwtDecode<{ guid: string }>(localStorage.getItem("borrower_token") || "").guid;
//         console.log("Restored outside borrower session with ID:", userId);
//         const borrowerId = localStorage.getItem('borrowerId') || "";
//         if (borrowerToken) {
//           setIsAuthenticated(true);
//           setRole("borrower");
//           console.log("Restored borrower session with ID:", userId);
//           setUserId(userId);
//           setBorrowerId(borrowerId);
//           return;
//         }

//         // Officer OAuth callback
//         if (sdk.isInOAuthCallback()) {
//           await sdk.completeOAuth();
//         }

//         if (sdk.isAuthenticated()) {
//           setIsAuthenticated(true);
//           setRole("officer");
//         }
//       } catch (err) {
//         console.error(err);
//         setError("Authentication failed");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     restoreSession();
//   }, [sdk]);

//   /* ================= OFFICER ================= */

//   const officerLogin = async () => {
//     // redirect-based login
//     await sdk.initialize(); // 🚨 redirects browser
//   };

//   const handleBorrowerId = (id: string) => {
//     setBorrowerId(id);
//   }

//   const officerLogout = () => {
//     setIsAuthenticated(false);
//     setRole(null);
//     setError(null);

//     // reset SDK to allow fresh login
//     setSdk(new UiPath(config));
//   };

//   /* ================= BORROWER ================= */

//   const borrowerLogin = (token: string) => {
//     localStorage.setItem("borrower_token", token);
//     setIsAuthenticated(true);
//     setRole("borrower");
//   };

//   const borrowerLogout = () => {
//     // localStorage.removeItem("borrower_token");
//     localStorage.clear()
//     setIsAuthenticated(false);
//     setRole(null);
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         isAuthenticated,
//         userId,
//         borrowerId,
//         isLoading,
//         role,
//         officerLogin,
//         officerLogout,
//         borrowerLogin,
//         borrowerLogout,
//         handleBorrowerId,
//         error,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// /* ================= HOOK ================= */

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) {
//     throw new Error("useAuth must be used inside AuthProvider");
//   }
//   return ctx;
// };