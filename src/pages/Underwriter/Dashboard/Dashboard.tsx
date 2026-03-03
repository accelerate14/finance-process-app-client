import { useEffect, useState } from "react";
import { getAllLoansLender } from "../../../api/borrower/get";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/UI/Button";

/* ================= TYPES ================= */
interface LoanRecord {
  Id: string;
  loanAmount: number;
  tenureMonths: number;
  applicationStatus: string;
  borrowerId: string;
  CreateTime: string;
  interestRate?: number; // Optional based on API availability
}

export default function UnderwriterDashboard() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLoans = async () => {
      setLoading(true);
      const result = await getAllLoansLender();
      if (result.success) {
        // Accessing .value as per your provided lender dashboard logic
        const dataValue = result.response.data?.value || [];
        setLoans(dataValue);
      }
      setLoading(false);
    };
    fetchLoans();
  }, []);

  /* ================= CALCULATIONS ================= */
  const stats = {
    total: loans.length,
    pending: loans.filter(l => l.applicationStatus === "SUBMITTED").length,
    approvedAmount: loans
      .filter(l => l.applicationStatus === "APPROVED")
      .reduce((sum, l) => sum + (l.loanAmount || 0), 0),
    rejectedPercent: loans.length 
      ? ((loans.filter(l => l.applicationStatus === "REJECTED").length / loans.length) * 100).toFixed(2) 
      : "0.00"
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US");
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-400">Syncing Underwriter Data...</div>;

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 1. TOP METRICS BAR (Matches Screenshot 2) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 bg-white border border-gray-200 rounded-sm shadow-sm divide-x divide-gray-100">
          <MetricBox label="Total Number of Submissions" value={stats.total} />
          <MetricBox label="Submissions Pending Review" value={stats.pending} />
          <MetricBox label="Approved Loan Amount" value={`$${stats.approvedAmount.toLocaleString()}`} />
          <MetricBox label="Percent of Loans Rejected" value={`${stats.rejectedPercent}%`} />
        </div>

        {/* 2. MAIN CONTENT AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: LOAN TABLE (Matches UI Style) */}
          <div className="lg:col-span-2 bg-white rounded-sm shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100 bg-[#FBFCFD] flex justify-between items-center">
              <h2 className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">Loan Applications Report</h2>
              <div className="flex gap-3 text-gray-400 text-sm">
                {/* <button className="hover:text-gray-600">🔍</button>
                <button className="hover:text-gray-600">⤢</button> */}
                <button className="hover:text-gray-600">⋮</button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#3B82F6] text-white text-[11px] uppercase tracking-tighter">
                    <th className="px-4 py-3 font-bold border-r border-blue-400/50">Loan ID</th>
                    <th className="px-4 py-3 font-bold border-r border-blue-400/50">Loan Amount</th>
                    <th className="px-4 py-3 font-bold border-r border-blue-400/50">Requested On</th>
                    <th className="px-4 py-3 font-bold border-r border-blue-400/50">Interest Rate (%)</th>
                    <th className="px-4 py-3 font-bold">Term (Months)</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] text-gray-700">
                  {loans.map((loan, idx) => (
                    <tr 
                      key={loan.Id} 
                      className="border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/lender/loan-action/${loan.Id}/${loan.borrowerId}`)}
                    >
                      <td className="px-4 py-3 text-blue-600 font-semibold underline decoration-blue-200">
                        LO - {String(idx + 1).padStart(6, '0')}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">${loan.loanAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(loan.CreateTime)}</td>
                      <td className="px-4 py-3 text-gray-500">{loan.interestRate?.toFixed(2) || "0.00"}</td>
                      <td className="px-4 py-3 text-gray-500">{loan.tenureMonths}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT: PROCESS TRACKER (Matches Screenshot 2) */}
          <div className="space-y-2">
             <StatusCard label="Started" color="bg-green-500" date="5/17/2023 4:29 PM" isComplete />
             <StatusCard label="Credit Score Calculation" color="bg-blue-500" date="5/17/2023 4:29 PM" isComplete />
             <StatusCard 
                label="Loan Officer Review" 
                color="bg-amber-500" 
                date="5/17/2023 4:29 PM" 
                comment="good"
                isComplete 
             />
             <StatusCard label="Applicant Document Upload" color="bg-green-500" date="5/17/2023 4:29 PM" isComplete />
             <StatusCard label="Underwriter Review" color="bg-orange-400" date="CURRENT" isActive />
             <StatusCard label="Pending Signature" color="bg-gray-400" date="Not Started" />
             <StatusCard label="Rejected" color="bg-pink-500" date="Not Started" />
          </div>

        </div>
      </div>
    </div>
  );
}

/* ================= HELPER COMPONENTS ================= */

function MetricBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-5 flex flex-col justify-center">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-2 border-b border-gray-50 pb-1">
        {label}
      </p>
      <p className="text-3xl font-light text-gray-800">{value}</p>
    </div>
  );
}

function StatusCard({ label, color, date, isComplete, isActive, comment }: any) {
  return (
    <div className={`rounded-sm border ${isActive ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'} bg-white overflow-hidden shadow-sm`}>
      <div className={`${color} px-3 py-1 flex justify-between items-center text-[10px] font-bold text-white uppercase`}>
        <div className="flex items-center gap-1">
          {isComplete && <span>✓</span>}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {isActive && <span className="bg-white text-blue-600 px-1 rounded-[2px] text-[8px]">CURRENT</span>}
          <span className="opacity-90">{date}</span>
        </div>
      </div>
      {comment && (
        <div className="p-3 bg-white flex flex-col gap-1 border-b border-gray-50">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-400">💬</div>
             <div className="flex flex-col">
                <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">Loan Officer Comments:</span>
                <span className="text-[11px] text-gray-600 italic">"{comment}"</span>
             </div>
          </div>
          <span className="text-[8px] text-gray-300 self-end italic">JL &gt; 5/17/2023 4:29 PM</span>
        </div>
      )}
    </div>
  );
}