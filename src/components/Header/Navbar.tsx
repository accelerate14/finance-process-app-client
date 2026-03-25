import { Link, useNavigate } from "react-router-dom";
import accelirateLogo from "./Accelirate.png";
import { useAuth } from "../../context/useAuth";
import { useUiPathAuth } from "../../context/UiPathAuthContext";
import Button from "../UI/Button";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

export default function Navbar() {
  const navigate = useNavigate();
  
  const { isAuthenticated: isBorrowerAuth, borrowerLogout, role: borrowerRole, borrowerId } = useAuth();
  const { isAuthenticated: isLenderAuth, logout: lenderLogout, roleLender: lenderRole, user: username } = useUiPathAuth();
  const [role, setRole] = useState("");
  const [name, setName] = useState("");

  const anyAuthenticated = isBorrowerAuth || isLenderAuth;

  const handleLogout = () => {
    if (isBorrowerAuth) borrowerLogout();
    if (isLenderAuth) lenderLogout();

    setName("");
    setRole("");
    navigate("/");
  };

  useEffect(() => {
    const lenderToken = localStorage.getItem(`uipath_sdk_user_token-${import.meta.env.VITE_UIPATH_CLIENT_ID}`);
    if (lenderToken) {
      console.log("Navbar - role from localStorage:", lenderToken);
      setRole('Lender');
    }
  }, [isLenderAuth]);

  useEffect(() => {
    const borrowerToken = localStorage.getItem("borrower_token");
    if (isBorrowerAuth && borrowerToken) {
    try {
        const decoded = jwtDecode<any>(borrowerToken);
        setName(decoded?.email || "");
        setRole('Borrower');
      } catch (e) {
        console.error("Token decode failed", e);
      }
    } else {
      // IF NOT authenticated, CLEAR the name
      setName("");
      setRole("");
    }

  }, [isBorrowerAuth, borrowerId]);

  return (
    <nav className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={accelirateLogo} alt="Logo" className="h-10 rounded w-auto" />
          {/* <span className="text-xl font-bold tracking-wide text-black">AcceliFinance</span> */}
          {lenderRole && <span className="text-l border rounded p-1 border-black tracking-wide text-black">{lenderRole.toUpperCase()} PORTAL</span>}
          {borrowerRole && <span className="text-l p-1 tracking-wide text-black">{borrowerRole.toUpperCase()} PORTAL</span>}
        </Link>

        {/* {lenderRole && <span className="text-sm font-medium text-black-700">{lenderRole.toUpperCase()}</span>} */}

        <div className="flex gap-3 items-center">
          {username && <span className="text-l font-medium text-black-700">{username}</span>}
          {name && <span className="text-l font-medium text-black-700">{name}</span>}
          {anyAuthenticated || isLenderAuth ? (
            <Button
              onClick={handleLogout}
              className="px-4 py-2 border border-black rounded-md text-sm font-medium hover:bg-gray-100 transition"
            >
              Logout
            </Button>
          ) : (
            <>
              <Link to="/borrower/login" className="px-4 py-2 border border-black rounded-md text-sm font-medium">
                Borrower Login
              </Link>
              <Link to="/lender-login" className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium">
                Lender Login
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// import { Link, useNavigate } from "react-router-dom";
// import accelirateLogo from "./Accelirate.png";
// import { useAuth } from "../../context/useAuth";
// import { useUiPathAuth } from "../../context/UiPathAuthContext"; // ✅ Import Lender Auth

// export default function Navbar() {
//   const navigate = useNavigate();
  
//   // Borrower Auth
//   const { 
//     isAuthenticated: isBorrowerAuth, 
//     borrowerLogout 
//   } = useAuth();

//   // Lender Auth
//   const { 
//     isAuthenticated: isLenderAuth, 
//     logout: lenderLogout 
//   } = useUiPathAuth();

//   // Combined state
//   const anyAuthenticated = isBorrowerAuth || isLenderAuth;

//   const handleLogout = () => {
//     if (isBorrowerAuth) borrowerLogout();
//     if (isLenderAuth) lenderLogout();
//     navigate("/");
//   };

//   return (
//     <nav className="w-full border-b border-gray-200 bg-white">
//       <div className="mx-auto px-6 py-4 flex items-center justify-between">
//         <Link to="/" className="flex items-center gap-3">
//           <img src={accelirateLogo} alt="Logo" className="h-9 w-auto" />
//           <span className="text-xl font-bold tracking-wide text-black">AcceliFinance</span>
//         </Link>

//         <div className="flex gap-3">
//           {anyAuthenticated ? (
//             <button
//               onClick={handleLogout}
//               className="px-4 py-2 border border-black cursor-pointer rounded-md text-sm font-medium hover:bg-gray-100 transition"
//             >
//               Logout
//             </button>
//           ) : (
//             <>
//               <Link to="/borrower/login" className="px-4 py-2 border border-black rounded-md text-sm font-medium">
//                 Borrower Login
//               </Link>
//               <Link to="/lender-login" className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium">
//                 Dashboard Login
//               </Link>
//             </>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// }

// // import { Link, useNavigate } from "react-router-dom";
// // import accelirateLogo from "./Accelirate.png";
// // import { useAuth } from "../../context/useAuth";
// // import { useUiPathAuth } from "../../context/UiPathAuthContext";


// // export default function Navbar() {
// //   const navigate = useNavigate();
// //   const {
// //     isAuthenticated,
// //     role,
// //     borrowerLogout,
// //     officerLogout,
// //   } = useAuth();

// //   // Lender Auth
// //   const handleLogout = () => {
// //     if (role === "borrower") borrowerLogout();
// //     if (role === "officer") officerLogout();
// //     navigate("/");
// //   };

// //   return (
// //     <nav className="w-full border-b border-gray-200 bg-white">
// //       <div className="mx-auto px-6 py-4 flex items-center justify-center sm:justify-between">
// //         <Link to="/" className="flex items-center gap-3">
// //           <img src={accelirateLogo} alt="AcceliFinance Logo" className="h-9 w-auto" />
// //           <span className="text-xl sm:text-2xl cursor-pointer font-bold tracking-wide text-black">
// //             AcceliFinance
// //           </span>
// //         </Link>

// //         <div className="hidden sm:flex gap-3">
// //           {isAuthenticated ? (
// //             <button
// //               onClick={handleLogout}
// //               className="px-4 py-2 border border-black cursor-pointer rounded-md text-sm font-medium hover:bg-gray-100 transition"
// //             >
// //               Logout
// //             </button>
// //           ) : (
// //             <>
// //               <Link
// //                 to="/borrower/login"
// //                 className="px-4 py-2 border border-black cursor-pointer rounded-md text-sm font-medium hover:bg-gray-100 transition"
// //               >
// //                 Borrower Login
// //               </Link>
// //               <Link
// //                 to="/lender-login"
// //                 className="px-4 py-2 bg-black text-white cursor-pointer rounded-md text-sm font-medium hover:bg-gray-800 transition"
// //               >
// //                 Dashboard Login
// //               </Link>
// //             </>
// //           )}
// //         </div>
// //       </div>
// //     </nav>
// //   );
// // }


// // // import { Link, useNavigate, useLocation } from "react-router-dom";
// // // import accelirateLogo from "./Accelirate.png";
// // // import { useEffect, useState } from "react";

// // // export default function Navbar() {
// // //   const [token, setToken] = useState<string | null>(null);
// // //   const navigate = useNavigate();
// // //   const location = useLocation();

// // //   useEffect(() => {
// // //     const borrowerToken = localStorage.getItem("borrower_token");
// // //     setToken(borrowerToken);
// // //   }, [location]);

// // //   const handleLogout = () => {
// // //     localStorage.removeItem("borrower_token");
// // //     localStorage.removeItem("borrower_role");
// // //     setToken(null);
// // //     navigate("/");
// // //   };

// // //   return (
// // //     <nav className="w-full border-b border-gray-200 bg-white">
// // //       <div className="mx-auto px-6 py-4 flex items-center justify-center sm:justify-between">
// // //         <Link to="/" className="flex items-center gap-3">
// // //           <img src={accelirateLogo} alt="AcceliFinance Logo" className="h-9 w-auto" />
// // //           <span className="text-xl sm:text-2xl cursor-pointer font-bold tracking-wide text-black">
// // //             AcceliFinance
// // //           </span>
// // //         </Link>

// // //         <div className="hidden sm:flex gap-3">
// // //           {token ? (
// // //             <button
// // //               onClick={handleLogout}
// // //               className="px-4 py-2 border border-black cursor-pointer rounded-md text-sm font-medium hover:bg-gray-100 transition"
// // //             >
// // //               Logout
// // //             </button>
// // //           ) : (
// // //             <>
// // //               <Link
// // //                 to="/borrower-login"
// // //                 className="px-4 py-2 border border-black cursor-pointer rounded-md text-sm font-medium hover:bg-gray-100 transition"
// // //               >
// // //                 Borrower Login
// // //               </Link>
// // //               <Link
// // //                 to="/lender-login"
// // //                 className="px-4 py-2 bg-black text-white cursor-pointer rounded-md text-sm font-medium hover:bg-gray-800 transition"
// // //               >
// // //                 Dashboard Login
// // //               </Link>
// // //             </>
// // //           )}
// // //         </div>
// // //       </div>
// // //     </nav>
// // //   );
// // // }
