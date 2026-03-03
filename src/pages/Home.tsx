import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useUiPathAuth } from "../context/UiPathAuthContext";
import Button from "../components/UI/Button";

export default function Home() {
  const navigate = useNavigate();

  const {
    isAuthenticated: isBorrowerAuth,
    isLoading: isBorrowerLoading,
    borrowerLogout
  } = useAuth();

  const {
    isAuthenticated: isLenderAuth,
    isLoading: isLenderLoading,
    logout: lenderLogout,
    roleLender // Pull the dynamic role (Officer or Underwriter)
  } = useUiPathAuth();

  const isAnyLoading = isBorrowerLoading || isLenderLoading;
  const isAnyAuthenticated = isBorrowerAuth || isLenderAuth;

  const handleLogout = () => {
    if (isBorrowerAuth) borrowerLogout();
    if (isLenderAuth) lenderLogout();
  };

  // Helper to determine where the "Officer/Underwriter" should go
  const getLenderDashboardPath = () => {
    if (roleLender === "Underwriter") return "/underwriter/dashboard";
    return "/lender/dashboard"; // Default for Officer
  };

  if (isAnyLoading) {
    return <main className="flex items-center justify-center py-24 italic text-gray-500">Syncing session...</main>;
  }

  return (
    <main className="flex items-center justify-center px-6 py-24 h-lvh">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-black">Finance Lending Portal</h1>

        <p className="text-gray-700 text-lg md:text-xl leading-relaxed">
          A unified digital lending platform designed for speed, accuracy,
          and automation. Borrowers can apply and track loans, while lenders
          manage approvals efficiently through intelligent workflows.
        </p>

        {isAnyAuthenticated ? (
          <div className="flex flex-col items-center gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-4">
              <p className="text-green-800 text-lg">
                ✅ Logged in as: <strong>{isLenderAuth ? roleLender : "Borrower"}</strong>
              </p>
            </div>

            <div className="flex flex-row items-center gap-2">
              {isBorrowerAuth && (
                <Button onClick={() => navigate("/borrower/loan-request-steps")}>
                  Apply for a Loan
                </Button>
              )}

              {isBorrowerAuth && (
                <Button onClick={() => navigate("/borrower/dashboard")}>
                  Go to Dashboard
                </Button>
              )}
            </div>

            {isLenderAuth && (
              <Button onClick={() => navigate(getLenderDashboardPath())}>
                Go to {roleLender} Dashboard
              </Button>
            )}

            <Button onClick={handleLogout} variant="secondary">
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button onClick={() => navigate("/borrower/login")}>Get Started as Borrower</Button>
            <Button onClick={() => navigate("/lender-login")} className="border border-black text-black">
              Login as Officer / Underwriter
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../context/useAuth";
// import { useUiPathAuth } from "../context/UiPathAuthContext";
// import Button from "../components/UI/Button";

// export default function Home() {
//   const navigate = useNavigate();

//   const {
//     isAuthenticated: isBorrowerAuth,
//     isLoading: isBorrowerLoading,
//     borrowerLogout
//   } = useAuth();

//   const {
//     isAuthenticated: isLenderAuth,
//     isLoading: isLenderLoading,
//     logout: lenderLogout
//   } = useUiPathAuth();

//   const isAnyLoading = isBorrowerLoading || isLenderLoading;
//   const isAnyAuthenticated = isBorrowerAuth || isLenderAuth;

//   const handleLogout = () => {
//     if (isBorrowerAuth) borrowerLogout();
//     if (isLenderAuth) lenderLogout();
//   };

//   if (isAnyLoading) {
//     return <main className="flex items-center justify-center py-24 italic text-gray-500">Syncing session...</main>;
//   }

//   return (
//     <main className="flex items-center justify-center px-6 py-24">
//       <div className="max-w-3xl text-center space-y-8">
//         <h1 className="text-4xl md:text-5xl font-bold text-black">Finance Lending Portal</h1>

//         <p className="text-gray-700 text-lg md:text-xl leading-relaxed">
//           A unified digital lending platform designed for speed, accuracy,
//           and automation. Borrowers can apply and track loans, while lenders
//           manage approvals efficiently through intelligent workflows.
//         </p>
//         {isAnyAuthenticated ? (
//           <div className="flex flex-col items-center gap-6">
//             <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-4">
//               <p className="text-green-800 text-lg">
//                 ✅ Logged in as: <strong>{isLenderAuth ? "Lending Officer" : "Borrower"}</strong>
//               </p>
//             </div>

//             {isLenderAuth && (
//               <Button onClick={() => navigate("/lender/dashboard")}>
//                 Go to Officer Dashboard
//               </Button>
//             )}

//             <Button onClick={handleLogout} variant="secondary">
//               Logout
//             </Button>
//           </div>
//         ) : (
//           <div className="flex flex-col sm:flex-row justify-center gap-4">
//             <Button onClick={() => navigate("/borrower/login")}>Get Started as Borrower</Button>
//             <Button onClick={() => navigate("/lender-login")} className="border border-black text-black">
//               Login as Officer
//             </Button>
//           </div>
//         )}
//       </div>
//     </main>
//   );
// }


// // import { useNavigate } from "react-router-dom";
// // import { useAuth } from "../context/useAuth";
// // import { useUiPathAuth } from "../context/UiPathAuthContext"; // ✅ Import Lender Auth
// // import Button from "../components/UI/Button";

// // export default function Home() {
// //   const navigate = useNavigate();

// //   // Borrower Auth
// //   const {
// //     isAuthenticated: isBorrowerAuth,
// //     isLoading: isBorrowerLoading,
// //     borrowerLogout
// //   } = useAuth();

// //   // Lender Auth
// //   const {
// //     isAuthenticated: isLenderAuth,
// //     isLoading: isLenderLoading,
// //     logout: lenderLogout
// //   } = useUiPathAuth();

// //   const isAnyLoading = isBorrowerLoading || isLenderLoading;
// //   const isAnyAuthenticated = isBorrowerAuth || isLenderAuth;

// //   const handleLogout = () => {
// //     if (isBorrowerAuth) borrowerLogout();
// //     if (isLenderAuth) lenderLogout();
// //   };

// //   if (isAnyLoading) {
// //     return <main className="flex items-center justify-center py-24 italic text-gray-500">Syncing session...</main>;
// //   }

// //   return (
// //     <main className="flex items-center justify-center px-6 py-24">
// //       <div className="max-w-3xl text-center space-y-8">
// //         <h1 className="text-4xl md:text-5xl font-bold text-black">Finance Lending Portal</h1>

// //         <p className="text-gray-700 text-lg md:text-xl leading-relaxed">
// //           A unified digital lending platform designed for speed, accuracy,
// //           and automation. Borrowers can apply and track loans, while lenders
// //           manage approvals efficiently through intelligent workflows.
// //         </p>

// //         {isAnyAuthenticated ? (
// //           <div className="flex flex-col items-center gap-6">
// //             <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-4">
// //               <p className="text-green-800 text-lg">
// //                 ✅ Logged in as: <strong>{isLenderAuth ? "Lending Officer" : "Borrower"}</strong>
// //               </p>
// //             </div>

// //             {/* If Lender, show a button to go back to their dashboard */}
// //             {isLenderAuth && (
// //               <Button onClick={() => navigate("/lender/dashboard")} className="bg-indigo-600">
// //                 Go to Lender Dashboard
// //               </Button>
// //             )}

// //             <Button onClick={handleLogout} variant="secondary">
// //               Logout
// //             </Button>
// //           </div>
// //         ) : (
// //           <div className="flex flex-col sm:flex-row justify-center gap-4">
// //             <Button onClick={() => navigate("/borrower/login")}>Get Started as Borrower</Button>
// //             <Button onClick={() => navigate("/lender-login")} className="border border-black bg-white text-black">
// //               Login as Officer
// //             </Button>
// //           </div>
// //         )}
// //       </div>
// //     </main>
// //   );
// // }

// // // import { useNavigate } from "react-router-dom";
// // // import { useAuth } from "../context/useAuth";
// // // import Button from "../components/UI/Button";

// // // export default function Home() {
// // //   const navigate = useNavigate();

// // //   const {
// // //     isAuthenticated,
// // //     isLoading,
// // //     role,
// // //     borrowerLogout,
// // //     officerLogout,
// // //   } = useAuth();

// // //   const logout = () => {
// // //     if (role === "borrower") borrowerLogout();
// // //     if (role === "officer") officerLogout();
// // //   };

// // //   if (isLoading) {
// // //     return (
// // //       <main className="flex items-center justify-center px-6 py-24">
// // //         <p className="text-gray-600 text-lg">
// // //           Checking authentication status...
// // //         </p>
// // //       </main>
// // //     );
// // //   }

// // //   return (
// // //     <main className="flex items-center justify-center px-6 py-24">
// // //       <div className="max-w-3xl text-center space-y-8">

// // //         {/* Title */}
// // //         <div>
// // //           <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
// // //             Finance Lending Portal
// // //           </h1>
// // //           <p className="text-gray-700 text-lg md:text-xl leading-relaxed">
// // //             A unified digital lending platform designed for speed, accuracy,
// // //             and automation. Borrowers can apply and track loans, while lenders
// // //             manage approvals efficiently through intelligent workflows.
// // //           </p>
// // //         </div>

// // //         {/* Auth State */}
// // //         {isAuthenticated ? (
// // //           <div className="flex flex-col items-center gap-6">

// // //             <div className="bg-gray-100 border border-gray-300 rounded-lg px-6 py-4">
// // //               <p className="text-gray-800 text-lg font-medium">
// // //                 ✅ You are logged in as a{" "}
// // //                 <span className="font-semibold">
// // //                   {role === "borrower" ? "Borrower" : "Lending Officer"}
// // //                 </span>
// // //               </p>
// // //             </div>

// // //             <Button onClick={logout}>
// // //               Logout
// // //             </Button>
// // //           </div>
// // //         ) : (
// // //           <div className="flex flex-col sm:flex-row justify-center gap-4">

// // //             <Button onClick={() => navigate("/borrower/login")}>
// // //               Get Started as Borrower
// // //             </Button>

// // //             <Button
// // //               onClick={() => navigate("/lender/login")}
// // //               className="border border-black bg-white text-black hover:bg-gray-100"
// // //             >
// // //               Login as Officer
// // //             </Button>

// // //           </div>
// // //         )}
// // //       </div>
// // //     </main>
// // //   );
// // // }


// // // // import { Link } from "react-router-dom";
// // // // import { useAuth } from "../context/useAuth";

// // // // export default function Home() {
// // // //   const {
// // // //     isAuthenticated,
// // // //     isLoading,
// // // //     role,
// // // //     borrowerLogout,
// // // //     officerLogout,
// // // //   } = useAuth();

// // // //   const logout = () => {
// // // //     if (role === "borrower") borrowerLogout();
// // // //     if (role === "officer") officerLogout();
// // // //   };

// // // //   if (isLoading) {
// // // //     return (
// // // //       <main className="flex items-center justify-center px-6 py-24">
// // // //         <p className="text-gray-600 text-lg">Checking authentication status...</p>
// // // //       </main>
// // // //     );
// // // //   }

// // // //   return (
// // // //     <main className="flex items-center justify-center px-6 py-24">
// // // //       <div className="max-w-3xl text-center">

// // // //         <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
// // // //           Finance Lending Portal
// // // //         </h1>
// // // //         <p className="text-gray-700 text-lg md:text-xl leading-relaxed mb-10">
// // // //           A unified digital lending platform designed for speed, accuracy,
// // // //           and automation. Borrowers can apply and track loans, while lenders
// // // //           manage approvals efficiently through intelligent workflows.
// // // //         </p>

// // // //         {isAuthenticated ? (
// // // //           <div className="flex flex-col items-center gap-6">
// // // //             <div className="bg-gray-100 border border-gray-300 rounded-lg px-6 py-4">
// // // //               <p className="text-gray-800 text-lg font-medium">
// // // //                 ✅ You are logged in as a{" "}
// // // //                 <span className="font-semibold">
// // // //                   {role === "borrower" ? "Borrower" : "Lending Officer"}
// // // //                 </span>
// // // //               </p>
// // // //             </div>

// // // //             <button
// // // //               onClick={logout}
// // // //               className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition font-medium"
// // // //             >
// // // //               Logout
// // // //             </button>
// // // //           </div>
// // // //         ) : (
// // // //           <div className="flex flex-col sm:flex-row justify-center gap-4">
// // // //             <Link to="/borrower-login" className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition font-medium">
// // // //               Get Started as Borrower
// // // //             </Link>
// // // //             <Link to="/lender-login" className="px-6 py-3 border border-black rounded-md hover:bg-gray-100 transition font-medium">
// // // //               Login as Officer
// // // //             </Link>
// // // //           </div>
// // // //         )}
// // // //       </div>
// // // //     </main>
// // // //   );
// // // // }


// // // // // import { Link } from "react-router-dom";
// // // // // import { useAuth } from "../context/useAuth";

// // // // // export default function Home() {
// // // // //   const { isAuthenticated, isLoading, logout } = useAuth();

// // // // //   if (isLoading) {
// // // // //     return (
// // // // //       <main className="flex items-center justify-center px-6 py-24">
// // // // //         <p className="text-gray-600 text-lg">Checking authentication status...</p>
// // // // //       </main>
// // // // //     );
// // // // //   }

// // // // //   return (
// // // // //     <main className="flex items-center justify-center px-6 py-24">
// // // // //       <div className="max-w-3xl text-center">
// // // // //         <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
// // // // //           Finance Lending Portal
// // // // //         </h1>

// // // // //         <p className="text-gray-700 text-lg md:text-xl leading-relaxed mb-10">
// // // // //           A unified digital lending platform designed for speed, accuracy,
// // // // //           and automation. Borrowers can apply and track loans, while lenders
// // // // //           manage approvals efficiently through intelligent workflows.
// // // // //         </p>

// // // // //         {/* 🔐 AUTHENTICATED VIEW */}
// // // // //         {isAuthenticated ? (
// // // // //           <div className="flex flex-col items-center gap-6">
// // // // //             <div className="bg-gray-100 border border-gray-300 rounded-lg px-6 py-4">
// // // // //               <p className="text-gray-800 text-lg font-medium">
// // // // //                 ✅ You are logged in as a <span className="font-semibold">Lending Officer</span>
// // // // //               </p>
// // // // //               <p className="text-gray-600 text-sm mt-1">
// // // // //                 You can now access workflows, review applications, and manage approvals.
// // // // //               </p>
// // // // //             </div>

// // // // //             <button
// // // // //               onClick={logout}
// // // // //               className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition font-medium"
// // // // //             >
// // // // //               Logout
// // // // //             </button>
// // // // //           </div>
// // // // //         ) : (
// // // // //           /* 🚪 NOT AUTHENTICATED VIEW */
// // // // //           <div className="flex flex-col sm:flex-row justify-center gap-4">
// // // // //             <Link
// // // // //               to="/borrower-login"
// // // // //               className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition font-medium"
// // // // //             >
// // // // //               Get Started as Borrower
// // // // //             </Link>

// // // // //             <Link
// // // // //               to="/lender-login"
// // // // //               className="px-6 py-3 border border-black rounded-md hover:bg-gray-100 transition font-medium"
// // // // //             >
// // // // //               Login as Officer
// // // // //             </Link>
// // // // //           </div>
// // // // //         )}
// // // // //       </div>
// // // // //     </main>
// // // // //   );
// // // // // }
