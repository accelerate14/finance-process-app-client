import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../../components/UI/Button";
import { useUiPathAuth } from "../../../context/UiPathAuthContext";
import { getBorrowerDocuments } from "../../../api/borrower/get";
import SignatureCanvas from 'react-signature-canvas';
// import { Entities } from '@uipath/uipath-typescript/entities';

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
        const entities = await sdk.entities.getAll();
        const loanEntity = entities.find(e => e.name === "LoanApplication");
        const profileEntity = entities.find(e => e.name === "BorrowerProfile");
        const employmentEntity = entities.find(e => e.name === "BorrowerEmployment");

        const [loanRes, profileRes, employRes, docRes] = await Promise.all([
          sdk.entities.getRecordsById(loanEntity!.id),
          profileEntity ? sdk.entities.getRecordsById(profileEntity.id) : Promise.resolve({ items: [] }),
          employmentEntity ? sdk.entities.getRecordsById(employmentEntity.id) : Promise.resolve({ items: [] }),
          getBorrowerDocuments(borrowerId),
        ]);

        setData({
          loan: loanRes.items.find((r: any) => r.Id === loanId || r.id === loanId),
          profile: profileRes.items.find((r: any) => r.Id === borrowerId || r.id === borrowerId),
          employment: employRes.items.find((r: any) => r.borrowerId === borrowerId),
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
                  <p className="text-2xl font-black text-gray-900">${loan?.loanAmount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Duration</p>
                  <p className="text-lg font-bold">{loan?.tenureMonths} Months</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Status</p>
                  <p className="text-sm font-black text-blue-600 uppercase">{loan?.applicationStatus}</p>
                </div>
              </div>
            </section>

            {/* EMPLOYMENT CARD */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Employment Analysis</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                <div className="border-l-4 border-black pl-4">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Employer</p>
                  <p className="text-lg font-bold">{employment?.employerName || "Private"}</p>
                </div>
                <div className="border-l-4 border-black pl-4">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Monthly Income</p>
                  <p className="text-lg font-bold">${employment?.monthlyIncome?.toLocaleString()}</p>
                </div>
              </div>
            </section>

            {/* DOCUMENTS VAULT SECTION */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Documents Vault</h2>
              <div className="space-y-4">
                {[
                  { label: "Driver's License", key: "driverLicense" },
                  { label: "Recent Pay Stub", key: "payStub" },
                  { label: "Profile Picture", key: "profilePic" },
                ].map((doc) => (
                  <div key={doc.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm font-bold text-gray-400 italic">
                        {doc.key === "profilePic" ? "🖼️" : "📄"}
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
                    {documents?.profilePic ? (
                        <img src={documents.profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        `${profile?.firstName?.[0] || '?'}${profile?.lastName?.[0] || ''}`
                    )}
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900">{profile?.firstName} {profile?.lastName}</p>
                    <p className="text-xs font-medium text-gray-400">{profile?.email}</p>
                  </div>
                </div>
                <div className="space-y-4 pt-6 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Residential Address</p>
                    <p className="text-sm font-medium">{profile?.address}, {profile?.city}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Date of Birth</p>
                    <p className="text-sm font-medium">{formatDob(profile?.dob)}</p>
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
                Application {loan?.applicationStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// import { useEffect, useState, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import Button from "../../../components/UI/Button";
// import { useUiPathAuth } from "../../../context/UiPathAuthContext";
// import { getBorrowerDocuments } from "../../../api/borrower/get";
// import SignatureCanvas from 'react-signature-canvas';

// export default function LoanActionPage() {
//   const { loanId, borrowerId } = useParams<{ loanId: string; borrowerId: string }>();
//   const navigate = useNavigate();
//   const { isAuthenticated, sdk } = useUiPathAuth();
//   const sigCanvas = useRef<SignatureCanvas>(null);

//   const [data, setData] = useState<any | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [actionLoading, setActionLoading] = useState(false);
  
//   // State for the e-sign view
//   const [signingDoc, setSigningDoc] = useState<{ label: string, url: string } | null>(null);

//   useEffect(() => {
//     const fetchAllDetails = async () => {
//       if (!loanId || !borrowerId || !sdk || !isAuthenticated) return;
//       setLoading(true);
//       try {
//         const entities = await sdk.entities.getAll();
//         const loanEntity = entities.find(e => e.name === "LoanApplication");
//         const profileEntity = entities.find(e => e.name === "BorrowerProfile");
//         const employmentEntity = entities.find(e => e.name === "BorrowerEmployment");

//         const [loanRes, profileRes, employRes, docRes] = await Promise.all([
//           sdk.entities.getRecordsById(loanEntity!.id),
//           profileEntity ? sdk.entities.getRecordsById(profileEntity.id) : Promise.resolve({ items: [] }),
//           employmentEntity ? sdk.entities.getRecordsById(employmentEntity.id) : Promise.resolve({ items: [] }),
//           getBorrowerDocuments(borrowerId),
//         ]);

//         setData({
//           loan: loanRes.items.find((r: any) => r.Id === loanId || r.id === loanId),
//           profile: profileRes.items.find((r: any) => r.Id === borrowerId || r.id === borrowerId),
//           employment: employRes.items.find((r: any) => r.borrowerId === borrowerId),
//           documents: docRes.success ? docRes.response.data : null,
//         });
//       } catch (err) {
//         console.error("Fetch Error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchAllDetails();
//   }, [loanId, borrowerId, sdk, isAuthenticated]);

//   const handleFinalSubmit = () => {
//     if (sigCanvas.current?.isEmpty()) {
//       alert("Please provide a signature first.");
//       return;
//     }
//     const signatureData = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
//     console.log("Signature Captured:", signatureData);
//     alert("Document Signed & Verified! Sending to UiPath Data Service...");
//     setSigningDoc(null); // Return to main page
//   };

//   if (loading) return <div className="p-10 text-center font-bold text-gray-500">Syncing Records...</div>;
//   if (!data) return <div className="p-10 text-center">No records found.</div>;

//   const { loan, profile, employment, documents } = data;

//   // --- SIGNING OVERLAY VIEW ---
//   if (signingDoc) {
//     return (
//       <div className="bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center">
//         <div className="w-full max-w-5xl flex justify-between items-center mb-6">
//           <h2 className="text-white text-xl font-bold">Review & E-Sign: {signingDoc.label}</h2>
//           <Button variant="secondary" onClick={() => setSigningDoc(null)} className="text-white border-white hover:text-black">Cancel</Button>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-5xl h-[80vh]">
//           {/* Document Preview Area */}
//           <div className="lg:col-span-2 bg-white rounded-xl overflow-hidden shadow-2xl">
//             <iframe 
//               src={signingDoc.url} 
//               className="w-full h-full" 
//               title="Document Preview"
//             />
//           </div>

//           {/* Signature Area */}
//           <div className="bg-gray-800 p-6 rounded-xl flex flex-col justify-between border border-gray-700">
//             <div>
//               <p className="text-blue-400 font-bold uppercase text-[10px] tracking-widest mb-2">Underwriter Verification</p>
//               <h3 className="text-white text-lg font-bold mb-4">Draw your signature below</h3>
//               <div className="bg-white rounded-lg overflow-hidden">
//                 <SignatureCanvas 
//                   ref={sigCanvas}
//                   penColor='black'
//                   canvasProps={{ className: 'w-full h-48 cursor-crosshair' }}
//                 />
//               </div>
//               <button 
//                 onClick={() => sigCanvas.current?.clear()}
//                 className="text-gray-400 text-xs mt-2 hover:text-white transition-colors"
//               >
//                 Clear Signature
//               </button>
//             </div>

//             <div className="space-y-3">
//               <div className="p-3 bg-gray-700/50 rounded-lg">
//                 <p className="text-gray-300 text-xs">By signing, you certify that the {signingDoc.label} matches the borrower profile for {profile?.firstName}.</p>
//               </div>
//               <Button variant="primary" className="w-full py-4 font-black" onClick={handleFinalSubmit}>
//                 Confirm & Submit Sign
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // --- STANDARD DASHBOARD VIEW ---
//   return (
//     <div className="p-8 bg-[#F8FAFC] min-h-screen">
//       <div className="max-w-6xl mx-auto space-y-6">
//         <Button variant="secondary" onClick={() => navigate(-1)} className="border-none hover:bg-transparent !px-0 text-gray-400 font-bold tracking-widest uppercase text-[10px]">
//           &larr; Back to Dashboard
//         </Button>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           <div className="lg:col-span-2 space-y-6">
//             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
//                 <h2 className="text-xl font-bold text-gray-900 mb-6">Loan Parameters</h2>
//                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
//                   <div>
//                     <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Requested Capital</p>
//                     <p className="text-2xl font-black text-gray-900">${loan?.loanAmount?.toLocaleString()}</p>
//                   </div>
//                   {/* ... rest of loan info ... */}
//                 </div>
//             </section>

//             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
//               <h2 className="text-xl font-bold text-gray-900 mb-6">Documents Vault</h2>
//               <div className="space-y-4">
//                 {[
//                   { label: "Driver's License", key: "driverLicense" },
//                   { label: "Recent Pay Stub", key: "payStub" },
//                   { label: "Profile Picture", key: "profilePic" },
//                 ].map((doc) => (
//                   <div key={doc.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
//                     <div className="flex items-center gap-3">
//                       <div className="p-2 bg-white rounded-lg shadow-sm font-bold text-gray-400 italic">
//                         {doc.key === "profilePic" ? "🖼️" : "📄"}
//                       </div>
//                       <p className="font-bold text-gray-700">{doc.label}</p>
//                     </div>
                    
//                     {documents?.[doc.key] ? (
//                       <Button 
//                         variant="secondary" 
//                         className="text-[10px] font-black uppercase px-3"
//                         onClick={() => setSigningDoc({ label: doc.label, url: documents[doc.key] })}
//                       >
//                         Sign Document
//                       </Button>
//                     ) : (
//                       <span className="text-[10px] font-bold text-gray-300 uppercase italic">Pending</span>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </section>
//           </div>
//           {/* ... Persona Card and Side Actions remain the same ... */}
//         </div>
//       </div>
//     </div>
//   );
// }

// // import { useEffect, useState } from "react";
// // import { useParams, useNavigate } from "react-router-dom";
// // import Button from "../../../components/UI/Button";
// // import { useUiPathAuth } from "../../../context/UiPathAuthContext";
// // // Importing only the necessary API functions
// // import { getBorrowerDocuments } from "../../../api/borrower/get";

// // export default function LoanActionPage() {
// //   const { loanId, borrowerId } = useParams<{ loanId: string; borrowerId: string }>();
// //   const navigate = useNavigate();
// //   const { isAuthenticated, sdk } = useUiPathAuth();

// //   const [data, setData] = useState<{
// //     loan: any;
// //     profile: any;
// //     employment: any;
// //     documents: any; 
// //   } | null>(null);

// //   const [loading, setLoading] = useState(true);
// //   const [actionLoading, setActionLoading] = useState(false);

// //   useEffect(() => {
// //     const fetchAllDetails = async () => {
// //       // Guard: Ensure we have the IDs and the SDK is ready
// //       if (!loanId || !borrowerId || !sdk || !isAuthenticated) return;
      
// //       setLoading(true);
// //       try {
// //         // 1. Get all entities via SDK to find the correct IDs
// //         const entities = await sdk.entities.getAll();
        
// //         const loanEntity = entities.find(e => e.name === "LoanApplication");
// //         const profileEntity = entities.find(e => e.name === "BorrowerProfile");
// //         const employmentEntity = entities.find(e => e.name === "BorrowerEmployment");

// //         if (!loanEntity) throw new Error("LoanApplication entity not found");

// //         // 2. Fetch records using SDK for Loan, Profile, Employment
// //         // AND use your custom API call for Documents
// //         const [loanRes, profileRes, employRes, docRes] = await Promise.all([
// //           sdk.entities.getRecordsById(loanEntity.id),
// //           profileEntity ? sdk.entities.getRecordsById(profileEntity.id) : Promise.resolve({ items: [] }),
// //           employmentEntity ? sdk.entities.getRecordsById(employmentEntity.id) : Promise.resolve({ items: [] }),
// //           getBorrowerDocuments(borrowerId), // Using your custom API specifically for docs
// //         ]);

// //         // 3. Process the results (Handling the 'Id' casing found in your console logs)
// //         const currentLoan = loanRes.items.find((r: any) => r.Id === loanId || r.id === loanId);
// //         const currentProfile = profileRes.items.find((r: any) => r.Id === borrowerId || r.id === borrowerId);
// //         const currentEmployment = employRes.items.find((r: any) => r.borrowerId === borrowerId);

// //         setData({
// //           loan: currentLoan,
// //           profile: currentProfile,
// //           employment: currentEmployment,
// //           // Set documents from your API response
// //           documents: docRes.success ? docRes.response.data : null,
// //         });
// //       } catch (err) {
// //         console.error("Data Fetch Error:", err);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchAllDetails();
// //   }, [loanId, borrowerId, sdk, isAuthenticated]);

// //   const updateStatus = async (newStatus: "APPROVED" | "REJECTED") => {
// //     if (!loanId || !sdk) return;
// //     setActionLoading(true);
    
// //     try {
// //       const entities = await sdk.entities.getAll();
// //       const loanEntity = entities.find(e => e.name === "LoanApplication");

// //       if (loanEntity) {
// //         // Use the SDK to update the status
// //         await sdk.entities.updateById(loanEntity.id, [
// //           {
// //             id: loanId, 
// //             applicationStatus: newStatus
// //           }
// //         ] as any);

// //         alert(`Loan ${newStatus.toLowerCase()} successfully!`);
// //         navigate(-1);
// //       }
// //     } catch (err) {
// //       console.error("SDK Update Error:", err);
// //       alert("Failed to update status.");
// //     } finally {
// //       setActionLoading(false);
// //     }
// //   };

// //   const formatDob = (dobString: string) => {
// //     if (!dobString) return "N/A";
// //     return new Date(dobString).toLocaleDateString("en-US", {
// //       year: "numeric",
// //       month: "long",
// //       day: "numeric",
// //     });
// //   };

// //   if (loading) return <div className="p-10 text-center font-bold text-gray-500">Syncing Records...</div>;
// //   if (!data || !data.loan) return <div className="p-10 text-center">No records found.</div>;

// //   const { loan, profile, employment, documents } = data;

// //   return (
// //     <div className="p-8 bg-[#F8FAFC] min-h-screen">
// //       <div className="max-w-6xl mx-auto space-y-6">
// //         <Button
// //           variant="secondary"
// //           onClick={() => navigate(-1)}
// //           className="border-none hover:bg-transparent !px-0 text-gray-400 font-bold tracking-widest uppercase text-[10px]"
// //         >
// //           &larr; Back to Dashboard
// //         </Button>

// //         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// //           <div className="lg:col-span-2 space-y-6">
// //             {/* LOAN INFO CARD */}
// //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// //               <h2 className="text-xl font-bold text-gray-900 mb-6">Loan Parameters</h2>
// //               <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
// //                 <div>
// //                   <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Requested Capital</p>
// //                   <p className="text-2xl font-black text-gray-900">${loan?.loanAmount?.toLocaleString()}</p>
// //                 </div>
// //                 <div>
// //                   <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Duration</p>
// //                   <p className="text-lg font-bold">{loan?.tenureMonths} Months</p>
// //                 </div>
// //                 <div>
// //                   <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Status</p>
// //                   <p className="text-sm font-black text-blue-600 uppercase">{loan?.applicationStatus}</p>
// //                 </div>
// //               </div>
// //             </section>

// //             {/* EMPLOYMENT CARD */}
// //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// //               <h2 className="text-xl font-bold text-gray-900 mb-6">Employment Analysis</h2>
// //               <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
// //                 <div className="border-l-4 border-black pl-4">
// //                   <p className="text-[10px] text-gray-400 uppercase font-bold">Employer</p>
// //                   <p className="text-lg font-bold">{employment?.employerName || "Private"}</p>
// //                 </div>
// //                 <div className="border-l-4 border-black pl-4">
// //                   <p className="text-[10px] text-gray-400 uppercase font-bold">Monthly Income</p>
// //                   <p className="text-lg font-bold">${employment?.monthlyIncome?.toLocaleString()}</p>
// //                 </div>
// //               </div>
// //             </section>

// //             {/* DOCUMENTS VAULT SECTION */}
// //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// //               <h2 className="text-xl font-bold text-gray-900 mb-6">Documents Vault</h2>
// //               <div className="space-y-4">
// //                 {[
// //                   { label: "Driver's License", key: "driverLicense" },
// //                   { label: "Recent Pay Stub", key: "payStub" },
// //                   { label: "Profile Picture", key: "profilePic" },
// //                 ].map((doc) => (
// //                   <div key={doc.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
// //                     <div className="flex items-center gap-3">
// //                       <div className="p-2 bg-white rounded-lg shadow-sm font-bold text-gray-400 italic">
// //                         {doc.key === "profilePic" ? "🖼️" : "📄"}
// //                       </div>
// //                       <p className="font-bold text-gray-700">{doc.label}</p>
// //                     </div>
                    
// //                     {documents?.[doc.key] ? (
// //                       <div className="flex gap-2">
// //                          <Button 
// //                           variant="secondary" 
// //                           className="text-[10px] font-black uppercase px-3"
// //                           onClick={() => window.open(documents[doc.key], "_blank")}
// //                         >
// //                           Preview
// //                         </Button>
// //                       </div>
// //                     ) : (
// //                       <span className="text-[10px] font-bold text-gray-300 uppercase italic">Pending Upload</span>
// //                     )}
// //                   </div>
// //                 ))}
// //               </div>
// //             </section>
// //           </div>

// //           <div className="space-y-6">
// //             {/* PERSONA CARD */}
// //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// //               <h2 className="text-lg font-bold text-gray-900 mb-6">Applicant Persona</h2>
// //               <div className="space-y-6">
// //                 <div className="flex items-center gap-4">
// //                   <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center text-xl font-black overflow-hidden border-2 border-gray-100">
// //                     {documents?.profilePic ? (
// //                         <img src={documents.profilePic} alt="Profile" className="w-full h-full object-cover" />
// //                     ) : (
// //                         `${profile?.firstName?.[0] || '?'}${profile?.lastName?.[0] || ''}`
// //                     )}
// //                   </div>
// //                   <div>
// //                     <p className="text-xl font-black text-gray-900">{profile?.firstName} {profile?.lastName}</p>
// //                     <p className="text-xs font-medium text-gray-400">{profile?.email}</p>
// //                   </div>
// //                 </div>
// //                 <div className="space-y-4 pt-6 border-t border-gray-50">
// //                   <div>
// //                     <p className="text-[10px] text-gray-400 uppercase font-bold">Residential Address</p>
// //                     <p className="text-sm font-medium">{profile?.address}, {profile?.city}</p>
// //                   </div>
// //                   <div>
// //                     <p className="text-[10px] text-gray-400 uppercase font-bold">Date of Birth</p>
// //                     <p className="text-sm font-medium">{formatDob(profile?.dob)}</p>
// //                   </div>
// //                 </div>
// //               </div>
// //             </section>

// //             {/* ACTION BUTTONS */}
// //             {loan?.applicationStatus === "SUBMITTED" ? (
// //               <div className="grid grid-cols-1 gap-3">
// //                 <Button variant="primary" loading={actionLoading} className="w-full py-4 font-black uppercase tracking-widest" onClick={() => updateStatus("APPROVED")}>
// //                   Approve Loan
// //                 </Button>
// //                 <Button variant="secondary" loading={actionLoading} className="w-full py-4 font-black uppercase tracking-widest text-red-600 border-red-100 hover:bg-red-50" onClick={() => updateStatus("REJECTED")}>
// //                   Reject
// //                 </Button>
// //               </div>
// //             ) : (
// //               <div className="p-4 bg-gray-100 rounded-xl text-center text-gray-500 font-bold uppercase text-[10px] tracking-widest">
// //                 Application {loan?.applicationStatus}
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // // import { useEffect, useState } from "react";
// // // import { useParams, useNavigate } from "react-router-dom";
// // // import Button from "../../../components/UI/Button";
// // // import { useUiPathAuth } from "../../../context/UiPathAuthContext";

// // // export default function LoanActionPage() {
// // //   const { loanId, borrowerId } = useParams<{ loanId: string; borrowerId: string }>();
// // //   const navigate = useNavigate();
// // //   const { isAuthenticated, sdk } = useUiPathAuth();

// // //   const [data, setData] = useState<{
// // //     loan: any;
// // //     profile: any;
// // //     employment: any;
// // //     documents: any;
// // //   } | null>(null);

// // //   const [loading, setLoading] = useState(true);
// // //   const [actionLoading, setActionLoading] = useState(false);

// // //   useEffect(() => {
// // //     const fetchAllDetailsViaSDK = async () => {
// // //       // Guard: Ensure we have the IDs and the SDK is ready
// // //       if (!loanId || !borrowerId || !sdk || !isAuthenticated) return;
      
// // //       setLoading(true);
// // //       try {
// // //         // 1. Get all entities to find the correct IDs
// // //         const entities = await sdk.entities.getAll();
// // //         console.log("Fetched entities:", entities);

// // //         const loanEntity = entities.find(e => e.name === "LoanApplication");
// // //         console.log("Found LoanApplication entity:", loanEntity);

// // //         const profileEntity = entities.find(e => e.name === "BorrowerProfile");
// // //         console.log("Found BorrowerProfile entity:", profileEntity);

// // //         const employmentEntity = entities.find(e => e.name === "BorrowerEmployment");
// // //         console.log("Found BorrowerEmployment entity:", employmentEntity);

// // //         const docsEntity = entities.find(e => e.name === "borrowerDocuments");
// // //         console.log("Found BorrowerDocuments entity:", docsEntity);

// // //         if (!loanEntity) throw new Error("LoanApplication entity not found");

// // //         // 2. Fetch records using the Entity IDs found above
// // //         // Note: For related data, we fetch records and then find the one matching borrowerId
// // //         const [loanRes, profileRes, employRes, docRes] = await Promise.all([
// // //           sdk.entities.getRecordsById(loanEntity.id),
// // //           profileEntity ? sdk.entities.getRecordsById(profileEntity.id) : Promise.resolve({ items: [] }),
// // //           employmentEntity ? sdk.entities.getRecordsById(employmentEntity.id) : Promise.resolve({ items: [] }),
// // //           docsEntity ? sdk.entities.getRecordsById(docsEntity.id) : Promise.resolve({ items: [] }),
// // //         ]);

// // //         console.log("Loan records:", loanRes);
// // //         console.log("borrowerId: ", borrowerId);

// // //         // 3. Process the results
// // //         // Find the specific loan by ID
// // //         const currentLoan = loanRes.items.find((r: any) => r.Id === loanId);
        
// // //         // Find related data by borrowerId field
// // //         const currentProfile = profileRes.items.find((r: any) => r.Id === borrowerId);
// // //         const currentEmployment = employRes.items.find((r: any) => r.borrowerId === borrowerId);
// // //         const currentDocs = docRes.items.find((r: any) => r.borrowerId === borrowerId);

// // //         console.log("Current Loan:", currentLoan);
// // //         console.log("Current Profile:", currentProfile);
// // //         console.log("Current Employment:", currentEmployment);
// // //         console.log("Current Documents:", currentDocs);

// // //         setData({
// // //           loan: currentLoan,
// // //           profile: currentProfile,
// // //           employment: currentEmployment,
// // //           documents: currentDocs,
// // //         });
// // //       } catch (err) {
// // //         console.error("SDK Data Fetch Error:", err);
// // //       } finally {
// // //         setLoading(false);
// // //       }
// // //     };

// // //     fetchAllDetailsViaSDK();
// // //   }, [loanId, borrowerId, sdk, isAuthenticated]);

// // //   const formatDob = (dobString: string) => {
// // //     if (!dobString) return "N/A";
// // //     return new Date(dobString).toLocaleDateString("en-US", {
// // //       year: "numeric",
// // //       month: "long",
// // //       day: "numeric",
// // //     });
// // //   };

// // //   const updateStatus = async (newStatus: "APPROVED" | "REJECTED") => {
// // //   if (!loanId || !sdk) return;
// // //   setActionLoading(true);
  
// // //   try {
// // //     const entities = await sdk.entities.getAll();
// // //     const loanEntity = entities.find(e => e.name === "LoanApplication");

// // //     if (loanEntity) {
// // //       // Change 'Id' to 'id' to satisfy the EntityRecord type requirement
// // //       await sdk.entities.updateById(loanEntity.id, [
// // //         {
// // //           id: loanId, // Use lowercase 'id'
// // //           applicationStatus: newStatus
// // //         }
// // //       ] as any); // Added 'as any' as a safety net if your specific SDK version is strictly mapped

// // //       alert(`Loan ${newStatus.toLowerCase()} successfully!`);
// // //       navigate(-1);
// // //     }
// // //   } catch (err) {
// // //     console.error("SDK Update Error:", err);
// // //     alert("Failed to update status via SDK.");
// // //   } finally {
// // //     setActionLoading(false);
// // //   }
// // // };

// // //   if (loading) return <div className="p-10 text-center font-bold text-gray-500">Syncing Records...</div>;
// // //   if (!data || !data.loan) return <div className="p-10 text-center">No records found.</div>;

// // //   const { loan, profile, employment, documents } = data;

// // //   return (
// // //     <div className="p-8 bg-[#F8FAFC] min-h-screen">
// // //       <div className="max-w-6xl mx-auto space-y-6">
// // //         <Button
// // //           variant="secondary"
// // //           onClick={() => navigate(-1)}
// // //           className="border-none hover:bg-transparent !px-0 text-gray-400 font-bold tracking-widest uppercase text-[10px]"
// // //         >
// // //           &larr; Back to Dashboard
// // //         </Button>

// // //         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// // //           <div className="lg:col-span-2 space-y-6">
// // //             {/* LOAN INFO CARD */}
// // //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// // //               <h2 className="text-xl font-bold text-gray-900 mb-6">Loan Parameters</h2>
// // //               <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
// // //                 <div>
// // //                   <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Requested Capital</p>
// // //                   <p className="text-2xl font-black text-gray-900">${loan?.loanAmount?.toLocaleString()}</p>
// // //                 </div>
// // //                 <div>
// // //                   <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Duration</p>
// // //                   <p className="text-lg font-bold">{loan?.tenureMonths} Months</p>
// // //                 </div>
// // //                 <div>
// // //                   <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Status</p>
// // //                   <p className="text-sm font-black text-blue-600 uppercase">{loan?.applicationStatus}</p>
// // //                 </div>
// // //               </div>
// // //             </section>

// // //             {/* EMPLOYMENT CARD */}
// // //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// // //               <h2 className="text-xl font-bold text-gray-900 mb-6">Employment Analysis</h2>
// // //               <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
// // //                 <div className="border-l-4 border-black pl-4">
// // //                   <p className="text-[10px] text-gray-400 uppercase font-bold">Employer</p>
// // //                   <p className="text-lg font-bold">{employment?.employerName || "Private"}</p>
// // //                 </div>
// // //                 <div className="border-l-4 border-black pl-4">
// // //                   <p className="text-[10px] text-gray-400 uppercase font-bold">Monthly Income</p>
// // //                   <p className="text-lg font-bold">${employment?.monthlyIncome?.toLocaleString()}</p>
// // //                 </div>
// // //               </div>
// // //             </section>

// // //             {/* DOCUMENTS VAULT SECTION */}
// // //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// // //               <h2 className="text-xl font-bold text-gray-900 mb-6">Documents Vault</h2>
// // //               <div className="space-y-4">
// // //                 {[
// // //                   { label: "Driver's License", key: "driverLicense" },
// // //                   { label: "Recent Pay Stub", key: "payStub" },
// // //                   { label: "Profile Picture", key: "profilePic" },
// // //                 ].map((doc) => (
// // //                   <div key={doc.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
// // //                     <div className="flex items-center gap-3">
// // //                       <div className="p-2 bg-white rounded-lg shadow-sm font-bold text-gray-400 italic">
// // //                         {doc.key === "profilePic" ? "🖼️" : "📄"}
// // //                       </div>
// // //                       <p className="font-bold text-gray-700">{doc.label}</p>
// // //                     </div>
                    
// // //                     {documents?.[doc.key] ? (
// // //                       <div className="flex gap-2">
// // //                          <Button 
// // //                           variant="secondary" 
// // //                           className="text-[10px] font-black uppercase px-3"
// // //                           onClick={() => window.open(documents[doc.key], "_blank")}
// // //                         >
// // //                           Preview
// // //                         </Button>
// // //                       </div>
// // //                     ) : (
// // //                       <span className="text-[10px] font-bold text-gray-300 uppercase italic">Pending Upload</span>
// // //                     )}
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             </section>
// // //           </div>

// // //           <div className="space-y-6">
// // //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// // //               <h2 className="text-lg font-bold text-gray-900 mb-6">Applicant Persona</h2>
// // //               <div className="space-y-6">
// // //                 <div className="flex items-center gap-4">
// // //                   <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center text-xl font-black overflow-hidden border-2 border-gray-100">
// // //                     {documents?.profilePic ? (
// // //                         <img src={documents.profilePic} alt="Profile" className="w-full h-full object-cover" />
// // //                     ) : (
// // //                         `${profile?.firstName?.[0] || '?'}${profile?.lastName?.[0] || ''}`
// // //                     )}
// // //                   </div>
// // //                   <div>
// // //                     <p className="text-xl font-black text-gray-900">{profile?.firstName} {profile?.lastName}</p>
// // //                     <p className="text-xs font-medium text-gray-400">{profile?.email}</p>
// // //                   </div>
// // //                 </div>
// // //                 <div className="space-y-4 pt-6 border-t border-gray-50">
// // //                   <div>
// // //                     <p className="text-[10px] text-gray-400 uppercase font-bold">Residential Address</p>
// // //                     <p className="text-sm font-medium">{profile?.address}, {profile?.city}</p>
// // //                   </div>
// // //                   <div>
// // //                     <p className="text-[10px] text-gray-400 uppercase font-bold">Date of Birth</p>
// // //                     <p className="text-sm font-medium">{formatDob(profile?.dob)}</p>
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             </section>

// // //             {loan?.applicationStatus === "SUBMITTED" ? (
// // //               <div className="grid grid-cols-1 gap-3">
// // //                 <Button variant="primary" loading={actionLoading} className="w-full py-4 font-black uppercase tracking-widest" onClick={() => updateStatus("APPROVED")}>
// // //                   Approve Loan
// // //                 </Button>
// // //                 <Button variant="secondary" loading={actionLoading} className="w-full py-4 font-black uppercase tracking-widest text-red-600 border-red-100 hover:bg-red-50" onClick={() => updateStatus("REJECTED")}>
// // //                   Reject
// // //                 </Button>
// // //               </div>
// // //             ) : (
// // //               <div className="p-4 bg-gray-100 rounded-xl text-center text-gray-500 font-bold uppercase text-[10px] tracking-widest">
// // //                 Application {loan?.applicationStatus}
// // //               </div>
// // //             )}
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }


// // // import { useEffect, useState } from "react";
// // // import { useParams, useNavigate } from "react-router-dom";
// // // import { getLoanById, getBorrowerProfile, getEmploymentInfo, getBorrowerDocuments } from "../../../api/borrower/get";
// // // import Button from "../../../components/UI/Button";
// // // import { updateLoanStatus } from "../../../api/borrower/put";

// // // export default function LoanActionPage() {
// // //   const { loanId, borrowerId } = useParams<{ loanId: string; borrowerId: string }>();
// // //   const navigate = useNavigate();

// // //   const [data, setData] = useState<{
// // //     loan: any;
// // //     profile: any;
// // //     employment: any;
// // //     documents: any; 
// // //   } | null>(null);
  
// // //   const [loading, setLoading] = useState(true);
// // //   const [actionLoading, setActionLoading] = useState(false);

// // //   useEffect(() => {
// // //     const fetchAllDetails = async () => {
// // //       if (!loanId || !borrowerId) return;
// // //       setLoading(true);

// // //       const [loanRes, profileRes, employRes, docRes] = await Promise.all([
// // //         getLoanById(loanId),
// // //         getBorrowerProfile(borrowerId),
// // //         getEmploymentInfo(borrowerId),
// // //         getBorrowerDocuments(borrowerId), 
// // //       ]);

// // //       if (loanRes.success && profileRes.success && employRes.success) {
// // //         setData({
// // //           loan: loanRes.response.data,
// // //           profile: profileRes.response.data,
// // //           employment: employRes.response.data,
// // //           documents: docRes.success ? docRes.response.data : null,
// // //         });
// // //       }
// // //       setLoading(false);
// // //     };

// // //     fetchAllDetails();
// // //   }, [loanId, borrowerId]);

// // //   const formatDob = (dobString: string) => {
// // //     if (!dobString) return "N/A";
// // //     return new Date(dobString).toLocaleDateString("en-US", {
// // //       year: "numeric",
// // //       month: "long",
// // //       day: "numeric",
// // //     });
// // //   };

// // //   const handleApprove = async () => {
// // //     setActionLoading(true);
// // //     if (!loanId) return;
// // //     const res = await updateLoanStatus(loanId, "APPROVED");
// // //     if (res.success) {
// // //       alert("Loan approved successfully!");
// // //       navigate(-1);
// // //     } else {
// // //       alert("Failed to approve loan.");
// // //     }
// // //     setActionLoading(false);
// // //   };

// // //   const handleReject = async () => {
// // //     setActionLoading(true);
// // //     if (!loanId) return;
// // //     const res = await updateLoanStatus(loanId, "REJECTED");
// // //     if (res.success) {
// // //       alert("Loan rejected.");
// // //       navigate(-1);
// // //     } else {
// // //       alert("Failed to reject loan.");
// // //     }
// // //     setActionLoading(false);
// // //   };

// // //   if (loading) return <div className="p-10 text-center font-bold text-gray-500">Syncing Records...</div>;
// // //   if (!data) return <div className="p-10 text-center">No records found.</div>;

// // //   const { loan, profile, employment, documents } = data;

// // //   return (
// // //     <div className="p-8 bg-[#F8FAFC] min-h-screen">
// // //       <div className="max-w-6xl mx-auto space-y-6">
// // //         <Button
// // //           variant="secondary"
// // //           onClick={() => navigate(-1)}
// // //           className="border-none hover:bg-transparent !px-0 text-gray-400 font-bold tracking-widest uppercase text-[10px]"
// // //         >
// // //           &larr; Back to Dashboard
// // //         </Button>

// // //         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// // //           <div className="lg:col-span-2 space-y-6">
// // //             {/* LOAN INFO CARD */}
// // //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// // //               <h2 className="text-xl font-bold text-gray-900 mb-6">Loan Parameters</h2>
// // //               <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
// // //                 <div>
// // //                   <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Requested Capital</p>
// // //                   <p className="text-2xl font-black text-gray-900">${loan?.loanAmount?.toLocaleString()}</p>
// // //                 </div>
// // //                 <div>
// // //                   <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Duration</p>
// // //                   <p className="text-lg font-bold">{loan?.tenureMonths} Months</p>
// // //                 </div>
// // //                 <div>
// // //                   <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Status</p>
// // //                   <p className="text-sm font-black text-blue-600 uppercase">{loan?.applicationStatus}</p>
// // //                 </div>
// // //               </div>
// // //             </section>

// // //             {/* EMPLOYMENT CARD */}
// // //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// // //               <h2 className="text-xl font-bold text-gray-900 mb-6">Employment Analysis</h2>
// // //               <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
// // //                 <div className="border-l-4 border-black pl-4">
// // //                   <p className="text-[10px] text-gray-400 uppercase font-bold">Employer</p>
// // //                   <p className="text-lg font-bold">{employment?.employerName || "Private"}</p>
// // //                 </div>
// // //                 <div className="border-l-4 border-black pl-4">
// // //                   <p className="text-[10px] text-gray-400 uppercase font-bold">Monthly Income</p>
// // //                   <p className="text-lg font-bold">${employment?.monthlyIncome?.toLocaleString()}</p>
// // //                 </div>
// // //               </div>
// // //             </section>

// // //             {/* DOCUMENTS VAULT SECTION */}
// // //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// // //               <h2 className="text-xl font-bold text-gray-900 mb-6">Documents Vault</h2>
// // //               <div className="space-y-4">
// // //                 {[
// // //                   { label: "Driver's License", key: "driverLicense" },
// // //                   { label: "Recent Pay Stub", key: "payStub" },
// // //                   { label: "Profile Picture", key: "profilePic" },
// // //                 ].map((doc) => (
// // //                   <div key={doc.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
// // //                     <div className="flex items-center gap-3">
// // //                       <div className="p-2 bg-white rounded-lg shadow-sm font-bold text-gray-400 italic">
// // //                         {doc.key === "profilePic" ? "🖼️" : "📄"}
// // //                       </div>
// // //                       <p className="font-bold text-gray-700">{doc.label}</p>
// // //                     </div>
                    
// // //                     {documents?.[doc.key] ? (
// // //                       <div className="flex gap-2">
// // //                          <Button 
// // //                           variant="secondary" 
// // //                           className="text-[10px] font-black uppercase px-3"
// // //                           onClick={() => window.open(documents[doc.key], "_blank")}
// // //                         >
// // //                           Preview
// // //                         </Button>
// // //                       </div>
// // //                     ) : (
// // //                       <span className="text-[10px] font-bold text-gray-300 uppercase italic">Pending Upload</span>
// // //                     )}
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             </section>
// // //           </div>

// // //           <div className="space-y-6">
// // //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// // //               <h2 className="text-lg font-bold text-gray-900 mb-6">Applicant Persona</h2>
// // //               <div className="space-y-6">
// // //                 <div className="flex items-center gap-4">
// // //                   <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center text-xl font-black overflow-hidden border-2 border-gray-100">
// // //                     {documents?.profilePic ? (
// // //                         <img src={documents.profilePic} alt="Profile" className="w-full h-full object-cover" />
// // //                     ) : (
// // //                         `${profile?.firstName?.[0]}${profile?.lastName?.[0]}`
// // //                     )}
// // //                   </div>
// // //                   <div>
// // //                     <p className="text-xl font-black text-gray-900">{profile?.firstName} {profile?.lastName}</p>
// // //                     <p className="text-xs font-medium text-gray-400">{profile?.email}</p>
// // //                   </div>
// // //                 </div>
// // //                 <div className="space-y-4 pt-6 border-t border-gray-50">
// // //                   <div>
// // //                     <p className="text-[10px] text-gray-400 uppercase font-bold">Residential Address</p>
// // //                     <p className="text-sm font-medium">{profile?.address}, {profile?.city}</p>
// // //                   </div>
// // //                   <div>
// // //                     <p className="text-[10px] text-gray-400 uppercase font-bold">Date of Birth</p>
// // //                     <p className="text-sm font-medium">{formatDob(profile?.dob)}</p>
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             </section>

// // //             {loan?.applicationStatus === "SUBMITTED" ? (
// // //               <div className="grid grid-cols-1 gap-3">
// // //                 <Button variant="primary" loading={actionLoading} className="w-full py-4 font-black uppercase tracking-widest" onClick={handleApprove}>
// // //                   Approve Loan
// // //                 </Button>
// // //                 <Button variant="secondary" loading={actionLoading} className="w-full py-4 font-black uppercase tracking-widest text-red-600 border-red-100 hover:bg-red-50" onClick={handleReject}>
// // //                   Reject
// // //                 </Button>
// // //               </div>
// // //             ) : (
// // //               <div className="p-4 bg-gray-100 rounded-xl text-center text-gray-500 font-bold uppercase text-[10px] tracking-widest">
// // //                 Application {loan?.applicationStatus}
// // //               </div>
// // //             )}
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // // // import { useEffect, useState } from "react";
// // // // // import { useParams, useNavigate } from "react-router-dom";
// // // // // import { getLoanById, getBorrowerProfile, getEmploymentInfo, getBorrowerDocuments } from "../../../api/borrower/get";
// // // // // import Button from "../../../components/UI/Button";
// // // // // import { updateLoanStatus } from "../../../api/borrower/put";

// // // // // export default function LoanActionPage() {
// // // // //   const { loanId, borrowerId } = useParams<{ loanId: string; borrowerId: string }>();
// // // // //   const navigate = useNavigate();

// // // // //   const [data, setData] = useState<{
// // // // //     loan: any;
// // // // //     profile: any;
// // // // //     employment: any;
// // // // //     documents: any; // Added documents to state
// // // // //   } | null>(null);
// // // // //   const [loading, setLoading] = useState(true);
// // // // //   const [actionLoading, setActionLoading] = useState(false);

// // // // //   useEffect(() => {
// // // // //     const fetchAllDetails = async () => {
// // // // //       if (!loanId || !borrowerId) return;
// // // // //       setLoading(true);

// // // // //       const [loanRes, profileRes, employRes, docRes] = await Promise.all([
// // // // //         getLoanById(loanId),
// // // // //         getBorrowerProfile(borrowerId),
// // // // //         getEmploymentInfo(borrowerId),
// // // // //         getBorrowerDocuments(borrowerId), // Now calling the document getter
// // // // //       ]);

// // // // //       if (loanRes.success && profileRes.success && employRes.success) {
// // // // //         setData({
// // // // //           loan: loanRes.response.data,
// // // // //           profile: profileRes.response.data,
// // // // //           employment: employRes.response.data,
// // // // //           documents: docRes.success ? docRes.response.data : null,
// // // // //         });
// // // // //       }
// // // // //       setLoading(false);
// // // // //     };

// // // // //     fetchAllDetails();
// // // // //   }, [loanId, borrowerId]);

// // // // //   const formatDob = (dobString: string) => {
// // // // //     if (!dobString) return "N/A";
// // // // //     return new Date(dobString).toLocaleDateString("en-US", {
// // // // //       year: "numeric",
// // // // //       month: "long",
// // // // //       day: "numeric",
// // // // //     });
// // // // //   };

// // // // //   const handleApprove = async () => {
// // // // //     setActionLoading(true);
// // // // //     if (!loanId) return;
// // // // //     const res = await updateLoanStatus(loanId, "APPROVED");
// // // // //     if (res.success) {
// // // // //       alert("Loan approved successfully!");
// // // // //       navigate(-1);
// // // // //     } else {
// // // // //       alert("Failed to approve loan.");
// // // // //     }
// // // // //     setActionLoading(false);
// // // // //   };

// // // // //   const handleReject = async () => {
// // // // //     setActionLoading(true);
// // // // //     if (!loanId) return;
// // // // //     const res = await updateLoanStatus(loanId, "REJECTED");
// // // // //     if (res.success) {
// // // // //       alert("Loan rejected.");
// // // // //       navigate(-1);
// // // // //     } else {
// // // // //       alert("Failed to reject loan.");
// // // // //     }
// // // // //     setActionLoading(false);
// // // // //   };

// // // // //   if (loading) return <div className="p-10 text-center font-bold text-gray-500">Syncing Records...</div>;
// // // // //   if (!data) return <div className="p-10 text-center">No records found.</div>;

// // // // //   const { loan, profile, employment, documents } = data;

// // // // //   return (
// // // // //     <div className="p-8 bg-[#F8FAFC] min-h-screen">
// // // // //       <div className="max-w-6xl mx-auto space-y-6">
// // // // //         <Button
// // // // //           variant="secondary"
// // // // //           onClick={() => navigate(-1)}
// // // // //           className="border-none hover:bg-transparent !px-0 text-gray-400 font-bold tracking-widest uppercase text-[10px]"
// // // // //         >
// // // // //           &larr; Back to Dashboard
// // // // //         </Button>

// // // // //         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// // // // //           <div className="lg:col-span-2 space-y-6">
// // // // //             {/* LOAN INFO CARD */}
// // // // //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// // // // //               <h2 className="text-xl font-bold text-gray-900 mb-6">Loan Parameters</h2>
// // // // //               <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
// // // // //                 <div>
// // // // //                   <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Requested Capital</p>
// // // // //                   <p className="text-2xl font-black text-gray-900">${loan?.loanAmount?.toLocaleString()}</p>
// // // // //                 </div>
// // // // //                 <div>
// // // // //                   <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Duration</p>
// // // // //                   <p className="text-lg font-bold">{loan?.tenureMonths} Months</p>
// // // // //                 </div>
// // // // //                 <div>
// // // // //                   <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Status</p>
// // // // //                   <p className="text-sm font-black text-blue-600 uppercase">{loan?.applicationStatus}</p>
// // // // //                 </div>
// // // // //               </div>
// // // // //             </section>

// // // // //             {/* EMPLOYMENT CARD */}
// // // // //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// // // // //               <h2 className="text-xl font-bold text-gray-900 mb-6">Employment Analysis</h2>
// // // // //               <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
// // // // //                 <div className="border-l-4 border-black pl-4">
// // // // //                   <p className="text-[10px] text-gray-400 uppercase font-bold">Employer</p>
// // // // //                   <p className="text-lg font-bold">{employment?.employerName || "Private"}</p>
// // // // //                 </div>
// // // // //                 <div className="border-l-4 border-black pl-4">
// // // // //                   <p className="text-[10px] text-gray-400 uppercase font-bold">Monthly Income</p>
// // // // //                   <p className="text-lg font-bold">${employment?.monthlyIncome?.toLocaleString()}</p>
// // // // //                 </div>
// // // // //               </div>
// // // // //             </section>

// // // // //             {/* NEW: DOCUMENTS VAULT SECTION */}
// // // // //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// // // // //               <h2 className="text-xl font-bold text-gray-900 mb-6">Documents Vault</h2>
// // // // //               <div className="space-y-4">
// // // // //                 {[
// // // // //                   { label: "Driver's License", key: "driverLicense" },
// // // // //                   { label: "Recent Pay Stub", key: "payStub" },
// // // // //                   { label: "Profile Picture", key: "profilePic" },
// // // // //                 ].map((doc) => (
// // // // //                   <div key={doc.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
// // // // //                     <div className="flex items-center gap-3">
// // // // //                       <div className="p-2 bg-white rounded-lg shadow-sm font-bold text-gray-400 italic">
// // // // //                         {doc.key === "profilePic" ? "🖼️" : "📄"}
// // // // //                       </div>
// // // // //                       <p className="font-bold text-gray-700">{doc.label}</p>
// // // // //                     </div>
                    
// // // // //                     {documents?.[doc.key] ? (
// // // // //                       <div className="flex gap-2">
// // // // //                          <Button 
// // // // //                           variant="secondary" 
// // // // //                           className="text-[10px] font-black uppercase px-3"
// // // // //                           onClick={() => window.open(documents[doc.key], "_blank")}
// // // // //                         >
// // // // //                           Preview
// // // // //                         </Button>
// // // // //                       </div>
// // // // //                     ) : (
// // // // //                       <span className="text-[10px] font-bold text-gray-300 uppercase italic">Pending Upload</span>
// // // // //                     )}
// // // // //                   </div>
// // // // //                 ))}
// // // // //               </div>
// // // // //             </section>
// // // // //           </div>

// // // // //           {/* SIDEBAR: BORROWER PROFILE */}
// // // // //           <div className="space-y-6">
// // // // //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// // // // //               <h2 className="text-lg font-bold text-gray-900 mb-6">Applicant Persona</h2>
// // // // //               <div className="space-y-6">
// // // // //                 <div className="flex items-center gap-4">
// // // // //                   {/* Dynamic Avatar: Shows profile pic if exists, else initials */}
// // // // //                   <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center text-xl font-black overflow-hidden border-2 border-gray-100">
// // // // //                     {documents?.profilePic ? (
// // // // //                         <img src={documents.profilePic} alt="Profile" className="w-full h-full object-cover" />
// // // // //                     ) : (
// // // // //                         `${profile?.firstName?.[0]}${profile?.lastName?.[0]}`
// // // // //                     )}
// // // // //                   </div>
// // // // //                   <div>
// // // // //                     <p className="text-xl font-black text-gray-900">{profile?.firstName} {profile?.lastName}</p>
// // // // //                     <p className="text-xs font-medium text-gray-400">{profile?.email}</p>
// // // // //                   </div>
// // // // //                 </div>
// // // // //                 <div className="space-y-4 pt-6 border-t border-gray-50">
// // // // //                   <div>
// // // // //                     <p className="text-[10px] text-gray-400 uppercase font-bold">Residential Address</p>
// // // // //                     <p className="text-sm font-medium">{profile?.address}, {profile?.city}</p>
// // // // //                   </div>
// // // // //                   <div>
// // // // //                     <p className="text-[10px] text-gray-400 uppercase font-bold">Date of Birth</p>
// // // // //                     <p className="text-sm font-medium">{formatDob(profile?.dob)}</p>
// // // // //                   </div>
// // // // //                 </div>
// // // // //               </div>
// // // // //             </section>

// // // // //             {/* ACTION BUTTONS */}
// // // // //             {loan?.applicationStatus === "SUBMITTED" ? (
// // // // //               <div className="grid grid-cols-1 gap-3">
// // // // //                 <Button variant="primary" loading={actionLoading} className="w-full py-4 font-black uppercase tracking-widest" onClick={handleApprove}>
// // // // //                   Approve Loan
// // // // //                 </Button>
// // // // //                 <Button variant="secondary" loading={actionLoading} className="w-full py-4 font-black uppercase tracking-widest text-red-600 border-red-100 hover:bg-red-50" onClick={handleReject}>
// // // // //                   Reject
// // // // //                 </Button>
// // // // //               </div>
// // // // //             ) : (
// // // // //               <div className="p-4 bg-gray-100 rounded-xl text-center text-gray-500 font-bold uppercase text-[10px] tracking-widest">
// // // // //                 Application {loan?.applicationStatus}
// // // // //               </div>
// // // // //             )}
// // // // //           </div>
// // // // //         </div>
// // // // //       </div>
// // // // //     </div>
// // // // //   );
// // // // // }

// // // // // // import { useEffect, useState } from "react";
// // // // // // import { useParams, useNavigate } from "react-router-dom";
// // // // // // import { getLoanById, getBorrowerProfile, getEmploymentInfo, getBorrowerDocuments } from "../../../api/borrower/get";
// // // // // // import Button from "../../../components/UI/Button"; // Using your custom component
// // // // // // import { updateLoanStatus } from "../../../api/borrower/put";


// // // // // // export default function LoanActionPage() {
// // // // // //   const { loanId, borrowerId } = useParams<{ loanId: string; borrowerId: string }>();
// // // // // //   const navigate = useNavigate();

// // // // // //   const [data, setData] = useState<{
// // // // // //     loan: any;
// // // // // //     profile: any;
// // // // // //     employment: any;
// // // // // //   } | null>(null);
// // // // // //   const [loading, setLoading] = useState(true);
// // // // // //   const [actionLoading, setActionLoading] = useState(false); // For button loading states

// // // // // //   useEffect(() => {
// // // // // //     const fetchAllDetails = async () => {
// // // // // //       if (!loanId || !borrowerId) return;
// // // // // //       setLoading(true);

// // // // // //       const [loanRes, profileRes, employRes] = await Promise.all([
// // // // // //         getLoanById(loanId),
// // // // // //         getBorrowerProfile(borrowerId),
// // // // // //         getEmploymentInfo(borrowerId),
// // // // // //       ]);

// // // // // //       if (loanRes.success && profileRes.success && employRes.success) {
// // // // // //         setData({
// // // // // //           loan: loanRes.response.data,
// // // // // //           profile: profileRes.response.data,
// // // // // //           employment: employRes.response.data,
// // // // // //         });
// // // // // //       }
// // // // // //       setLoading(false);
// // // // // //     };

// // // // // //     fetchAllDetails();
// // // // // //   }, [loanId, borrowerId]);

// // // // // //   const formatDob = (dobString: string) => {
// // // // // //     if (!dobString) return "N/A";
// // // // // //     return new Date(dobString).toLocaleDateString("en-US", {
// // // // // //       year: "numeric",
// // // // // //       month: "long",
// // // // // //       day: "numeric",
// // // // // //     });
// // // // // //   };

// // // // // //   const handleApprove = async () => {
// // // // // //     setActionLoading(true);
// // // // // //     if (!loanId) return;
// // // // // //     const res = await updateLoanStatus(loanId, "APPROVED"); 
// // // // // //     if (res.success) {
// // // // // //       alert("Loan approved successfully!");
// // // // // //       navigate(-1); // Go back to previous page
// // // // // //     } else {
// // // // // //       alert("Failed to approve loan.");
// // // // // //     }
// // // // // //     setActionLoading(false);
// // // // // //   }

// // // // // //   const handleReject = async () => {
// // // // // //     setActionLoading(true);
// // // // // //     if (!loanId) return;
// // // // // //     const res = await updateLoanStatus(loanId, "REJECTED");
// // // // // //     if (res.success) {
// // // // // //       alert("Loan rejected.");
// // // // // //       navigate(-1); // Go back to previous page
// // // // // //     } else {
// // // // // //       alert("Failed to reject loan.");
// // // // // //     }
// // // // // //     setActionLoading(false);
// // // // // //   }


// // // // // //   if (loading) return <div className="p-10 text-center font-bold text-gray-500">Syncing Records...</div>;
// // // // // //   if (!data) return <div className="p-10 text-center">No records found.</div>;

// // // // // //   const { loan, profile, employment } = data;

// // // // // //   return (
// // // // // //     <div className="p-8 bg-[#F8FAFC] min-h-screen">
// // // // // //       <div className="max-w-6xl mx-auto space-y-6">
// // // // // //         {/* Back Button using your component */}
// // // // // //         <Button 
// // // // // //           variant="secondary" 
// // // // // //           onClick={() => navigate(-1)}
// // // // // //           className="border-none hover:bg-transparent !px-0 text-gray-400 font-bold tracking-widest uppercase text-[10px]"
// // // // // //         >
// // // // // //           &larr; Back to Dashboard
// // // // // //         </Button>

// // // // // //         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
// // // // // //           <div className="lg:col-span-2 space-y-6">
// // // // // //             {/* LOAN INFO CARD */}
// // // // // //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// // // // // //               <h2 className="text-xl font-bold text-gray-900 mb-6">Loan Parameters</h2>
// // // // // //               <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
// // // // // //                 <div>
// // // // // //                   <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Requested Capital</p>
// // // // // //                   <p className="text-2xl font-black text-gray-900">${loan?.loanAmount?.toLocaleString()}</p>
// // // // // //                 </div>
// // // // // //                 <div>
// // // // // //                   <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Duration</p>
// // // // // //                   <p className="text-lg font-bold">{loan?.tenureMonths} Months</p>
// // // // // //                 </div>
// // // // // //                 <div>
// // // // // //                   <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Status</p>
// // // // // //                   <p className="text-sm font-black text-blue-600 uppercase">{loan?.applicationStatus}</p>
// // // // // //                 </div>
// // // // // //               </div>
// // // // // //             </section>

// // // // // //             {/* EMPLOYMENT CARD */}
// // // // // //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// // // // // //               <h2 className="text-xl font-bold text-gray-900 mb-6">Employment Analysis</h2>
// // // // // //               <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
// // // // // //                 <div className="border-l-4 border-black pl-4">
// // // // // //                   <p className="text-[10px] text-gray-400 uppercase font-bold">Employer</p>
// // // // // //                   <p className="text-lg font-bold">{employment?.employerName || "Private"}</p>
// // // // // //                 </div>
// // // // // //                 <div className="border-l-4 border-black pl-4">
// // // // // //                   <p className="text-[10px] text-gray-400 uppercase font-bold">Monthly Income</p>
// // // // // //                   <p className="text-lg font-bold">${employment?.monthlyIncome?.toLocaleString()}</p>
// // // // // //                 </div>
// // // // // //                 <div className="border-l-4 border-black pl-4">
// // // // // //                   <p className="text-[10px] text-gray-400 uppercase font-bold">Status</p>
// // // // // //                   <p className="text-lg font-bold text-gray-700">{employment?.employmentStatus}</p>
// // // // // //                 </div>
// // // // // //               </div>
// // // // // //             </section>
// // // // // //           </div>

// // // // // //           {/* SIDEBAR: BORROWER PROFILE */}
// // // // // //           <div className="space-y-6">
// // // // // //             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
// // // // // //               <h2 className="text-lg font-bold text-gray-900 mb-6">Applicant Persona</h2>
// // // // // //               <div className="space-y-6">
// // // // // //                 <div className="flex items-center gap-4">
// // // // // //                   <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center text-xl font-black">
// // // // // //                     {profile?.firstName?.[0]}{profile?.lastName?.[0]}
// // // // // //                   </div>
// // // // // //                   <div>
// // // // // //                     <p className="text-xl font-black text-gray-900">{profile?.firstName} {profile?.lastName}</p>
// // // // // //                     <p className="text-xs font-medium text-gray-400">{profile?.email}</p>
// // // // // //                   </div>
// // // // // //                 </div>
                
// // // // // //                 <div className="space-y-4 pt-6 border-t border-gray-50">
// // // // // //                   <div>
// // // // // //                     <p className="text-[10px] text-gray-400 uppercase font-bold">Residential Address</p>
// // // // // //                     <p className="text-sm font-medium">{profile?.address}, {profile?.city}</p>
// // // // // //                   </div>
// // // // // //                   <div>
// // // // // //                     <p className="text-[10px] text-gray-400 uppercase font-bold">Date of Birth</p>
// // // // // //                     <p className="text-sm font-medium">{formatDob(profile?.dob)}</p>
// // // // // //                   </div>
// // // // // //                 </div>
// // // // // //               </div>
// // // // // //             </section>

// // // // // //             {/* ACTION BUTTONS USING YOUR COMPONENT */}
// // // // // //             {loan?.applicationStatus === "SUBMITTED" ? <div className="grid grid-cols-1 gap-3">
// // // // // //               <Button 
// // // // // //                 variant="primary" 
// // // // // //                 loading={actionLoading}
// // // // // //                 className="w-full py-4 font-black uppercase tracking-widest"
// // // // // //                 onClick={handleApprove} // Example of how loading works
// // // // // //               >
// // // // // //                 Approve Loan
// // // // // //               </Button>
// // // // // //               <Button 
// // // // // //                 variant="secondary" 
// // // // // //                 loading={actionLoading}
// // // // // //                 className="w-full py-4 font-black uppercase tracking-widest text-red-600 border-red-100 hover:bg-red-50"
// // // // // //                 onClick={handleReject}
// // // // // //               >
// // // // // //                 Reject
// // // // // //               </Button>
// // // // // //             </div> : <div className="text-center text-gray-500 font-bold">
// // // // // //               This application has been {loan?.applicationStatus.toLowerCase()}.
// // // // // //           </div>}
// // // // // //           </div>

// // // // // //         </div>
// // // // // //       </div>
// // // // // //     </div>
// // // // // //   );
// // // // // // }

// // // // // // // import { useEffect, useState } from "react";
// // // // // // // import { useParams, useNavigate } from "react-router-dom";
// // // // // // // import { getLoanById, getBorrowerProfile, getEmploymentInfo } from "../../../api/borrower/get";
// // // // // // // import Button from "../../../components/UI/Button";

// // // // // // // export default function LoanActionPage() {
// // // // // // //   const { loanId, borrowerId } = useParams<{ loanId: string; borrowerId: string }>();
// // // // // // //   const navigate = useNavigate();

// // // // // // //   const [data, setData] = useState<{
// // // // // // //     loan: any;
// // // // // // //     profile: any;
// // // // // // //     employment: any;
// // // // // // //   } | null>(null);
// // // // // // //   const [loading, setLoading] = useState(true);

// // // // // // //   useEffect(() => {
// // // // // // //     const fetchAllDetails = async () => {
// // // // // // //       if (!loanId || !borrowerId) return;
// // // // // // //       setLoading(true);

// // // // // // //       // We trigger all three API calls at the same time
// // // // // // //       const [loanRes, profileRes, employRes] = await Promise.all([
// // // // // // //         getLoanById(loanId),
// // // // // // //         getBorrowerProfile(borrowerId),
// // // // // // //         getEmploymentInfo(borrowerId),
// // // // // // //       ]);

// // // // // // //       if (loanRes.success && profileRes.success && employRes.success) {
// // // // // // //         setData({
// // // // // // //           loan: loanRes.response.data,
// // // // // // //           profile: profileRes.response.data,
// // // // // // //           employment: employRes.response.data,
// // // // // // //         });
// // // // // // //       } else {
// // // // // // //         console.error("One or more APIs failed to load");
// // // // // // //       }
// // // // // // //       setLoading(false);
// // // // // // //     };

// // // // // // //     fetchAllDetails();
// // // // // // //   }, [loanId, borrowerId]);

// // // // // // //   if (loading) return <div className="p-10 text-center">Loading Application Details...</div>;
// // // // // // //   if (!data) return <div className="p-10 text-center">Data not found.</div>;

// // // // // // //   return (
// // // // // // //     <div className="p-8 bg-[#F8FAFC] min-h-screen space-y-6">
// // // // // // //       <div className="max-w-5xl mx-auto">
// // // // // // //         <button onClick={() => navigate(-1)} className="text-sm text-gray-500 mb-4 hover:text-indigo-600">
// // // // // // //           &larr; Back to Dashboard
// // // // // // //         </button>

// // // // // // //         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
// // // // // // //           {/* 1. Loan Details Section */}
// // // // // // //           <div className="md:col-span-2 space-y-6">
// // // // // // //             <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
// // // // // // //               <h2 className="text-lg font-bold border-b pb-3 mb-4 text-gray-800">Loan Application Details</h2>
// // // // // // //               <div className="grid grid-cols-2 gap-4">
// // // // // // //                 <div>
// // // // // // //                   <p className="text-xs text-gray-400 uppercase">Amount Requested</p>
// // // // // // //                   <p className="text-xl font-bold text-indigo-600">${data.loan.loanAmount?.toLocaleString()}</p>
// // // // // // //                 </div>
// // // // // // //                 <div>
// // // // // // //                   <p className="text-xs text-gray-400 uppercase">Loan Type</p>
// // // // // // //                   <p className="font-semibold">{data.loan.loanType}</p>
// // // // // // //                 </div>
// // // // // // //                 <div>
// // // // // // //                   <p className="text-xs text-gray-400 uppercase">Tenure</p>
// // // // // // //                   <p className="font-semibold">{data.loan.tenureMonths} Months</p>
// // // // // // //                 </div>
// // // // // // //                 <div>
// // // // // // //                   <p className="text-xs text-gray-400 uppercase">Status</p>
// // // // // // //                   <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">
// // // // // // //                     {data.loan.applicationStatus}
// // // // // // //                   </span>
// // // // // // //                 </div>
// // // // // // //               </div>
// // // // // // //             </section>

// // // // // // //             {/* 2. Employment Section */}
// // // // // // //             <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
// // // // // // //               <h2 className="text-lg font-bold border-b pb-3 mb-4 text-gray-800">Employment Information</h2>
// // // // // // //               <div className="grid grid-cols-2 gap-4">
// // // // // // //                 <div>
// // // // // // //                   <p className="text-xs text-gray-400 uppercase">Employer Name</p>
// // // // // // //                   <p className="font-semibold">{data.employment.employerName || "N/A"}</p>
// // // // // // //                 </div>
// // // // // // //                 <div>
// // // // // // //                   <p className="text-xs text-gray-400 uppercase">Annual Income</p>
// // // // // // //                   <p className="font-semibold">${data.employment.annualIncome?.toLocaleString()}</p>
// // // // // // //                 </div>
// // // // // // //                 <div>
// // // // // // //                   <p className="text-xs text-gray-400 uppercase">Occupation</p>
// // // // // // //                   <p className="font-semibold">{data.employment.occupation}</p>
// // // // // // //                 </div>
// // // // // // //               </div>
// // // // // // //             </section>
// // // // // // //           </div>

// // // // // // //           {/* 3. Borrower Profile Section */}
// // // // // // //           <div className="space-y-6">
// // // // // // //             <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
// // // // // // //               <h2 className="text-lg font-bold border-b pb-3 mb-4 text-gray-800">Borrower Profile</h2>
// // // // // // //               <div className="space-y-4">
// // // // // // //                 <div className="flex items-center gap-3">
// // // // // // //                   <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
// // // // // // //                     {data.profile.firstName?.[0]}{data.profile.lastName?.[0]}
// // // // // // //                   </div>
// // // // // // //                   <div>
// // // // // // //                     <p className="font-bold text-gray-900">{data.profile.firstName} {data.profile.lastName}</p>
// // // // // // //                     <p className="text-xs text-gray-500">{data.profile.email}</p>
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //                 <div className="pt-4 border-t">
// // // // // // //                   <p className="text-xs text-gray-400 uppercase">Phone</p>
// // // // // // //                   <p className="text-sm font-medium">{data.profile.phoneNumber}</p>
// // // // // // //                 </div>
// // // // // // //                 <div>
// // // // // // //                   <p className="text-xs text-gray-400 uppercase">Address</p>
// // // // // // //                   <p className="text-sm text-gray-600">{data.profile.address}</p>
// // // // // // //                 </div>
// // // // // // //               </div>
// // // // // // //             </section>

// // // // // // //             {/* Decision Buttons */}
// // // // // // //             <div className="space-y-3">
// // // // // // //               <Button className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700">
// // // // // // //                 APPROVE LOAN
// // // // // // //               </Button>
// // // // // // //               <Button className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700">
// // // // // // //                 REJECT LOAN
// // // // // // //               </Button>
// // // // // // //             </div>
// // // // // // //           </div>

// // // // // // //         </div>
// // // // // // //       </div>
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // }