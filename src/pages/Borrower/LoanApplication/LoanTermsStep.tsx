import { useState } from "react";
import Input from "../../../components/UI/Input";
import Button from "../../../components/UI/Button";
import Select from "../../../components/UI/Select";
import { submitLoanApplication } from "../../../api/borrower/post";

export default function LoanTermsStep({
  defaultValues,
  onSubmit,
  onBack,
}: any) {
  const [data, setData] = useState(defaultValues || {});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setApiError(null);

    const borrowerId = localStorage.getItem("borrowerId");

    if (!borrowerId) {
      setApiError("Borrower session not found. Please login again.");
      return;
    }

    const payload = {
      RequestedOn: new Date().toISOString(),
      BorrowerEmail: localStorage.getItem("borrowerEmail") || "",
      LoanAmount: Number(data.loanAmount),
      TermOfLoan: Number(data.tenureMonths),
      PurposeOfLoan: data.loanType || "Personal Loan", // Defaulting to Personal Loan if not selected;
      CaseStatus: "SUBMITTED",
      UserId: borrowerId
    };

    try {
      setLoading(true);

      const res = await submitLoanApplication(payload);

      if (!res.success) {
        setApiError(res.message || "Loan submission failed");
        return;
      }

      onSubmit(payload);
    } catch {
      setApiError("Something went wrong while submitting loan request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">
        Loan Terms
      </h2>

      {apiError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Loan Type*"
          name="loanType"
          value={data.loanType || ""}
          onChange={handleChange}
          options={[
            "Personal Loan",
            "Education Loan",
            "Home Loan",
            "Business Loan",
            "Medical Loan",
          ]}
        />

        <Input
          label="Loan Amount*"
          name="loanAmount"
          value={data.loanAmount || ""}
          onChange={handleChange}
        />

        <Input
          label="Tenure (Months)*"
          name="tenureMonths"
          value={data.tenureMonths || ""}
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          Submit Loan Request
        </Button>
      </div>
    </>
  );
}