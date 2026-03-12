import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { getBorrowerProfile, getLoanApplication } from "../../../api/borrower/get";
import { jwtDecode } from "jwt-decode";
import Button from "../../../components/UI/Button";
import { useNavigate } from "react-router-dom";

ChartJS.register(ArcElement, Tooltip, Legend);

const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase() || "";
    let colors = "bg-gray-100 text-gray-800 border-gray-200";
    if (s.includes("SUBMITTED") || s.includes("PENDING")) colors = "bg-yellow-100 text-yellow-800 border-yellow-200";
    else if (s.includes("APPROVED")) colors = "bg-blue-100 text-blue-800 border-blue-200";
    else if (s.includes("DISBURSED")) colors = "bg-green-100 text-green-800 border-green-200";
    return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors}`}>{status}</span>;
};

export default function BorrowerDashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem("borrower_token");
    const borrowerId = token ? jwtDecode<{ guid: string }>(token).guid : "";

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [loans, setLoans] = useState<any[]>([]);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                if (!borrowerId && token) {
                    localStorage.setItem("borrowerId", jwtDecode<{ guid: string }>(token).guid);
                }

                const [p, l] = await Promise.all([
                    getBorrowerProfile(borrowerId),
                    getLoanApplication(borrowerId),
                ]);

                if (p.success) setProfile(p.response.data);
                if (l.success && Array.isArray(l.response.data)) setLoans(l.response.data);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, [borrowerId, token]);

    if (loading) return <div className="p-10 text-center text-gray-500">Loading dashboard...</div>;

    const submittedCount = loans.length;
    const approvedCount = loans.filter(l => l.CaseStatus?.toUpperCase().includes("APPROVED")).length;
    const inProgressCount = loans.filter(l => l.CaseStatus?.toUpperCase().includes("REVIEW")).length;

    const pieData = {
        labels: ["Under Review", "Approved", "Other"],
        datasets: [{
            data: [inProgressCount, approvedCount, submittedCount - (inProgressCount + approvedCount)],
            backgroundColor: ["#F97316", "#10B981", "#6366F1"],
        }],
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-6 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Welcome, {profile?.FirstName}</h1>
                    <p className="text-sm text-gray-500">{loans.length} active applications</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {[
                        { label: "Submitted", value: submittedCount },
                        { label: "Approved", value: approvedCount },
                        { label: "In Review", value: inProgressCount },
                        { label: "Rejected", value: 0 },
                        { label: "Pending Action", value: approvedCount },
                        { label: "Average Value", value: "$" + (submittedCount > 0 ? (loans.reduce((a, c) => a + c.LoanAmount, 0) / submittedCount).toLocaleString() : 0) }
                    ].map((card) => (
                        <div key={card.label} className="bg-white rounded-xl shadow p-4 text-center">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{card.label}</p>
                            <p className="text-lg font-semibold text-gray-800">{card.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-white rounded-xl shadow p-5 overflow-x-auto">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">Your Loan Submissions</h2>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Loan ID</th>
                                    <th className="px-4 py-3 text-left">Amount</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loans.map((item) => (
                                    <tr
                                        key={item.Id}
                                        className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                                        onClick={() => navigate(`/borrower/loan-details/${item.Id}`, { state: { loan: item } })}
                                    >
                                        <td className="px-4 py-4 text-indigo-600 font-bold group-hover:underline">
                                            {item.Id?.slice(0, 8) || "N/A"}
                                        </td>
                                        <td className="px-4 py-4 font-medium">${item.LoanAmount?.toLocaleString()}</td>
                                        <td className="px-4 py-4">{getStatusBadge(item.CaseStatus)}</td>
                                        <td className="px-4 py-4 text-right">
                                            {item.CaseStatus?.toUpperCase() === "SUBMITTED" ? (
                                                <Button
                                                    onClick={(e: React.MouseEvent) => {
                                                        e.stopPropagation(); // Prevents double navigation
                                                        navigate(`/borrower/loan-details/${item.Id}`, { state: { loan: item } });
                                                    }}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-2 rounded"
                                                >
                                                    Review
                                                </Button>
                                            ) : (
                                                <span className="text-gray-400 text-[10px] font-bold">LOCKED</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">Application Summary</h2>
                        <div className="w-48 h-48">
                            <Pie data={pieData} options={{ plugins: { legend: { display: false } } }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}