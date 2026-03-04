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