import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../../components/UI/Button";
import { useUiPathAuth } from "../../../context/UiPathAuthContext";
import { getBorrowerDocuments } from "../../../api/borrower/get";
import SignatureCanvas from 'react-signature-canvas';
import { Entities } from '@uipath/uipath-typescript/entities';

export default function LoanActionPage() {
  const { loanId, borrowerId } = useParams<{ loanId: string; borrowerId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, sdk } = useUiPathAuth();
  const sigCanvas = useRef<SignatureCanvas>(null);

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // State for the e-sign view
  const [signingDoc, setSigningDoc] = useState<{ label: string, url: string } | null>(null);

  useEffect(() => {
    const fetchAllDetails = async () => {
      if (!loanId || !borrowerId || !sdk || !isAuthenticated) return;
      setLoading(true);
      try {
        // 1. Initialize the modular Entities service
        const entitiesService = new Entities(sdk);
        const allEntities = await entitiesService.getAll();

        const loanEntityMeta = allEntities.find(e => e.name === "FLCMLoanApplications");
        const profileEntityMeta = allEntities.find(e => e.name === "FLCMPersonalInfo");
        const employmentEntityMeta = allEntities.find(e => e.name === "FLCMEmploymentData");

        // 2. Fetch specific records using getRecords
        // We initialize the "Smart Entity" for each to access the method directly
        const [loanRes, profileRes, employRes, docRes] = await Promise.all([
          loanEntityMeta ? (await entitiesService.getById(loanEntityMeta.id)).getRecords() : Promise.resolve({ items: [] }),
          profileEntityMeta ? (await entitiesService.getById(profileEntityMeta.id)).getRecords() : Promise.resolve({ items: [] }),
          employmentEntityMeta ? (await entitiesService.getById(employmentEntityMeta.id)).getRecords() : Promise.resolve({ items: [] }),
          getBorrowerDocuments(borrowerId),
        ]);

        setData({
          loan: (loanRes as any).items?.find((r: any) => r.Id === loanId),
          profile: (profileRes as any).items?.find((r: any) => r.UserId === borrowerId),
          employment: (employRes as any).items?.find((r: any) => r.UserId === borrowerId),
          documents: docRes.success ? docRes.response.data : null,
        });
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllDetails();
  }, [loanId, borrowerId, sdk, isAuthenticated]);

  const handleSignSubmit = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Please provide a signature first.");
      return;
    }
    const signatureBase64 = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    console.log("Captured Signature:", signatureBase64);
    alert("Document signed successfully!");
    setSigningDoc(null);
  };

  const formatDob = (dobString: string) => {
    if (!dobString) return "N/A";
    return new Date(dobString).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Syncing Records...</div>;
  if (!data) return <div className="p-10 text-center">No records found.</div>;

  const { loan, profile, employment, documents } = data;

  // --- SIGNING VIEW (TOGGLED) ---
  if (signingDoc) {
    return (
      <div className="bg-[#0F172A] min-h-screen p-8">
        <div className="max-w-6xl mx-auto flex flex-col h-[85vh]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white text-2xl font-black uppercase tracking-tight">Review & E-Sign: {signingDoc.label}</h2>
            <Button variant="secondary" onClick={() => setSigningDoc(null)} className="text-white border-white/20 hover:bg-white/10">Exit Review</Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
            <div className="lg:col-span-2 bg-white rounded-2xl overflow-hidden shadow-2xl">
              <iframe src={signingDoc.url} className="w-full h-full border-none" title="Doc Preview" />
            </div>
            <div className="bg-slate-800 p-8 rounded-2xl flex flex-col justify-between border border-slate-700">
              <div>
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-center">Underwriter Verification</p>
                <div className="bg-white rounded-xl p-2">
                  <SignatureCanvas ref={sigCanvas} penColor='black' canvasProps={{ className: 'w-full h-64 rounded-lg cursor-crosshair' }} />
                </div>
                <button onClick={() => sigCanvas.current?.clear()} className="w-full text-slate-400 text-[10px] mt-4 uppercase font-bold hover:text-white transition-colors">Clear Pad</button>
              </div>
              <Button variant="primary" className="w-full py-5 font-black uppercase tracking-widest text-sm" onClick={handleSignSubmit}>Complete Signature</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD VIEW ---
  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button variant="secondary" onClick={() => navigate(-1)} className="border-none hover:bg-transparent !px-0 text-gray-400 font-bold tracking-widest uppercase text-[10px]">
          &larr; Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* LOAN INFO CARD */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Loan Parameters</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Requested Capital</p>
                  <p className="text-2xl font-black text-gray-900">${loan?.LoanAmount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Duration</p>
                  <p className="text-lg font-bold">{loan?.TermOfLoan} Months</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Status</p>
                  <p className="text-sm font-black text-blue-600 uppercase">{loan?.CaseStatus}</p>
                </div>
              </div>
            </section>

            {/* EMPLOYMENT CARD */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Employment Analysis</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                <div className="border-l-4 border-black pl-4">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Employer</p>
                  <p className="text-lg font-bold">{employment?.EmployerName || "Private"}</p>
                </div>
                <div className="border-l-4 border-black pl-4">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Monthly Income</p>
                  <p className="text-lg font-bold">${employment?.MonthlyIncome?.toLocaleString()}</p>
                </div>
              </div>
            </section>

            {/* DOCUMENTS VAULT SECTION */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Documents Vault</h2>
              <div className="space-y-4">
                {[
                  { label: "Driver's License", key: "DriversLicense" },
                  { label: "Recent Pay Stub", key: "PayStub" },
                  { label: "Profile Picture", key: "ProfilePicture" },
                ].map((doc) => (
                  <div key={doc.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm font-bold text-gray-400 italic">
                        {doc.key === "ProfilePicture" ? "🖼️" : "📄"}
                      </div>
                      <p className="font-bold text-gray-700">{doc.label}</p>
                    </div>
                    {documents?.[doc.key] ? (
                      <Button variant="secondary" className="text-[10px] font-black uppercase px-3" onClick={() => setSigningDoc({ label: doc.label, url: documents[doc.key] })}>
                        Review & Sign
                      </Button>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-300 uppercase italic">Pending Upload</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* PERSONA CARD - KEPT INTACT */}
          <div className="space-y-6">
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Applicant Persona</h2>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center text-xl font-black overflow-hidden border-2 border-gray-100">
                    {documents?.ProfilePicture ? (
                        <img src={documents.ProfilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        `${profile?.FirstName?.[0] || '?'}${profile?.LastName?.[0] || ''}`
                    )}
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900">{profile?.FirstName} {profile?.LastName}</p>
                    <p className="text-xs font-medium text-gray-400">{profile?.Email}</p>
                  </div>
                </div>
                <div className="space-y-4 pt-6 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Residential Address</p>
                    <p className="text-sm font-medium">{profile?.Address}, {profile?.City}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Date of Birth</p>
                    <p className="text-sm font-medium">{formatDob(profile?.DateOfBirth)}</p>
                  </div>
                </div>
              </div>
            </section>

            {loan?.applicationStatus === "SUBMITTED" ? (
              <div className="grid grid-cols-1 gap-3">
                <Button variant="primary" loading={actionLoading} className="w-full py-4 font-black uppercase tracking-widest" onClick={() => {}}>
                  Approve Loan
                </Button>
                <Button variant="secondary" loading={actionLoading} className="w-full py-4 font-black uppercase tracking-widest text-red-600 border-red-100 hover:bg-red-50" onClick={() => {}}>
                  Reject
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-gray-100 rounded-xl text-center text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                Application {loan?.CaseStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}