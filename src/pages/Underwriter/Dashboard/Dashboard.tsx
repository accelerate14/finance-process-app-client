import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUiPathAuth } from "../../../context/UiPathAuthContext";
import { Entities } from '@uipath/uipath-typescript/entities';

/* ================= TYPES ================= */
interface LoanRecord {
  Id: string;
  LoanAmount: number;
  TermOfLoan: number;
  CaseStatus: string;
  UserId: string;
  InterestRate?: number;
  CreateTime: string;
  PurposeOfLoan?: string;
}

export default function UnderwriterDashboard() {
  const { sdk, isAuthenticated } = useUiPathAuth();
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLoansWithSDK = async () => {
      if (!sdk || !isAuthenticated) return;
      setLoading(true);
      try {
        const entitiesService = new Entities(sdk);
        // Fetching from the specific Loan Applications Entity
        const allEntities = await entitiesService.getAll();
        const loanMeta = allEntities.find(e => e.name === "FLCMLoanApplications");

        if (loanMeta) {
          const result = await entitiesService.getAllRecords(loanMeta.id);
          // SDK returns records in .items
          setLoans(result.items as any);
        }
      } catch (err) {
        console.error("SDK Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoansWithSDK();
  }, [sdk, isAuthenticated]);

  /* ================= GROUPING LOGIC ================= */
  const groupedData = useMemo(() => {
    return loans.reduce((acc, loan) => {
      const uid = loan.UserId || "Unknown User";
      if (!acc[uid]) acc[uid] = [];
      acc[uid].push(loan);
      return acc;
    }, {} as Record<string, LoanRecord[]>);
  }, [loans]);

  const stats = {
    totalUsers: Object.keys(groupedData).length,
    activeLoans: loans.length,
    pendingUnderwriting: loans.filter(l => l.CaseStatus === "UNDERWRITER_REVIEW").length,
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Underwriter Queue</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER & METRICS */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Underwriter Queue</h1>
            <p className="text-slate-500 font-medium">Grouped by Applicant ID</p>
          </div>
          <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
            <MetricSmall label="Total Applicants" value={stats.totalUsers} />
            <MetricSmall label="Total Loans" value={stats.activeLoans} />
            <MetricSmall label="In Review" value={stats.pendingUnderwriting} />
          </div>
        </div>

        {/* MAIN GROUPED TABLE */}
        <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.1em]">
                <th className="px-6 py-4">Applicant User ID</th>
                <th className="px-6 py-4">Submission Count</th>
                <th className="px-6 py-4">Latest Application Date</th>
                <th className="px-6 py-4 text-right">Queue Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {Object.entries(groupedData).map(([userId, userLoans]) => (
                <React.Fragment key={userId}>
                  <tr
                    className={`border-b border-slate-50 transition-colors cursor-pointer hover:bg-indigo-50/30 ${expandedUser === userId ? 'bg-indigo-50/50' : ''}`}
                    onClick={() => setExpandedUser(expandedUser === userId ? null : userId)}
                  >
                    <td className="px-6 py-5 font-black text-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">
                        {userId.substring(0, 2).toUpperCase()}
                      </div>
                      {userId}
                    </td>
                    <td className="px-6 py-5">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                        {userLoans.length} Applications
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-medium">
                      {new Date(userLoans[0].CreateTime).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">
                        {expandedUser === userId ? "Close Folder" : "Open Folder"}
                      </button>
                    </td>
                  </tr>

                  {/* EXPANDED LOAN LIST */}
                  {expandedUser === userId && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={4} className="px-10 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {userLoans.map((loan, i) => (
                            <div
                              key={loan.Id}
                              onClick={(e) => {
                                e.stopPropagation(); // 1. Prevents closing the folder when clicking the card
                                navigate(`/lender/loan-action/${loan.Id}/${loan.UserId}`);
                              }}
                              className="bg-white p-5 rounded-xl border-2 border-slate-200 hover:border-indigo-500 cursor-pointer transition-all shadow-sm group active:scale-95"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  Loan Ref: {String(i + 1).padStart(3, '0')}
                                </span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${loan.CaseStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                  {loan.CaseStatus}
                                </span>
                              </div>
                              <h4 className="text-2xl font-black text-slate-900 mb-1">
                                ${loan.LoanAmount?.toLocaleString() || '0'}
                              </h4>
                              <p className="text-xs text-slate-500 font-medium mb-4">{loan.PurposeOfLoan || "Personal Loan"}</p>
                              <div className="pt-4 border-t border-slate-50 flex justify-between items-center group-hover:text-indigo-600">
                                <span className="text-[10px] font-bold uppercase tracking-tighter">View Case Details</span>
                                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricSmall({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border-2 border-slate-100 p-4 rounded-xl shadow-sm">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}