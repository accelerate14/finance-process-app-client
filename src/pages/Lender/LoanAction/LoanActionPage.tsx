import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../../components/UI/Button";
import { useUiPathAuth } from "../../../context/UiPathAuthContext";
import { getBorrowerDocuments } from "../../../api/borrower/get";
import { Entities } from '@uipath/uipath-typescript/entities';
import { CaseInstances } from '@uipath/uipath-typescript/cases';
import { Tasks } from '@uipath/uipath-typescript/tasks';

export default function LoanActionPage() {
  const { loanId, borrowerId } = useParams<{ loanId: string; borrowerId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, sdk } = useUiPathAuth();

  const [activeTab, setActiveTab] = useState<"details" | "actions">("details");
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionTask, setActionTask] = useState<any | null>(null);

  useEffect(() => {
    const fetchAllDetails = async () => {
      if (!sdk || !isAuthenticated) return;
      setLoading(true);
      try {
        const entitiesService = new Entities(sdk);
        const caseService = new CaseInstances(sdk);

        const allEntities = await entitiesService.getAll();

        const loanMeta = allEntities.find(e => e.name === "FLCMLoanApplications");
        const profileMeta = allEntities.find(e => e.name === "FLCMPersonalInfo");
        const employMeta = allEntities.find(e => e.name === "FLCMEmploymentData");

        const [loanRes, profileRes, employRes] = await Promise.all([
          loanMeta ? entitiesService.getAllRecords(loanMeta.id) : { items: [] },
          profileMeta ? entitiesService.getAllRecords(profileMeta.id) : { items: [] },
          employMeta ? entitiesService.getAllRecords(employMeta.id) : { items: [] },
        ]);

        const activeLoan = (loanRes.items as any[])?.find(r => r.Id === loanId) || loanRes.items?.[0];

        // 3. Find the Case Instance and Task Link
        if (activeLoan?.CaseId) {
          const instances = await caseService.getAll();
          const targetInstance = instances.items.find((inst: any) => inst.caseId === activeLoan.CaseId);

          if (targetInstance) {
            console.log("Target Instance Found:", targetInstance.instanceId);

            try {
              // Use the method from the docs to get hierarchical stage data
              const stages = await caseService.getStages(
                targetInstance.instanceId,
                '750192'
              );

              console.log("Fetched Stages:", stages);

              // Iterate through stages to find the active task
              for (const stage of stages) {
                // Check if this stage has tasks associated with it
                if (stage.tasks && stage.tasks.length > 0) {
                  for (const taskGroup of stage.tasks) {
                    // taskGroup is usually an array of tasks for that specific stage
                    const pendingTask = taskGroup.find(
                      (t: any) => t.status === 'Unassigned' || t.status === 'Pending'
                    );

                    if (pendingTask) {
                      console.log(`Found active task in stage [${stage.name}]:`, pendingTask);
                      setActionTask(pendingTask);
                      return; // Exit once we find the actionable task
                    }
                  }
                }
              }
            } catch (stageErr) {
              console.error("Error fetching stages:", stageErr);
            }
          }
        }
        // Fetch documents using CaseId just like the borrower side
        let documents = null;
        if (activeLoan?.CaseId) {
          const docRes = await getBorrowerDocuments(activeLoan.CaseId);
          if (docRes.success) documents = docRes.response.data;
        }

        setData({
          loan: activeLoan,
          profile: (profileRes.items as any[])?.find(r => r.UserId === borrowerId) || profileRes.items?.[0],
          employment: (employRes.items as any[])?.find(r => r.UserId === borrowerId) || employRes.items?.[0],
          documents: documents,
          loanEntityId: loanMeta?.id
        });
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllDetails();
  }, [loanId, borrowerId, sdk, isAuthenticated]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!sdk || !data?.loan?.Id || !data?.loanEntityId) return;
    setIsUpdating(true);
    try {
      const entitiesService = new Entities(sdk);
      await entitiesService.updateRecordsById(data.loanEntityId, [
        { id: data.loan.Id, CaseStatus: newStatus }
      ]);

      setData((prev: any) => ({
        ...prev,
        loan: { ...prev.loan, CaseStatus: newStatus }
      }));
    } catch (err) {
      console.error("Update Error:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white text-slate-900 text-sm font-bold uppercase tracking-widest">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        Synchronizing Data...
      </div>
    </div>
  );

  const { loan, profile, employment, documents } = data || {};

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-blue-100">
      <header className="bg-white border-b-2 border-slate-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="p-3 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200">
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{profile?.FirstName} {profile?.LastName}</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Loan Application Detail</p>
            </div>
          </div>

          <nav className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            {["details", "actions"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-8 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-widest ${activeTab === tab ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          <div className="lg:col-span-8 space-y-10">
            {activeTab === "details" ? (
              <>
                {/* Personal Info Grid */}
                <section className="bg-white rounded-2xl border-2 border-slate-100 p-8 grid grid-cols-1 md:grid-cols-2 gap-10 shadow-sm">
                  <div className="space-y-6">
                    <Detail label="Legal Name" value={`${profile?.FirstName} ${profile?.LastName}`} bold />
                    <Detail label="Social Security Number" value={profile?.SSN} bold />
                    <Detail label="Email Address" value={profile?.Email} bold />
                  </div>
                  <div className="space-y-6">
                    <Detail label="Date of Birth" value={profile?.DateOfBirth ? new Date(profile.DateOfBirth).toLocaleDateString() : "N/A"} bold />
                    <Detail label="Residential Address" value={`${profile?.Address}, ${profile?.City}, ${profile?.State} ${profile?.ZipCode}`} bold />
                  </div>
                </section>

                {/* Financial Summary */}
                <section className="bg-white rounded-2xl border-2 border-slate-900 overflow-hidden shadow-xl">
                  <div className="px-8 py-5 border-b-2 border-slate-900 bg-slate-900 flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">{loan?.CaseId}</h3>
                    <span className="text-[10px] font-black text-white bg-blue-600 px-3 py-1 rounded-full uppercase tracking-tighter">
                      {loan?.CaseStatus}
                    </span>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="p-8 bg-slate-50 rounded-2xl border-2 border-slate-100">
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-2 block">Requested Principal</label>
                      <p className="text-5xl font-black text-slate-900">${loan?.LoanAmount?.toLocaleString()}</p>
                    </div>
                    <div className="p-8 bg-emerald-50 rounded-2xl border-2 border-emerald-100">
                      <label className="text-[10px] text-emerald-600/60 uppercase tracking-widest font-black mb-2 block">Requested Date</label>
                      <p className="text-5xl font-black text-emerald-700">{loan?.CreateTime ? new Date(loan.CreateTime).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-8 pt-4">
                      <Detail label="Loan Purpose" value={loan?.PurposeOfLoan} bold />
                      <Detail label="Term Length" value={`${loan?.TermOfLoan} Months`} bold />
                      <Detail label="Employment" value={employment?.EmploymentStatus} bold />
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <section className="bg-white rounded-2xl border-2 border-slate-100 p-8 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-8 border-b-2 border-slate-50 pb-4">Verification Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  {[
                    { label: "Driver's License", key: "DriversLicense" },
                    { label: "Recent Pay Stub", key: "PayStub" },
                    { label: "Loan Agreement", key: "LoanAgreement" },
                  ].map((doc) => (
                    <div key={doc.key} className="flex items-center justify-between p-6 rounded-2xl border-2 border-slate-100 group hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div>
                          <span className="text-base font-black text-slate-800 block uppercase tracking-tight">{doc.label}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Required for compliance</span>
                        </div>
                      </div>
                      {documents?.[doc.key] ? (
                        <button
                          onClick={() => window.open(documents[doc.key], '_blank')}
                          className="bg-white border-2 border-slate-200 hover:border-blue-600 px-6 py-2 rounded-xl text-xs font-black text-slate-700 hover:text-blue-600 transition-all shadow-sm active:scale-95"
                        >
                          OPEN PDF
                        </button>
                      ) : (
                        <span className="text-xs font-black text-red-400 border-2 border-red-50 px-4 py-2 rounded-xl uppercase italic">Not uploaded yet</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Actions */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white sticky top-28 shadow-2xl border-4 border-slate-800">
              <div className="mb-10 text-center">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-3">Decision Engine</p>
                <h3 className="text-2xl font-black mb-4">Officer Action</h3>
                <div className="h-1 w-12 bg-blue-600 mx-auto rounded-full"></div>
              </div>

              {/* <div className="space-y-4">
                <Button 
                  loading={isUpdating}
                  onClick={() => handleUpdateStatus('Approve')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white border-none py-5 text-sm font-black uppercase tracking-widest transition-all shadow-[0_10px_30px_-10px_rgba(37,99,235,0.6)]"
                >
                  Confirm Approval
                </Button>
                <Button 
                  loading={isUpdating}
                  onClick={() => handleUpdateStatus('Documents Reupload')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border-2 border-slate-700 py-5 text-sm font-black uppercase tracking-widest transition-all"
                >
                  Request Re-upload
                </Button>
              </div> */}

              {/* <div className="mt-12 pt-10 border-t border-slate-800 space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Active Stage</p>
                  <p className="text-xs font-black text-blue-400 uppercase">{loan?.CaseStatus}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Risk Category</p>
                  <p className="text-xs font-black text-emerald-400 uppercase">Tier 1 / Low</p>
                </div>
              </div> */}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function Detail({ label, value, bold = false, className = "" }: { label: string, value: any, bold?: boolean, className?: string }) {
  return (
    <div className={className}>
      <label className="text-[10px] text-slate-400 uppercase tracking-[0.15em] block mb-1.5 font-black">{label}</label>
      <p className={`text-base text-slate-800 ${bold ? 'font-black' : 'font-bold'}`}>{value || "—"}</p>
    </div>
  );
}