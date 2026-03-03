import { useState } from "react";
import Button from "../../../components/UI/Button";
import Input from "../../../components/UI/Input";
import { useNavigate } from "react-router-dom";
import { uploadBorrowerDocuments } from "../../../api/borrower/post";

type DocFile = {
  file: File | null;
  previewUrl: string | null;
};

type UploadBoxProps = {
  title: string;
  doc: DocFile;
  accept?: string; // Added optional accept prop
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
};

export default function UploadDocumentsPage() {
  const [license, setLicense] = useState<DocFile>({ file: null, previewUrl: null });
  const [payStub, setPayStub] = useState<DocFile>({ file: null, previewUrl: null });
  // NEW: State for Profile Picture
  const [profilePic, setProfilePic] = useState<DocFile>({ file: null, previewUrl: null });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<DocFile>>
  ) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setter({ file: selectedFile, previewUrl: url });
    }
  };

  const removeFile = (setter: React.Dispatch<React.SetStateAction<DocFile>>, currentDoc: DocFile) => {
    if (currentDoc.previewUrl) {
      URL.revokeObjectURL(currentDoc.previewUrl);
    }
    setter({ file: null, previewUrl: null });
  };

  const handleSubmit = async () => {
    const borrowerId = localStorage.getItem("borrowerId");

    if (!borrowerId) {
      setError("Borrower not found. Please login again.");
      return;
    }

    // Logic: Require at least one doc or the profile pic
    if (!license.file && !payStub.file && !profilePic.file) {
      setError("Please upload at least one document or a profile picture.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Update the API call to include the profile picture
      // Ensure your uploadBorrowerDocuments function in post.ts is updated to accept a 3rd file argument
      await uploadBorrowerDocuments(
        borrowerId,
        license.file || undefined,
        payStub.file || undefined,
        profilePic.file || undefined 
      );

      navigate("/borrower/dashboard"); 
    } catch (err: any) {
      console.error("Upload Error:", err);
      setError(err.response?.data?.message || "Failed to upload documents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-start mb-4">
          <button 
            onClick={() => navigate("/borrower/dashboard")}
            className="flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <span className="mr-2">←</span> Go to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-6 md:p-8">
          <h1 className="text-xl font-semibold mb-2">Upload Documents</h1>
          <p className="text-sm text-gray-500 mb-6">
            Complete your profile by uploading the required documentation.
          </p>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* PROFILE PICTURE BOX - Only accepts images */}
            <UploadBox
              title="Profile Picture"
              doc={profilePic}
              accept="image/*" 
              onUpload={(e) => handleFile(e, setProfilePic)}
              onRemove={() => removeFile(setProfilePic, profilePic)}
            />

            <UploadBox
              title="Driver's License"
              doc={license}
              onUpload={(e) => handleFile(e, setLicense)}
              onRemove={() => removeFile(setLicense, license)}
            />

            <UploadBox
              title="Recent Pay Stub"
              doc={payStub}
              onUpload={(e) => handleFile(e, setPayStub)}
              onRemove={() => removeFile(setPayStub, payStub)}
            />
          </div>

          <div className="flex justify-end mt-8">
            <Button 
              onClick={handleSubmit} 
              loading={loading}
              className="px-8"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Updated Upload Box Component ---------- */

function UploadBox({ title, doc, onUpload, onRemove, accept = "image/*,.pdf" }: UploadBoxProps) {
  return (
    <div className="border rounded-lg p-4 flex flex-col h-full bg-white">
      <div className="font-medium mb-3 text-gray-700">{title}</div>
      <Input 
        type="file" 
        accept={accept} // Use the specific accept prop
        onChange={onUpload} 
      />
      
      {doc.file && (
        <div className="mt-3 flex items-center justify-between text-[11px] bg-indigo-50 text-indigo-700 p-2 rounded border border-indigo-100">
          <span className="truncate flex-1 mr-2">{doc.file.name}</span>
          <button type="button" onClick={onRemove} className="text-red-500 font-bold px-1 hover:scale-110 transition-transform">✕</button>
        </div>
      )}

      <div className="mt-4 h-48 border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
        {doc.previewUrl ? (
          doc.file?.type.includes("image") ? (
            <img src={doc.previewUrl} alt="Preview" className="max-w-full max-h-full object-cover w-full h-full" />
          ) : (
            <div className="text-center p-4">
              <div className="text-3xl mb-1">📄</div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">PDF Selected</div>
            </div>
          )
        ) : (
          <div className="text-center text-gray-300">
            <div className="text-2xl mb-1">☁️</div>
            <span className="text-[10px] uppercase font-bold tracking-widest">Drop File</span>
          </div>
        )}
      </div>
    </div>
  );
}

// import { useState } from "react";
// import Button from "../../../components/UI/Button";
// import Input from "../../../components/UI/Input";
// import { useNavigate } from "react-router-dom";
// import { uploadBorrowerDocuments } from "../../../api/borrower/post";

// type DocFile = {
//   file: File | null;
//   previewUrl: string | null;
// };

// type UploadBoxProps = {
//   title: string;
//   doc: DocFile;
//   onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   onRemove: () => void;
// };

// export default function UploadDocumentsPage() {
//   const [license, setLicense] = useState<DocFile>({ file: null, previewUrl: null });
//   const [payStub, setPayStub] = useState<DocFile>({ file: null, previewUrl: null });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const navigate = useNavigate();

//   const handleFile = (
//     e: React.ChangeEvent<HTMLInputElement>,
//     setter: React.Dispatch<React.SetStateAction<DocFile>>
//   ) => {
//     const selectedFile = e.target.files?.[0];
//     if (selectedFile) {
//       const url = URL.createObjectURL(selectedFile);
//       setter({ file: selectedFile, previewUrl: url });
//     }
//   };

//   const removeFile = (setter: React.Dispatch<React.SetStateAction<DocFile>>, currentDoc: DocFile) => {
//     if (currentDoc.previewUrl) {
//       URL.revokeObjectURL(currentDoc.previewUrl);
//     }
//     setter({ file: null, previewUrl: null });
//   };

//   const handleSubmit = async () => {
//     const borrowerId = localStorage.getItem("borrowerId");

//     if (!borrowerId) {
//       setError("Borrower not found. Please login again.");
//       return;
//     }

//     if (!license.file && !payStub.file) {
//       setError("Please upload at least one document.");
//       return;
//     }

//     try {
//       setLoading(true);
//       setError(null);

//       await uploadBorrowerDocuments(
//         borrowerId,
//         license.file || undefined,
//         payStub.file || undefined
//       );

//       // REDIRECT: Redirecting to the View/Comments page instead of dashboard
//       navigate("/borrower/view-documents"); 
//     } catch (err: any) {
//       console.error("Upload Error:", err);
//       setError(err.response?.data?.message || "Failed to upload documents. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 p-4 md:p-6">
//       <div className="max-w-5xl mx-auto">
        
//         {/* NEW: Go to Dashboard Button */}
//         <div className="flex justify-start mb-4">
//           <button 
//             onClick={() => navigate("/borrower/dashboard")}
//             className="flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
//           >
//             <span className="mr-2">←</span> Go to Dashboard
//           </button>
//         </div>

//         <div className="bg-white rounded-xl shadow p-6 md:p-8">
//           <h1 className="text-xl font-semibold mb-2">Upload Documents</h1>
//           <p className="text-sm text-gray-500 mb-6">
//             We need further confirmation of your identity and income.
//           </p>

//           {error && (
//             <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
//               {error}
//             </div>
//           )}

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
//             <UploadBox
//               title="Driver's License"
//               doc={license}
//               onUpload={(e) => handleFile(e, setLicense)}
//               onRemove={() => removeFile(setLicense, license)}
//             />

//             <UploadBox
//               title="Recent Pay Stub"
//               doc={payStub}
//               onUpload={(e) => handleFile(e, setPayStub)}
//               onRemove={() => removeFile(setPayStub, payStub)}
//             />
//           </div>

//           <div className="flex justify-end mt-8">
//             {/* NEXT BUTTON: Now triggers the redirect to View Documents page */}
//             <Button 
//               onClick={handleSubmit} 
//               disabled={loading}
//               className={loading ? "opacity-70 cursor-not-allowed" : ""}
//             >
//               {loading ? "Uploading..." : "Next"}
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ---------- Upload Box Component (Keep as is) ---------- */

// function UploadBox({ title, doc, onUpload, onRemove }: UploadBoxProps) {
//   return (
//     <div className="border rounded-lg p-4 flex flex-col h-full bg-white">
//       <div className="font-medium mb-3">{title}</div>
//       <Input 
//         type="file" 
//         accept="image/*,.pdf" 
//         onChange={onUpload} 
//       />
//       {doc.file && (
//         <div className="mt-3 flex items-center justify-between text-sm bg-blue-50 text-blue-700 p-2 rounded">
//           <span className="truncate flex-1 mr-2">{doc.file.name}</span>
//           <button type="button" onClick={onRemove} className="text-red-500 font-bold px-1">✕</button>
//         </div>
//       )}
//       <div className="mt-4 h-48 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
//         {doc.previewUrl ? (
//           doc.file?.type.includes("image") ? (
//             <img src={doc.previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
//           ) : (
//             <div className="text-center p-4">
//               <div className="text-3xl mb-1">📄</div>
//               <div className="text-xs text-gray-500">PDF Document Selected</div>
//             </div>
//           )
//         ) : (
//           <span className="text-gray-400 text-sm">No file selected</span>
//         )}
//       </div>
//     </div>
//   );
// }

// // import { useState, useEffect } from "react";
// // import Button from "../../../components/UI/Button";
// // import Input from "../../../components/UI/Input";
// // import { useNavigate } from "react-router-dom";
// // import { uploadBorrowerDocuments } from "../../../api/borrower/post";

// // type DocFile = {
// //   file: File | null;
// //   previewUrl: string | null;
// // };

// // type UploadBoxProps = {
// //   title: string;
// //   doc: DocFile;
// //   onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
// //   onRemove: () => void;
// // };

// // export default function UploadDocumentsPage() {
// //   const [license, setLicense] = useState<DocFile>({ file: null, previewUrl: null });
// //   const [payStub, setPayStub] = useState<DocFile>({ file: null, previewUrl: null });

// //   const [loading, setLoading] = useState(false);
// //   const [error, setError] = useState<string | null>(null);

// //   const navigate = useNavigate();

// //   // Helper to handle file selection and generate a local preview URL
// //   const handleFile = (
// //     e: React.ChangeEvent<HTMLInputElement>,
// //     setter: React.Dispatch<React.SetStateAction<DocFile>>
// //   ) => {
// //     const selectedFile = e.target.files?.[0];
// //     if (selectedFile) {
// //       // Create a temporary URL for the preview box
// //       const url = URL.createObjectURL(selectedFile);
// //       setter({ file: selectedFile, previewUrl: url });
// //     }
// //   };

// //   // Helper to clear file and revoke the object URL to save memory
// //   const removeFile = (setter: React.Dispatch<React.SetStateAction<DocFile>>, currentDoc: DocFile) => {
// //     if (currentDoc.previewUrl) {
// //       URL.revokeObjectURL(currentDoc.previewUrl);
// //     }
// //     setter({ file: null, previewUrl: null });
// //   };

// //   const handleSubmit = async () => {
// //     const borrowerId = localStorage.getItem("borrowerId");

// //     if (!borrowerId) {
// //       setError("Borrower not found. Please login again.");
// //       return;
// //     }

// //     if (!license.file && !payStub.file) {
// //       setError("Please upload at least one document.");
// //       return;
// //     }

// //     try {
// //       setLoading(true);
// //       setError(null);

// //       // Call the API function (Ensure the API function does NOT manually set multipart headers)
// //       await uploadBorrowerDocuments(
// //         borrowerId,
// //         license.file || undefined,
// //         payStub.file || undefined
// //       );

// //       navigate("/borrower/dashboard");
// //     } catch (err: any) {
// //       console.error("Upload Error:", err);
// //       setError(err.response?.data?.message || "Failed to upload documents. Please try again.");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   return (
// //     <div className="min-h-screen bg-gray-100 p-4 md:p-6">
// //       <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-6 md:p-8">
// //         <h1 className="text-xl font-semibold mb-2">Upload Documents</h1>
// //         <p className="text-sm text-gray-500 mb-6">
// //           We need further confirmation of your identity and income.
// //         </p>

// //         {error && (
// //           <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
// //             {error}
// //           </div>
// //         )}

// //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
// //           <UploadBox
// //             title="Driver's License"
// //             doc={license}
// //             onUpload={(e) => handleFile(e, setLicense)}
// //             onRemove={() => removeFile(setLicense, license)}
// //           />

// //           <UploadBox
// //             title="Recent Pay Stub"
// //             doc={payStub}
// //             onUpload={(e) => handleFile(e, setPayStub)}
// //             onRemove={() => removeFile(setPayStub, payStub)}
// //           />
// //         </div>

// //         <div className="flex justify-end mt-8">
// //           <Button 
// //             onClick={handleSubmit} 
// //             disabled={loading}
// //             className={loading ? "opacity-70 cursor-not-allowed" : ""}
// //           >
// //             {loading ? "Uploading..." : "Next"}
// //           </Button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // /* ---------- Upload Box Component ---------- */

// // function UploadBox({ title, doc, onUpload, onRemove }: UploadBoxProps) {
// //   return (
// //     <div className="border rounded-lg p-4 flex flex-col h-full">
// //       <div className="font-medium mb-3">{title}</div>

// //       <Input 
// //         type="file" 
// //         accept="image/*,.pdf" 
// //         onChange={onUpload} 
// //       />

// //       {doc.file && (
// //         <div className="mt-3 flex items-center justify-between text-sm bg-blue-50 text-blue-700 p-2 rounded">
// //           <span className="truncate flex-1 mr-2">{doc.file.name}</span>
// //           <button
// //             type="button"
// //             onClick={onRemove}
// //             className="text-red-500 hover:text-red-700 font-bold px-1"
// //             title="Remove file"
// //           >
// //             ✕
// //           </button>
// //         </div>
// //       )}

// //       {/* Preview Area */}
// //       <div className="mt-4 h-48 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
// //         {doc.previewUrl ? (
// //           doc.file?.type.includes("image") ? (
// //             <img
// //               src={doc.previewUrl}
// //               alt="Document Preview"
// //               className="max-w-full max-h-full object-contain"
// //             />
// //           ) : (
// //             <div className="text-center p-4">
// //               <div className="text-3xl mb-1">📄</div>
// //               <div className="text-xs text-gray-500">PDF Document Selected</div>
// //             </div>
// //           )
// //         ) : (
// //           <span className="text-gray-400 text-sm">No file selected</span>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }


// // // import { useState } from "react";
// // // import Button from "../../../components/UI/Button";
// // // import Input from "../../../components/UI/Input";
// // // import { useNavigate } from "react-router-dom";
// // // import { uploadBorrowerDocuments } from "../../../api/borrower/post";

// // // type DocFile = {
// // //   file: File | null;
// // // };

// // // type UploadBoxProps = {
// // //   title: string;
// // //   doc: DocFile;
// // //   onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
// // //   onRemove: () => void;
// // // };

// // // export default function UploadDocumentsPage() {
// // //   const [license, setLicense] = useState<DocFile>({ file: null });
// // //   const [payStub, setPayStub] = useState<DocFile>({ file: null });

// // //   const [loading, setLoading] = useState(false);
// // //   const [error, setError] = useState<string | null>(null);

// // //   const navigate = useNavigate();

// // //   const handleFile = (
// // //     e: React.ChangeEvent<HTMLInputElement>,
// // //     setter: (f: DocFile) => void
// // //   ) => {
// // //     if (e.target.files?.[0]) {
// // //       setter({ file: e.target.files[0] });
// // //     }
// // //   };

// // //   const removeFile = (setter: (f: DocFile) => void) => {
// // //     setter({ file: null });
// // //   };

// // //   const handleSubmit = async () => {
// // //     const borrowerId = localStorage.getItem("borrowerId");

// // //     if (!borrowerId) {
// // //       setError("Borrower not found. Please login again.");
// // //       return;
// // //     }

// // //     if (!license.file && !payStub.file) {
// // //       setError("Please upload at least one document.");
// // //       return;
// // //     }

// // //     try {
// // //       setLoading(true);
// // //       setError(null);

// // //       await uploadBorrowerDocuments(
// // //         borrowerId,
// // //         license.file || undefined,
// // //         payStub.file || undefined
// // //       );

// // //       navigate("/borrower/dashboard");
// // //     } catch (err) {
// // //       console.error(err);
// // //       setError("Failed to upload documents. Please try again.");
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   return (
// // //     <div className="min-h-screen bg-gray-100 p-4 md:p-6">
// // //       <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-6 md:p-8">

// // //         <h1 className="text-xl font-semibold mb-2">
// // //           Upload Documents
// // //         </h1>

// // //         <p className="text-sm text-gray-500 mb-6">
// // //           We need further confirmation of your identity and income.
// // //         </p>

// // //         {error && (
// // //           <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
// // //             {error}
// // //           </div>
// // //         )}

// // //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
// // //           <UploadBox
// // //             title="Driver's License"
// // //             doc={license}
// // //             onUpload={(e) => handleFile(e, setLicense)}
// // //             onRemove={() => removeFile(setLicense)}
// // //           />

// // //           <UploadBox
// // //             title="Recent Pay Stub"
// // //             doc={payStub}
// // //             onUpload={(e) => handleFile(e, setPayStub)}
// // //             onRemove={() => removeFile(setPayStub)}
// // //           />
// // //         </div>

// // //         <div className="flex justify-end mt-8">
// // //           <Button onClick={handleSubmit} disabled={loading}>
// // //             {loading ? "Uploading..." : "Next"}
// // //           </Button>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // /* ---------- Upload Box ---------- */

// // // function UploadBox({
// // //   title,
// // //   doc,
// // //   onUpload,
// // //   onRemove,
// // // }: UploadBoxProps) {
// // //   return (
// // //     <div className="border rounded-lg p-4">
// // //       <div className="font-medium mb-3">{title}</div>

// // //       <Input
// // //         type="file"
// // //         label="Upload file"
// // //         onChange={onUpload}
// // //       />

// // //       {doc.file && (
// // //         <div className="mt-3 flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
// // //           <span className="truncate">{doc.file.name}</span>
// // //           <button
// // //             type="button"
// // //             onClick={onRemove}
// // //             className="text-red-500 font-bold"
// // //           >
// // //             ✕
// // //           </button>
// // //         </div>
// // //       )}

// // //       <div className="mt-4 h-40 border rounded flex items-center justify-center text-gray-400 text-sm">
// // //         Preview Here
// // //       </div>
// // //     </div>
// // //   );
// // // }


// // // // import { useState } from "react";
// // // // import Button from "../../../components/UI/Button";
// // // // import Input from "../../../components/UI/Input";
// // // // import { useNavigate } from "react-router-dom";

// // // // type DocFile = {
// // // //     file: File | null;
// // // // };

// // // // type UploadBoxProps = {
// // // //     title: string;
// // // //     doc: { file: File | null };
// // // //     onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
// // // //     onRemove: () => void;
// // // // };


// // // // export default function UploadDocumentsPage() {
// // // //     const [license, setLicense] = useState<DocFile>({ file: null });
// // // //     const [payStub, setPayStub] = useState<DocFile>({ file: null });
// // // //     const navigate = useNavigate();

// // // //     const handleFile = (
// // // //         e: React.ChangeEvent<HTMLInputElement>,
// // // //         setter: (f: DocFile) => void
// // // //     ) => {
// // // //         if (e.target.files?.[0]) {
// // // //             setter({ file: e.target.files[0] });
// // // //         }
// // // //     };

// // // //     const removeFile = (setter: (f: DocFile) => void) => {
// // // //         setter({ file: null });
// // // //     };

// // // //     return (
// // // //         <div className="min-h-screen bg-gray-100 p-6">
// // // //             <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-8">

// // // //                 <h1 className="text-xl font-semibold mb-2">
// // // //                     Upload Documents
// // // //                 </h1>

// // // //                 <p className="text-sm text-gray-500 mb-6">
// // // //                     We need further confirmation of your identity and income.
// // // //                 </p>

// // // //                 <div className="grid md:grid-cols-2 gap-8">
// // // //                     <UploadBox
// // // //                         title="Driver's License"
// // // //                         doc={license}
// // // //                         onUpload={(e) => handleFile(e, setLicense)}
// // // //                         onRemove={() => removeFile(setLicense)}
// // // //                     />

// // // //                     <UploadBox
// // // //                         title="Recent Pay Stub"
// // // //                         doc={payStub}
// // // //                         onUpload={(e) => handleFile(e, setPayStub)}
// // // //                         onRemove={() => removeFile(setPayStub)}
// // // //                     />
// // // //                 </div>

// // // //                 <div className="flex justify-end mt-8">
// // // //                     <Button onClick={() => {navigate("/borrower/dashboard")}}>Next</Button>
// // // //                 </div>
// // // //             </div>
// // // //         </div>
// // // //     );
// // // // }

// // // // /* ---------- Upload Box ---------- */

// // // // function UploadBox({
// // // //     title,
// // // //     doc,
// // // //     onUpload,
// // // //     onRemove,
// // // // }: UploadBoxProps) {
// // // //     return (
// // // //         <div className="border rounded-lg p-4">
// // // //             <div className="font-medium mb-2">{title}</div>

// // // //             <Input
// // // //                 type="file"
// // // //                 onChange={onUpload}
// // // //             />

// // // //             {doc.file && (
// // // //                 <div className="mt-3 flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
// // // //                     <span className="truncate">{doc.file.name}</span>
// // // //                     <button
// // // //                         onClick={onRemove}
// // // //                         className="text-red-500 font-bold"
// // // //                     >
// // // //                         ✕
// // // //                     </button>
// // // //                 </div>
// // // //             )}

// // // //             <div className="mt-4 h-40 border rounded flex items-center justify-center text-gray-400 text-sm">
// // // //                 Preview Here
// // // //             </div>
// // // //         </div>
// // // //     );
// // // // }
