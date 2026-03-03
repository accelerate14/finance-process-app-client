import Home from "./pages/Home";
import BorrowerLogin from "./pages/Borrower/Auth/BorrowerLogin";
import BorrowerDashboard from "./pages/Borrower/Dashboard/Dashboard";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LoginScreen as LenderLogin } from "./pages/Lender/Auth/LenderLogin";

import Navbar from "./components/Header/Navbar";
import { AuthProvider } from "./context/useAuth";
import { UiPathAuthProvider } from "./context/UiPathAuthContext";

import type { UiPathSDKConfig } from "@uipath/uipath-typescript";
import BorrowerHome from "./pages/Borrower/Home/BorrowerHome";
import LoanRequestPage from "./pages/Borrower/LoanRequest/LoanRequestPage";
import BorrowerRegister from "./pages/Borrower/Auth/BorrowerRegister";
import LoanApplicationWizard from "./pages/Borrower/LoanSteps/LoanApplicationWizard";
import BorrowerReviewPage from "./pages/Borrower/ReviewPage/BorrowerReviewPage";
import UploadDocumentsPage from "./pages/Borrower/UploadDocuments/UploadDocumentsPage";
import ViewDocumentsPage from "./pages/Borrower/ViewDocumentsPage/ViewDocumentsPage";
import LoanDetailsPage from "./pages/Borrower/LoanDetails/LoanDetailsPage";
import LenderDashboard from "./pages/Lender/Dashboard/Dashboard";
import LoanActionPage from "./pages/Lender/LoanAction/LoanActionPage";
import UnderwriterDashboard from "./pages/Underwriter/Dashboard/Dashboard";

import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import AccessDenied from "./components/FailedUI/AccessDenied";
import Footer from "./components/Footer/Footer";

const authConfig: UiPathSDKConfig = {
  clientId: import.meta.env.VITE_UIPATH_CLIENT_ID,
  orgName: import.meta.env.VITE_UIPATH_ORG_NAME,
  tenantName: import.meta.env.VITE_UIPATH_TENANT_NAME,
  baseUrl: import.meta.env.VITE_UIPATH_BASE_URL,
  redirectUri: import.meta.env.VITE_UIPATH_REDIRECT_URI,
  scope: import.meta.env.VITE_UIPATH_SCOPE,
};

export default function App() {
  return (
    <UiPathAuthProvider config={authConfig}>
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/borrower/login" element={<BorrowerLogin />} />
            <Route path="/borrower/register" element={<BorrowerRegister />} />
            <Route path="/lender-login" element={<LenderLogin />} />
            <Route path="/access-denied" element={<AccessDenied />} />

            {/* Restricted to: BORROWER */}
            <Route element={<ProtectedRoute allowedRole="Borrower" />}>
              <Route path="/borrower/dashboard" element={<BorrowerDashboard />} />
              <Route path="/borrower/home" element={<BorrowerHome />} />
              <Route path="/borrower/loan-request" element={<LoanRequestPage />} />
              <Route path="/borrower/loan-request-steps" element={<LoanApplicationWizard />} />
              <Route path="/borrower/review" element={<BorrowerReviewPage />} />
              <Route path="/borrower/upload-documents" element={<UploadDocumentsPage />} />
              <Route path="/borrower/view-documents" element={<ViewDocumentsPage />} />
              <Route path="/borrower/loan-details/:loanId" element={<LoanDetailsPage />} />
              <Route path="/borrower/dashboard?event=signing_complete" element={<BorrowerDashboard />} />
            </Route>

            {/* Restricted to: OFFICER */}
            <Route element={<ProtectedRoute allowedRole="Officer" />}>
              <Route path="/lender/dashboard" element={<LenderDashboard />} />
              <Route path="/lender/loan-action/:loanId/:borrowerId" element={<LoanActionPage />} />
            </Route>

            {/* Restricted to: UNDERWRITER */}
            <Route element={<ProtectedRoute allowedRole="Underwriter" />}>
              <Route path="/underwriter/dashboard" element={<UnderwriterDashboard />} />
            </Route>

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Footer />
        </Router>
      </AuthProvider>
    </UiPathAuthProvider>
  );
}




// export default function App() {

//   return (
//     <UiPathAuthProvider config={authConfig}>
//       <AuthProvider>
//         <Router>
//           <Navbar />

//           <Routes>
//             <Route path="/" element={<Home />} />
//             <Route
//               path="/borrower/login"
//               element={<BorrowerLogin />}
//             />
//             <Route
//               path="/borrower/register"
//               element={<BorrowerRegister />}
//             />
//             <Route path="/lender-login" element={<LenderLogin />} />
//             <Route
//               path="/borrower/dashboard"
//               element={<BorrowerDashboard />}
//             />
//             <Route
//               path="/borrower/home"
//               element={<BorrowerHome />}
//             />
//             <Route
//               path="/borrower/loan-request"
//               element={<LoanRequestPage />}
//             />
//             <Route
//               path="/borrower/loan-request-steps"
//               element={<LoanApplicationWizard />}
//             />
//             <Route path="/borrower/review" element={<BorrowerReviewPage />} />
//             <Route path="/borrower/upload-documents" element={<UploadDocumentsPage />} />
//             <Route path="/borrower/view-documents" element={<ViewDocumentsPage />} />
//             <Route path="/borrower/loan-details/:loanId" element={<LoanDetailsPage />} />
//             <Route path="/lender/dashboard" element={<LenderDashboard />} />
//             <Route path="/lender/loan-action/:loanId/:borrowerId" element={<LoanActionPage />} />
//             <Route path="/underwriter/dashboard" element={<UnderwriterDashboard />} />

//           </Routes>
//         </Router>
//       </AuthProvider>
//     </UiPathAuthProvider>
//   );
// }



// import Home from "./pages/Home";
// import BorrowerLogin from "./pages/Borrower/Auth/BorrowerLogin";
// // import LenderLogin from "./pages/Lender/Auth/LenderLogin";
// import Navbar from "./components/Navbar";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { LoginScreen as LenderLogin } from "./pages/Lender/Auth/LenderLogin";
// import { AuthProvider } from "./context/useAuth";
// import type { UiPathSDKConfig } from '@uipath/uipath-typescript';
// import BorrowerDashboard from "./pages/Borrower/Dashboard/Dashboard";

// const authConfig: UiPathSDKConfig = {
//   clientId: import.meta.env.VITE_UIPATH_CLIENT_ID,
//   orgName: import.meta.env.VITE_UIPATH_ORG_NAME,
//   tenantName: import.meta.env.VITE_UIPATH_TENANT_NAME,

//   // 🚨 MUST be UiPath Cloud
//   baseUrl: "https://staging.uipath.com",

//   // 🚨 MUST match Admin Center EXACTLY
//   redirectUri: "http://localhost:5173/",

//   // 🚨 Keep scopes SMALL
//   scope: "offline_access OR.Execution",
// };

// export default function App() {
//   return (
//     <AuthProvider config={authConfig}>
//       <Router>
//         <Navbar />
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/borrower-login" element={<BorrowerLogin />} />
//           <Route path="/lender-login" element={<LenderLogin />} />
//           <Route path="/borrower/dashboard" element={<BorrowerDashboard />} />
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// }


// // import { useEffect, useState } from 'react'
// // import reactLogo from './assets/react.svg'
// // import viteLogo from '/vite.svg'
// // import './App.css'
// // import { UiPath } from '@uipath/uipath-typescript';


// // function App() {
// //   const [count, setCount] = useState(0);

// //   const sdk = new UiPath({
// //     baseUrl: import.meta.env.VITE_UIPATH_BASE_URL || 'https://cloud.uipath.com',
// //     orgName: import.meta.env.VITE_UIPATH_ORG_NAME || 'your-organization',
// //     tenantName: import.meta.env.VITE_UIPATH_TENANT_NAME || 'your-tenant',
// //     clientId: import.meta.env.VITE_UIPATH_CLIENT_ID || 'your-client-id',
// //     redirectUri: import.meta.env.VITE_UIPATH_REDIRECT_URI || 'your-redirect-uri',
// //     scope: import.meta.env.VITE_UIPATH_SCOPE || 'your-scopes',
// //   });


// //   // IMPORTANT: OAuth requires calling initialize()
// //   useEffect(() => {
// //     async function initalizeSdk() {
// //       try {
// //         await sdk.initialize();
// //         console.log('SDK initialized successfully');

// //         // Now you can use the SDK
// //         const tasks = await sdk.tasks.getAll();
// //       } catch (error) {
// //         console.error('Failed to initialize SDK:', error);
// //       }
// //     }
// //     initalizeSdk();
// //   }, [])

// //   useEffect(() => {
// //     const interval = setInterval(() => {
// //       setCount((prevCount) => prevCount + 1);
// //     }, 1000);

// //     return () => clearInterval(interval);
// //   }, []);


// //   return (
// //     <>
// //       <div>
// //         <a href="https://vite.dev" target="_blank">
// //           <img src={viteLogo} className="logo react" alt="Vite logo" />
// //         </a>
// //         <a href="https://react.dev" target="_blank">
// //           <img src={reactLogo} className="logo react" alt="React logo" />
// //         </a>
// //       </div>
// //       <h1>Hello guys!!</h1>
// //       <div className="card">
// //         <button onClick={() => setCount((count) => count + 1)}>
// //           count is {count}
// //         </button>
// //         <p>
// //           Edit <code>src/App.tsx</code> and save to test HMR
// //         </p>
// //       </div>
// //       <p className="read-the-docs">
// //         Click on the Vite and React logos to learn more
// //       </p>
// //     </>
// //   )
// // }

// // export default App