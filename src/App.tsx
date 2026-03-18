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