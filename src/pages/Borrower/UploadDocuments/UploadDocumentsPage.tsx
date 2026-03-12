import { useState } from "react";
import Button from "../../../components/UI/Button";
import Input from "../../../components/UI/Input";
import { useNavigate } from "react-router-dom";
import { uploadBorrowerDocuments } from "../../../api/borrower/post";
import { jwtDecode } from "jwt-decode";

type DocFile = {
  file: File | null;
  previewUrl: string | null;
};

type UploadBoxProps = {
  title: string;
  doc: DocFile;
  accept?: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
};

export default function UploadDocumentsPage() {
  const [license, setLicense] = useState<DocFile>({ file: null, previewUrl: null });
  const [payStub, setPayStub] = useState<DocFile>({ file: null, previewUrl: null });

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
    const borrowerId = jwtDecode<{ guid: string }>(localStorage.getItem("borrower_token") || "").guid

    if (!borrowerId) {
      setError("Borrower not found. Please login again.");
      return;
    }

    // Logic: Require both documents to be present
    if (!license.file || !payStub.file) {
      setError("Please upload both your Driver's License and Recent Pay Stub.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Removed the 3rd argument (profilePic) from the API call
      await uploadBorrowerDocuments(
        borrowerId,
        license.file,
        payStub.file
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              Finish & Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Upload Box Component ---------- */

function UploadBox({ title, doc, onUpload, onRemove, accept = "image/*,.pdf" }: UploadBoxProps) {
  return (
    <div className="border rounded-lg p-4 flex flex-col h-full bg-white">
      <div className="font-medium mb-3 text-gray-700">{title}</div>
      <Input 
        type="file" 
        accept={accept} 
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