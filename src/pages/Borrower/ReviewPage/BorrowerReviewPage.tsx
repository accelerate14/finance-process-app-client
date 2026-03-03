import { useEffect, useState } from "react";
import {
    getBorrowerProfile,
    getEmploymentInfo,
    getLoanApplication,
} from "../../../api/borrower/get";
import Button from "../../../components/UI/Button";
import { useNavigate } from "react-router-dom";

export default function BorrowerReviewPage() {
    const navigate = useNavigate();
    const borrowerId = localStorage.getItem("borrowerId") || "";

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [profile, setProfile] = useState<any>(null);
    const [employment, setEmployment] = useState<any>(null);
    const [loan, setLoan] = useState<any>(null);

    useEffect(() => {
        const loadAll = async () => {
            try {
                const [p, e, l] = await Promise.all([
                    getBorrowerProfile(borrowerId),
                    getEmploymentInfo(borrowerId),
                    getLoanApplication(borrowerId),
                ]);

                if (!p.success || !e.success || !l.success) {
                    setError("Failed to load application details");
                    return;
                }

                setProfile(p.response.data);
                setEmployment(e.response.data);

                // ✅ HANDLE ARRAY: Pick the latest loan from the array
                const loanData = l.response.data;
                if (Array.isArray(loanData) && loanData.length > 0) {
                    // Sort by CreateTime descending or just pick the last item
                    const latestLoan = loanData[loanData.length - 1];
                    setLoan(latestLoan);
                } else if (loanData && !Array.isArray(loanData)) {
                    // Fallback if API returns a single object
                    setLoan(loanData);
                }

            } catch (err) {
                console.error("Review Page Load Error:", err);
                setError("Unable to load data");
            } finally {
                setLoading(false);
            }
        };

        loadAll();
    }, [borrowerId]);


    if (loading) {
        return <div className="p-10 text-center">Loading details...</div>;
    }

    if (error || !loan) {
        return (
            <div className="p-6 text-red-600 bg-red-50 rounded">
                {error || "No loan application found to review."}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-8 space-y-8">

                <div className="flex justify-between items-center border-b pb-4">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Review Your Loan Application
                    </h1>
                    <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                        ID: {loan.Id || "Draft"}
                    </span>
                </div>

                <Section title="Personal Information">
                    <Field label="Name" value={`${profile?.FirstName} ${profile?.LastName}`} />
                    <Field label="Email" value={profile?.Email} />
                    <Field label="Address" value={profile?.Address || "Not provided"} />
                </Section>

                <Section title="Employment Information">
                    <Field label="Status" value={employment?.EmploymentStatus} />
                    <Field label="Employer" value={employment?.EmployerName || "—"} />
                    <Field label="Monthly Income" value={`₹${employment?.MonthlyIncome?.toLocaleString()}`} />
                </Section>

                <Section title="Loan Details">
                    <Field label="Loan Type" value={loan?.PurposeOfLoan} />
                    <Field label="Amount Requested" value={`₹${loan?.LoanAmount?.toLocaleString()}`} />
                    <Field label="Tenure" value={`${loan?.TermOfLoan} months`} />
                    <Field label="Interest Rate (Est.)" value="5.2% p.a." />
                </Section>

                <div className="flex justify-between pt-6 border-t">
                    <Button 
                        onClick={() => navigate("/borrower/dashboard")} 
                        className="bg-white !text-gray-600 border hover:bg-gray-50"
                    >
                        Back to Dashboard
                    </Button>
                    
                    <Button onClick={() => navigate("/borrower/upload-documents")}>
                        Confirm & Continue
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ---------- Helpers ---------- */

function Section({ title, children }: any) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-lg font-semibold mb-4 text-indigo-600 border-l-4 border-indigo-600 pl-3">
                {title}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50 p-5 rounded-lg">
                {children}
            </div>
        </div>
    );
}

function Field({ label, value }: any) {
    return (
        <div className="text-sm">
            <div className="text-gray-500 mb-1 uppercase text-[10px] font-bold tracking-wider">{label}</div>
            <div className="font-semibold text-gray-800">{value || "N/A"}</div>
        </div>
    );
}