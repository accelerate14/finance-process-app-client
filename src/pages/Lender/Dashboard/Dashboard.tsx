import { useEffect, useState } from "react";
import { useUiPathAuth } from "../../../context/UiPathAuthContext";
import Button from "../../../components/UI/Button";
import { Entities } from '@uipath/uipath-typescript/entities'; // Import the service class

// Import Recharts components
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useNavigate } from "react-router-dom";
// import { getAllLoans } from "../../../api/lender/get";

/* ================= TYPES ================= */

interface LoanRecord {
  Id: string;
  LoanAmount: number;
  TermOfLoan: number;
  CaseStatus: string;
  UserId: string;
  CreateTime: string;
}

export default function LenderDashboard() {
  const { isAuthenticated, sdk } = useUiPathAuth();
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLoans = async () => {
      if (!isAuthenticated || !sdk) return;

      setLoading(true);
      try {
        // 1. Initialize the Entities service with your authenticated sdk
        const entitiesService = new Entities(sdk);

        // 2. Get all entities to find the ID for "LoanApplication"
        const allEntities = await entitiesService.getAll();
        const target = allEntities.find((e) => e.name === "LoanApplication");

        if (target) {
          /**
           * 3. Get the specific entity instance (Smart Entity)
           * This attaches methods like getAllRecords() directly to the object
           */
          const loanEntity = await entitiesService.getById(target.id);

          // 4. Call the operation directly on the entity as per docs
          const recordsResponse = await loanEntity.getAllRecords();

          // Standardizing extraction from the response
          const data = (recordsResponse as any).items || [];
          setLoans(data);
        }
      } catch (err) {
        console.error("SDK Entities Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [isAuthenticated, sdk]);
  /* ================= DATA CALCULATIONS ================= */

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Prepare Data for Line Chart
  const getWeeklyData = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

    loans.forEach((loan) => {
      const day = days[new Date(loan.CreateTime).getDay()];
      counts[day]++;
    });
    return days.map(d => ({ name: d, requests: counts[d] }));
  };

  // Prepare Data for Pie Chart
  const getBorrowerDistribution = () => {
    const distribution: Record<string, number> = {};
    loans.forEach(loan => {
      const label = `User-${loan.UserId.substring(0, 5)}`;
      distribution[label] = (distribution[label] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  };

  const handleReview = (loanId: string, borrowerId: string) => {
    console.log("Navigating to review loan:", loanId, "for borrower:", borrowerId);
    navigate(`/lender/loan-action/${loanId}/${borrowerId}`)
  }

  const lineData = getWeeklyData();
  const pieData = getBorrowerDistribution();
  const COLORS = ['#4F46E5', '#F97316', '#10B981', '#EF4444', '#8B5CF6'];

  if (loading) return <div className="p-10 text-center font-bold">Fetching Live Data...</div>;

  return (
    <div className="p-6 bg-[#F1F5F9] min-h-screen space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Line Chart: Weekly Requests */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-sm font-bold text-gray-400 uppercase mb-6">Weekly Loan Application</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="requests"
                    stroke="#4F46E5"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart: Borrower Application Split */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-sm font-bold text-gray-400 uppercase mb-6">Applications by Borrower</h2>
            <div className="h-64 w-full flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-1/2 space-y-2 overflow-y-auto max-h-48 px-4">
                {pieData.map((b, idx) => (
                  <div key={b.name} className="flex justify-between text-[11px] font-medium border-b border-gray-50 pb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="text-gray-600">{b.name}</span>
                    </div>
                    <span className="text-indigo-600 font-bold">{b.value} Applications</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-[#2D74B3] flex justify-between items-center">
            <h2 className="text-white font-bold tracking-wide">Loan Officer Report</h2>
            <span className="text-[10px] bg-white/20 text-white px-2 py-1 rounded">
              {/* {isAuthenticated ? "Live Connection" : "Auth Pending"} */}
            </span>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[11px] uppercase font-bold text-gray-500 border-b">
                <th className="p-4">Loan ID</th>
                <th className="p-4">Requested On</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Term</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loans.map((loan) => (
                <tr key={loan.Id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 text-sm font-medium text-gray-700">{loan.Id?.slice(0, 8)}</td>
                  <td className="p-4 text-sm text-gray-500">{formatDate(loan.CreateTime)}</td>
                  <td className="p-4 text-sm font-bold text-gray-900">${loan.LoanAmount.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                      {loan.CaseStatus}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{loan.TermOfLoan} Mo</td>
                  <td className="p-4">
                    <Button
                      onClick={() => handleReview(loan.Id, loan.UserId)}
                      className="bg-black text-white text-[10px] font-bold px-4 py-2 rounded-md hover:bg-indigo-600 transition-all"
                    >
                      REVIEW
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}