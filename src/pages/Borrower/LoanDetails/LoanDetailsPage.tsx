import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { getBorrowerProfile, getLoanById } from "../../../api/borrower/get";
import Button from "../../../components/UI/Button";
import Card from "../../../components/UI/Card";
import StatBox from "../../../components/UI/StatBox";

const STAGES = [
  "Application Submitted",
  "Eligibility Evaluation",
  "Loan Officer Review",
  "Document Uploaded",
  "Loan Officer Document Review",
  "Underwriter Approval",
  "Borrower Signature"
];

export default function LoanDetailsPage() {
  const { loanId } = useParams();
  const location = useLocation();
  const borrowerId = localStorage.getItem("borrowerId") || "";

  const [activeTab, setActiveTab] = useState<"details" | "actions">("details");
  const [loan, setLoan] = useState<any>(location.state?.loan || null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(!location.state?.loan);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const requests: [Promise<any>, Promise<any> | null] = [
          getBorrowerProfile(borrowerId),
          !loan ? getLoanById(loanId!) : null
        ];

        const [pRes, lRes] = await Promise.all(requests);

        if (pRes.success) setProfile(pRes.response.data);
        if (lRes && lRes.success) setLoan(lRes.response.data);
        
      } catch (err) {
        console.error("Error loading details:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [borrowerId, loanId, loan]);

  if (loading && !loan) return <div className="p-10 text-center italic">Syncing loan data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {["details", "actions"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 md:px-8 py-3 text-xs md:text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                activeTab === tab 
                ? "border-b-2 border-black text-black" 
                : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab === "details" ? "Loan Details" : "Actions"}
            </button>
          ))}
        </div>

        {activeTab === "details" ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Status Header */}
            <Card>
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div className="text-center md:text-left">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Application Status</p>
                  <h2 className="text-2xl font-extrabold text-amber-500">
                    {loan?.CaseStatus || "PROCESSING"}
                  </h2>
                </div>
                <div className="flex-1 max-w-full md:max-w-md">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-2 font-bold uppercase">
                    <span>Applied</span>
                    <span>Disbursed</span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: '45%' }} 
                    ></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatBox label="Loan Amount" value={`₹${loan?.LoanAmount?.toLocaleString()}`} />
              <StatBox label="Interest Rate" value="5.2% p.a." />
              <StatBox label="Tenure" value={`${loan?.TermOfLoan} Months`} />
              <StatBox label="Monthly EMI" value="₹16,500" valueColor="text-indigo-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Borrower Info Card */}
              <div className="lg:col-span-1">
                <Card title="Borrower Details">
                  <div className="space-y-4">
                    <InfoRow label="ID" value={loan?.Id?.split('-')[0].toUpperCase()} />
                    <InfoRow label="Name" value={`${profile?.Firstname || '...'} ${profile?.LastName || ''}`} />
                    <InfoRow label="Email" value={profile?.Email || '...'} />
                    <InfoRow label="Employment" value="Salaried" />
                    <InfoRow label="KYC Status" value="Verified" isStatus />
                  </div>
                </Card>
              </div>

              {/* Progress Stepper Card - Changed to single column */}
              <div className="lg:col-span-2">
                <Card title="Application Journey">
                  <div className="flex flex-col space-y-0">
                    {STAGES.map((stage, index) => (
                      <StepItem 
                        key={stage} 
                        label={stage} 
                        isCompleted={index < (loan?.currentStep || 3)} 
                        isActive={index === (loan?.currentStep || 3)}
                        isLast={index === STAGES.length - 1}
                      />
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Actions bar */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
              <Button variant="secondary" className="w-full sm:w-auto">View Documents</Button>
              <Button variant="primary" className="w-full sm:w-auto">Contact Support</Button>
            </div>
          </div>
        ) : (
          <Card className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
               <p className="text-gray-400 font-medium italic">No pending actions for this application.</p>
               <p className="text-xs text-gray-300 mt-1">Check back once the lender reviews your docs.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* --- Internal Helper Components --- */

function InfoRow({ label, value, isStatus = false }: { label: string; value: string; isStatus?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className={`font-bold ${isStatus ? "text-green-600" : "text-gray-800"}`}>
        {value}
      </span>
    </div>
  );
}

function StepItem({ 
  label, 
  isCompleted, 
  isActive, 
  isLast 
}: { 
  label: string; 
  isCompleted: boolean; 
  isActive: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        {/* Dot */}
        <div className={`relative flex items-center justify-center w-5 h-5 rounded-full border-2 z-10 transition-all duration-500 ${
          isCompleted ? "bg-green-500 border-green-500" : isActive ? "bg-white border-amber-500" : "bg-white border-gray-200"
        }`}>
          {isCompleted && <span className="text-white text-[10px]">✓</span>}
          {isActive && <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />}
        </div>
        {/* Connector Line */}
        {!isLast && (
          <div className={`w-0.5 h-10 -my-1 transition-colors duration-500 ${
            isCompleted ? "bg-green-500" : "bg-gray-200"
          }`} />
        )}
      </div>
      
      <div className="pb-8">
        <span className={`text-sm tracking-tight block ${
          isCompleted ? "text-gray-700 font-semibold" : isActive ? "text-amber-500 font-extrabold" : "text-gray-400"
        }`}>
          {label}
        </span>
        {isActive && <span className="text-[10px] text-amber-400 font-medium italic">In progress...</span>}
      </div>
    </div>
  );
}