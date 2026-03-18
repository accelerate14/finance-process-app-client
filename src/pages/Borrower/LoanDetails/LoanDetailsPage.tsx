import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { 
  getBorrowerProfile, 
  getEmploymentInfo, 
  getLoanById, 
  getBorrowerDocuments 
} from "../../../api/borrower/get";
import Button from "../../../components/UI/Button";
import Card from "../../../components/UI/Card";
import StatBox from "../../../components/UI/StatBox";
import { jwtDecode } from "jwt-decode";

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
  const navigate = useNavigate();
  const location = useLocation();
  const borrowerId = jwtDecode<{ guid: string }>(localStorage.getItem("borrower_token") || "").guid;

  const [activeTab, setActiveTab] = useState<"details" | "actions">("details");
  const [loan, setLoan] = useState<any>(location.state?.loan || null);
  const [profile, setProfile] = useState<any>(null);
  const [employmentInfo, setEmploymentInfo] = useState<any>(null);
  const [documents, setDocuments] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true); // Ensure loading is true when effect starts

        // 1. Fetch Core Data
        const [pRes, lRes, eRes] = await Promise.all([
          getBorrowerProfile(borrowerId),
          !loan ? getLoanById(loanId!) : Promise.resolve({ success: true, response: { data: loan } }),
          getEmploymentInfo(borrowerId)
        ]);

        if (pRes.success) setProfile(pRes.response.data);
        const activeLoan = lRes.success ? lRes.response.data : loan;
        if (lRes.success) setLoan(activeLoan);
        if (eRes.success) setEmploymentInfo(eRes.response.data);

        // 2. Fetch Documents - MUST happen before setLoading(false)
        if (activeLoan?.CaseId) {
          const docRes = await getBorrowerDocuments(activeLoan.CaseId);
          if (docRes.success) {
            setDocuments(docRes.response.data);
          }
        }

      } catch (err) {
        console.error("Error loading details:", err);
      } finally {
        // Only stop the loading spinner once everything is in state
        setLoading(false);
      }
    };

    initializeData();
  }, [borrowerId, loanId]);

  // Updated loading check: don't render content until documents are also processed
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium italic animate-pulse">Retrieving application details...</p>
        </div>
      </div>
    );
  }

  const hasDocs = !!(documents?.DriversLicense && documents?.PayStub);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {["details", "actions"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "details" | "actions")}
              className={`px-4 md:px-8 py-3 text-xs md:text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                activeTab === tab ? "border-b-2 border-black text-black" : "text-gray-400"
              }`}
            >
              {tab === "details" ? "Loan Details" : "Actions"}
            </button>
          ))}
        </div>

        {activeTab === "details" ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card>
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div className="text-center md:text-left">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Application Status</p>
                  <h2 className="text-2xl font-extrabold text-amber-500">
                    {loan?.CaseStatus || "PROCESSING"}
                  </h2>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatBox label="Loan Amount" value={`$${loan?.LoanAmount?.toLocaleString()}`} />
              <StatBox label="Tenure" value={`${loan?.TermOfLoan || 'N/A'} Months`} />
              <StatBox label="Purpose" value={loan?.PurposeOfLoan || "N/A"} />
              <StatBox label="Case ID" value={loan?.CaseId || "N/A"} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <Card title="Borrower Details">
                  <div className="space-y-4">
                    <InfoRow label="Loan ID" value={loan?.Id?.split('-')[0].toUpperCase()} />
                    <InfoRow label="Name" value={`${profile?.FirstName} ${profile?.LastName || ''}`} />
                    <InfoRow label="Email" value={profile?.Email || '...'} />
                    <InfoRow label="Employment" value={employmentInfo?.EmploymentStatus || '...'} />
                  </div>
                </Card>

                <Card title="Submitted Documents">
                  <div className="space-y-3">
                    <DocumentLink 
                        label="Driver's License" 
                        url={documents?.DriversLicense} 
                        onUpload={() => navigate("/borrower/upload-documents", { state: { loanId: loan?.Id, loan } })}
                    />
                    <DocumentLink 
                        label="Recent Pay Stub" 
                        url={documents?.PayStub} 
                        onUpload={() => navigate("/borrower/upload-documents", { state: { loanId: loan?.Id, loan } })}
                    />
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card title="Application Journey">
                  <div className="flex flex-col space-y-0">
                    {STAGES.map((stage, index) => {
                      const isCompleted = index < 3 || (index === 3 && hasDocs); 
                      const isActive = hasDocs ? index === 4 : index === 3;
                      
                      return (
                        <StepItem
                          key={stage}
                          label={stage}
                          isCompleted={isCompleted}
                          isActive={isActive}
                          isLast={index === STAGES.length - 1}
                        />
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
              <Button variant="primary" className="w-full sm:w-auto" onClick={() => navigate("/borrower/dashboard")}>
                ← Back to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <Card className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <p className="text-gray-400 font-medium italic">No pending actions for this application.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* --- Helper Components (Same as before) --- */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="font-bold text-gray-800">{value}</span>
    </div>
  );
}

function DocumentLink({ label, url, onUpload }: { label: string; url: string | null; onUpload: () => void }) {
  if (!url) {
    return (
      <div className="flex items-center justify-between p-3 border border-dashed border-amber-300 rounded bg-amber-50 transition-all">
        <div className="flex items-center">
            <span className="mr-2 text-lg opacity-50">📄</span>
            <span className="text-xs font-medium text-amber-700 uppercase tracking-tight">{label} missing</span>
        </div>
        <button onClick={onUpload} className="text-[10px] font-black text-amber-600 uppercase hover:underline">
            Upload Now
        </button>
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border rounded bg-white hover:border-black transition-all group">
      <div className="flex items-center">
        <span className="mr-2 text-lg">📄</span>
        <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">{label}</span>
      </div>
      <span className="text-[10px] font-black text-amber-500 uppercase">View</span>
    </a>
  );
}

function StepItem({ label, isCompleted, isActive, isLast }: any) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`relative flex items-center justify-center w-5 h-5 rounded-full border-2 z-10 transition-all duration-500 ${
          isCompleted ? "bg-green-500 border-green-500" : isActive ? "bg-white border-amber-500" : "bg-white border-gray-200"
        }`}>
          {isCompleted && <span className="text-white text-[10px]">✓</span>}
          {isActive && <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />}
        </div>
        {!isLast && <div className={`w-0.5 h-10 -my-1 transition-colors duration-500 ${isCompleted ? "bg-green-500" : "bg-gray-200"}`} />}
      </div>
      <div className="pb-8">
        <span className={`text-sm tracking-tight block ${isCompleted ? "text-gray-700 font-semibold" : isActive ? "text-amber-500 font-extrabold" : "text-gray-400"}`}>
          {label}
        </span>
        {isActive && <span className="text-[10px] text-amber-400 font-medium italic">In progress...</span>}
      </div>
    </div>
  );
}

// import { useEffect, useState } from "react";
// import { useLocation, useParams } from "react-router-dom";
// import { getBorrowerProfile, getEmploymentInfo, getLoanById } from "../../../api/borrower/get";
// import Button from "../../../components/UI/Button";
// import Card from "../../../components/UI/Card";
// import StatBox from "../../../components/UI/StatBox";
// import { jwtDecode } from "jwt-decode";

// const STAGES = [
//   "Application Submitted",
//   "Eligibility Evaluation",
//   "Loan Officer Review",
//   "Document Uploaded",
//   "Loan Officer Document Review",
//   "Underwriter Approval",
//   "Borrower Signature"
// ];

// export default function LoanDetailsPage() {
//   const { loanId } = useParams();
//   const location = useLocation();
//   const borrowerId = jwtDecode<{ guid: string }>(localStorage.getItem("borrower_token") || "").guid;

//   const [activeTab, setActiveTab] = useState<"details" | "actions">("details");
//   const [loan, setLoan] = useState<any>(location.state?.loan || null);
//   const [profile, setProfile] = useState<any>(null);
//   const [employmentInfo, setEmploymentInfo] = useState<any>(null);
//   const [loading, setLoading] = useState(!location.state?.loan);

//   useEffect(() => {
//     const initializeData = async () => {
//       try {
//         const requests: [Promise<any>, Promise<any> | null, Promise<any> | null] = [
//           getBorrowerProfile(borrowerId),
//           !loan ? getLoanById(loanId!) : null,
//           getEmploymentInfo(borrowerId)
//         ];

//         const [pRes, lRes, eRes] = await Promise.all(requests);

//         if (pRes.success) setProfile(pRes.response.data);
//         if (lRes && lRes.success) setLoan(lRes.response.data);
//         if (eRes && eRes.success) setEmploymentInfo(eRes.response.data);

//       } catch (err) {
//         console.error("Error loading details:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     initializeData();
//   }, [borrowerId, loanId, loan]);

//   if (loading && !loan) return <div className="p-10 text-center italic">Syncing loan data...</div>;

//   return (
//     <div className="min-h-screen bg-gray-50 p-4 md:p-8 relative">
      
//       {/* DEVELOPMENT OVERLAY */}
//       <div className="absolute inset-0 z-50 flex items-center justify-center">
//         <div className="bg-white/80 backdrop-blur-sm border-2 border-dashed border-gray-300 p-8 rounded-2xl shadow-2xl text-center transform -rotate-2">
//           <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">
//             Under Development
//           </h1>
//           <p className="text-gray-500 font-medium mt-2">
//             This feature is being polished. Check back soon!
//           </p>
//           <div className="mt-4 flex justify-center gap-2">
//             <span className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
//             <span className="w-3 h-3 bg-amber-400 rounded-full animate-pulse delay-75" />
//             <span className="w-3 h-3 bg-amber-400 rounded-full animate-pulse delay-150" />
//           </div>
//         </div>
//       </div>

//       {/* WRAP CONTENT IN BLUR AND DISABLE POINTER EVENTS */}
//       <div className="max-w-6xl mx-auto space-y-6 blur-[4px] pointer-events-none select-none opacity-50">
        
//         {/* Navigation Tabs */}
//         <div className="flex border-b border-gray-200 overflow-x-auto">
//           {["details", "actions"].map((tab) => (
//             <button
//               key={tab}
//               className={`px-4 md:px-8 py-3 text-xs md:text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
//                 activeTab === tab ? "border-b-2 border-black text-black" : "text-gray-400"
//               }`}
//             >
//               {tab === "details" ? "Loan Details" : "Actions"}
//             </button>
//           ))}
//         </div>

//         {activeTab === "details" ? (
//           <div className="space-y-6">
//             <Card>
//               <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
//                 <div className="text-center md:text-left">
//                   <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Application Status</p>
//                   <h2 className="text-2xl font-extrabold text-amber-500">
//                     {loan?.CaseStatus || "PROCESSING"}
//                   </h2>
//                 </div>
//               </div>
//             </Card>

//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//               <StatBox label="Loan Amount" value={`$${loan?.LoanAmount?.toLocaleString()}`} />
//               <StatBox label="Tenure" value={`${loan?.TermOfLoan} Months`} />
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//               <div className="lg:col-span-1">
//                 <Card title="Borrower Details">
//                   <div className="space-y-4">
//                     <InfoRow label="Loan ID" value={loan?.Id?.split('-')[0].toUpperCase()} />
//                     <InfoRow label="Name" value={`${profile?.FirstName} ${profile?.LastName || ''}`} />
//                     <InfoRow label="Email" value={profile?.Email || '...'} />
//                     <InfoRow label="Employment Status" value={employmentInfo?.EmploymentStatus || '...'} />
//                   </div>
//                 </Card>
//               </div>

//               <div className="lg:col-span-2">
//                 <Card title="Application Journey">
//                   <div className="flex flex-col space-y-0">
//                     {STAGES.map((stage, index) => (
//                       <StepItem
//                         key={stage}
//                         label={stage}
//                         isCompleted={index < 3}
//                         isActive={index === 3}
//                         isLast={index === STAGES.length - 1}
//                       />
//                     ))}
//                   </div>
//                 </Card>
//               </div>
//             </div>

//             <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
//               <Button variant="secondary" className="w-full sm:w-auto">View Documents</Button>
//               <Button variant="primary" className="w-full sm:w-auto">Contact Support</Button>
//             </div>
//           </div>
//         ) : (
//           <Card className="flex items-center justify-center min-h-[300px]">
//             <div className="text-center">
//               <p className="text-gray-400 font-medium italic">No pending actions for this application.</p>
//             </div>
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// }

// /* --- Internal Helper Components --- */

// function InfoRow({ label, value, isStatus = false }: { label: string; value: string; isStatus?: boolean }) {
//   return (
//     <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
//       <span className="text-gray-500 font-medium">{label}</span>
//       <span className={`font-bold ${isStatus ? "text-green-600" : "text-gray-800"}`}>
//         {value}
//       </span>
//     </div>
//   );
// }

// function StepItem({
//   label,
//   isCompleted,
//   isActive,
//   isLast
// }: {
//   label: string;
//   isCompleted: boolean;
//   isActive: boolean;
//   isLast: boolean;
// }) {
//   return (
//     <div className="flex gap-4">
//       <div className="flex flex-col items-center">
//         {/* Dot */}
//         <div className={`relative flex items-center justify-center w-5 h-5 rounded-full border-2 z-10 transition-all duration-500 ${isCompleted ? "bg-green-500 border-green-500" : isActive ? "bg-white border-amber-500" : "bg-white border-gray-200"
//           }`}>
//           {isCompleted && <span className="text-white text-[10px]">✓</span>}
//           {isActive && <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />}
//         </div>
//         {/* Connector Line */}
//         {!isLast && (
//           <div className={`w-0.5 h-10 -my-1 transition-colors duration-500 ${isCompleted ? "bg-green-500" : "bg-gray-200"
//             }`} />
//         )}
//       </div>

//       <div className="pb-8">
//         <span className={`text-sm tracking-tight block ${isCompleted ? "text-gray-700 font-semibold" : isActive ? "text-amber-500 font-extrabold" : "text-gray-400"
//           }`}>
//           {label}
//         </span>
//         {isActive && <span className="text-[10px] text-amber-400 font-medium italic">In progress...</span>}
//       </div>
//     </div>
//   );
// }